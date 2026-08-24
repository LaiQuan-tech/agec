"use server";

import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth";
import {
  toChineseError,
  toAuthErrorState,
  type ActionState,
} from "@/lib/admin/action-result";
import { revalidateFor } from "@/lib/admin/revalidate";
import { collect, number, requireId, text } from "@/lib/admin/validate";

type FacultyInput = {
  name: string;
  name_en: string | null;
  title: string;
  title_en: string | null;
  category: string;
  fields: string | null;
  fields_en: string | null;
  experience_en: string | null;
  photo_url: string | null;
  sort_order: number;
};

/**
 * `email` exists on the table but is deliberately absent from the form:
 * getFaculty() in lib/data.ts doesn't even select it and no public component
 * renders it, so offering the field would let staff type an address that never
 * shows up anywhere — and leave them wondering why.
 *
 * `experience` is absent for a different reason: it is rendered (the 名譽教授
 * and 退休師資 cards use it) but has only ever been written by the 2026 seed,
 * and no Chinese input was built for it. `experience_en` *is* offered, so the
 * form shows the seeded Chinese read-only next to it — see FacultyForm.
 *
 * None of the English columns are required. text() returns null for a blank
 * field, which is what lib/i18n's pick() reads as "not translated yet" before
 * falling back to the Chinese; "" would survive (pick() trims) but would make
 * an emptied field look different from a never-filled one in the database.
 *
 * `name_en` is the odd one out and is *not* a fallback: getFaculty() passes it
 * through in both languages and the 客座／名譽／退休 cards print it as its own
 * line beside the Chinese name. Blank simply means that line is omitted.
 */
function parse(form: FormData): { values?: FacultyInput; fieldErrors?: Record<string, string> } {
  const name = text(form, "name", "姓名", { required: true, max: 50 });
  const nameEn = text(form, "name_en", "英文姓名", { max: 100 });
  const title = text(form, "title", "職稱", { required: true, max: 50 });
  const titleEn = text(form, "title_en", "英文職稱", { max: 100 });
  const category = text(form, "category", "分類", { required: true, max: 20 });
  const fields = text(form, "fields", "研究領域", { max: 200 });
  const fieldsEn = text(form, "fields_en", "英文研究領域", { max: 400 });
  const experienceEn = text(form, "experience_en", "英文經歷", { max: 500 });
  const photoUrl = text(form, "photo_url", "照片網址", { max: 500 });
  const sortOrder = number(form, "sort_order", "顯示順序", { min: 0, max: 9999 });

  const fieldErrors = collect({
    name: name.error,
    name_en: nameEn.error,
    title: title.error,
    title_en: titleEn.error,
    category: category.error,
    fields: fields.error,
    fields_en: fieldsEn.error,
    experience_en: experienceEn.error,
    photo_url: photoUrl.error,
    sort_order: sortOrder.error,
  });
  if (fieldErrors) return { fieldErrors };

  return {
    values: {
      name: name.value!,
      name_en: nameEn.value,
      title: title.value!,
      title_en: titleEn.value,
      category: category.value!,
      fields: fields.value,
      fields_en: fieldsEn.value,
      experience_en: experienceEn.value,
      photo_url: photoUrl.value,
      // The column defaults to 0; an empty box means "no preference", not an
      // error, so it lands on the same 0 the database would have used.
      sort_order: sortOrder.value ?? 0,
    },
  };
}

export async function createFaculty(_prev: ActionState, form: FormData): Promise<ActionState> {
  let newId: number;

  try {
    const { supabase } = await requireAdmin();

    const { values, fieldErrors } = parse(form);
    if (fieldErrors) return { ok: false, message: "請修正下列欄位", fieldErrors };

    const { data, error } = await supabase
      .from("faculty")
      .insert(values!)
      .select("id")
      .single();
    if (error) return { ok: false, message: toChineseError(error) };

    revalidateFor("faculty");
    newId = data.id as number;
  } catch (error) {
    const authState = toAuthErrorState(error);
    if (authState) return authState;
    throw error;
  }

  // Outside the try: redirect() signals by throwing, and a catch block here
  // would turn a successful save into an unexplained error.
  redirect(`/admin/faculty/${newId}?created=1`);
}

export async function updateFaculty(_prev: ActionState, form: FormData): Promise<ActionState> {
  try {
    const { supabase } = await requireAdmin();
    const id = requireId(form);

    const { values, fieldErrors } = parse(form);
    if (fieldErrors) return { ok: false, message: "請修正下列欄位", fieldErrors };

    const { error } = await supabase.from("faculty").update(values!).eq("id", id);
    if (error) return { ok: false, message: toChineseError(error) };

    revalidateFor("faculty");
    return { ok: true, message: "已儲存，前台已同步更新" };
  } catch (error) {
    const authState = toAuthErrorState(error);
    if (authState) return authState;
    throw error;
  }
}

export async function deleteFaculty(form: FormData): Promise<void> {
  try {
    const { supabase } = await requireAdmin();
    const id = requireId(form);

    const { error } = await supabase.from("faculty").delete().eq("id", id);
    if (error) {
      // A delete is fired from a dialog with nowhere to show a returned
      // message, so the failure goes to the server log and the row simply
      // stays put — visible to the user as "it didn't disappear".
      console.error("[admin/faculty] delete failed:", toChineseError(error));
      return;
    }

    revalidateFor("faculty");
  } catch (error) {
    if (toAuthErrorState(error)) return;
    throw error;
  }

  redirect("/admin/faculty");
}
