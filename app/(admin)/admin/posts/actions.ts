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
  collect,
  datetimeLocal,
  oneOf,
  requireId,
  text,
} from "@/lib/admin/validate";
import { hasEditorContent, POST_STATUSES, taipeiDateStamp, type PostStatus } from "./constants";

type PostInput = {
  /**
   * null when the field was left blank. Resolving it is deliberately left to
   * the caller: a new post gets a generated slug, but an edit must keep the one
   * it already has, or clearing the field would silently move a published post
   * to a new URL and break every link to it.
   */
  slug: string | null;
  title: string;
  title_en: string | null;
  excerpt: string | null;
  excerpt_en: string | null;
  cover_url: string | null;
  content_html: string;
  content_json: unknown;
  content_html_en: string | null;
  content_json_en: unknown;
  author: string | null;
  author_en: string | null;
  tags: string[];
  status: PostStatus;
  published_at: string | null;
};

/** Mirrors posts_slug_format in supabase/migrations/*_posts_table.sql. */
const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

const SLUG_ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";

/**
 * `post-YYYYMMDD-xxxx`, the format the migration promises when the field is
 * left blank. The random tail is what keeps two posts written on the same day
 * apart; a collision still lands on posts_slug_key and comes back in Chinese.
 */
function generateSlug(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(4));
  let tail = "";
  for (const byte of bytes) tail += SLUG_ALPHABET[byte % SLUG_ALPHABET.length];
  return `post-${taipeiDateStamp()}-${tail}`;
}


/** Comma-separated in, `text[]` out. Full-width commas count — staff type both. */
function parseTags(raw: string): string[] {
  const seen = new Set<string>();
  for (const piece of raw.split(/[,，]/)) {
    const tag = piece.trim();
    if (tag) seen.add(tag);
  }
  return [...seen];
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
    // The column is named because there are two of them now, and "which body
    // lost its JSON" is the first question anyone reading this line will ask.
    console.error(`[admin/posts] ${column} was not valid JSON; storing null`);
    return null;
  }
}

/**
 * The English body, or null when there is nothing in it.
 *
 * Sanitising first and testing second is deliberate: a body made only of tags
 * the allowlist drops comes out of sanitizeHtml() empty, and it should count as
 * "not written" rather than as a translation consisting of nothing.
 *
 * The JSON is dropped alongside the HTML. Keeping it would leave a row whose
 * `content_html_en` is null — "not translated", the state the public page falls
 * back on — while `content_json_en` still holds a document, and reopening the
 * post would show an editor with content the site does not display.
 *
 * `content_html` gets none of this treatment on purpose: it is NOT NULL, it is
 * the only rendering source the article has, and there is nothing behind it to
 * fall back to. An empty Chinese body stays exactly as the editor produced it.
 */
function parseEnglishBody(form: FormData): {
  content_html_en: string | null;
  content_json_en: unknown;
} {
  const html = sanitizeHtml(String(form.get("content_html_en") ?? ""), RICH_TEXT_SANITIZE);
  if (!hasEditorContent(html)) return { content_html_en: null, content_json_en: null };

  return {
    content_html_en: html,
    content_json_en: parseContentJson(String(form.get("content_json_en") ?? ""), "content_json_en"),
  };
}

/**
 * None of the English columns are ever required, including the body: text()
 * returns null for a blank field, which is what lib/i18n's pick() reads as "not
 * translated yet" before falling back to the Chinese. Storing "" would survive
 * (pick() trims) but would make an emptied field indistinguishable from a
 * never-filled one, and the 英文 badge on the list counts exactly that.
 *
 * There is no `tags_en`, and the column does not exist either — see the note in
 * supabase/migrations/20260827100000_posts_i18n.sql. `tags` is a `text[]` that
 * a tag filter has to match against, and a translated copy would stop matching
 * the moment one side was filled and the other was not: the same trap that
 * keeps `courses.program` in one language. Both sites share one set of tags,
 * and the plan for English tag names is a lookup table keyed on the Chinese
 * value — never a second editable column beside this one.
 */
