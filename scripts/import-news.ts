/**
 * Step 5 of the news migration: parsed rows + uploaded assets → the `news` table.
 *
 *   npx tsx scripts/import-news.ts --dry
 *   npx tsx scripts/import-news.ts --write
 *
 * TypeScript rather than Python, which the earlier steps are written in, for
 * one reason: this is the step that sanitises, and the allowlist has to be *the*
 * allowlist. `RICH_TEXT_SANITIZE` is imported from lib/sanitize.ts, the same
 * module the two Server Actions and the two render sites use. A Python
 * reimplementation would be a fourth copy — and the one copy nobody would think
 * to update when the list changes, because it does not live with the others.
 *
 * Reads (all produced by the earlier steps, all re-runnable):
 *   data/news-parsed.json   428 rows, bodies still raw
 *   data/url-map.json       old asset URL → Supabase URL
 *   data/titles-en.json     optional; id → English title
 *
 * Writes nothing until --write, and prints the same report either way.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sanitizeHtml from "sanitize-html";
import { RICH_TEXT_SANITIZE } from "../lib/sanitize";

const HERE = dirname(fileURLToPath(import.meta.url));
const DATA = join(HERE, "data");
const WRITE = process.argv.includes("--write");
/**
 * Add the new rows without touching the ones already there.
 *
 * ⚠️ Plain `--write` empties the table first, and that is not recoverable in the
 * way it looks. `news.id` is an identity column, so DELETE does not rewind the
 * sequence: the ids currently in the table run 443–870, not 1–428, precisely
 * because an earlier `--write` deleted rows numbered from 1. Re-running it
 * would hand every row a fresh id above 870, so all 428 existing
 * `/news/<id>` URLs would 404 with no mapping from the old id to the new one.
 * It would also drop, silently: everything the office has edited since the
 * import, every pinned flag (the prepared rows hard-code `is_pinned: false`),
 * every hand-written English column, every draft, and every `content_json`.
 *
 * So the admissions batch appends. `--only` narrows the rows to one category,
 * which is an exact definition of "the new ones" while that category is still
 * empty — no matching, no schema change. The guard below enforces that it is.
 *
 * ⚠️ This is safe exactly once per category. There is still no column linking a
 * row to its CMS record, so a second run would insert duplicates rather than
 * update. Giving `news` a `legacy_id` with a unique index, and switching to
 * `Prefer: resolution=merge-duplicates`, is what would make this step genuinely
 * re-runnable — see scripts/README.md.
 */
const APPEND = process.argv.includes("--append");
const ONLY = (() => {
  const i = process.argv.indexOf("--only");
  return i >= 0 ? process.argv[i + 1] : undefined;
})();

/** Plain-text standfirst length. Long enough to be a sentence, short enough to
 *  sit on the feature card without wrapping past three lines at 1440px. */
const BODY_MAX = 140;

/**
 * English category labels.
 *
 * ⚠️ These four strings must stay identical to `NEWS_FILTER_TABS` in
 * lib/i18n/news.ts. The tabs come from the dictionary and each row's label
 * comes from this column, and they sit a few centimetres apart on the same
 * page — so "Announcements" in the tab bar over rows tagged "News" is a visible
 * contradiction, not a nuance. They are also exactly what the eleven rows this
 * import replaces already carried, which were checked against the department's
 * own English site when they were written; the values are reused rather than
 * re-derived. (`scripts/data/legacy-news-backup.json` is that table, kept.)
 *
 * 演講公告 has no tab of its own — it is pulled out into its own section — but
 * the label still prints on every talk row, so it needs a value here too.
 */
const CATEGORY_EN: Record<string, string> = {
  最新公告: "Announcements",
  演講公告: "Talks",
  求職徵才: "Careers",
  活動剪影: "Event highlights",
  // The six recruit lists on the old site collapse to this one category — see
  // CATEGORY_MAP in fetch-news.py. "Admissions" is what the three admission
  // rows in legacy-news-backup.json already carried, checked against the
  // department's own English site at the time, and what NEWS_FILTER_TABS shows.
  招生: "Admissions",
};

type Parsed = {
  id: string;
  category: string;
  title: string;
  published_at: string;
  content_html: string;
  attachments: { src: string; name: string }[];
  cover: string | null;
  source_url: string;
  speaker?: string | null;
  event_at?: string | null;
};

type MappedAsset = { url: string; kind: string; name: string; size: number; mime: string };

