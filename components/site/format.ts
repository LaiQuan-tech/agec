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

/**
 * A talk's `event_at` as a Taipei wall-clock string: "2026.06.08（一）14:30".
 *
 * Unlike formatNewsDate above, this one cannot avoid `new Date()`. `event_at`
 * is a `timestamptz` and PostgREST hands it back normalised to UTC, so the
 * eight-hour shift has to actually be applied — slicing the string would print
 * 06:30 for a 14:30 talk.
 *
 * That is safe here only because every caller is a Server Component: the
 * markup is produced once, on a server, and never recomputed during hydration.
 * ⚠️ Calling this from a `"use client"` component would reintroduce exactly the
 * server/client timezone disagreement the note at the top of this file is
 * about — the browser's own zone would win on the second render.
 */
export function formatEventTime(eventAt: string, lang: "zh" | "en"): string {
  const at = new Date(eventAt);
  if (Number.isNaN(at.getTime())) return "";

  const parts = new Intl.DateTimeFormat(lang === "en" ? "en-GB" : "zh-TW", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(at);

  return parts;
}
