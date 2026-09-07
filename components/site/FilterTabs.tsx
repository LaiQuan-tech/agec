"use client";

import { useState } from "react";

/**
 * `.filter-tabs` — the pill row. 目前唯一的使用者是 /courses 的學制籤
 * （components/site/CourseTable.tsx）。
 *
 * 參考站的 site.js 對 /news 與 /courses 只切 `active` 與 `aria-pressed`，
 * 從來不篩任何東西，移植時照做並把它記成「原站行為，不是 bug」。那三頁後來
 * 各自走掉了：/news 的籤改成真的會導到分類頁（FilterTabLinks），/faculty 的
 * 那組在區塊拆開之後移除，/courses 這組在 2026-09 接上 `onChange`，因為一個
 * 按了沒有任何反應的控制項比沒有它更糟。
 *
 * 所以「只亮不篩」這個模式已經不存在於站上。`onChange` 仍然是選用的，但新的
 * 呼叫端請想清楚：省略它就等於印一排騙人的按鈕。
 *
 * There is no URL/hash state: a reload always returns to the first tab.
 */
export type FilterTab = {
  /**
   * The value handed to `onChange`. Kept separate from `label` because
   * /courses matches it against `courses.program`, which is always Chinese
   * (`Program.name` is the translated display name) while the label the
   * visitor reads is not. Collapsing the two would make every English tab
   * match nothing and silently empty the table.
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
  /** 額外的 class。目前沒有呼叫端在用（`.faculty-filters` 隨那組籤一起移除）。 */
  className?: string;
  ariaLabel: string;
  /**
   * Receives the clicked tab's `value` — /courses compares it against
   * `courses.program` by exact string match, with "全部" meaning no filter.
   * 省略它，這排籤就只會亮不會做事；見檔頭。
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
