import type { MetadataRoute } from "next";
import { LANGS, localizePath } from "@/lib/i18n";
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
];

/**
 * Both language versions of all eight public routes, each carrying the
 * `alternates.languages` block so a crawler that finds one version knows the
 * other exists. /admin and /login are omitted deliberately.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return ROUTES.flatMap((route) =>
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
