import { NAV_ITEMS, type NavItem } from "@/lib/nav";

/**
 * Navigation derivations shared by the three places the reference site repeats
 * the route list: the 7-item desktop nav, the 8-card menu overlay grid, and the
 * 4+3 footer columns. All three read lib/nav.ts so the routes and their
 * Chinese labels can never drift apart.
 */

/** Zero-padded ordinal, e.g. 1 → "01". */
export function padNo(n: number): string {
  return String(n).padStart(2, "0");
}

/** Total shown as the denominator of every interior hero's "NN / 08". */
export const ROUTE_TOTAL = padNo(NAV_ITEMS.length);

/** Desktop nav: the 7 non-home routes. 首頁 is only reachable via the brand. */
export const DESKTOP_NAV: NavItem[] = NAV_ITEMS.slice(1);

/** Menu overlay grid: all 8 routes, numbered 01–08 in nav order. */
export const MENU_ITEMS: (NavItem & { no: string })[] = NAV_ITEMS.map(
  (item, i) => ({ ...item, no: padNo(i + 1) })
);

/**
 * Footer sitemap columns. The reference site hard-splits the 7 non-home routes
 * 4 / 3 — that's a layout decision (`.footer-links` is a 2-column grid of bare
 * <div>s), not data, so the split point is fixed here rather than computed.
 */
export const FOOTER_COLUMNS: NavItem[][] = [
  DESKTOP_NAV.slice(0, 4),
  DESKTOP_NAV.slice(4),
];

/**
 * The "NN / 08" route number an interior hero prints, derived from the route's
 * position in NAV_ITEMS (news = 02 … alumni = 08). Returns null for the home
 * page, which has no route number.
 */
export function routeNumber(href: string): string | null {
  const i = NAV_ITEMS.findIndex((item) => item.href === href);
  return i > 0 ? padNo(i + 1) : null;
}
