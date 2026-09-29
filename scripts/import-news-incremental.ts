/**
 * 增量匯入：舊站（agec.ntu.edu.tw）新貼出的消息 → news 表。只新增，不清空、
 * 不改既有列，可以放心重跑。
 *
 *   npx tsx scripts/import-news-incremental.ts --since 2026-09-01 --dry     # 預設；只印報告
 *   npx tsx scripts/import-news-incremental.ts --since 2026-09-01 --write   # 真的寫入
 *
 * ---------------------------------------------------------------------------
 * 為什麼不能用 scripts/import-news.ts
 * ---------------------------------------------------------------------------
 * 那支腳本的 --write 只有兩種模式，這次兩種都不能用：
 *   1. 純 --write：會先把整張表清空、每一列都砍掉，再全量寫入（確切做法見
 *      import-news.ts 檔頭的說明）。news.id 是 identity 欄位，清空不會把
 *      序列倒回去——清空重寫會讓現有 584 個 /news/<id> 網址全部指向不存在
 *      的列。
 *   2. --append --only <分類>：只在「該分類目前是空的」時才允許寫入（寫死的
 *      guard，查到任何一列同分類資料就中止）。上次搬運後五個分類
 *      （最新公告／演講公告／求職徵才／活動剪影／招生）全部已經有資料，
 *      這個模式現在對任何分類都會直接中止。
 * scripts/README.md 也寫了：「真正讓第 5 步可重跑的做法……還沒做」。這支就是
 * 補上那一塊——用內容比對做去重，而不是「這個分類還是空的」這種一次性假設。
 *
 * ---------------------------------------------------------------------------
 * 去重規則：為什麼是 (title, published_at)，不能只比 title
 * ---------------------------------------------------------------------------
 * news 表沒有任何欄位記錄舊站的文章 id 或來源網址（不像 documents 表用
 * file_url 判斷已匯入）。上次搬運是整批全量寫入，從來不需要判斷「這筆是不是
 * 已經進來了」；這支腳本每次都要面對「舊站列表裡的這一筆，news 表裡到底有
 * 沒有」，而唯一能拿來比對的就是內容本身——只有 title 和 published_at 是從
 * 舊站可靠取得、新站也原樣保留的欄位。
 *
 * 只比 title 會誤殺：舊站會把同一件事同時貼在兩個分類（例如「最新公告」與
 * 「活動剪影」各一則），標題完全相同、發佈日期通常差一兩天。2026-09 這批就有
 * 一組實例（id 14748528 與 74656931，標題都是「【活動剪影】115年9月6日-115
 * 學年度新生暨家長座談會」，日期分別是 09-07 與 09-06）。既有 584 列裡也有
 * 4 組同標題的歷史案例，其中 3 組連 published_at 都相同（真的是同一天貼進兩個
 * 分類的兩筆獨立記錄，上次匯入兩筆都收了——用「SELECT id,title,published_at,
 * category FROM news」實查過，見下面 fetchExistingForDedup() 的查詢）。所以
 * 比對 key 必須是 (title, published_at) 的組合，只比 title 會把這種「同標題
 * 不同日期／不同分類」的合法第二筆誤判成重複而跳過。
 *
 * 這個做法仍有一個已知的殘留風險，寫在這裡而不是留給下一個人猜：如果同一次
 * 爬到的候選名單裡，剛好有兩筆 (title, published_at) 完全相同（例如舊站真的
 * 在同一天用同一個標題貼了兩個分類），而寫入時半途失敗只成功了一筆，下次重
 * 跑時「news 已有一筆符合這個 key」會讓兩筆都被判成已存在，漏掉真正該補寫的
 * 那一筆。這批 13 筆沒有這個情況（見下面的 dry-run 報告），但下一個要改這支
 * 腳本的人應該知道：真正一勞永逸的做法是幫 news 加一個 legacy_id 欄位加
 * unique index，用 Prefer: resolution=merge-duplicates 做 upsert——那才是
 * scripts/README.md 說的「真正可重跑」。這支腳本是在沒有那個欄位之前，用
 * 內容比對頂著用的過渡做法。
 *
 * ---------------------------------------------------------------------------
 * --dry 與 --write 的邊界畫在哪、為什麼
 * ---------------------------------------------------------------------------
 * --dry 只打兩種唯讀請求：舊站的列表頁/內頁（GET），以及 news 表的去重查詢
 * （GET）。報告裡的「圖片數」「附件數」是直接算舊站內頁解析出來的 <img>／
 * 附件連結數量，不需要真的下載檔案就能算。
 *
 * 下載圖片與附件、上傳 Supabase Storage、把內文 HTML 的資產網址換成 Storage
 * 網址、跑 RICH_TEXT_SANITIZE、寫入 news 表——這一整段只在 --write 才會執行
 * （writeRows()）。不是偷懶少做，是刻意：資產要換成 Storage 網址才能正確
 * 消毒與摘要（rewriteAssets 找不到對照就會把整張圖拿掉），而「找不到對照」
 * 在 --dry 模式下永遠成立，因為 --dry 從來沒有上傳過任何東西——如果 --dry
 * 也跑一次消毒管線，報告會顯示「0 張圖」，明明內頁有圖，誤導遠大於幫助。
 * 圖片數/附件數的計算因此刻意繞過消毒管線，直接數舊站原始 HTML。
 *
 * ---------------------------------------------------------------------------
 * 讀什麼、不碰什麼
 * ---------------------------------------------------------------------------
 * 讀（唯讀，不修改）：
 *   scripts/data/titles-en-september.json   舊站數字 id → 英文標題，主對話提供
 *   scripts/data/speakers-en.json           既有的講者中譯英對照表（沿用，同一
 *                                            人可能有好幾種舊站寫法，逐字串對照）
 * 暫存（本腳本自己的資料，寫在這裡，不碰 scripts/data/ 既有檔案）：
 *   scripts/data/incremental/cache/         舊站內頁 HTML 快取＋（--write 才有的）
 *                                            下載資產快取；重跑不必重抓
 *   scripts/data/incremental/written-*.json （--write 才會產生）本次寫入的舊站 id
 *                                            → 新 news.id 對照，news 表本身沒有
 *                                            地方存這個對照，只能存在這裡
 *
 * ---------------------------------------------------------------------------
 * 重複用到、但不能直接 import 的東西
 * ---------------------------------------------------------------------------
 * ⚠️ CATEGORY_EN 是 import-news.ts 裡的 const，沒有 export；本檔規則是「可以
 * import、不能修改」，所以沒辦法幫它加 export。這裡重複定義同一份五筆對照，
 * 改任何一邊的分類英文都要記得改另一邊（也要對到 lib/i18n/news.ts 的
 * NEWS_FILTER_TABS，import-news.ts 的檔頭已經寫過這個三方一致的要求）。
 * ⚠️ EXT_FOR_MIME / MIME_ALIASES 是 scripts/upload-assets.py 的常數，Python
 * 檔案本來就无法被 TS import，這裡是唯一一份 TS 版，值必須跟 upload-assets.py
 * 保持一致。
 */
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sanitizeHtml from "sanitize-html";
import { RICH_TEXT_SANITIZE } from "../lib/sanitize";