function parse(form: FormData): { values?: PostInput; fieldErrors?: Record<string, string> } {
  const title = text(form, "title", "標題", { required: true, max: 200 });
  const titleEn = text(form, "title_en", "英文標題", { max: 300 });
  const slug = text(form, "slug", "網址代稱", { max: 120 });
  const excerpt = text(form, "excerpt", "摘要", { max: 300 });
  const excerptEn = text(form, "excerpt_en", "英文摘要", { max: 600 });
  const coverUrl = text(form, "cover_url", "封面圖片網址", { max: 500 });
  const author = text(form, "author", "作者", { max: 60 });
  const authorEn = text(form, "author_en", "英文作者", { max: 120 });
  const status = oneOf(form, "status", "狀態", POST_STATUSES, { required: true });
  const publishedAt = datetimeLocal(form, "published_at", "發佈時間");

  const slugError =
    slug.error ?? (slug.value && !SLUG_PATTERN.test(slug.value)
      ? "網址代稱只能用小寫英文、數字與連字號，例如 ntu-agec-forum"
      : undefined);

  const coverError =
    coverUrl.error ?? (coverUrl.value && !/^(https?:\/\/|\/)/.test(coverUrl.value)
      ? "封面圖片網址請以 http://、https:// 或 / 開頭"
      : undefined);

  const tags = parseTags(String(form.get("tags") ?? ""));
  const tagsError =
    tags.length > 20
      ? "標籤最多 20 個"
      : tags.find((t) => t.length > 20)
        ? "每個標籤不能超過 20 個字"
        : undefined;

  const fieldErrors = collect({
    title: title.error,
    title_en: titleEn.error,
    slug: slugError,
    excerpt: excerpt.error,
    excerpt_en: excerptEn.error,
    cover_url: coverError,
    author: author.error,
    author_en: authorEn.error,
    tags: tagsError,
    status: status.error,
    published_at: publishedAt.error,
  });
  if (fieldErrors) return { fieldErrors };

  // Publishing without a date is the one combination posts_published_needs_date
  // rejects. Rather than bouncing the form back, the missing date is read as
  // "publish it now" — which is what "已發佈" means to whoever just chose it.
  const resolvedPublishedAt =
    status.value === "published" && !publishedAt.value
      ? new Date().toISOString()
      : publishedAt.value;

  // Belt and braces: if the line above ever stops filling the gap, the staff get
  // a Chinese field error instead of the database's English constraint name.
  if (status.value === "published" && !resolvedPublishedAt) {
    return { fieldErrors: { published_at: "設為「已發佈」時必須填寫發佈時間" } };
  }

  return {
    values: {
      slug: slug.value,
      title: title.value!,
      title_en: titleEn.value,
      excerpt: excerpt.value,
      excerpt_en: excerptEn.value,
      cover_url: coverUrl.value,
      content_html: sanitizeHtml(String(form.get("content_html") ?? ""), RICH_TEXT_SANITIZE),
      content_json: parseContentJson(String(form.get("content_json") ?? ""), "content_json"),
      ...parseEnglishBody(form),
      author: author.value,
      author_en: authorEn.value,
      tags,
      status: status.value!,
      published_at: resolvedPublishedAt,
    },
  };
}

export async function createPost(_prev: ActionState, form: FormData): Promise<ActionState> {
  let newId: number;

  try {
    const { supabase, userId } = await requireAdmin();

    const { values, fieldErrors } = parse(form);
    if (fieldErrors) return { ok: false, message: "請修正下列欄位", fieldErrors };

    const { data, error } = await supabase
      .from("posts")
      // created_by is an audit column: set once, here, and never touched by an
      // edit — otherwise it records the last editor, not the author.
      .insert({ ...values!, slug: values!.slug ?? generateSlug(), created_by: userId })
      .select("id, slug")
      .single();
    if (error) return { ok: false, message: toChineseError(error) };

    revalidateFor("posts", data.slug as string);
    newId = data.id as number;
  } catch (error) {
    const authState = toAuthErrorState(error);
    if (authState) return authState;
    throw error;
  }

  // Outside the try: redirect() signals by throwing, and a catch block here
  // would turn a successful save into an unexplained error.
  redirect(`/admin/posts/${newId}?created=1`);
}

export async function updatePost(_prev: ActionState, form: FormData): Promise<ActionState> {
  try {
    const { supabase } = await requireAdmin();
    const id = requireId(form);

    const { values, fieldErrors } = parse(form);
    if (fieldErrors) return { ok: false, message: "請修正下列欄位", fieldErrors };

    // Read the current slug before overwriting it. A renamed post leaves a
    // cached page behind at the old URL, and only the database knows what that
    // URL was — a hidden field carrying it could be stale or forged.
    const { data: existing } = await supabase
      .from("posts")
      .select("slug")
      .eq("id", id)
      .maybeSingle<{ slug: string }>();

    // Blank means "leave the address alone", not "give me a new one".
    const slug = values!.slug ?? existing?.slug ?? generateSlug();

    const { error } = await supabase
      .from("posts")
      .update({ ...values!, slug })
      .eq("id", id);
    if (error) return { ok: false, message: toChineseError(error) };

    revalidateFor("posts", existing?.slug, slug);
    return { ok: true, message: "已儲存，前台已同步更新" };
  } catch (error) {
    const authState = toAuthErrorState(error);
    if (authState) return authState;
    throw error;
  }
}

export async function deletePost(form: FormData): Promise<void> {
  try {
    const { supabase } = await requireAdmin();
    const id = requireId(form);

    const { data: existing } = await supabase
      .from("posts")
      .select("slug")
      .eq("id", id)
      .maybeSingle<{ slug: string }>();

    const { error } = await supabase.from("posts").delete().eq("id", id);
    if (error) {
      // A delete is fired from a dialog with nowhere to show a returned
      // message, so the failure goes to the server log and the row simply
      // stays put — visible to the user as "it didn't disappear".
      console.error("[admin/posts] delete failed:", toChineseError(error));
      return;
    }

    revalidateFor("posts", existing?.slug);
  } catch (error) {
    if (toAuthErrorState(error)) return;
    throw error;
  }

  redirect("/admin/posts");
}
