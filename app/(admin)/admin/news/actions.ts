"use server";

import { redirect } from "next/navigation";
import sanitizeHtml from "sanitize-html";
import { RICH_TEXT_SANITIZE } from "@/lib/sanitize";
import { requireAdmin } from "@/lib/admin/auth";
import {
  toChineseError,
  toAuthErrorState,
  type ActionState,
} from "@/lib/admin/action-result";
import { revalidateFor } from "@/lib/admin/revalidate";
import {
  boolean,
  collect,
  date,
  datetimeLocal,
  oneOf,
  requireId,
  text,
} from "@/lib/admin/validate";
import type { NewsAttachment } from "@/lib/data";
import { hasEditorContent } from "./constants";

/** Matches the CHECK constraint on news.status. */
const NEWS_STATUSES = ["draft", "published"] as const;

type NewsInput = {
  published_at: string;
  category: string;
  category_en: string | null;
  title: string;
  title_en: string | null;
  body: string | null;
  body_en: string | null;
  content_html: string | null;
  content_json: unknown;
  content_html_en: string | null;
  content_json_en: unknown;
  cover_url: string | null;
  is_pinned: boolean;
  status: (typeof NEWS_STATUSES)[number];
  attachments: NewsAttachment[];
  speaker: string | null;
  speaker_en: string | null;
  venue: string | null;
  venue_en: string | null;
  event_at: string | null;
};

/** How many files one announcement may carry, and how large a label may be. */
const MAX_ATTACHMENTS = 20;
const MAX_ATTACHMENT_NAME = 260;

/**
 * The attachments list, as JSON from the hidden field AttachmentsField posts.
 *
 * Every entry here was produced by our own upload endpoint, which is why the
 * shape is predictable — and exactly why it still gets checked. The field is a
 * text input in a form on the client: whatever validation the component does is
 * advisory, and this is the last point before the value lands in a jsonb column
 * that render sites map over without guards.
 *
 * A malformed payload is rejected rather than silently trimmed. Unlike the
 * ProseMirror JSON above — which is a convenience the article survives without
 * — a dropped attachment is a download link the reader was promised and cannot
 * see, with nothing on screen to say so.
 */
function parseAttachments(form: FormData): { value: NewsAttachment[]; error?: string } {
  const raw = String(form.get("attachments") ?? "").trim();
  if (!raw) return { value: [] };

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { value: [], error: "附件清單格式不正確，請重新上傳" };
  }
  if (!Array.isArray(parsed)) return { value: [], error: "附件清單格式不正確，請重新上傳" };
  if (parsed.length > MAX_ATTACHMENTS) {
    return { value: [], error: `附件最多 ${MAX_ATTACHMENTS} 個` };
  }

  const files: NewsAttachment[] = [];
  for (const entry of parsed) {
    if (typeof entry !== "object" || entry === null) {
      return { value: [], error: "附件清單格式不正確，請重新上傳" };
    }
    const { name, url, size, mime } = entry as Record<string, unknown>;
    if (typeof name !== "string" || typeof url !== "string" || typeof mime !== "string") {
      return { value: [], error: "附件清單格式不正確，請重新上傳" };
    }
    // http/https only. The value is rendered straight into an href, so a
    // `javascript:` URL here would be a stored XSS on a public page.
    if (!/^https?:\/\//i.test(url)) {
      return { value: [], error: `附件「${name}」的網址無效` };
    }
    files.push({
      name: name.slice(0, MAX_ATTACHMENT_NAME),
      url,
      size: typeof size === "number" && Number.isFinite(size) && size >= 0 ? Math.round(size) : 0,
      mime,
    });
  }
  return { value: files };
}


/**
 * The ProseMirror JSON is only ever fed back into the editor, so a malformed
 * payload is dropped rather than rejected: content_html is the rendering source
 * and survives on its own, and refusing the save would cost the author their
 * text over a field they never see.
 */
function parseContentJson(raw: string, column: string): unknown {
  if (!raw.trim()) return null;
  try {
    return JSON.parse(raw);
  } catch {
    // The column is named because there are two of them, and "which body lost
    // its JSON" is the first question anyone reading this line will ask.
    console.error(`[admin/news] ${column} was not valid JSON; storing null`);
    return null;
  }
}