const HERE = dirname(fileURLToPath(import.meta.url)); // scripts/
const LEGACY_DATA = join(HERE, "data"); // 既有資料，唯讀
const DATA = join(HERE, "data", "incremental"); // 本腳本自己的暫存
const CACHE = join(DATA, "cache");

const OLD_SITE = "https://www.agec.ntu.edu.tw";
// Cloudflare 擋 Python 預設 UA 是實測過的事實（scripts/fetch-assets.py:29-30）；
// 用同一支瀏覽器 UA 字串、同樣走 curl 子行程，不重新賭一次別的組合會不會被擋。
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

/* ------------------------------------------------------------------ *
 * CLI 參數                                                            *
 * ------------------------------------------------------------------ */

const argv = process.argv.slice(2);
const WRITE = argv.includes("--write");

const SINCE = (() => {
  const i = argv.indexOf("--since");
  const value = i >= 0 ? argv[i + 1] : undefined;
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    console.error("用法：--since YYYY-MM-DD 為必填（例如 --since 2026-09-01）");
    process.exit(1);
  }
  return value;
})();

/* ------------------------------------------------------------------ *
 * 分類英文對照（重複自 import-news.ts 的 CATEGORY_EN，見檔頭說明）      *
 * ------------------------------------------------------------------ */

const CATEGORY_EN: Record<string, string> = {
  最新公告: "Announcements",
  演講公告: "Talks",
  求職徵才: "Careers",
  活動剪影: "Event highlights",
  招生: "Admissions",
};

/**
 * 「招生資訊-X」的 X 對到 news.program 的值。由具體到一般排序；目前五個
 * 學制彼此都不是對方的子字串（例如「碩士在職專班」不包含「碩士班」這個連續
 * 子字串），順序其實不影響正確性，但保留「具體優先」的順序是防未來舊站加新
 * 學制時不會不小心被短字串搶先比對到。
 */
const PROGRAM_PATTERNS: [needle: string, program: string][] = [
  ["博士班", "博士班"],
  ["碩士在職專班", "碩士在職專班"],
  ["國際專班", "國際專班"],
  ["碩士班", "碩士班"],
  ["大學部", "大學部"],
];

/** 純文字標語長度上限，同 import-news.ts 的 BODY_MAX。 */
const BODY_MAX = 140;

/* ------------------------------------------------------------------ *
 * 小工具                                                              *
 * ------------------------------------------------------------------ */

function env(key: string): string {
  const line = readFileSync(join(HERE, "..", ".env.local"), "utf-8")
    .split("\n")
    .find((l) => l.startsWith(`${key}=`));
  if (!line) throw new Error(`.env.local 缺少 ${key}`);
  return line
    .slice(key.length + 1)
    .trim()
    .replace(/^"|"$/g, "");
}

