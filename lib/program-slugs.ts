/**
 * 學制的網址代稱。
 *
 * `/courses/undergraduate` 而不是 `/courses/3` 或 `/courses/%E5%A4%A7%E5%AD%B8%E9%83%A8`：
 * 這幾頁是系辦會貼進信件與公告的網址，讀得懂才有意義。
 *
 * ## 為什麼是程式碼裡的對照表，不是資料表欄位
 *
 * 與 lib/news-categories.ts 同一個處理。學制只有四個、而且是這個系所的組織
 * 結構，不是內容 —— 系辦不會新增第五個學制，卻可能在後台手滑改到一個
 * 「代稱」欄位。放在這裡的代價是新增學制要改程式碼，換來的是：
 *
 *  - 網址不會因為有人編輯而失效（改代稱 = 舊網址 404，而且沒有轉址表）
 *  - 不需要 unique constraint、不需要在後台驗證格式
 *  - 不需要在 revalidate 時同時帶新舊兩個代稱（events 那條路就是這樣）
 *
 * ⚠️ key 是 `programs.name` 的**中文原值**，必須與資料庫逐字相同。它同時也是
 * `courses.program` 比對用的文字外鍵（見 lib/data.ts 的 Program.name_zh），
 * 所以這一欄本來就不能翻譯、不能改字。
 *
 * ⚠️ 對照表以外的學制沒有代稱，也就沒有修業規定頁 —— `slugForProgram()` 回
 * null，入口不會渲染連結。這是刻意的：與其產生一個 `/courses/undefined`，
 * 不如什麼都不出現。
 */

/** 中文學制名 → 網址代稱。 */
const PROGRAM_SLUGS: Record<string, string> = {
  大學部: "undergraduate",
  碩士班: "master",
  碩士在職專班: "executive-master",
  博士班: "phd",
};

/** 反查表，建一次就好。 */
const NAME_BY_SLUG: Record<string, string> = Object.fromEntries(
  Object.entries(PROGRAM_SLUGS).map(([name, slug]) => [slug, name])
);

/** 這個學制的網址代稱；不在對照表裡就回 null（代表它沒有規定頁）。 */
export function slugForProgram(nameZh: string): string | null {
  return PROGRAM_SLUGS[nameZh] ?? null;
}

/**
 * 網址代稱 → 中文學制名；不是四個代稱之一就回 null。
 *
 * ⚠️ 路由拿到的是使用者可以任意輸入的字串，所以這一支是白名單而不是轉換：
 * 回 null 的都由呼叫端 404，不會有任何值被送進資料庫查詢。
 */
export function programForSlug(slug: string): string | null {
  return NAME_BY_SLUG[slug] ?? null;
}

/** 四個代稱，給 generateStaticParams 與 sitemap 用。 */
export const PROGRAM_SLUG_LIST = Object.values(PROGRAM_SLUGS);
