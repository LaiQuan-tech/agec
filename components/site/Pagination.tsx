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
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) =>
        n === page ? (
          // `.pagination span` is the current-page style in site.css.
          <span key={n} aria-current="page">
            {String(n).padStart(2, "0")}
          </span>
        ) : (
          <Link
            key={n}
            href={hrefFor(n)}
            aria-label={t.paginationPage.replace("{n}", String(n))}
          >
            {String(n).padStart(2, "0")}
          </Link>
        )
      )}
      {page < totalPages ? (
        <Link href={hrefFor(page + 1)}>{t.paginationNext}</Link>
      ) : null}
    </nav>
  );
}