function readJson<T>(path: string, fallback: T): T {
  if (!existsSync(path)) return fallback;
  return JSON.parse(readFileSync(path, "utf-8")) as T;
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function resolveUrl(src: string): string {
  const decoded = decodeEntities(src);
  return decoded.startsWith("http") ? decoded : `${OLD_SITE}${decoded}`;
}

function sleep(seconds: number) {
  // 對舊站客氣一點，同 fetch-news.py 每則之間 sleep(0.25) 的用意。同步腳本，
  // 用子行程 sleep 卡住即可，不需要真的引入非同步排程。
  execFileSync("sleep", [String(seconds)]);
}

/* ------------------------------------------------------------------ *
 * 抓舊站：列表頁（不快取，怕漏看系辦剛貼的新消息）與內頁（快取，內容      *
 * 一旦發佈不會變，重跑不必重抓，同 fetch-news.py 的 CACHE）              *
 * ------------------------------------------------------------------ */

function curlToFile(url: string, dest: string, maxTime: number, connectTimeout: number): string {
  const code = execFileSync(
    "curl",
    [
      "-sS",
      "-L",
      "--max-time",
      String(maxTime),
      "--connect-timeout",
      String(connectTimeout),
      "--retry",
      "1",
      "-A",
      UA,
      "-D",
      dest + ".hdr",
      "-o",
      dest,
      "-w",
      "%{http_code}",
      url,
    ],
    { encoding: "utf-8" },
  );
  return code.trim();
}

function fetchListPage(pageNo: number): string | null {
  const dest = join(CACHE, `list-page-${pageNo}.html`);
  const code = curlToFile(`${OLD_SITE}/zh_tw/news?page_no=${pageNo}`, dest, 40, 8);
  if (code !== "200") {
    console.warn(`  ⚠️ 第 ${pageNo} 頁：HTTP ${code}，當作沒有更多頁面`);
    return null;
  }
  return readFileSync(dest, "utf-8");
}

function fetchDetailCached(legacyId: string, href: string): string | null {
  const dest = join(CACHE, `${legacyId}.html`);
  if (existsSync(dest) && statSync(dest).size > 5_000) {
    return readFileSync(dest, "utf-8");
  }
  const code = curlToFile(`${OLD_SITE}${href}`, dest, 40, 8);
  if (code !== "200") {
    console.warn(`  ⚠️ 舊id ${legacyId}：內頁 HTTP ${code}`);
    return null;
  }
  return readFileSync(dest, "utf-8");
}

/* ------------------------------------------------------------------ *
 * 解析：列表頁                                                        *
 * ------------------------------------------------------------------ */

type ListItem = {
  legacyId: string;
  categoryRaw: string;
  title: string;
  publishedAt: string; // YYYY-MM-DD，列表頁自己的日期（內頁的日期比較準，見下）
  href: string;
};

function parseListPage(html: string): ListItem[] {
  const blocks = html.match(/<li class="i-annc__item[\s\S]*?<\/li>/g) ?? [];
  const items: ListItem[] = [];
  for (const block of blocks) {
    const cat = /i-annc__category">([^<]*)</.exec(block)?.[1]?.trim();
    const link = /<a\s+class="i-annc__title"\s+href="([^"]+)"\s+title="([^"]*)"/.exec(block);
    const date = /i-annc__postdate">\s*([\d/-]+)\s*</.exec(block)?.[1];
    if (!cat || !link || !date) continue; // 缺任一欄位的列不猜，直接略過
    const idMatch = /-(\d+)\/?$/.exec(link[1]);
    if (!idMatch) continue;
    items.push({
      legacyId: idMatch[1],
      categoryRaw: cat,
      title: decodeEntities(link[2]).trim(),
      // "2026-09/07" → "2026-09-07"：日期字串只有一個 "/"，同 fetch-news.py
      // 對付 "2026-08/31" 這種格式的手法。
      publishedAt: date.replace("/", "-"),
      href: link[1],
    });
  }
  return items;
}

/* ------------------------------------------------------------------ *
 * 解析：內頁（title / date / content_html / attachments / cover）      *
 * 完全比照 scripts/parse-news.py 的正則與 extract_div，包含它記錄過的   *
 * off-by-one 教訓（見 extractDiv 內的註解）。                          *
 * ------------------------------------------------------------------ */

const TITLE_RE = /<h1[^>]*class="[^"]*s-annc__show-title[^"]*"[^>]*>([\s\S]*?)<\/h1>/;
const DATE_RE = /<span[^>]*class="[^"]*s-annc__date[^"]*"[^>]*>\s*(\d{4}-\d{2}-\d{2})/;
const FILE_RE = /<a[^>]*class="[^"]*s-annc__flie-title[^"]*"[^>]*href="([^"]+)"[^>]*title="([^"]*)"/g;

function cleanTitle(raw: string): string {
  return decodeEntities(raw.replace(/<[^>]+>/g, ""))
    .replace(/[\s　]+/g, " ")
    .trim();
}

/**
 * 第一個帶有 class 的 <div> 的內層 HTML。正則沒辦法直接做這件事——內文本身
 * 可能包著自己的 <div>，`.*?</div>` 只會停在第一個內層的 </div>。所以找開
 * 標籤後往前掃、記深度。
 *
 * ⚠️ parse-news.py 的 extract_div() 記錄過一個 off-by-one：結束位置要記
 * 「配到的 `</div` 這個 match 的起點」（這裡是 `t.index`），不能用「結束
 * match 的終點再扣掉一個固定長度」去回推——那個做法在 92% 的演講公告內文
 * 是 `...<img ...></div>` 收尾時，會連 <img> 的收尾 `>` 一起砍掉。這裡直接
 * 用 t.index（相當於 Python 的 t.start()），不會重犯那個錯。
 */
function extractDiv(page: string, className: string): string | null {
  const openRe = new RegExp(`<div[^>]*class="[^"]*${className}[^"]*"[^>]*>`);
  const openMatch = openRe.exec(page);
  if (!openMatch) return null;

  const start = openMatch.index + openMatch[0].length;
  const tagRe = /<\/?div\b/gi;
  tagRe.lastIndex = start;

  let depth = 1;
  let end: number | null = null;
  let t: RegExpExecArray | null;
  while (depth > 0 && (t = tagRe.exec(page))) {
    if (t[0].startsWith("</")) {
      depth -= 1;
      end = t.index;
    } else {
      depth += 1;
    }
  }
  return depth === 0 && end !== null ? page.slice(start, end) : page.slice(start);
}

type DetailParsed = {
  title: string;
  publishedAt: string | null;
  contentHtml: string;
  attachments: { src: string; name: string }[];
  cover: string | null;
};

function parseDetailPage(page: string): DetailParsed {
  const titleMatch = TITLE_RE.exec(page);
  const title = titleMatch ? cleanTitle(titleMatch[1]) : "";

  const dateMatch = DATE_RE.exec(page);
  const contentHtml = extractDiv(page, "s-annc__post-body") ?? "";

  const attachments: { src: string; name: string }[] = [];
  const seen = new Set<string>();
  const fileRe = new RegExp(FILE_RE.source, "g");
  let fm: RegExpExecArray | null;
  while ((fm = fileRe.exec(page))) {
    const url = resolveUrl(fm[1]);
    if (seen.has(url)) continue;
    seen.add(url);
    attachments.push({ src: url, name: decodeEntities(fm[2]).trim() });
  }

  const sub = extractDiv(page, "s-annc__sub-img") ?? "";
  const coverMatch = /<img[^>]*\ssrc="([^"]+)"/i.exec(sub);
  const cover = coverMatch && coverMatch[1].trim() ? coverMatch[1] : null;

  return {
    title,
    publishedAt: dateMatch ? dateMatch[1] : null,
    contentHtml,
    attachments,
    cover,
  };
}

