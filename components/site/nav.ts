import { NAV_ITEMS, navItems, type NavItem } from "@/lib/nav";
import type { Lang } from "@/lib/i18n";

/**
 * Navigation derivations shared by the three places the reference site repeats
 * the route list: the 7-item desktop nav, the 8-card menu overlay grid, and the
 * 4+3 footer columns. All three read lib/nav.ts so the routes and their labels
 * can never drift apart — in either language.
 *
 * The three lists are functions of `lang` rather than module constants: a
 * module constant is evaluated once per process and would freeze whichever
 * language happened to render first, then serve it to the other. `ROUTE_TOTAL`
 * and `routeNumber` stay constants because they only read hrefs and the list
 * length, both of which are language-neutral by construction.
 *
 * The hrefs these return are language-neutral too — run them through
 * `navHref` (lib/nav.ts) at render time to get the `/en`-prefixed URL.
 */

/** Zero-padded ordinal, e.g. 1 → "01". */
export function padNo(n: number): string {
  return String(n).padStart(2, "0");
}

/** Total shown as the denominator of every interior hero's "NN / 08". */
export const ROUTE_TOTAL = padNo(NAV_ITEMS.length);

/** Desktop nav: the 7 non-home routes. 首頁 is only reachable via the brand. */
export function desktopNav(lang: Lang): NavItem[] {
  return navItems(lang).slice(1);
}

/** Menu overlay grid: all 8 routes, numbered 01–08 in nav order. */
export function menuItems(lang: Lang): (NavItem & { no: string })[] {
  return navItems(lang).map((item, i) => ({ ...item, no: padNo(i + 1) }));
}

/**
 * Footer sitemap columns. The reference site hard-splits the 7 non-home routes
 * 4 / 3 — that's a layout decision (`.footer-links` is a 2-column grid of bare
 * <div>s), not data, so the split point is fixed here rather than computed.
 */
export function footerColumns(lang: Lang): NavItem[][] {
  const routes = desktopNav(lang);
  return [routes.slice(0, 4), routes.slice(4)];
}

/**
 * The "NN / 08" route number an interior hero prints, derived from the route's
 * position in NAV_ITEMS (news = 02 … alumni = 08). Returns null for the home
 * page, which has no route number.
 *
 * Matches on `href`, which is the same in both languages, so this keeps
 * reading the Chinese-labelled list — the labels are never looked at.
 */
export function routeNumber(href: string): string | null {
  const i = NAV_ITEMS.findIndex((item) => item.href === href);
  return i > 0 ? padNo(i + 1) : null;
}
