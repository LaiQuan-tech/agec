"use client";

import Link from "next/link";
import { useState } from "react";

/**
 * 各學制招生頁的「招生公告」清單＋年份籤（client）。
 *
 * 客戶 2026-09-21：「招生資訊的頁面，也要有年份篩選的功能。」與 /news 的年份
 * 導覽（NewsYearNav）長得一樣，但這裡是**瀏覽器端篩**，不是連到另一個路由：
 * 一個學制的公告最多幾十則（在職專班 54），整份本來就在頁面上，點一下年份
 * 就切換，不打伺服器、不需要 /admissions/<slug>/year/<y> 一整組路由。
 * 與 /courses 課程表（CourseTable.tsx：FilterTabs + useState）同一種做法。
 *
 * 年份＝公告日期的西元年，最新在前；預設「全部年份」；只有一個年份時不印
 * 年份列（同 NewsYearNav 的規則，一個籤沒有東西可以切）。
 *
 * 標記沿用 /news：年份列是 `nav.news-years`（用 <button aria-pressed> 不是
 * <a>，樣式在 site-extensions.css 一起蓋），清單是 `.inner-news-list`
 * （日期／分類／標題／箭頭四個直接子元素，順序不能動——site.css 的
 * `.inner-news-list>a` 是四欄格線）。
 */

export type AdmissionNoticeItem = {
  id: number;
  href: string;
  /** `YYYY-MM-DD`，給 <time dateTime>。 */
  dateTime: string;
  /** 印出來的日期（`YYYY.MM.DD`）。 */
  date: string;
  year: number;
  category: string;
  title: string;
};

export function AdmissionNoticeList({
  items,
  yearLabel,
  allYearsLabel,
  navLabel,
  yearHint,
  empty,
}: {
  items: AdmissionNoticeItem[];
  yearLabel: string;
  allYearsLabel: string;
  navLabel: string;
  /** 「{year} 年的公告，共 {count} 則」——年份按鈕的 aria-label。 */
  yearHint: string;
  empty: string;
}) {
  const [year, setYear] = useState<number | null>(null);

  // 年份由資料推導，新的在前。筆數只讀給輔助技術（aria-label），畫面上不印
  // —— 與 /news 的年份列同款：每個年份掛一個 (12) 會把這一行變得擁擠。
  const counts = new Map<number, number>();
  for (const item of items) counts.set(item.year, (counts.get(item.year) ?? 0) + 1);
  const years = [...counts.keys()].sort((a, b) => b - a);
  const visible = year === null ? items : items.filter((item) => item.year === year);

  if (items.length === 0) return <p className="news-empty">{empty}</p>;

  return (
    <>
      {years.length >= 2 ? (
        <nav className="news-years" aria-label={navLabel}>
          <span className="news-years-label">{yearLabel}</span>
          <button
            type="button"
            className={year === null ? "active" : undefined}
            aria-pressed={year === null}
            onClick={() => setYear(null)}
          >
            {allYearsLabel}
          </button>
          {years.map((y) => (
            <button
              key={y}
              type="button"
              className={year === y ? "active" : undefined}
              aria-pressed={year === y}
              aria-label={yearHint.replace("{year}", String(y)).replace("{count}", String(counts.get(y)))}
              onClick={() => setYear(y)}
            >
              {y}
            </button>
          ))}
        </nav>
      ) : null}
      <div className="inner-news-list">
        {visible.map((item) => (
          <Link href={item.href} key={item.id}>
            <time dateTime={item.dateTime}>{item.date}</time>
            <span>{item.category}</span>
            <h3>{item.title}</h3>
            <i>↗︎</i>
          </Link>
        ))}
      </div>
    </>
  );
}