function readJson<T>(name: string, fallback?: T): T {
  const path = join(DATA, name);
  if (!existsSync(path)) {
    if (fallback !== undefined) return fallback;
    throw new Error(`缺少 ${path}，請先跑前面的步驟`);
  }
  return JSON.parse(readFileSync(path, "utf-8")) as T;
}

function env(key: string): string {
  const line = readFileSync(join(HERE, "..", ".env.local"), "utf-8")
    .split("\n")
    .find((l) => l.startsWith(`${key}=`));
  if (!line) throw new Error(`.env.local 缺少 ${key}`);
  return line.slice(key.length + 1).trim().replace(/^"|"$/g, "");
}

/* ------------------------------------------------------------------ *
 * Transform                                                           *
 * ------------------------------------------------------------------ */

const stats = new Map<string, number>();
const bump = (key: string, by = 1) => stats.set(key, (stats.get(key) ?? 0) + by);

/**
 * Point every asset reference at Supabase, and drop the ones that no longer
 * resolve anywhere.
 *
 * A quarter of the inline images are hotlinks to hosts that died years ago —
 * `bioagri.agec.ntu.edu.tw`, a Facebook CDN URL that expired, two newspaper
 * sites. Copying those `<img>` tags across verbatim would reproduce the old
 * site's broken images on the new one; a missing image at least renders as
 * nothing rather than as a broken-image icon with alt text nobody wrote.
 *
 * Anything still pointing at the old host after this is logged, not left in
 * silently: the whole point of re-hosting is that the new site stops depending
 * on the old one being alive.
 */
function rewriteAssets(html: string, urlMap: Record<string, MappedAsset>): string {
  /*
   * Nine bodies wrap the poster in a link to the same file — "click to see it
   * full size". Rewriting only `<img src>` would leave those hrefs pointing at
   * the old host: the picture would load from Supabase and clicking it would
   * still leave the site. Every one of them is a file already uploaded for the
   * `<img>` beside it, so this is a lookup, not another download.
   *
   * Only asset paths are touched. Links to old-site *pages* stay as they are —
   * those are references, not resources, and the new site has no equivalent to
   * point them at.
   */
  const withLinks = html.replace(/<a\b[^>]*\shref="([^"]*\/uploads\/asset\/data\/[^"]*)"/gi,
    (tag, href: string) => {
      const decoded = href.replace(/&amp;/g, "&");
      const absolute = decoded.startsWith("http")
        ? decoded
        : `https://www.agec.ntu.edu.tw${decoded}`;
      const mapped = urlMap[absolute];
      if (!mapped) {
        bump("連結-指向舊站資產但未搬移");
        return tag;
      }
      bump("連結-已改指 Supabase");
      return tag.replace(/\shref="[^"]*"/i, ` href="${mapped.url}"`);
    });

  return withLinks.replace(/<img\b[^>]*>/gi, (tag) => {
    const src = /\ssrc="([^"]*)"/i.exec(tag)?.[1];
    if (!src) {
      bump("圖片-無 src，移除");
      return "";
    }
    if (src.startsWith("data:")) {
      // The sanitiser restricts img to http/https, so these would vanish there
      // anyway. Counting them here is what makes that visible in the report.
      bump("圖片-data URI，移除");
      return "";
    }
    // `&` arrives from the attribute as `&amp;`; the map is keyed on real URLs.
    const decoded = src.replace(/&amp;/g, "&");
    const absolute = decoded.startsWith("http")
      ? decoded
      : `https://www.agec.ntu.edu.tw${decoded}`;
    const mapped = urlMap[absolute];
    if (!mapped) {
      bump("圖片-來源已失效，移除");
      return "";
    }
    bump("圖片-已改指 Supabase");
    return tag.replace(/\ssrc="[^"]*"/i, ` src="${mapped.url}"`);
  });
}

/**
 * Facebook post embeds → an ordinary link to the post.
 *
 * Nine of the fifteen embeds in the imported bodies are `plugins/post.php`
 * iframes. Adding facebook.com to `allowedIframeHostnames` would render them,
 * and would also load Facebook's frame — and its cookies — into every reader's
 * browser on a university page; the embed does not render for a logged-out
 * visitor anyway. Dropping them loses the content entirely.
 *
 * The plugin URL carries the real post address in its `href` parameter, so the
 * third option is available and is plainly the best one: keep the destination,
 * lose the tracking. The sanitiser then treats it like any other outbound link
 * (target=_blank, rel=noopener).
 */
