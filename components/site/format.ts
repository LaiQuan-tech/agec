/**
 * Date formatting for the ported public site.
 *
 * Plain string slicing rather than `new Date()`, so the server render and the
 * client hydration can't disagree about the timezone.
 */

export type NewsDateParts = {
  /** "MM.DD" — the <strong> in the home page's `.news-item time`. */
  monthDay: string;
  /** "YYYY" — the <span> beside it. */
  year: string;
  /** "YYYY.MM.DD" — the interior news list's single-line date. */
  full: string;
};

export function formatNewsDate(publishedAt: string): NewsDateParts {
  const [y, m, d] = (publishedAt ?? "").slice(0, 10).split("-");
  if (!y || !m || !d) {
    return { monthDay: "", year: "", full: publishedAt ?? "" };
  }
  return { monthDay: `${m}.${d}`, year: y, full: `${y}.${m}.${d}` };
}
