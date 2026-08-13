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
  title: string;
  category: string;
  fields: string | null;
  photo_url: string | null;
  sort_order: number;
};

/**
 * `email` exists on the table but is deliberately absent from the form:
 * getFaculty() in lib/data.ts doesn't even select it and no public component
 * renders it, so offering the field would let staff type an address that never
 * shows up anywhere — and leave them wondering why.
 */
function parse(form: FormData): { values?: FacultyInput; fieldErrors?: Record<string, string> } {
  const name = text(form, "name", "姓名", { required: true, max: 50 });
  const title = text(form, "title", "職稱", { required: true, max: 50 });
  const category = text(form, "category", "分類", { required: true, max: 20 });
  const fields = text(form, "fields", "研究領域", { max: 200 });
  const photoUrl = text(form, "photo_url", "照片網址", { max: 500 });
  const sortOrder = number(form, "sort_order", "顯示順序", { min: 0, max: 9999 });

  const fieldErrors = collect({
    name: name.error,
    title: title.error,
    category: category.error,
    fields: fields.error,
    photo_url: photoUrl.error,
    sort_order: sortOrder.error,
  });
  if (fieldErrors) return { fieldErrors };

  return {
    values: {
      name: name.value!,
      title: title.value!,
      category: category.value!,
      fields: fields.value,
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