function facebookEmbedsToLinks(html: string): string {
  return html.replace(/<iframe\b[^>]*\ssrc="([^"]+)"[^>]*>\s*<\/iframe>/gi, (tag, src: string) => {
    const decoded = src.replace(/&amp;/g, "&");
    if (!/^https:\/\/(www\.)?facebook\.com\/plugins\//i.test(decoded)) return tag;
    let target: string | null = null;
    try {
      target = new URL(decoded).searchParams.get("href");
    } catch {
      target = null;
    }
    if (!target) {
      bump("Facebook 嵌入-取不出原始網址，移除");
      return "";
    }
    bump("Facebook 嵌入-改成連結");
    return `<p><a href="${target}">${target}</a></p>`;
  });
}

/** Word residue that survives tag-stripping as stray whitespace. */
function tidy(html: string): string {
  return html
    // The CMS wraps whole paragraphs in <span style="font-family:'新細明體'">.
    // The sanitiser drops the tags; this collapses what they leave behind.
    .replace(/(&nbsp;| )+/g, " ")
    .replace(/(<br\s*\/?>\s*){3,}/gi, "<br><br>")
    .replace(/^(?:\s|<br\s*\/?>)+/i, "")
    .replace(/(?:\s|<br\s*\/?>)+$/i, "")
    .trim();
}

/** First image in the body, promoted to the row's cover. */
function hoistCover(html: string): string | null {
  return /<img\b[^>]*\ssrc="([^"]+)"/i.exec(html)?.[1] ?? null;
}

/**
 * The plain-text standfirst.
 *
 * Must not be HTML: `.inner-news-feature p` and `.post-standfirst` render it as
 * a text node, so a tag would be printed on the page as characters.
 *
 * Returns null rather than an empty string when there is nothing to summarise,
 * which is the common case — 48 of the 428 bodies are a poster image and
 * nothing else. Null is what /news/[id] reads as "no standfirst"; "" would be a
 * value, and the feature card would render an empty paragraph.
 */
function summarise(html: string): string | null {
  const text = html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;| /g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
  if (text.length < 10) return null;
  if (text.length <= BODY_MAX) return text;
  // Cut at a sentence boundary when there is one nearby, so the standfirst does
  // not end mid-clause.
  const window = text.slice(0, BODY_MAX);
  const stop = Math.max(window.lastIndexOf("。"), window.lastIndexOf("，"), window.lastIndexOf(". "));
  return (stop > BODY_MAX * 0.5 ? window.slice(0, stop + 1) : window.trimEnd()) + "…";
}

