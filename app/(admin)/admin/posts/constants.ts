/**
 * Shared, framework-free bits of the blog section.
 *
 * Lives outside actions.ts because a `"use server"` file may only export async
 * functions; exporting these from there is a build error. Everything here is
 * imported by both the Server Components and the client form, so it must stay
 * free of `server-only` imports.
 */

/** Entities that stand in for a space, alongside the character itself. */
const HTML_WHITESPACE = /&nbsp;|&#0*160;|&#x0*a0;|\u00a0/gi;

/** Any other `&…;` is a real visible character; "&" is a safe stand-in for it. */
const HTML_ENTITY = /&(?:[a-z][a-z0-9]*|#\d+|#x[0-9a-f]+);/gi;

/**
 * Whether an editor body holds anything worth storing.
 *
 * Tiptap never hands back an empty string: a document someone opened and then
 * cleared serialises as `<p></p>`, and that shell would be stored as a
 * perfectly ordinary value. For the English body that matters — lib/i18n's
 * pick() only falls back to the Chinese when the English side is blank, so a
 * stored shell would render /en/blog as an article with no text at all. The
 * column is nullable precisely so "not translated yet" is representable, which
 * means the shell has to be recognised and written back as null.
 *
 * The test is "is there any text left once the tags are gone", with one
 * exception: <img> and <hr> carry the whole meaning of the block they sit in
 * and leave no text behind, so a body that is nothing but a picture would
 * otherwise be discarded on save without anyone being told.
 *
 * Only ever run on HTML that has already been through sanitize-html, which
 * escapes `>` inside attribute values — that is what makes stripping tags with
 * a regex safe here, on `<a href="?a=1&gt;2">` as much as on anything else.
 *
 * Shared with the list page, which scores the same columns for its 英文 badge:
 * "filled" there has to mean exactly what "stored" means here, or the badge
 * would count a body the action had already turned back into null.
 */
export function hasEditorContent(html: string | null | undefined): boolean {
  if (!html) return false;
  if (/<(?:img|hr)\b/i.test(html)) return true;

  const textOnly = html
    .replace(/<[^>]*>/g, "")
    .replace(HTML_WHITESPACE, " ")
    .replace(HTML_ENTITY, "&");
  return textOnly.trim().length > 0;
}

/** Mirrors the posts_status_check constraint. Adding a value here alone is a lie. */
export const POST_STATUSES = ["draft", "published"] as const;

export type PostStatus = (typeof POST_STATUSES)[number];

export const POST_STATUS_LABELS: Record<PostStatus, string> = {
  draft: "草稿",
  published: "已發佈",
};

/**
 * Whether a post is reachable on the public site at this moment.
 *
 * Mirrors the filter in getPosts() / getPostBySlug() (lib/data.ts), which is
 * the only thing keeping unpublished work off the open internet: 已發佈 is not
 * sufficient on its own, because a future `published_at` is how a post gets
 * queued up and /blog keeps 404ing until that time arrives. Anything in the
 * admin that offers a link to the public page has to agree with it, or it will
 * hand the staff a 404 on exactly the posts they scheduled in advance.
 *
 * The clock is read in here, and injectable, for the same reason
 * taipeiDateStamp() takes one: calling Date.now() straight from a component
 * body is what react-hooks/purity forbids. The pages that call this are
 * force-dynamic, so "now" is per request either way.
 */
export function isPostLive(
  status: PostStatus,
  publishedAt: string | null,
  now: Date = new Date()
): boolean {
  if (status !== "published" || !publishedAt) return false;
  const at = Date.parse(publishedAt);
  return !Number.isNaN(at) && at <= now.getTime();
}

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
