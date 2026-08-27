import type { Metadata } from "next";
import { localizePath, type Lang, type Msg } from "@/lib/i18n";

/**
 * Per-route <title> / <meta description> in both languages, plus the
 * hreflang wiring that tells search engines the two versions of a page are
 * translations of each other rather than duplicates.
 *
 * Kept out of the page files because each route now has two of them (zh at
 * `/about`, en at `/en/about`) and the pair must not drift.
 */

/**
 * Absolute origin, needed because `alternates.languages` must resolve to
 * absolute URLs for hreflang to be valid. Vercel injects VERCEL_PROJECT_
 * PRODUCTION_URL on every deployment; the literal is the fallback for local
 * builds and is what ships until the department's own domain is pointed here.
 */
export const SITE_ORIGIN = process.env.NEXT_PUBLIC_SITE_ORIGIN
  ? process.env.NEXT_PUBLIC_SITE_ORIGIN
  : process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "https://agec-theta.vercel.app";

export const SITE_NAME: Msg = {
  zh: "國立臺灣大學 農業經濟學系",
  en: "Department of Agricultural Economics, NTU",
};

/** Fallback description, used by routes that don't set their own. */
const DEFAULT_DESCRIPTION: Msg = {
  zh: "以經濟洞見回應世界的農業挑戰。國立臺灣大學農業經濟學系官方網站。",
  en: "Meeting the world's agricultural challenges with economic insight. Official site of the Department of Agricultural Economics, National Taiwan University.",
};

type RouteMeta = { title: Msg; description?: Msg };

/** Keyed by the language-neutral path. */
const ROUTES = {
  "/": {
    title: { zh: "首頁", en: "Home" },
    description: DEFAULT_DESCRIPTION,
  },
  "/news": {
    title: { zh: "最新消息", en: "News" },
  },
  "/about": {
    title: { zh: "本系簡介", en: "About AGEC" },
    description: DEFAULT_DESCRIPTION,
  },
  "/faculty": {
    title: { zh: "系所成員", en: "People" },
  },
  "/admissions": {
    title: { zh: "招生資訊", en: "Admissions" },
    description: DEFAULT_DESCRIPTION,
  },
  "/courses": {
    title: { zh: "課程資訊", en: "Courses & Curriculum" },
  },
  "/students": {
    title: { zh: "學生專區", en: "Students" },
  },
  "/alumni": {
    title: { zh: "系友專區", en: "Alumni" },
    description: DEFAULT_DESCRIPTION,
  },
  /**
   * Not one of the eight routes in lib/nav.ts, on purpose: those eight are the
   * department's agreed IA and every interior hero prints its position as
   * "NN / 08". Adding a ninth would renumber all of them. /blog is reached from
   * the footer and from /news instead.
   */
  "/blog": {
    title: { zh: "專欄文章", en: "Features & Essays" },
  },
} satisfies Record<string, RouteMeta>;

export type SiteRoute = keyof typeof ROUTES;

/**
 * Builds a route's Metadata for one language.
 *
 * `x-default` points at the Chinese version: it is the department's primary
 * language and the only one whose content is guaranteed complete, since the
 * English columns start empty and fall back to Chinese.
 */
export function routeMetadata(route: SiteRoute, lang: Lang): Metadata {
  const meta: RouteMeta = ROUTES[route];
  const path = localizePath(route, lang);

  return {
    // Absolute, not relying on the root layout's `title.template`: that
    // template is a single Chinese string ("%s | 國立臺灣大學 農業經濟學系")
    // and would append it to every English page title.
    title: { absolute: `${meta.title[lang]} | ${SITE_NAME[lang]}` },
    description: (meta.description ?? DEFAULT_DESCRIPTION)[lang],
    alternates: {
      canonical: path,
      languages: {
        "zh-Hant": `${SITE_ORIGIN}${localizePath(route, "zh")}`,
        en: `${SITE_ORIGIN}${localizePath(route, "en")}`,
        "x-default": `${SITE_ORIGIN}${localizePath(route, "zh")}`,
      },
    },
    openGraph: {
      title: meta.title[lang],
      description: (meta.description ?? DEFAULT_DESCRIPTION)[lang],
      url: `${SITE_ORIGIN}${path}`,
      siteName: SITE_NAME[lang],
      locale: lang === "en" ? "en_US" : "zh_TW",
      type: "website",
    },
  };
}

/**
 * Metadata for one blog post.
 *
 * `routeMetadata` above is keyed on the fixed route table, which a dynamic
 * `/blog/[slug]` has no entry in — hence a sibling that takes the values
 * directly. It reproduces the same three things that matter for a translated
 * page: an absolute title (the root layout's template is a single Chinese
 * string), the hreflang pair, and an OpenGraph block.
 */
export function postMetadata(
  slug: string,
  lang: Lang,
  post: { title: string; excerpt: string | null; cover_url: string | null }
): Metadata {
  const route = `/blog/${slug}`;
  const description = post.excerpt ?? DEFAULT_DESCRIPTION[lang];

  return {
    title: { absolute: `${post.title} | ${SITE_NAME[lang]}` },
    description,
    alternates: {
      canonical: localizePath(route, lang),
      languages: {
        "zh-Hant": `${SITE_ORIGIN}${localizePath(route, "zh")}`,
        en: `${SITE_ORIGIN}${localizePath(route, "en")}`,
        "x-default": `${SITE_ORIGIN}${localizePath(route, "zh")}`,
      },
    },
    openGraph: {
      title: post.title,
      description,
      url: `${SITE_ORIGIN}${localizePath(route, lang)}`,
      siteName: SITE_NAME[lang],
      locale: lang === "en" ? "en_US" : "zh_TW",
      type: "article",
      images: post.cover_url ? [post.cover_url] : undefined,
    },
  };
}
