import Link from "next/link";
import { translate, type Lang } from "@/lib/i18n";
import { NEWS } from "@/lib/i18n/news";

/**
 * `.pagination` — the numbered page control shared by /news and /news/talks.
 *
 * The reference site shipped this row as decoration: 01/02/03 and 下一頁 with
 * no JavaScript behind them, every one an `href="#"`, so clicking a page number
 * jumped to the top of the document. It is real here — `.pagination` in
 * site.css supplies the type and the right alignment, and the links are
 * ordinary routes, so it still needs no client JS.
 *
 * Extracted from News.tsx when the talks archive appeared and needed the same
 * control. The labels stay in the news dictionary: both lists are news, and a
 * second copy of 「下一頁」 is a second thing to translate.
 */

/** Pages either side of the current one that are always printed. */
const RADIUS = 1;

/**
 * Which page numbers to print, and where the gaps go.
 *
 * 🔴 Why this exists: the row used to print every page. That was invisible at
 * the 11 announcements the site launched with and unusable at 585 — /news is
 * 42 pages, so the control became a 42-number strip wider than the content it
 * paged through, and picking a page out of it meant reading a wall of numbers.
 *
 * The window is first · … · page−1 · page · page+1 · … · last, so the row is at
 * most seven slots wide no matter how long the list gets, and the two ends stay
 * reachable in one click from anywhere.
 *
 * ⚠️ A gap that hides exactly one page prints that page instead. 「1 … 3」 is
 * both wider than 「1 2 3」 and worse: it suggests something is hidden when
 * nothing is.
 */
export function pageWindow(page: number, totalPages: number): (number | "gap")[] {
  const keep = new Set<number>([1, totalPages]);
  for (let n = page - RADIUS; n <= page + RADIUS; n += 1) {
    if (n >= 1 && n <= totalPages) keep.add(n);
  }

  const out: (number | "gap")[] = [];
  let previous = 0;
  for (const n of [...keep].sort((a, b) => a - b)) {
    if (previous && n - previous === 2) out.push(previous + 1);
    else if (previous && n - previous > 2) out.push("gap");
    out.push(n);
    previous = n;
  }
  return out;
}

export function Pagination({
  lang,
  page,
  totalPages,
  hrefFor,
}: {
  lang: Lang;
  page: number;
  totalPages: number;
  /** 1-based page number → route. Each list numbers its own pages. */
  hrefFor: (page: number) => string;
}) {
  const t = translate(NEWS, lang);

  // Hidden entirely at one page rather than rendered as a lone "01" — a control
  // that cannot do anything is worse than no control.
  if (totalPages <= 1) return null;

  return (
    <nav className="pagination" aria-label={t.paginationLabel}>
      {page > 1 ? <Link href={hrefFor(page - 1)}>{t.paginationPrev}</Link> : null}
      {pageWindow(page, totalPages).map((slot, i) =>
        slot === "gap" ? (
          /*
           * `.pagination span` is site.css's current-page style (green, bold),
           * so the ellipsis needs a class of its own or it reads as a second
           * current page. The override lives in site-extensions.css.
           *
           * aria-hidden because it is punctuation: a screen reader announcing
           * 「省略符號」 between two page numbers adds nothing, and the pages it
           * stands for are still reachable through the two ends.
           */
          // eslint-disable-next-line react/no-array-index-key -- gaps have no id
          <span key={`gap-${i}`} className="pagination-gap" aria-hidden="true">
            …
          </span>
        ) : slot === page ? (
          <span key={slot} aria-current="page">
            {String(slot).padStart(2, "0")}
          </span>
        ) : (
          <Link
            key={slot}
            href={hrefFor(slot)}
            aria-label={t.paginationPage.replace("{n}", String(slot))}
          >
            {String(slot).padStart(2, "0")}
          </Link>
        )
      )}
      {page < totalPages ? (
        <Link href={hrefFor(page + 1)}>{t.paginationNext}</Link>
      ) : null}
    </nav>
  );
}
