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

type CourseInput = {
  code: string;
  name: string;
  name_en: string | null;
  credit: number;
  ctype: string;
  ctype_en: string | null;
  program: string;
};

/**
 * `program` and `ctype` are plain text columns with a datalist in front of
 * them, so they are validated as free text rather than with oneOf() — see
 * constants.ts for why the list is open.
 *
 * There is no `program_en`, by design: `program` is a text foreign key into
 * `programs.name`, and getCourses() both sorts and tab-filters by matching the
 * two. Translating it here would break that match the moment one side was
 * translated and the other was not — silently, with the course dropping to the
 * bottom of the table and its tab selecting nothing. The English display name
 * comes from `programs.name_en` instead, edited under /admin/programs.
 *
 * `name_en` and `ctype_en` are never required. text() returns null for a blank
 * field, which is what lib/i18n's pick() reads as "not translated yet" before
 * falling back to the Chinese; "" would work by luck (pick() trims) but would
 * make an emptied field look different from a never-filled one.
 */
function parse(form: FormData): { values?: CourseInput; fieldErrors?: Record<string, string> } {
  const code = text(form, "code", "課號", { required: true, max: 30 });
  const name = text(form, "name", "課程名稱", { required: true, max: 200 });
  const nameEn = text(form, "name_en", "英文課程名稱", { max: 300 });
  const credit = number(form, "credit", "學分", { required: true, min: 0, max: 20 });
  const ctype = text(form, "ctype", "類型", { required: true, max: 20 });
  const ctypeEn = text(form, "ctype_en", "英文類型", { max: 40 });
  const program = text(form, "program", "學制", { required: true, max: 30 });

  const fieldErrors = collect({
    code: code.error,
    name: name.error,
    name_en: nameEn.error,
    credit: credit.error,
    ctype: ctype.error,
    ctype_en: ctypeEn.error,
    program: program.error,
  });
  if (fieldErrors) return { fieldErrors };

  return {
    values: {
      code: code.value!,
      name: name.value!,
      name_en: nameEn.value,
      credit: credit.value!,
      ctype: ctype.value!,
      ctype_en: ctypeEn.value,
      program: program.value!,
    },
  };
}

export async function createCourse(_prev: ActionState, form: FormData): Promise<ActionState> {
  let newId: number;

  try {
    const { supabase } = await requireAdmin();

    const { values, fieldErrors } = parse(form);
    if (fieldErrors) return { ok: false, message: "請修正下列欄位", fieldErrors };

    const { data, error } = await supabase
      .from("courses")
      .insert(values!)
      .select("id")
      .single();
    if (error) return { ok: false, message: toChineseError(error) };

    revalidateFor("courses");
    newId = data.id as number;
  } catch (error) {
    const authState = toAuthErrorState(error);
    if (authState) return authState;
    throw error;
  }

  // Outside the try: redirect() signals by throwing, and a catch block here
  // would turn a successful save into an unexplained error.
  redirect(`/admin/courses/${newId}?created=1`);
}

export async function updateCourse(_prev: ActionState, form: FormData): Promise<ActionState> {
  try {
    const { supabase } = await requireAdmin();
    const id = requireId(form);

    const { values, fieldErrors } = parse(form);
    if (fieldErrors) return { ok: false, message: "請修正下列欄位", fieldErrors };

    const { error } = await supabase.from("courses").update(values!).eq("id", id);
    if (error) return { ok: false, message: toChineseError(error) };

    revalidateFor("courses");
    return { ok: true, message: "已儲存，前台已同步更新" };
  } catch (error) {
    const authState = toAuthErrorState(error);
    if (authState) return authState;
    throw error;
  }
}

export async function deleteCourse(form: FormData): Promise<void> {
  try {
    const { supabase } = await requireAdmin();
    const id = requireId(form);

    const { error } = await supabase.from("courses").delete().eq("id", id);
    if (error) {
      // A delete is fired from a dialog with nowhere to show a returned
      // message, so the failure goes to the server log and the row simply
      // stays put — visible to the user as "it didn't disappear".
      console.error("[admin/courses] delete failed:", toChineseError(error));
      return;
    }

    revalidateFor("courses");
  } catch (error) {
    if (toAuthErrorState(error)) return;
    throw error;
  }

  redirect("/admin/courses");
}
