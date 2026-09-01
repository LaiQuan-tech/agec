import type { MetadataRoute } from "next";
import { LANGS, localizePath } from "@/lib/i18n";
import { getNewsIds, getNewsYears, getPostSlugs } from "@/lib/data";
import { NEWS_CATEGORIES } from "@/lib/news-categories";
import { SITE_ORIGIN } from "@/lib/site-routes";

const ROUTES = [
  "/",
  "/news",
  "/about",
  "/faculty",
  "/admissions",
  "/courses",
  "/students",
  "/alumni",
  "/blog",
  // 演講公告 are excluded from /news's paginated list, so without this entry
  // the archive's first page would be reachable only from a link inside the
  // talks block. Its own pages 2..n stay out for the same reason /news/page/N
  // does — see the note below.
  "/news/talks",
  // The filtered views of /news. Their own pages 2..n stay out for the same
  // reason /news/page/N does — see the note below.
  ...NEWS_CATEGORIES.map((c) => `/news/category/${c.slug}`),
];

/**
 * Both language versions of every public route — the eight in lib/nav.ts, plus
 * /blog, plus one entry per published post and per news item — each carrying
 * the `alternates.languages` block so a crawler that finds one version knows
 * the other exists. /admin and /login are omitted deliberately.
 *
 * The paginated /news/page/N and /news/talks/page/N URLs are left out on
 * purpose: they hold no content of their own, and every item on them already
 * has its own entry here.
 *
 * Async because the post list comes from the database. Drafts and scheduled
 * posts are excluded by getPostSlugs, so this never advertises a URL that
 * would 404.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [slugs, newsIds, years] = await Promise.all([
    getPostSlugs(),
    getNewsIds(),
    getNewsYears(),
  ]);
  const articles = [
    ...slugs.map((slug) => `/blog/${slug}`),
    ...newsIds.map((id) => `/news/${id}`),
  ];

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

  return [...ROUTES, ...yearRoutes, ...articles].flatMap((route) =>
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