function countImages(contentHtml: string): number {
  return (contentHtml.match(/<img\b[^>]*\ssrc="[^"]+"/gi) ?? []).length;
}

function extractImgSrcs(contentHtml: string): string[] {
  const re = /<img\b[^>]*\ssrc="([^"]+)"/gi;
  const out: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(contentHtml))) out.push(m[1]);
  return out;
}

/* ------------------------------------------------------------------ *
 * 演講公告的講者／時間：完全比照 parse-news.py 的 parse_talk()。         *
 * 這批 13 筆沒有「演講公告」，這段程式碼在這次 dry-run 不會被觸發，      *
 * 但欄位形狀要跟 prepared 物件一致（speaker／event_at 兩欄），留給下一   *
 * 次真的搬到演講公告時用，不能等到那時候才補。                          *
 * ------------------------------------------------------------------ */

const ROC_DATE_RE = /(?:(\d{2,3})年)?\s*(\d{1,2})月(\d{1,2})日/;
const TIME_RE = /(\d{1,2})[:：](\d{2})/;
const SPEAKER_RE =
  /(?:\d{1,2}[:：]\d{2}(?:\s*[-–~]\s*\d{1,2}[:：]\d{2})?)\s*(?:邀請|敬邀|由)?\s*(.+?)\s*(?:蒞臨演講|蒞臨|演講|主講|專題演講)\s*$/;
const SPEAKER_FALLBACK_RE = /(?:邀請|敬邀)\s*(.+?)\s*(?:蒞臨演講|蒞臨|主講)\s*$/;
const SPEAKER_MIN = 2;
const SPEAKER_MAX = 120;
// 頭尾要剝掉的字元：半形/全形空白、逗號、頓號、連字號、en dash。放在字元類別
// 最後一個位置的 "-" 是字面值，不會被讀成範圍運算子。
const SPEAKER_TRIM_RE = /^[\s　,，、–-]+|[\s　,，、–-]+$/g;

function parseTalk(title: string, publishedAt: string): { speaker: string | null; eventAt: string | null } {
  let speaker: string | null = null;
  let eventAt: string | null = null;

  const md = ROC_DATE_RE.exec(title);
  if (md) {
    const [, roc, monthStr, dayStr] = md;
    const month = parseInt(monthStr, 10);
    const day = parseInt(dayStr, 10);
    let year: number;
    if (roc) {
      year = parseInt(roc, 10) + 1911; // 民國 → 西元
    } else {
      const pubYear = parseInt(publishedAt.slice(0, 4), 10);
      const pubMonth = parseInt(publishedAt.slice(5, 7), 10);
      // 沒寫年份：演講通常先公告才舉行，所以歸在公告當年——除非月份已經過了
      // 大半年，代表公告跨到了隔年。
      year = month < pubMonth - 6 ? pubYear + 1 : pubYear;
    }
    const tm = TIME_RE.exec(title);
    const hh = tm ? parseInt(tm[1], 10) : 0;
    const mm = tm ? parseInt(tm[2], 10) : 0;
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31 && hh <= 23 && mm <= 59) {
      const pad = (n: number, w: number) => String(n).padStart(w, "0");
      // 台北全年 UTC+8，沒有日光節約時間要處理。
      eventAt = `${pad(year, 4)}-${pad(month, 2)}-${pad(day, 2)}T${pad(hh, 2)}:${pad(mm, 2)}:00+08:00`;
    }
  }

  const speakerMatch = SPEAKER_RE.exec(title) ?? SPEAKER_FALLBACK_RE.exec(title);
  if (speakerMatch) {
    const s = speakerMatch[1].replace(SPEAKER_TRIM_RE, "");
    if (s.length >= SPEAKER_MIN && s.length <= SPEAKER_MAX) speaker = s;
  }
  return { speaker, eventAt };
}

/* ------------------------------------------------------------------ *
 * 分類對照（任務事實 8）                                                *
 * ------------------------------------------------------------------ */

function mapCategory(raw: string): { category: string; program: string | null; programNote: string | null } {
  if (raw.startsWith("招生資訊")) {
    for (const [needle, program] of PROGRAM_PATTERNS) {
      if (raw.includes(needle)) return { category: "招生", program, programNote: null };
    }
    return { category: "招生", program: null, programNote: `學制對不到子分類「${raw}」，program 留 null` };
  }
  if (raw in CATEGORY_EN) return { category: raw, program: null, programNote: null };
  // 五類之外的分類：不是任務事實列出的任何一種情況，理論上不該出現在這批，
  // 但不要吃掉——照原樣收，讓人在報告裡看到再決定怎麼辦。
  return { category: raw, program: null, programNote: `未知分類「${raw}」，沒有英文對照` };
}

/* ------------------------------------------------------------------ *
 * 去重：查 news 現有資料，比對 (title, published_at)                    *
 * ------------------------------------------------------------------ */

type ExistingRow = { id: number; title: string; published_at: string; category: string };

function dedupKey(title: string, publishedAt: string): string {
  return `${title}\u0001${publishedAt}`;
}

