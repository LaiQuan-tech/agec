"use client";

import { useState } from "react";
import type { Faculty } from "@/lib/data";
import { FilterTabs } from "./FilterTabs";
import { FacultyCard } from "./FacultyCard";

/** The hard-coded magic string site.js compares against; means "no filter". */
const ALL = "全部";

/**
 * `#section-1`'s tabs + result count + `.faculty-grid`.
 *
 * /faculty is the only page whose `.filter-tabs` actually filter anything —
 * site.js has a faculty-specific block on top of the generic active-state
 * handler. That block:
 *   - compares `button.textContent.trim()` against the card's
 *     `.faculty-category` textContent, i.e. an exact string match on the
 *     visible label, with '全部' hard-coded as the escape hatch;
 *   - collects its cards with
 *     `.faculty-filters.closest('.inner-section').querySelectorAll('.faculty-grid article')`,
 *     which is why `#section-2`'s duplicate grid is never affected — that is
 *     existing reference behaviour, not a bug, and `#section-2` is therefore
 *     rendered by the server component instead of from here;
 *   - rewrites the count as '顯示 ' + count + ' 位成員' (one half-width space
 *     on each side of the number).
 * There is no URL/hash state: a reload always returns to 全部.
 *
 * The three elements below are siblings inside `#section-1`'s `.container`,
 * exactly as in the reference — this component returns a fragment so no extra
 * wrapper appears in the DOM.
 */
export function FacultyFilterGrid({
  members,
  tabs,
}: {
  /** The standard-card members, already in display order. */
  members: Faculty[];
  /** Tab labels, `全部` first. Derived from the data — see Faculty.tsx. */
  tabs: string[];
}) {
  const [filter, setFilter] = useState(ALL);
  const isVisible = (member: Faculty) =>
    filter === ALL || member.category === filter;
  const count = members.filter(isVisible).length;

  return (
    <>
      <FilterTabs
        tabs={tabs}
        className="faculty-filters"
        ariaLabel="依師資類別篩選"
        onChange={setFilter}
      />
      <p className="faculty-result-count" aria-live="polite">
        顯示 {count} 位成員
      </p>
      <div className="faculty-grid">
        {members.map((member) => (
          <FacultyCard
            key={member.id}
            member={member}
            showCategory
            visible={isVisible(member)}
          />
        ))}
        {/* `.faculty-empty` spans the whole row (grid-column:1/-1). It never
            renders on the reference site — all four tabs match somebody — but
            the style exists for exactly this case. */}
        {count === 0 ? (
          <p className="faculty-empty">此分類目前沒有成員。</p>
        ) : null}
      </div>
    </>
  );
}
