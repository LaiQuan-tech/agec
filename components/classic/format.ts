/**
 * Small presentation helpers for the classic theme. Plain functions with no
 * "use client"/"use server" directive so they can be imported from both the
 * Server Components (Home/About/Admissions/Journal/Alumni) and the Client
 * Components (News/Faculty/Courses) in this folder.
 */

export type NewsDateParts = {
  /** Full date, e.g. "2026.06.09" (used by /news list + seminar card). */
  full: string;
  /** Day-of-month, zero-padded, e.g. "09" (home 最新消息 date block). */
  day: string;
  /** Year.Month, e.g. "2026.06" (home 最新消息 date block). */
  ym: string;
};

/**
 * Format a Supabase `date`/timestamp string into the pieces the prototype
 * renders. Uses plain string slicing (not `new Date()`) so the output is
 * timezone-stable between server render and client hydration.
 */
export function formatNewsDate(publishedAt: string): NewsDateParts {
  const datePart = (publishedAt ?? "").slice(0, 10); // YYYY-MM-DD
  const [y, m, d] = datePart.split("-");
  if (!y || !m || !d) {
    return { full: publishedAt ?? "", day: "", ym: "" };
  }
  return { full: `${y}.${m}.${d}`, day: d, ym: `${y}.${m}` };
}

/**
 * Single-character badge for a degree program, matching the prototype's
 * 學/碩/博/職/際 icons. Derived from the program name so it works for whatever
 * `programs` rows the DB returns (order matters: check the more specific
 * keywords first).
 */
export function programIcon(name: string): string {
  if (name.includes("國際")) return "際";
  if (name.includes("在職")) return "職";
  if (name.includes("博")) return "博";
  if (name.includes("碩")) return "碩";
  if (name.includes("學") || name.includes("大學")) return "學";
  return name.trim().charAt(0) || "學";
}

/** Serif heading font token (風格A). */
export const SERIF = "var(--font-heading)";