async function fetchExistingForDedup(base: string, key: string, since: string): Promise<ExistingRow[]> {
  const headers = { apikey: key, Authorization: `Bearer ${key}` };
  const rows: ExistingRow[] = [];
  const PAGE = 1000;
  for (let offset = 0; ; offset += PAGE) {
    // published_at >= since 就足夠：候選名單裡的每一筆日期本來就 >= since，
    // 不可能跟一筆日期更早的既有列撞 key，先用這個條件把要比對的既有資料
    // 縮到最小，也讓 dry-run 報告能直接印出「這個範圍內既有幾筆」。
    const url =
      `${base}/rest/v1/news?select=id,title,published_at,category` +
      `&published_at=gte.${since}&order=id.asc&limit=${PAGE}&offset=${offset}`;
    const res = await fetch(url, { headers });
    if (!res.ok) throw new Error(`查詢既有 news 失敗：${res.status} ${await res.text()}`);
    const page = (await res.json()) as ExistingRow[];
    rows.push(...page);
    if (page.length < PAGE) break;
  }
  return rows;
}

/* ------------------------------------------------------------------ *
 * 內文轉換（只在 --write 執行，見檔頭「--dry 與 --write 的邊界」）       *
 * 逐一比照 import-news.ts 的同名函式：rewriteAssets／                  *
 * facebookEmbedsToLinks／tidy／hoistCover／summarise。無法 import      *
 * （那些函式沒有 export，且規則是不能改 import-news.ts），所以在這裡    *
 * 重新寫一份、邏輯保持一致。                                            *
 * ------------------------------------------------------------------ */

type MappedAsset = { url: string; kind: "image" | "file"; name: string; size: number; mime: string };

function rewriteAssets(html: string, assetMap: Map<string, MappedAsset>): string {
  const withLinks = html.replace(/<a\b[^>]*\shref="([^"]*\/uploads\/asset\/data\/[^"]*)"/gi, (tag, href: string) => {
    const mapped = assetMap.get(resolveUrl(href));
    if (!mapped) return tag;
    return tag.replace(/\shref="[^"]*"/i, ` href="${mapped.url}"`);
  });

  return withLinks.replace(/<img\b[^>]*>/gi, (tag) => {
    const src = /\ssrc="([^"]*)"/i.exec(tag)?.[1];
    if (!src || src.startsWith("data:")) return "";
    const mapped = assetMap.get(resolveUrl(src));
    if (!mapped) return "";
    return tag.replace(/\ssrc="[^"]*"/i, ` src="${mapped.url}"`);
  });
}

function facebookEmbedsToLinks(html: string): string {
  return html.replace(/<iframe\b[^>]*\ssrc="([^"]+)"[^>]*>\s*<\/iframe>/gi, (tag, src: string) => {
    const decoded = decodeEntities(src);
    if (!/^https:\/\/(www\.)?facebook\.com\/plugins\//i.test(decoded)) return tag;
    let target: string | null = null;
    try {
      target = new URL(decoded).searchParams.get("href");
    } catch {
      target = null;
    }
    if (!target) return "";
    return `<p><a href="${target}">${target}</a></p>`;
  });
}

function tidy(html: string): string {
  return html
    .replace(/(&nbsp;| )+/g, " ")
    .replace(/(<br\s*\/?>\s*){3,}/gi, "<br><br>")
    .replace(/^(?:\s|<br\s*\/?>)+/i, "")
    .replace(/(?:\s|<br\s*\/?>)+$/i, "")
    .trim();
}

function hoistCover(html: string): string | null {
  return /<img\b[^>]*\ssrc="([^"]+)"/i.exec(html)?.[1] ?? null;
}

function summarise(html: string): string | null {
  const text = html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;| /g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
  if (text.length < 10) return null;
  if (text.length <= BODY_MAX) return text;
  const window = text.slice(0, BODY_MAX);
  const stop = Math.max(window.lastIndexOf("。"), window.lastIndexOf("，"), window.lastIndexOf(". "));
  return (stop > BODY_MAX * 0.5 ? window.slice(0, stop + 1) : window.trimEnd()) + "…";
}

/* ------------------------------------------------------------------ *
 * 資產下載／上傳（只在 --write 執行）。比照 fetch-assets.py 的下載邏輯   *
 * 與 upload-assets.py 的上傳邏輯；EXT_FOR_MIME/MIME_ALIASES 是唯一一份  *
 * TS 版（Python 檔案沒辦法被 import，見檔頭說明）。                     *
 * ------------------------------------------------------------------ */

const EXT_FOR_MIME: Record<string, string> = {
  "application/pdf": "pdf",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "application/vnd.ms-excel": "xls",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
  "application/vnd.ms-powerpoint": "ppt",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
  "application/zip": "zip",
  "application/x-7z-compressed": "7z",
  "application/x-rar": "rar",
  "application/x-rar-compressed": "rar",
  "application/vnd.rar": "rar",
  "application/vnd.oasis.opendocument.text": "odt",
  "application/vnd.oasis.opendocument.spreadsheet": "ods",
  "text/rtf": "rtf",
  "application/rtf": "rtf",
  "text/plain": "txt",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/webp": "webp",
  "image/avif": "avif",
};
const MIME_ALIASES: Record<string, string | null> = {
  "application/x-rar": "application/vnd.rar",
  "application/CDFV2": "application/msword",
  "application/octet-stream": null,
};
const IMAGE_LIMIT = 10 * 1024 * 1024;
const MAX_EDGE = 2000;

function keyFor(url: string): string {
  const m = /\/([0-9a-f]{24})\//.exec(url);
  if (m) return m[1];
  return "ext-" + createHash("sha1").update(url).digest("hex").slice(0, 16);
}