function main() {
  const rows = readJson<Parsed[]>("news-parsed.json");
  const urlMap = readJson<Record<string, MappedAsset>>("url-map.json", {});
  const titlesEn = readJson<Record<string, string>>("titles-en.json", {});
  // Keyed on the Chinese speaker string, which is what the parser produced —
  // the same person appears under several spellings across nine years of
  // announcements, so this is a per-string table rather than a per-person one.
  const speakersEn = readJson<Record<string, string>>("speakers-en.json", {});

  const prepared = rows.map((row) => {
    const rewritten = facebookEmbedsToLinks(rewriteAssets(row.content_html, urlMap));
    const clean = tidy(sanitizeHtml(rewritten, RICH_TEXT_SANITIZE));

    const attachments = row.attachments
      .map((a) => {
        const mapped = urlMap[a.src];
        if (!mapped) {
          bump("附件-來源已失效，移除");
          return null;
        }
        bump("附件-已改指 Supabase");
        // The label from the markup, not the one sniffed at download time: it
        // is what the old site showed readers, and half the download filenames
        // are missing their extension.
        return { name: a.name || mapped.name, url: mapped.url, size: mapped.size, mime: mapped.mime };
      })
      .filter((a): a is NonNullable<typeof a> => a !== null);

    const body = summarise(clean);
    if (!body) bump("摘要-無內容可摘（留 null）");
    const cover = row.cover ?? hoistCover(clean);
    if (cover) bump("封面-自內文第一張圖抽出");

    if (clean.includes("<table")) bump("內文-保留表格");
    if (clean.includes("<iframe")) bump("內文-保留 YouTube");
    if (!clean) bump("內文-消毒後為空（留 null）");

    const titleEn = titlesEn[row.id] ?? null;
    if (titleEn) bump("英文標題-已填");
    const speakerEn = row.speaker ? (speakersEn[row.speaker] ?? null) : null;
    if (speakerEn) bump("英文講者-已填");
    const categoryEn = CATEGORY_EN[row.category] ?? null;
    if (!categoryEn) bump("⚠️ 分類沒有英文對照");

    return {
      published_at: row.published_at,
      category: row.category,
      category_en: categoryEn,
      title: row.title,
      title_en: titleEn,
      body,
      content_html: clean || null,
      // Never written by the import: content_json is the editor's own format,
      // and there is no ProseMirror document to derive from imported HTML. The
      // editor falls back to content_html when the JSON is null, which is
      // exactly this case.
      content_json: null,
      cover_url: cover,
      is_pinned: false,
      status: "published",
      attachments,
      speaker: row.speaker ?? null,
      speaker_en: speakerEn,
      // Never in the headline, and 92% of the talks are a poster image with no
      // machine-readable text at all — the room exists only as pixels. Left for
      // the office to fill in rather than guessed.
      venue: null,
      event_at: row.event_at ?? null,
    };
  });

  writeFileSync(join(DATA, "news-prepared.json"), JSON.stringify(prepared, null, 1));

  console.log(`準備 ${prepared.length} 則`);
  for (const [key, value] of [...stats].sort()) console.log(`  ${key.padEnd(28)} ${value}`);

  const byCategory = new Map<string, number>();
  for (const p of prepared) byCategory.set(p.category, (byCategory.get(p.category) ?? 0) + 1);
  console.log("\n分類：" + [...byCategory].map(([k, v]) => `${k} ${v}`).join("、"));

  const selected = ONLY ? prepared.filter((p) => p.category === ONLY) : prepared;
  if (ONLY) console.log(`\n--only ${ONLY}：${selected.length} 則將寫入`);

  if (!WRITE) {
    console.log("\n（--dry：沒有寫入資料庫。加 --write 才會真的寫）");
    return;
  }
  void writeRows(selected);
}

/* ------------------------------------------------------------------ *
 * Write                                                               *
 * ------------------------------------------------------------------ */

async function writeRows(prepared: { category: string }[]) {
  const base = env("NEXT_PUBLIC_SUPABASE_URL");
  const key = env("SUPABASE_SERVICE_ROLE_KEY");
  const headers = {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
  };

  if (APPEND) {
    // The guard that makes appending safe: --only names a category, and this
    // insists the table holds none of it yet. If it does, either this already
    // ran or the office has been publishing into it — and in both cases a
    // second pass would duplicate rather than update, because nothing here
    // knows which CMS record a row came from.
    const categories = [...new Set(prepared.map((p) => p.category))];
    for (const category of categories) {
      const url = `${base}/rest/v1/news?select=id&category=eq.${encodeURIComponent(category)}&limit=1`;
      const existing = (await (await fetch(url, { headers })).json()) as unknown[];
      if (existing.length) {
        throw new Error(
          `中止：news 已經有「${category}」的資料。--append 只安全一次；` +
            `再跑會插出重複的列，因為沒有欄位能對回 CMS 記錄。`
        );
      }
    }
    console.log(`\n--append：不清空，只新增 ${categories.join("、")}`);
  } else {
    // Everything currently in the table goes. ⚠️ See the note on APPEND: this
    // renumbers every row and breaks every /news/<id> URL. It was right for the
    // first import, when the table held eleven hand-made samples; it is not
    // right for a second batch.
    const cleared = await fetch(`${base}/rest/v1/news?id=gt.0`, { method: "DELETE", headers });
    if (!cleared.ok) throw new Error(`清空失敗：${cleared.status} ${await cleared.text()}`);
    console.log("\n已清空 news");
  }

  // Batched: 428 rows in one request is a several-megabyte body once the HTML
  // is included, and a failure part-way through tells you nothing about which
  // row caused it.
  const BATCH = 50;
  let written = 0;
  for (let i = 0; i < prepared.length; i += BATCH) {
    const slice = prepared.slice(i, i + BATCH);
    const response = await fetch(`${base}/rest/v1/news`, {
      method: "POST",
      headers: { ...headers, Prefer: "return=minimal" },
      body: JSON.stringify(slice),
    });
    if (!response.ok) {
      throw new Error(`第 ${i}–${i + slice.length} 筆寫入失敗：${response.status} ${await response.text()}`);
    }
    written += slice.length;
    console.log(`  寫入 ${written}/${prepared.length}`);
  }
  console.log(`\n完成：${written} 則`);
}

main();
