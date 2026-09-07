import { createServerClient } from "@/lib/supabase/server";
import { pick, type Lang } from "@/lib/i18n";

/**
 * 全站搜尋。
 *
 * ## 為什麼是 ILIKE 而不是 Postgres 的全文檢索
 *
 * `to_tsvector` 需要語言的斷詞器才有意義，而 PostgreSQL 內建的分析器**不認得
 * 中文**：整句「115學年度申請入學」會被當成一個 token，搜「入學」就找不到。
 * 正確做法是裝 zhparser 或 pg_jieba，但 Supabase 的受管環境沒有這兩個擴充。
 *
 * 所以用 `ilike '%關鍵字%'`。它在中文上反而剛好：中文沒有空白分隔，子字串
 * 比對就是使用者預期的行為。代價是不能走索引 —— 但這個站最大的表是 585 列，
 * 全表掃描是毫秒等級。
 *
 * ⚠️ 如果消息成長到數萬列，這裡要改成 pg_trgm 的 GIN 索引（`gin_trgm_ops`
 * 可以加速 ilike），或是加一個中文斷詞器。改的時候只要動這個檔。
 *
 * ## 為什麼不搜靜態頁的文案
 *
 * 八個頁面的內容寫在 lib/i18n/*.ts 裡，不在資料庫。要搜它需要另外建一份索引
 * 並在 build 時產生。目前沒做 —— 使用者搜的多半是人名、課名、簡章、獎學金這類
 * 資料庫裡的東西。這是已知的缺口，不是疏忽。
 */

export type SearchHit = {
  /** 給 React 用的唯一鍵。 */
  key: string;
  /** 分類標籤，例如「最新消息」。 */
  kind: string;
  title: string;
  /** 一句話的補充，沒有就是 null。 */
  detail: string | null;
  href: string;
  /** 排序用：標題命中排在內文命中前面。 */
  titleHit: boolean;
};

/** 每一類最多回幾筆。整體上限是這個乘以類別數。 */
const PER_KIND = 20;

/**
 * ⚠️ PostgREST 的 `or=(...)` 是逗號分隔的，而 `ilike` 的值本身也可能含逗號。
 * 值裡的逗號、括號與雙引號會把那個運算式切壞 —— 而切壞的結果不是錯誤，是
 * 一個語意完全不同、還是會回資料的查詢。所以先把它們拿掉。
 *
 * 萬用字元要轉義，否則使用者打一個字元就等於搜全部：
 *
 *   `%` `_`  SQL LIKE 的萬用字元
 *   `*`      🔴 **PostgREST 自己的別名**，它會在送進 SQL 之前把 `*` 換成 `%`。
 *            這一個不在任何 SQL 教學裡，是實測撞出來的：`q=*` 原本會回 47 筆
 *            橫跨所有類別的結果，也就是整個資料庫。
 *   `\`      跳脫字元本身
 *
 * 實測（直接打 PostgREST，`or=(...)` 內外行為一致）：
 *   ilike.%*%   → 585 筆（全部）      ilike.%\*%  → 1 筆
 *   ilike.%%    → 585 筆              ilike.%\%%  → 1 筆
 *   ilike.%_%   → 585 筆              ilike.%\_%  → 0 筆
 */
