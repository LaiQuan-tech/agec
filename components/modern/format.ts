/**
 * Small presentation helpers for the modern theme (風格B). Plain functions
 * with no "use client"/"use server" directive so they import cleanly from
 * both Server Components (Home/About/Admissions/Journal/Alumni) and Client
 * Components (News/Faculty/Courses) in this folder.
 */

export type NewsDateParts = {
  /** Full date, e.g. "2026.06.09" (used by /news list). */
  full: string;
  /** Month.Day, e.g. "06.09" (home 最新消息 card meta line). */
  md: string;
};

/**
 * Format a Supabase `date`/timestamp string. Uses plain string slicing (not
 * `new Date()`) so output is timezone-stable between server render and client
 * hydration.
 */
export function formatNewsDate(publishedAt: string): NewsDateParts {
  const datePart = (publishedAt ?? "").slice(0, 10); // YYYY-MM-DD
  const [y, m, d] = datePart.split("-");
  if (!y || !m || !d) {
    return { full: publishedAt ?? "", md: "" };
  }
  return { full: `${y}.${m}.${d}`, md: `${m}.${d}` };
}

/**
 * Single-character badge for a degree program (學/碩/博/職/際), derived from
 * the program name so it works for whatever `programs` rows the DB returns.
 * Order matters — check the more specific keywords first.
 */
export function programIcon(name: string): string {
  if (name.includes("國際")) return "際";
  if (name.includes("在職")) return "職";
  if (name.includes("博")) return "博";
  if (name.includes("碩")) return "碩";
  if (name.includes("學") || name.includes("大學")) return "學";
  return name.trim().charAt(0) || "學";
}

/** Heading font token — resolves to Noto Sans TC under [data-theme="modern"]. */
export const SANS = "var(--font-heading)";
