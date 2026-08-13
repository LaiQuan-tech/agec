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

type ProgramInput = {
  name: string;
  name_en: string | null;
  description: string | null;
  sort_order: number;
};

/**
 * `name` is the only required column. The optional ones are written back as
 * null rather than "" so an emptied field behaves like a never-filled one —
 * the public cards test them with `p.name_en && …`, which an empty string
 * would pass while rendering nothing.
 */
function parse(form: FormData): { values?: ProgramInput; fieldErrors?: Record<string, string> } {
  const name = text(form, "name", "學制名稱", { required: true, max: 50 });
  const nameEn = text(form, "name_en", "英文名稱", { max: 120 });
  const description = text(form, "description", "簡介", { max: 500 });
  const sortOrder = number(form, "sort_order", "顯示順序", { min: 0, max: 999 });

  const fieldErrors = collect({
    name: name.error,
    name_en: nameEn.error,
    description: description.error,
    sort_order: sortOrder.error,
  });
  if (fieldErrors) return { fieldErrors };

  return {
    values: {
      name: name.value!,
      name_en: nameEn.value,
      description: description.value,
      // The column defaults to 0; a blank field means "no preference", not an error.
      sort_order: sortOrder.value ?? 0,
    },
  };
}

export async function createProgram(_prev: ActionState, form: FormData): Promise<ActionState> {
  let newId: number;

  try {
    const { supabase } = await requireAdmin();

    const { values, fieldErrors } = parse(form);
    if (fieldErrors) return { ok: false, message: "請修正下列欄位", fieldErrors };

    const { data, error } = await supabase
      .from("programs")
      .insert(values!)
      .select("id")
      .single();
    if (error) return { ok: false, message: toChineseError(error) };

    revalidateFor("programs");
    newId = data.id as number;
  } catch (error) {
    const authState = toAuthErrorState(error);
    if (authState) return authState;
    throw error;
  }

  // Outside the try: redirect() signals by throwing, and a catch block here
  // would turn a successful save into an unexplained error.
  redirect(`/admin/programs/${newId}?created=1`);
}

export async function updateProgram(_prev: ActionState, form: FormData): Promise<ActionState> {
  try {
    const { supabase } = await requireAdmin();
    const id = requireId(form);

    const { values, fieldErrors } = parse(form);
    if (fieldErrors) return { ok: false, message: "請修正下列欄位", fieldErrors };

    const { error } = await supabase.from("programs").update(values!).eq("id", id);
    if (error) return { ok: false, message: toChineseError(error) };

    revalidateFor("programs");
    return { ok: true, message: "已儲存，首頁與招生資訊頁已同步更新" };
  } catch (error) {
    const authState = toAuthErrorState(error);
    if (authState) return authState;
    throw error;
  }
}

export async function deleteProgram(form: FormData): Promise<void> {
  try {
    const { supabase } = await requireAdmin();
    const id = requireId(form);

    const { error } = await supabase.from("programs").delete().eq("id", id);
    if (error) {
      // A delete is fired from a dialog with nowhere to show a returned
      // message, so the failure goes to the server log and the row simply
      // stays put — visible to the user as "it didn't disappear".
      console.error("[admin/programs] delete failed:", toChineseError(error));
      return;
    }

    revalidateFor("programs");
  } catch (error) {
    if (toAuthErrorState(error)) return;
    throw error;
  }

  redirect("/admin/programs");
}