/**
 * One editor's `content_html*` / `content_json*` pair, or two nulls.
 *
 * Sanitising first and testing second is deliberate: a body made only of tags
 * the allowlist drops comes out of sanitizeHtml() empty, and it should count as
 * "nothing was written" rather than as a body consisting of nothing.
 *
 * Tiptap never hands back an empty string — a document someone opened and then
 * cleared serialises as `<p></p>` — so without hasEditorContent() that shell
 * would be stored as an ordinary value. On the English side that is the whole
 * ballgame: lib/data.ts resolves the body with pickNullable(), which only falls
 * back to the Chinese when the English column is blank, so a stored shell would
 * render /en/news/[id] as an item with no text at all.
 *
 * The JSON is dropped alongside the HTML, never on its own. Keeping it would
 * leave a row whose `content_html` is null — the state the page reads as "no
 * body" — while `content_json` still holds a document, and reopening the item
 * would show an editor full of text the site refuses to display.
 *
 * Unlike the blog, this runs on the Chinese body too. `posts.content_html` is
 * NOT NULL and is the only rendering source an article has, so an empty one is
 * stored as the editor produced it; `news.content_html` is nullable because a
 * one-line announcement genuinely has nothing to read, and null is how
 * /news/[id] is told to render the item without a body block.
 */
function parseEditorBody(
  form: FormData,
  htmlKey: string,
  jsonKey: string
): { html: string | null; json: unknown } {
  const html = sanitizeHtml(String(form.get(htmlKey) ?? ""), RICH_TEXT_SANITIZE);
  if (!hasEditorContent(html)) return { html: null, json: null };

  return { html, json: parseContentJson(String(form.get(jsonKey) ?? ""), jsonKey) };
}

/**
 * Everything past 標題 / 分類 / 發佈日期 is optional, and deliberately so.
 *
 * A 最新消息 row is allowed to be nothing but a dated one-line announcement —
 * that is what separates it from a 部落格 post — so neither `body` nor
 * `content_html` is required even in Chinese. What each of the three content
 * columns is for, since they are easy to confuse:
 *
 *   body        plain-text standfirst under the title. Shown on every item's
 *               own page (`.post-standfirst` in components/site/NewsPost.tsx)
 *               and on the single feature card at the top of /news. Both render
 *               it as a text node, so it must not be HTML.
 *   content_html the article body on /news/[id], and only there. Sanitised HTML
 *               from the same Tiptap editor the blog uses. Null is the ordinary
 *               case, not a fault: the page says so in words (NEWS.noBody)
 *               rather than ending at the title.
 *   cover_url   shown on every item's own page, and doubles as the feature
 *               card's full-bleed backdrop, where /images/courtyard.jpg stands
 *               in when it is null.
 *
 * All three were absent from this form until /news/[id] existed: the old note
 * here recorded that `body` had nowhere to render and that `cover_url` had gone
 * out with the 風格B theme, both true at the time and both since overtaken.
 *
 * The English columns are never required either. text() hands back null for a
 * blank field, which is what lib/i18n's pick()/pickNullable() read as "not
 * translated yet" before falling back to the Chinese value; storing "" instead
 * would survive (pick() trims) but would make an emptied field
 * indistinguishable from a never-filled one, and the 英文 badge on the list
 * counts exactly that.
 */
