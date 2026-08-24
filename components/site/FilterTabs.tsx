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
export type FilterTab = {
  /**
   * The value handed to `onChange`. Kept separate from `label` because
   * /faculty matches it against `faculty.category`, which is always Chinese
   * (it selects the card layout, so it is never translated) while the label
   * the visitor reads is not. Collapsing the two would make every English tab
   * match nothing and silently empty the grid.
   */
  value: string;
  /** Visible text, in the page's language. */
  label: string;
};

export function FilterTabs({
  tabs,
  className,
  ariaLabel,
  onChange,
}: {
  /** Tabs in display order. The first one starts active. */
  tabs: FilterTab[];
  /** Extra class, e.g. "faculty-filters". */
  className?: string;
  ariaLabel: string;
  /**
   * Omit for the cosmetic-only case. When present, receives the clicked
   * tab's `value` — /faculty compares it against `faculty.category` by exact
   * string match, with "全部" meaning no filter.
   */
  onChange?: (value: string) => void;
}) {
  const [active, setActive] = useState(tabs[0]?.value);

  return (
    <div
      className={`filter-tabs${className ? ` ${className}` : ""}`}
      role="toolbar"
      aria-label={ariaLabel}
    >
      {tabs.map((tab) => (
        <button
          key={tab.value}
          type="button"
          className={tab.value === active ? "active" : ""}
          aria-pressed={tab.value === active}
          onClick={() => {
            setActive(tab.value);
            onChange?.(tab.value);
          }}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
