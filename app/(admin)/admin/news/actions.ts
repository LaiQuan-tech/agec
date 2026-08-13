"use server";

import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth";
import {
  toChineseError,
  toAuthErrorState,
  type ActionState,
} from "@/lib/admin/action-result";
import { revalidateFor } from "@/lib/admin/revalidate";
import { boolean, collect, date, requireId, text } from "@/lib/admin/validate";

type NewsInput = {
  published_at: string;
  category: string;
  title: string;
  cover_url: string | null;
  is_pinned: boolean;
};

/**
 * `body` exists on the table but is deliberately absent from the form: no
 * public news component renders it, so offering it would let staff type content
 * that never appears. Long-form content goes to the blog instead.
 *
 * `cover_url` is offered, because components/modern/Home.tsx does render it as
 * the thumbnail on the home page news cards (falling back to a stock image).
 */
function parse(form: FormData): { values?: NewsInput; fieldErrors?: Record<string, string> } {
  const publishedAt = date(form, "published_at", "發佈日期", { required: true });
  const category = text(form, "category", "分類", { required: true, max: 20 });
  const title = text(form, "title", "標題", { required: true, max: 200 });
  const coverUrl = text(form, "cover_url", "縮圖網址", { max: 500 });

  const coverError =
    coverUrl.error ?? (coverUrl.value && !/^(https?:\/\/|\/)/.test(coverUrl.value)
      ? "縮圖網址請以 http://、https:// 或 / 開頭"
      : undefined);

  const fieldErrors = collect({
    published_at: publishedAt.error,
    category: category.error,
    title: title.error,
    cover_url: coverError,
  });
  if (fieldErrors) return { fieldErrors };

  return {
    values: {
      published_at: publishedAt.value!,
      category: category.value!,
      title: title.value!,
      cover_url: coverUrl.value,
      is_pinned: boolean(form, "is_pinned"),
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

    revalidateFor("news");
    newId = data.id as number;
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

    revalidateFor("news");
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

    revalidateFor("news");
  } catch (error) {
    if (toAuthErrorState(error)) return;
    throw error;
  }

  redirect("/admin/news");
}
