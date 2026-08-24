import { localizePath, type Lang, type Msg } from "@/lib/i18n";

export type NavItem = {
  /** Language-neutral path, e.g. "/about". Run through `navHref` to render. */
  href: string;
  label: string;
};

type NavSource = { href: string; label: Msg };

/**
 * Canonical 8-item site navigation (design_handoff_agec/README.md §資訊架構).
 * The desktop nav, the menu overlay and the footer sitemap all derive from
 * this one list (components/site/nav.ts), so the routes and their labels can
 * never drift apart — in either language.
 *
 * `href` stays language-neutral: English pages live at the same paths under
 * `/en`, so prefixing once at render time (`navHref`) beats storing two lists.
 */
const NAV_SOURCE: NavSource[] = [
  { href: "/", label: { zh: "首頁", en: "Home" } },
  { href: "/news", label: { zh: "最新消息", en: "News" } },
  { href: "/about", label: { zh: "本系簡介", en: "About" } },
  { href: "/faculty", label: { zh: "系所成員", en: "People" } },
  { href: "/admissions", label: { zh: "招生資訊", en: "Admissions" } },
  { href: "/courses", label: { zh: "課程資訊", en: "Courses" } },
  { href: "/students", label: { zh: "學生專區", en: "Students" } },
  { href: "/alumni", label: { zh: "系友專區", en: "Alumni" } },
];

/** The 8 routes with labels resolved for one language. */
export function navItems(lang: Lang): NavItem[] {
  return NAV_SOURCE.map((item) => ({
    href: item.href,
    label: item.label[lang],
  }));
}

/** The href to render for a nav route in a given language. */
export function navHref(href: string, lang: Lang): string {
  return localizePath(href, lang);
}

/**
 * Chinese-labelled list, kept as a named export because
 * components/classic/Shell.tsx (the retired A/B variant) still imports it.
 */
export const NAV_ITEMS: NavItem[] = navItems("zh");
