"use client";

import { useState } from "react";

/**
 * `.filter-tabs` — the pill row used by /news, /courses and /faculty.
 *
 * ⚠️ On the reference site these tabs are *cosmetic* on /news and /courses:
 * site.js's generic handler only moves the `active` class and `aria-pressed`,
 * it never filters the list. Clicking a tab there visibly does nothing to the
 * data. That is existing behaviour, not a bug — "fixing" it makes the port
 * diverge from the original. Only /faculty actually filters, via its own
 * handler, so only /faculty should pass `onChange`.
 *
 * There is no URL/hash state: a reload always returns to the first tab.
 */
export function FilterTabs({
  tabs,
  className,
  ariaLabel,
  onChange,
}: {
  /** Visible labels. The first one starts active. */
  tabs: string[];
  /** Extra class, e.g. "faculty-filters". */
  className?: string;
  ariaLabel: string;
  /**
   * Omit for the cosmetic-only case. When present, receives the clicked
   * label — /faculty compares it against `faculty.category` by exact string
   * match, with "全部" meaning no filter.
   */
  onChange?: (tab: string) => void;
}) {
  const [active, setActive] = useState(tabs[0]);

  return (
    <div
      className={`filter-tabs${className ? ` ${className}` : ""}`}
      role="toolbar"
      aria-label={ariaLabel}
    >
      {tabs.map((tab) => (
        <button
          key={tab}
          type="button"
          className={tab === active ? "active" : ""}
          aria-pressed={tab === active}
          onClick={() => {
            setActive(tab);
            onChange?.(tab);
          }}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}
