"use client";

import { useState } from "react";
import type { Course } from "@/lib/data";
import { translate, type Lang } from "@/lib/i18n";
import { COURSES } from "@/lib/i18n/courses";
import { FilterTabs, type FilterTab } from "./FilterTabs";
import { MaybeLink } from "./MaybeLink";

/**
 * 「不篩選」的哨兵值。兩種語言都維持中文的「全部」—— 它是拿去跟
 * `courses.program` 比對的**值**，不是標籤（見 FilterTab 的說明）。
 */
const ALL = "全部";

/**
 * `#section-1` 的學制籤 ＋ `.course-table`。
 *
 * ## 為什麼會有這個元件
 *
 * 這排籤原本只會亮，不會篩 —— 參考站的 site.js 對 /news 與 /courses 只切
 * `active` class，移植時照做並在 FilterTabs 的檔頭記下「這是原站行為，不是
 * bug」。但那個判斷在這個站上不成立：/news 的籤後來改成真的會導到分類頁
 * （FilterTabLinks），只剩這一頁的籤點下去什麼都沒發生 —— 一個看起來可以操作、
 * 按了卻沒有任何回應的控制項，比沒有這排籤更糟。2026-09 客戶也是這樣回報的。
 *
 * ## 為什麼是前端狀態，不是路徑片段
 *
 * /news 的分類走 `/news/category/<slug>` 是因為那些頁面各自有內容、要被索引、
 * 要能分享。這裡不一樣：整張表就在同一頁上，篩選只是把已經送到瀏覽器的列
 * 藏起來，沒有新的內容可以索引。多開四條路由只會讓同一份課表有五個網址。
 *
 * 代價與 /faculty 當初那組一樣：重新整理會回到「全部」。
 *
 * ## 空狀態
 *
 * 某個學制一門課都沒有時，印一句話而不是留下一個只有表頭的空表格。
 * 這不是假設性的：`courses` 目前只有 6 列，碩士在職專班一列都沒有。
 */
export function CourseTable({
  lang,
  rows,
  tabs,
}: {
  lang: Lang;
  /** 已經照 `programRank` 排好序的課程 —— 見 Courses.tsx。 */
  rows: Course[];
  /** 「全部」＋四個學制。`value` 是中文的 `program`，只有 `label` 會翻譯。 */
  tabs: FilterTab[];
}) {
  const t = translate(COURSES, lang);
  const [filter, setFilter] = useState(ALL);
  const shown = filter === ALL ? rows : rows.filter((c) => c.program === filter);

  return (
    <>
      <FilterTabs tabs={tabs} ariaLabel={t.tabs.ariaLabel} onChange={setFilter} />
      {shown.length === 0 ? (
        /* 整張表換掉，而不是留著表頭再塞一列訊息進去：`.course-table` 是
           `role="table"`，它的子元素都是 `role="row"`，多一個 <p> 進去對讀屏
           就是一個結構不合法的表格。 */
        <p className="course-empty" role="status">
          {t.tabs.empty}
        </p>
      ) : (
        /* `.course-table` is a 6-column grid declared on `.course-head`
           and on `.course-table>a` directly — every row must be an <a>
           holding exactly five <span>s plus the trailing <i>, or the
           columns stop lining up. */
        <div className="course-table" role="table">
          <div className="course-head" role="row">
            <span>{t.table.code}</span>
            <span>{t.table.name}</span>
            <span>{t.table.credit}</span>
            <span>{t.table.program}</span>
            <span>{t.table.ctype}</span>
          </div>
          {shown.map((course) => (
            // Not clickable: there is no per-course page on either site and
            // `courses` has no url column, so the reference site's
            // `href="#"` was a row that looked like a link and scrolled to
            // the top. MaybeLink keeps the <a> the grid needs and drops the
            // behaviour. Give the table a destination by adding
            // `courses.url` and passing it here.
            <MaybeLink href={null} role="row" key={course.id}>
              <span>{course.code}</span>
              <span>{course.name}</span>
              <span>{course.credit}</span>
              {/* `program_label`, not `program`: the latter is the Chinese
                  match key the filter and the sort need, and would print
                  Chinese into an otherwise English table. */}
              <span>{course.program_label}</span>
              <span>{course.ctype}</span>
            </MaybeLink>
          ))}
        </div>
      )}
    </>
  );
}
