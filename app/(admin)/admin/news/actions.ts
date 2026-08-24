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
  category_en: string | null;
  title: string;
  title_en: string | null;
  is_pinned: boolean;
};

/**
 * `body` and `cover_url` exist on the table but are deliberately absent from
 * the form. cover_url is rendered nowhere: it briefly was offered, back when
 * the 風格B home page used it as a card thumbnail, and went out with that
 * theme. `body` is the standfirst on the single featured card in
 * components/site/News.tsx and is null for every row today, so the paragraph is
 * simply dropped — long-form content goes to the blog instead. Restore either
 * only alongside a component that actually displays it.
 *
 * That omission is why there is no `body_en` here either, although the column
 * exists: with no Chinese `body` to translate, an English-only standfirst would
 * appear on /en/news and nowhere else. Add the pair together or not at all.
 */
function parse(form: FormData): { values?: NewsInput; fieldErrors?: Record<string, string> } {
  const publishedAt = date(form, "published_at", "發佈日期", { required: true });
  const category = text(form, "category", "分類", { required: true, max: 20 });
  const categoryEn = text(form, "category_en", "英文分類", { max: 40 });
  const title = text(form, "title", "標題", { required: true, max: 200 });
  const titleEn = text(form, "title_en", "英文標題", { max: 300 });

  const fieldErrors = collect({
    published_at: publishedAt.error,
    category: category.error,
    category_en: categoryEn.error,
    title: title.error,
    title_en: titleEn.error,
  });
  if (fieldErrors) return { fieldErrors };

  return {
    values: {
      published_at: publishedAt.value!,
      category: category.value!,
      title: title.value!,
      // The English columns are never required. text() hands back null for a
      // blank field, which is what lib/i18n's pick() reads as "not translated
      // yet" before falling back to the Chinese value; storing "" instead would
      // make an emptied field indistinguishable from a never-filled one.
      category_en: categoryEn.value,
      title_en: titleEn.value,
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
