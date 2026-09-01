import Link from "next/link";
import type { FilterTab } from "./FilterTabs";

/**
 * `.filter-tabs` as navigation — the pill row on /news, where each pill is a
 * different URL rather than a toggle.
 *
 * A separate component from `FilterTabs` rather than a mode of it, for a
 * mechanical reason: `FilterTabs` is `"use client"`, and a function prop like
 * `hrefFor` cannot cross the RSC boundary. (`Pagination` takes one only because
 * it is a Server Component.) Keeping them apart also means /courses and
 * /faculty — the two pages whose tabs are still a client-side toggle — are not
 * touched at all, and /news stops shipping the `useState` that existed only to
 * light up a pill.
 *
 * The active pill comes from the route, not from state. That is the whole point:
 * with `useState` the row would reset to 「全部」 on every navigation, which is
 * exactly what a reader would not expect after clicking one.
 *
 * ⚠️ site.css styles these as `.filter-tabs button` — an element selector, so
 * an `<a>` inherits none of it. The matching rules live in site-extensions.css;
 * that file and this component have to move together.
 */
export function FilterTabLinks({
  tabs,
  activeValue,
  hrefFor,
  ariaLabel,
  className,
}: {
  tabs: FilterTab[];
  /** The `value` of the tab the current route represents. */
  activeValue: string;
  hrefFor: (value: string) => string;
  ariaLabel: string;
  className?: string;
}) {
  return (
    /*
     * <nav>, not `role="toolbar"`.
     *
     * A toolbar is a group of controls with roving tab focus; this is a set of
     * links to sibling pages, which is a navigation landmark. `aria-pressed`
     * goes with it — that belongs to toggle buttons, and a link has no pressed
     * state. `aria-current="page"` is the accurate one here: the active tab is
     * not "on", it *is* the page you are looking at.
     */
    <nav
      className={`filter-tabs${className ? ` ${className}` : ""}`}
      aria-label={ariaLabel}
    >
      {tabs.map((tab) => {
        const active = tab.value === activeValue;
        return (
          <Link
            key={tab.value}
            href={hrefFor(tab.value)}
            className={active ? "active" : undefined}
            aria-current={active ? "page" : undefined}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