function resolveMime(sniffed: string, filenameHint: string | null): { mime: string | null; ext: string } {
  const mime = sniffed in MIME_ALIASES ? MIME_ALIASES[sniffed] : sniffed;
  if (mime === null || mime === undefined) {
    const name = (filenameHint ?? "").toLowerCase();
    for (const [candidateMime, ext] of Object.entries(EXT_FOR_MIME)) {
      if (name.endsWith("." + ext)) return { mime: candidateMime, ext };
    }
    return { mime: null, ext: "" };
  }
  return mime in EXT_FOR_MIME ? { mime, ext: EXT_FOR_MIME[mime] } : { mime: null, ext: "" };
}

function shrinkImage(path: string): string | null {
  const out = path + ".web.jpg";
  if (existsSync(out) && statSync(out).size > 0) return out;
  try {
    execFileSync("sips", [
      "-Z",
      String(MAX_EDGE),
      "-s",
      "format",
      "jpeg",
      "-s",
      "formatOptions",
      "80",
      path,
      "--out",
      out,
    ]);
    return existsSync(out) && statSync(out).size > 0 ? out : null;
  } catch {
    return null;
  }
}

type DownloadMeta = { code: string; size: number; mime: string; filename: string | null };

function downloadAsset(url: string): { path: string; meta: DownloadMeta } | null {
  const dest = join(CACHE, "assets", keyFor(url));
  mkdirSync(dirname(dest), { recursive: true });
  const metaPath = dest + ".meta";
  if (!existsSync(dest) || !existsSync(metaPath)) {
    const hdrPath = dest + ".hdr";
    const code = execFileSync(
      "curl",
      [
        "-sS",
        "-L",
        "--max-time",
        "60",
        "--connect-timeout",
        "8",
        "--retry",
        "1",
        "-A",
        UA,
        "-D",
        hdrPath,
        "-o",
        dest,
        "-w",
        "%{http_code}",
        url,
      ],
      { encoding: "utf-8" },
    ).trim();
    const size = existsSync(dest) ? statSync(dest).size : 0;
    const headers = existsSync(hdrPath) ? readFileSync(hdrPath, "utf-8") : "";
    let filename: string | null = null;
    const dm = /content-disposition:([^\r\n]+)/i.exec(headers);
    if (dm) {
      const fm = /filename\*?=(?:UTF-8'')?"?([^"\r\n;]+)"?/i.exec(dm[1]);
      if (fm) filename = decodeURIComponent(fm[1]).trim();
    }
    const mime = size ? execFileSync("file", ["-b", "--mime-type", dest], { encoding: "utf-8" }).trim() : "";
    writeFileSync(metaPath, JSON.stringify({ code, size, mime, filename }));
  }
  const meta = JSON.parse(readFileSync(metaPath, "utf-8")) as DownloadMeta;
  if (meta.code !== "200" || meta.size === 0 || meta.mime.startsWith("text/html")) return null;
  return { path: dest, meta };
}

async function uploadToStorage(
  base: string,
  key: string,
  bucket: string,
  objectKey: string,
  filePath: string,
  mime: string,
): Promise<boolean> {
  const res = await fetch(`${base}/storage/v1/object/${bucket}/${objectKey}`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": mime,
      "x-upsert": "true",
    },
    body: readFileSync(filePath),
  });
  return res.ok;
}

async function ensureAssetUploaded(
  url: string,
  kind: "image" | "file",
  label: string | null,
  assetMap: Map<string, MappedAsset>,
  base: string,
  key: string,
): Promise<void> {
  if (assetMap.has(url)) return;
  const dl = downloadAsset(url);
  if (!dl) return;
  const { mime, ext } = resolveMime(dl.meta.mime, dl.meta.filename ?? label);
  if (!mime) return;

  const bucket = kind === "image" ? "posters" : "attachments";
  let source = dl.path;
  let finalMime = mime;
  let size = dl.meta.size;
  let objectKey = `news/${keyFor(url)}.${ext}`;

  if (kind === "image" && dl.meta.size > IMAGE_LIMIT) {
    const smaller = shrinkImage(dl.path);
    if (!smaller) return;
    source = smaller;
    finalMime = "image/jpeg";
    size = statSync(smaller).size;
    objectKey = `news/${keyFor(url)}.jpg`;
  }

  const ok = await uploadToStorage(base, key, bucket, objectKey, source, finalMime);
  if (!ok) return;

  assetMap.set(url, {
    url: `${base}/storage/v1/object/public/${bucket}/${objectKey}`,
    kind,
    name: dl.meta.filename ?? label ?? objectKey,
    size,
    mime: finalMime,
  });
}

/* ------------------------------------------------------------------ *
 * 整合一筆的所有欄位                                                   *
 * ------------------------------------------------------------------ */

type ProcessedItem = {
  legacyId: string;
  href: string;
  categoryRaw: string;
  category: string;
  categoryEn: string | null;
  program: string | null;
  programNote: string | null;
  title: string;
  titleEn: string | null;
  publishedAt: string;
  speaker: string | null;
  speakerEn: string | null;
  eventAt: string | null;
  contentHtml: string;
  attachments: { src: string; name: string }[];
  cover: string | null;
  imgCount: number;
  attachmentCount: number;
  alreadyExists: boolean;
  existingMatches: ExistingRow[];
};

/** 寫入 news 的一列，欄位形狀照 import-news.ts:335-359 的 prepared 物件，
 *  多一個 program（那個欄位是 import-news.ts 寫完之後才加的 migration，
 *  prepared 物件從沒更新過；這支腳本從一開始就把它填進去，任務事實 8 要求
 *  的行為）。 */
type NewsInsertRow = {
  published_at: string;
  category: string;
  category_en: string | null;
  title: string;
  title_en: string | null;
  body: string | null;
  content_html: string | null;
  content_json: null;
  cover_url: string | null;
  is_pinned: false;
  status: "published";
  attachments: { name: string; url: string; size: number; mime: string }[];
  speaker: string | null;
  speaker_en: string | null;
  venue: null;
  event_at: string | null;
  program: string | null;
};