function parse(form: FormData): { values?: NewsInput; fieldErrors?: Record<string, string> } {
  const publishedAt = date(form, "published_at", "發佈日期", { required: true });
  const category = text(form, "category", "分類", { required: true, max: 20 });
  const categoryEn = text(form, "category_en", "英文分類", { max: 40 });
  const title = text(form, "title", "標題", { required: true, max: 200 });
  const titleEn = text(form, "title_en", "英文標題", { max: 300 });
  const body = text(form, "body", "摘要", { max: 300 });
  const bodyEn = text(form, "body_en", "英文摘要", { max: 600 });
  const coverUrl = text(form, "cover_url", "封面圖片網址", { max: 500 });
  const status = oneOf(form, "status", "發佈狀態", NEWS_STATUSES, { required: true });
  const attachments = parseAttachments(form);
  const speaker = text(form, "speaker", "講者", { max: 200 });
  const speakerEn = text(form, "speaker_en", "英文講者", { max: 300 });
  const venue = text(form, "venue", "地點", { max: 200 });
  const venueEn = text(form, "venue_en", "英文地點", { max: 300 });
  const eventAt = datetimeLocal(form, "event_at", "演講時間");

  const coverError =
    coverUrl.error ?? (coverUrl.value && !/^(https?:\/\/|\/)/.test(coverUrl.value)
      ? "封面圖片網址請以 http://、https:// 或 / 開頭"
      : undefined);

  const fieldErrors = collect({
    published_at: publishedAt.error,
    category: category.error,
    category_en: categoryEn.error,
    title: title.error,
    title_en: titleEn.error,
    body: body.error,
    body_en: bodyEn.error,
    cover_url: coverError,
    status: status.error,
    attachments: attachments.error,
    speaker: speaker.error,
    speaker_en: speakerEn.error,
    venue: venue.error,
    venue_en: venueEn.error,
    event_at: eventAt.error,
  });
  if (fieldErrors) return { fieldErrors };

  const content = parseEditorBody(form, "content_html", "content_json");
  const contentEn = parseEditorBody(form, "content_html_en", "content_json_en");

  return {
    values: {
      published_at: publishedAt.value!,
      category: category.value!,
      title: title.value!,
      body: body.value,
      cover_url: coverUrl.value,
      content_html: content.html,
      content_json: content.json,
      // See the note on parse() above: null, not "", is what marks an English
      // column as "not translated yet".
      category_en: categoryEn.value,
      title_en: titleEn.value,
      body_en: bodyEn.value,
      content_html_en: contentEn.html,
      content_json_en: contentEn.json,
      is_pinned: boolean(form, "is_pinned"),
      // Required by oneOf() above, so `.value` is never null here.
      status: status.value!,
      attachments: attachments.value,
      speaker: speaker.value,
      speaker_en: speakerEn.value,
      venue: venue.value,
      venue_en: venueEn.value,
      event_at: eventAt.value,
    },
  };
}

export async function createNews(_prev: ActionState, form: FormData): Promise<ActionState> {
  let newId: number;

  try {
    const { supabase } = await requireAdmin();

    const { values, fieldErrors } = parse(form);
    if (fieldErrors) return { ok: false, message: "請修正下列欄位", fieldErrors };

    const { data, error } = await supabase
      .from("news")
      .insert(values!)
      .select("id")
      .single();
    if (error) return { ok: false, message: toChineseError(error) };

    newId = data.id as number;
    // The id is what /news/[id] is keyed on, so it goes to revalidateFor the
    // same way a post's slug does — assigned first, because it is an argument
    // now. Without it the item's own page keeps serving its ISR copy for five
    // minutes after a save, which is the failure lib/admin/revalidate.ts exists
    // to prevent.
    revalidateFor("news", String(newId));
  } catch (error) {
    const authState = toAuthErrorState(error);
    if (authState) return authState;
    throw error;
  }

  // Outside the try: redirect() signals by throwing, and a catch block here
  // would turn a successful save into an unexplained error.
  redirect(`/admin/news/${newId}?created=1`);
}

export async function updateNews(_prev: ActionState, form: FormData): Promise<ActionState> {
  try {
    const { supabase } = await requireAdmin();
    const id = requireId(form);

    const { values, fieldErrors } = parse(form);
    if (fieldErrors) return { ok: false, message: "請修正下列欄位", fieldErrors };

    const { error } = await supabase.from("news").update(values!).eq("id", id);
    if (error) return { ok: false, message: toChineseError(error) };

    revalidateFor("news", String(id));
    return { ok: true, message: "已儲存，前台已同步更新" };
  } catch (error) {
    const authState = toAuthErrorState(error);
    if (authState) return authState;
    throw error;
  }
}

export async function deleteNews(form: FormData): Promise<void> {
  try {
    const { supabase } = await requireAdmin();
    const id = requireId(form);

    const { error } = await supabase.from("news").delete().eq("id", id);
    if (error) {
      // A delete is fired from a dialog with nowhere to show a returned
      // message, so the failure goes to the server log and the row simply
      // stays put — visible to the user as "it didn't disappear".
      console.error("[admin/news] delete failed:", toChineseError(error));
      return;
    }

    revalidateFor("news", String(id));
  } catch (error) {
    if (toAuthErrorState(error)) return;
    throw error;
  }

  redirect("/admin/news");
}
