import type { MetadataRoute } from "next";
import { LANGS, localizePath } from "@/lib/i18n";
import {
  getAlumniEventSlugs,
  getFacultyPageIds,
  getNewsIds,
  getNewsYears,
  getProgramsWithRequirements,
} from "@/lib/data";
import { eventBasePath } from "@/lib/alumni-events";
import { NEWS_CATEGORIES } from "@/lib/news-categories";
import { PROGRAM_SLUG_LIST, slugForProgram } from "@/lib/program-slugs";
import { SITE_ORIGIN } from "@/lib/site-routes";

/**
 * 🔴 沒有這一行，/sitemap.xml 會在 build 時凍結。
 *
 * sitemap.ts 是特殊的 Route Handler：沒有 Request-time API、也沒有 segment
 * config 的話，Next 會把它當靜態檔預先產生（build 輸出印成「○ /sitemap.xml」），
 * 之後系辦在後台發的每一則消息、每一場活動、每一位新老師都不會出現在
 * sitemap 裡，直到下一次部署（上線前實測：後台新增一場活動後，正式站的
 * /sitemap.xml 沒有它，本機同一份資料庫算出來的有）。
 *
 * lib/admin/revalidate.ts 存檔時會對 /sitemap.xml 打 revalidatePath，正常情況
 * 是即時更新；這個 300 秒與公開頁相同，是那條路徑失效時的兜底。
 */
// 🔴 不用 `revalidate = 300`：正式站實測（2026-09-19）Vercel 把 metadata route 的
//    ISR 當靜態檔——20 分鐘內 etag 不變、x-vercel-cache 永遠 HIT、age 一路增加，
//    同一時段 /news 這種 ISR 頁 300 秒就 STALE 重生。改成每次請求都算：三四個
//    只取 id／slug 的查詢，爬蟲一天打幾次而已。
export const dynamic = "force-dynamic";

const ROUTES = [
  "/",
  "/news",
  "/about",
  "/faculty",
  "/admissions",
  "/courses",
  "/students",
  "/alumni",
  // 演講公告 are excluded from /news's paginated list, so without this entry
  // the archive's first page would be reachable only from a link inside the
  // talks block. Its own pages 2..n stay out for the same reason /news/page/N
  // does — see the note below.
  "/news/talks",
  // The filtered views of /news. Their own pages 2..n stay out for the same
  // reason /news/page/N does — see the note below.
  ...NEWS_CATEGORIES.map((c) => `/news/category/${c.slug}`),
  // 網站導覽（給人看的那一頁，不是這一支產生的 XML）。它不在 lib/nav.ts 的
  // 八條路線裡，所以要自己列一條，否則爬蟲只能從機構列的那個連結找到它。
  "/sitemap",
];

/**
 * Both language versions of every public route — the eight in lib/nav.ts, plus
 * one entry per news item and per event page — each carrying
 * the `alternates.languages` block so a crawler that finds one version knows
 * the other exists. /admin and /login are omitted deliberately.
 *
 * The paginated /news/page/N and /news/talks/page/N URLs are left out on
 * purpose: they hold no content of their own, and every item on them already
 * has its own entry here.
 *
 * Async because the item list comes from the database. Drafts are excluded by
 * getNewsIds, so this never advertises a URL that would 404.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [newsIds, years, facultyIds, programNames, alumniEventSlugs, generalEventSlugs] =
    await Promise.all([
      getNewsIds(),
      getNewsYears(),
      getFacultyPageIds(),
      getProgramsWithRequirements(),
      // 活動單頁，兩種對象各自的前綴。getAlumniEventSlugs 只回已上架與已取消
      // 的（草稿不列），而且依對象分開，所以這裡不會列出會 404 的網址。
      getAlumniEventSlugs("alumni"),
      getAlumniEventSlugs("general"),
    ]);
  const articles = newsIds.map((id) => `/news/${id}`);
  const events = [
    ...alumniEventSlugs.map((slug) => `${eventBasePath("alumni")}/${slug}`),
    ...generalEventSlugs.map((slug) => `${eventBasePath("general")}/${slug}`),
  ];
  // 師資的站內個人頁：行政同仁以外每一位都有（getFacultyPageIds 與
  // getFacultyById 同一個條件），所以這裡列的就是全部，不會出現會 404 的網址。
  const profiles = facultyIds.map((id) => `/faculty/${id}`);
  // 各學制的修業規定頁。同上：只有真的有內文的學制才有頁面，而且代稱來自
  // 程式碼裡的白名單，所以這裡不會列出會 404 的網址。
  const requirements = programNames
    .map((name) => slugForProgram(name))
    .filter((slug): slug is string => Boolean(slug))
    .map((slug) => `/courses/${slug}`);
  // 各學制的招生頁：四頁一定存在（每個學制都有招生公告可以列），直接列白名單。
  const admissions = PROGRAM_SLUG_LIST.map((slug) => `/admissions/${slug}`);

  /*
   * 年份頁。這些是真正的封存索引 —— 十一年的消息，年份是讀者實際會用來找東西
   * 的入口，而且清單是資料推導的，所以不會列出空的年份。
   *
   * ⚠️ 分類 × 年份的組合（/news/category/admissions/year/2024）刻意不收。
   * 4 × 11 = 44 個網址、兩種語言就是 88 筆，內容全部是別處已經各自有網址的
   * 消息的子集合 —— 與 /news/page/N 被排除的理由完全一樣（「本身沒有內容」）。
   * 它們仍然可以被瀏覽、被連結，只是不由 sitemap 主動推薦。
   */
  const yearRoutes = years.map(({ year }) => `/news/year/${year}`);

  return [
    ...ROUTES,
    ...yearRoutes,
    ...requirements,
    ...admissions,
    ...profiles,
    ...articles,
    ...events,
  ].flatMap((route) =>
    LANGS.map((lang) => ({
      url: `${SITE_ORIGIN}${localizePath(route, lang)}`,
      changeFrequency: "weekly" as const,
      priority: route === "/" ? 1 : 0.8,
      alternates: {
        languages: {
          "zh-Hant": `${SITE_ORIGIN}${localizePath(route, "zh")}`,
          en: `${SITE_ORIGIN}${localizePath(route, "en")}`,
        },
      },
    }))
  );
}