/* ------------------------------------------------------------------ *
 * 報告                                                                *
 * ------------------------------------------------------------------ */

function printReport(items: ProcessedItem[]) {
  const sorted = [...items].sort((a, b) => a.publishedAt.localeCompare(b.publishedAt) || a.legacyId.localeCompare(b.legacyId));

  console.log(`\n候選 ${items.length} 筆（--since ${SINCE}）：`);
  for (const it of sorted) {
    const programTag = it.program ? `/${it.program}` : "";
    const flags = [
      it.titleEn ? "" : "⚠️缺英文標題",
      it.programNote ? "⚠️" + it.programNote : "",
    ]
      .filter(Boolean)
      .join(" ");
    console.log(
      `  ${it.publishedAt}  [${it.category}${programTag}]`.padEnd(28) +
        `圖${it.imgCount} 附${it.attachmentCount}  已存在:${it.alreadyExists ? "是" : "否"}  ` +
        `(舊id ${it.legacyId})  ${it.title}` +
        (flags ? `  ${flags}` : ""),
    );
  }

  const existing = items.filter((i) => i.alreadyExists);
  const missingEn = items.filter((i) => !i.titleEn);
  const importable = items.filter((i) => !i.alreadyExists && i.titleEn);

  console.log(
    `\n統計：候選 ${items.length}　已存在（略過）${existing.length}　` +
      `缺英文標題（略過）${missingEn.length}　可匯入 ${importable.length}`,
  );

  if (existing.length) {
    console.log("\n已存在（(title, published_at) 對到既有列，不會重複寫入）：");
    for (const i of existing) {
      const matched = i.existingMatches.map((m) => `id ${m.id}（${m.category}）`).join("、");
      console.log(`  (舊id ${i.legacyId}) ${i.title}｜${i.publishedAt} → 對到既有 ${matched}`);
    }
  } else {
    console.log("\n沒有任何一筆被判定為已存在。");
  }

  if (missingEn.length) {
    console.log("\n缺英文標題（不會寫入；需先補進 scripts/data/titles-en-september.json）：");
    for (const i of missingEn) console.log(`  (舊id ${i.legacyId}) ${i.title}｜${i.publishedAt}`);
  }

  const badProgram = items.filter((i) => i.programNote);
  if (badProgram.length) {
    console.log("\n分類/學制需要人工確認：");
    for (const i of badProgram) console.log(`  (舊id ${i.legacyId}) ${i.title} → ${i.programNote}`);
  }
}

/* ------------------------------------------------------------------ *
 * main                                                                *
 * ------------------------------------------------------------------ */

async function main() {
  mkdirSync(CACHE, { recursive: true });

  console.log(`增量匯入舊站消息（--since ${SINCE}，模式：${WRITE ? "--write 真的寫入" : "--dry 只印報告"}）`);

  const base = env("NEXT_PUBLIC_SUPABASE_URL");
  const key = env("SUPABASE_SERVICE_ROLE_KEY");

  /* ---- 1. 逐頁抓列表，直到整頁都比 --since 舊 ---- */
  const candidates: ListItem[] = [];
  for (let page = 1; ; page++) {
    const html = fetchListPage(page);
    if (!html) break;
    const items = parseListPage(html);
    if (items.length === 0) {
      console.log(`  第 ${page} 頁沒有任何項目，停止翻頁`);
      break;
    }
    const qualifying = items.filter((it) => it.publishedAt >= SINCE);
    console.log(`  第 ${page} 頁：${items.length} 筆，符合 --since 的 ${qualifying.length} 筆`);
    candidates.push(...qualifying);
    if (qualifying.length === 0) {
      console.log(`  整頁都比 --since 舊，停止翻頁`);
      break;
    }
    if (page > 1) sleep(0.2);
  }

  // 同一個 id 理論上不會在 /zh_tw/news 列表裡出現兩次（不像舊 fetch-news.py
  // 要處理「同一篇在 /news 與 /recruit 都能找到」的情況——這裡只有一個列表
  // 來源），但分頁邊界萬一重疊還是保險去重一次，只留第一次見到的。
  const seenIds = new Set<string>();
  const uniqueCandidates = candidates.filter((c) => {
    if (seenIds.has(c.legacyId)) return false;
    seenIds.add(c.legacyId);
    return true;
  });

  /* ---- 2. 既有 news 資料，供去重比對 ---- */
  const existingRows = await fetchExistingForDedup(base, key, SINCE);
  const existingByKey = new Map<string, ExistingRow[]>();
  for (const row of existingRows) {
    const k = dedupKey(row.title, row.published_at);
    if (!existingByKey.has(k)) existingByKey.set(k, []);
    existingByKey.get(k)!.push(row);
  }
  console.log(`\n既有 news 中 published_at >= ${SINCE} 的列：${existingRows.length} 筆（去重比對基準）`);

  /* ---- 3. 逐筆抓內頁、解析 ---- */
  const titlesEn = readJson<Record<string, string>>(join(LEGACY_DATA, "titles-en-september.json"), {});
  const speakersEn = readJson<Record<string, string>>(join(LEGACY_DATA, "speakers-en.json"), {});

  const processed: ProcessedItem[] = [];
  for (const cand of uniqueCandidates) {
    const html = fetchDetailCached(cand.legacyId, cand.href);
    sleep(0.2);
    if (!html) continue; // 抓不到內頁：略過，不硬湊資料

    const parsed = parseDetailPage(html);
    const title = parsed.title || cand.title;
    // 內頁的日期比較準（同 parse-news.py），列表頁日期當備援。
    const publishedAt = parsed.publishedAt || cand.publishedAt;

    const { category, program, programNote } = mapCategory(cand.categoryRaw);
    const categoryEn = CATEGORY_EN[category] ?? null;
    const titleEn = titlesEn[cand.legacyId] ?? null;

    const talk = category === "演講公告" ? parseTalk(title, publishedAt) : { speaker: null, eventAt: null };
    const speakerEn = talk.speaker ? (speakersEn[talk.speaker] ?? null) : null;

    const key2 = dedupKey(title, publishedAt);
    const existingMatches = existingByKey.get(key2) ?? [];

    processed.push({
      legacyId: cand.legacyId,
      href: cand.href,
      categoryRaw: cand.categoryRaw,
      category,
      categoryEn,
      program,
      programNote,
      title,
      titleEn,
      publishedAt,
      speaker: talk.speaker,
      speakerEn,
      eventAt: talk.eventAt,
      contentHtml: parsed.contentHtml,
      attachments: parsed.attachments,
      cover: parsed.cover,
      imgCount: countImages(parsed.contentHtml),
      attachmentCount: parsed.attachments.length,
      alreadyExists: existingMatches.length > 0,
      existingMatches,
    });
  }

  /* ---- 4. 報告 ---- */
  printReport(processed);

  if (!WRITE) {
    console.log("\n（--dry：沒有下載/上傳任何檔案、沒有寫入資料庫。加 --write 才會真的執行）");
    return;
  }

  const importable = processed.filter((i) => !i.alreadyExists && i.titleEn);
  if (importable.length === 0) {
    console.log("\n沒有可寫入的列（全部已存在或缺英文標題），結束。");
    return;
  }
  await writeRows(importable, base, key);
}

