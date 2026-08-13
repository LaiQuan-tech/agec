/**
 * Shared, framework-free bits of the blog section.
 *
 * Lives outside actions.ts because a `"use server"` file may only export async
 * functions; exporting these from there is a build error. Everything here is
 * imported by both the Server Components and the client form, so it must stay
 * free of `server-only` imports.
 */

/** Mirrors the posts_status_check constraint. Adding a value here alone is a lie. */
export const POST_STATUSES = ["draft", "published"] as const;

export type PostStatus = (typeof POST_STATUSES)[number];

export const POST_STATUS_LABELS: Record<PostStatus, string> = {
  draft: "草稿",
  published: "已發佈",
};

/**
 * The timezone every date in this section is rendered in.
 *
 * `published_at` is a `timestamptz`, so the instant is unambiguous — but the
 * wall-clock the office staff typed is Taipei time, and rendering it in the
 * server's timezone would show them a different hour than the one they saved.
 * Kept in step with datetimeLocal() in lib/admin/validate.ts, which parses the
 * submitted value as +08:00.
 */
const DISPLAY_TIME_ZONE = "Asia/Taipei";

function taipeiParts(iso: string): Record<string, string> | null {
  const instant = new Date(iso);
  if (Number.isNaN(instant.getTime())) return null;

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: DISPLAY_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    // h23 rather than hour12:false — the latter renders midnight as "24" in
    // some ICU builds, which no <input type="datetime-local"> will accept.
    hourCycle: "h23",
  }).formatToParts(instant);

  const out: Record<string, string> = {};
  for (const part of parts) out[part.type] = part.value;
  return out;
}

/** Formats a stored timestamptz for `<input type="datetime-local">`. */
export function toDatetimeLocalValue(iso: string | null): string {
  if (!iso) return "";
  const p = taipeiParts(iso);
  if (!p) return "";
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
}

/** Formats a stored timestamptz for the admin list. */
export function formatPublishedAt(iso: string | null): string {
  if (!iso) return "";
  const p = taipeiParts(iso);
  if (!p) return "";
  return `${p.year}-${p.month}-${p.day} ${p.hour}:${p.minute}`;
}

/** Today in Taipei as `YYYYMMDD`, for the generated slug. */
export function taipeiDateStamp(now: Date = new Date()): string {
  const p = taipeiParts(now.toISOString());
  return p ? `${p.year}${p.month}${p.day}` : "00000000";
}
