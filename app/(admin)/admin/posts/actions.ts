"use server";

import { redirect } from "next/navigation";
import sanitizeHtml from "sanitize-html";
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
import { POST_STATUSES, taipeiDateStamp, type PostStatus } from "./constants";

type PostInput = {
  slug: string;
  title: string;
  excerpt: string | null;
  cover_url: string | null;
  content_html: string;
  content_json: unknown;
  author: string | null;
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

/**
 * Re-sanitises the HTML the browser posted.
 *
 * The editor's allowlist runs in the browser and is therefore only a
 * convenience: a Server Action is an HTTP endpoint, so the `content_html` field
 * is whatever the request body says it is. Stored HTML is rendered verbatim to
 * every public visitor, so the one allowlist that actually decides what can
 * execute has to be this one.
 */
const SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    "p", "br", "hr",
    "h2", "h3", "h4",
    "strong", "em", "s", "code", "pre",
    "blockquote",
    "ul", "ol", "li",
    "a", "img",
  ],
  allowedAttributes: {
    a: ["href", "target", "rel"],
    img: ["src", "alt"],
  },
  allowedSchemes: ["http", "https", "mailto"],
  allowedSchemesByTag: { img: ["http", "https"] },
  // Every link leaves the site, and rel is not optional: without noopener the
  // opened page gets a handle on window.opener.
  transformTags: {
    a: sanitizeHtml.simpleTransform("a", { target: "_blank", rel: "noopener noreferrer" }),
  },
  disallowedTagsMode: "discard",
};

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
function parseContentJson(raw: string): unknown {
  if (!raw.trim()) return null;
  try {
    return JSON.parse(raw);
  } catch {
    console.error("[admin/posts] content_json was not valid JSON; storing null");
    return null;
  }
}

function parse(form: FormData): { values?: PostInput; fieldErrors?: Record<string, string> } {
  const title = text(form, "title", "標題", { required: true, max: 200 });
  const slug = text(form, "slug", "網址代稱", { max: 120 });
  const excerpt = text(form, "excerpt", "摘要", { max: 300 });
  const coverUrl = text(form, "cover_url", "封面圖片網址", { max: 500 });
  const author = text(form, "author", "作者", { max: 60 });
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
    slug: slugError,
    excerpt: excerpt.error,
    cover_url: coverError,
    author: author.error,
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
      slug: slug.value ?? generateSlug(),
      title: title.value!,
      excerpt: excerpt.value,
      cover_url: coverUrl.value,
      content_html: sanitizeHtml(String(form.get("content_html") ?? ""), SANITIZE_OPTIONS),
      content_json: parseContentJson(String(form.get("content_json") ?? "")),
      author: author.value,
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
      .insert({ ...values!, created_by: userId })
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

    const { error } = await supabase.from("posts").update(values!).eq("id", id);
    if (error) return { ok: false, message: toChineseError(error) };

    revalidateFor("posts", existing?.slug, values!.slug);
    return { ok: true, message: "已儲存" };
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
