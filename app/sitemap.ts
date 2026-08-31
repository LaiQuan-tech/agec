import type { MetadataRoute } from "next";
import { LANGS, localizePath } from "@/lib/i18n";
import { getNewsIds, getPostSlugs } from "@/lib/data";
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
  const [slugs, newsIds] = await Promise.all([getPostSlugs(), getNewsIds()]);
  const articles = [
    ...slugs.map((slug) => `/blog/${slug}`),
    ...newsIds.map((id) => `/news/${id}`),
  ];

  return [...ROUTES, ...articles].flatMap((route) =>
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