/* ------------------------------------------------------------------ *
 * write                                                               *
 * ------------------------------------------------------------------ */

async function writeRows(items: ProcessedItem[], base: string, key: string) {
  console.log(`\n--write：準備寫入 ${items.length} 筆`);

  // 4b：下載內文圖片／附件／封面，上傳 Storage。每個 URL 只上傳一次（用
  // assetMap 記住），同一張圖同時是封面又出現在內文是常態。
  const assetMap = new Map<string, MappedAsset>();
  for (const item of items) {
    for (const src of extractImgSrcs(item.contentHtml)) {
      await ensureAssetUploaded(resolveUrl(src), "image", null, assetMap, base, key);
    }
    for (const att of item.attachments) {
      await ensureAssetUploaded(att.src, "file", att.name, assetMap, base, key);
    }
    if (item.cover) {
      await ensureAssetUploaded(resolveUrl(item.cover), "image", null, assetMap, base, key);
    }
  }
  console.log(`  資產上傳完成：${assetMap.size} 個`);

  // 5：改網址、消毒、組出最終要寫入的列。
  const rows: { legacyId: string; row: NewsInsertRow }[] = items.map((item) => {
    const rewritten = facebookEmbedsToLinks(rewriteAssets(item.contentHtml, assetMap));
    const clean = tidy(sanitizeHtml(rewritten, RICH_TEXT_SANITIZE));

    const attachments = item.attachments
      .map((a) => {
        const mapped = assetMap.get(a.src);
        if (!mapped) return null;
        return { name: a.name || mapped.name, url: mapped.url, size: mapped.size, mime: mapped.mime };
      })
      .filter((a): a is NonNullable<typeof a> => a !== null);

    const coverAbs = item.cover ? resolveUrl(item.cover) : null;
    const mappedCover = coverAbs ? assetMap.get(coverAbs) : undefined;
    const cover = mappedCover?.url ?? hoistCover(clean);

    const row: NewsInsertRow = {
      published_at: item.publishedAt,
      category: item.category,
      category_en: item.categoryEn,
      title: item.title,
      title_en: item.titleEn,
      body: summarise(clean),
      content_html: clean || null,
      content_json: null,
      cover_url: cover,
      is_pinned: false,
      status: "published",
      attachments,
      speaker: item.speaker,
      speaker_en: item.speakerEn,
      venue: null,
      event_at: item.eventAt,
      program: item.program,
    };
    return { legacyId: item.legacyId, row };
  });

  // 9：只用 POST 新增，沒有任何清空或砍列的動作。批次寫入同 import-news.ts
  // 的理由：一次全部塞進一個請求，失敗時看不出是哪一筆造成的。
  const headers = {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
  };
  const BATCH = 50;
  const written: { legacyId: string; newsId: number; title: string; published_at: string }[] = [];
  for (let i = 0; i < rows.length; i += BATCH) {
    const slice = rows.slice(i, i + BATCH);
    const response = await fetch(`${base}/rest/v1/news`, {
      method: "POST",
      headers: { ...headers, Prefer: "return=representation" },
      body: JSON.stringify(slice.map((s) => s.row)),
    });
    if (!response.ok) {
      throw new Error(`第 ${i}–${i + slice.length} 筆寫入失敗：${response.status} ${await response.text()}`);
    }
    const inserted = (await response.json()) as { id: number }[];
    inserted.forEach((r, j) => {
      written.push({
        legacyId: slice[j].legacyId,
        newsId: r.id,
        title: slice[j].row.title,
        published_at: slice[j].row.published_at,
      });
    });
    console.log(`  寫入 ${i + slice.length}/${rows.length}`);
  }

  // news 沒有欄位存「這列是從舊站哪個 id 搬來的」，寫這份稽核紀錄是唯一
  // 事後還查得回去的地方。
  mkdirSync(DATA, { recursive: true });
  const auditPath = join(DATA, `written-${SINCE}-${Date.now()}.json`);
  writeFileSync(auditPath, JSON.stringify(written, null, 1));
  console.log(`\n完成：寫入 ${written.length} 則。稽核紀錄：${auditPath}`);
}

main().catch((err) => {
  console.error("\n發生錯誤：", err instanceof Error ? err.stack ?? err.message : err);
  process.exitCode = 1;
});