function safePattern(raw: string): string {
  const cleaned = raw.replace(/[,()"]/g, " ").trim();
  const escaped = cleaned.replace(/([%_*\\])/g, "\\$1");
  return `%${escaped}%`;
}

function truncate(text: string | null, max = 90): string | null {
  if (!text) return null;
  const flat = text.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  if (!flat) return null;
  return flat.length <= max ? flat : `${flat.slice(0, max)}…`;
}

function localize(path: string, lang: Lang): string {
  return lang === "en" ? `/en${path}` : path;
}

export type SearchResult = {
  hits: SearchHit[];
  /** 查詢本身失敗時為 true —— 與「查得到但沒有結果」是兩件事。 */
  failed: boolean;
};

export async function search(query: string, lang: Lang): Promise<SearchResult> {
  const q = query.trim();
  if (!q) return { hits: [], failed: false };

  const supabase = createServerClient();
  const like = safePattern(q);
  const hits: SearchHit[] = [];
  let failed = false;

  const matches = (...values: (string | null)[]) =>
    values.some((v) => (v ?? "").toLowerCase().includes(q.toLowerCase()));

  /* --- 最新消息 -------------------------------------------------------- */
  {
    // ⚠️ status 一定要過濾：service-role 繞過 RLS，少了它草稿會被搜出來。
    //    這是這個檔案裡最容易漏、而且漏了完全不會報錯的一行。
    const { data, error } = await supabase
      .from("news")
      .select("id, title, title_en, body, body_en, category, category_en, published_at")
      .eq("status", "published")
      .or(
        `title.ilike.${like},title_en.ilike.${like},body.ilike.${like},` +
          `content_html.ilike.${like}`
      )
      .order("published_at", { ascending: false })
      .limit(PER_KIND)
      .returns<
        {
          id: number;
          title: string;
          title_en: string | null;
          body: string | null;
          body_en: string | null;
          category: string;
          category_en: string | null;
          published_at: string;
        }[]
      >();

    if (error) {
      console.error("[search] news failed:", error.message);
      failed = true;
    }
    for (const row of data ?? []) {
      const title = pick(row.title, row.title_en, lang);
      const category = pick(row.category, row.category_en, lang);
      hits.push({
        key: `news-${row.id}`,
        kind: category,
        title,
        detail: truncate(pick(row.body, row.body_en, lang)) ?? row.published_at.slice(0, 10),
        href: localize(`/news/${row.id}`, lang),
        titleHit: matches(row.title, row.title_en),
      });
    }
  }

  /* --- 系所成員 -------------------------------------------------------- */
  {
    const { data, error } = await supabase
      .from("faculty")
      .select("id, name, name_en, title, title_en, fields, fields_en, category")
      .or(
        `name.ilike.${like},name_en.ilike.${like},title.ilike.${like},` +
          `fields.ilike.${like},experience.ilike.${like}`
      )
      .limit(PER_KIND)
      .returns<
        {
          id: number;
          name: string;
          name_en: string | null;
          title: string | null;
          title_en: string | null;
          fields: string | null;
          fields_en: string | null;
          category: string;
        }[]
      >();

    if (error) {
      console.error("[search] faculty failed:", error.message);
      failed = true;
    }
    for (const row of data ?? []) {
      hits.push({
        key: `faculty-${row.id}`,
        kind: row.category,
        title: pick(row.name, row.name_en, lang),
        detail:
          truncate(pick(row.title, row.title_en, lang)) ??
          truncate(pick(row.fields, row.fields_en, lang)),
        // 師資沒有個人頁面，只能指到 /faculty。⚠️ 不要編一個 #id 錨點：
        // 那些卡片沒有 id，連過去只會停在頁首，看起來像壞掉的連結。
        href: localize("/faculty", lang),
        titleHit: matches(row.name, row.name_en),
      });
    }
  }

  /* --- 課程 ------------------------------------------------------------ */
  {
    const { data, error } = await supabase
      .from("courses")
      .select("id, code, name, name_en, program, credit")
      .or(`code.ilike.${like},name.ilike.${like},name_en.ilike.${like}`)
      .limit(PER_KIND)
      .returns<
        {
          id: number;
          code: string;
          name: string;
          name_en: string | null;
          program: string;
          credit: number;
        }[]
      >();

    if (error) {
      console.error("[search] courses failed:", error.message);
      failed = true;
    }
    for (const row of data ?? []) {
      hits.push({
        key: `course-${row.id}`,
        kind: row.program,
        title: pick(row.name, row.name_en, lang),
        detail: `${row.code}・${row.credit} 學分`,
        href: localize("/courses", lang),
        titleHit: true,
      });
    }
  }

  /* --- 系友活動 -------------------------------------------------------- */
  {
    const { data, error } = await supabase
      .from("alumni_events")
      .select("id, slug, title, title_en, summary, summary_en, starts_at, status")
      // 與 lib/data.ts 的 PUBLIC_EVENT_STATUSES 一致：草稿不能外流，
      // 已取消的仍要找得到（已報名的人會來查）。
      .in("status", ["published", "cancelled"])
      .or(
        `title.ilike.${like},title_en.ilike.${like},summary.ilike.${like},body.ilike.${like}`
      )
      .order("starts_at", { ascending: false })
      .limit(PER_KIND)
      .returns<
        {
          id: number;
          slug: string;
          title: string;
          title_en: string | null;
          summary: string | null;
          summary_en: string | null;
          starts_at: string;
          status: string;
        }[]
      >();

    if (error) {
      // 表不存在（migration 未執行）也走這裡 —— 那不該讓整個搜尋失敗，
      // 其他四類照樣有結果。
      if (error.code !== "42P01") failed = true;
      console.error("[search] events failed:", error.message);
    }
    for (const row of data ?? []) {
      hits.push({
        key: `event-${row.id}`,
        kind: lang === "en" ? "Alumni event" : "系友活動",
        title: pick(row.title, row.title_en, lang),
        detail:
          truncate(pick(row.summary, row.summary_en, lang)) ??
          row.starts_at.slice(0, 10),
        href: localize(`/alumni/events/${row.slug}`, lang),
        titleHit: matches(row.title, row.title_en),
      });
    }
  }

  // 標題命中排前面。同一組之內維持各自查詢的順序（消息與活動已按日期排過）。
  hits.sort((a, b) => Number(b.titleHit) - Number(a.titleHit));

  return { hits, failed };
}
