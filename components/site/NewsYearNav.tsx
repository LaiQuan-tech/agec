import Link from "next/link";
import type { NewsYear } from "@/lib/data";
import { translate, type Lang } from "@/lib/i18n";
import { NEWS } from "@/lib/i18n/news";

/**
 * 依年份瀏覽消息的那一行。
 *
 * ## 為什麼不是第二排籤
 *
 * 分類是四個，做成 `.filter-tabs` 的膠囊剛好；年份是十一個，同樣做成膠囊會在
 * 分類籤下面再壓一排同樣醒目的東西，兩排加起來十六顆——而使用者要的是「畫面
 * 簡潔」。所以年份走輕量的一行文字連結：一個小標題加上以間隔點分開的年份，
 * 讀起來像檔案索引而不是第二組篩選器。
 *
 * ## 為什麼年份要跟著分類走
 *
 * `hrefFor` 由呼叫端提供，而呼叫端會把目前的分類帶進去，所以在「招生」頁點
 * 2024 得到的是 /news/category/admissions/year/2024，而不是跳回全站的 2024。
 * 反過來也一樣：分類籤的 href 會保留年份。兩排各自把對方清掉的話，讀者每縮小
 * 一次範圍就會失去另一次，那不是篩選器，是兩個互相打架的開關。
 *
 * ## 年份從哪裡來
 *
 * `getNewsYears()`，也就是 generateStaticParams 用的同一支。列出來的年份一定
 * 有資料，所以這一行不會出現點下去是空頁的連結。
 */
export function NewsYearNav({
  lang,
  years,
  activeYear,
  hrefFor,
}: {
  lang: Lang;
  years: NewsYear[];
  /** 目前篩選的年份，null 表示全部。 */
  activeYear: number | null;
  /** null → 取消年份篩選。 */
  hrefFor: (year: number | null) => string;
}) {
  const t = translate(NEWS, lang);

  // 只有一個年份時整行不顯示：唯一的選項等於沒有選擇。
  if (years.length < 2) return null;

  return (
    <nav className="news-years" aria-label={t.yearNavLabel}>
      {/* 這是列的名稱不是連結，所以是 <span> 而不是 <h2>——放進標題大綱裡會在
          目錄上多出一層跟內容無關的階層。 */}
      <span className="news-years-label">{t.yearLabel}</span>
      <Link
        href={hrefFor(null)}
        className={activeYear === null ? "active" : undefined}
        aria-current={activeYear === null ? "page" : undefined}
      >
        {t.yearAll}
      </Link>
      {years.map(({ year, count }) => (
        <Link
          key={year}
          href={hrefFor(year)}
          className={year === activeYear ? "active" : undefined}
          aria-current={year === activeYear ? "page" : undefined}
          // 筆數只讀給輔助技術，畫面上不印：十一個年份各掛一個 (37) 會把這一行
          // 變回它想避開的那種擁擠。
          aria-label={t.yearHint
            .replace("{year}", String(year))
            .replace("{count}", String(count))}
        >
          {year}
        </Link>
      ))}
    </nav>
  );
}
