"use server";

import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth";
import {
  toChineseError,
  toAuthErrorState,
  type ActionState,
} from "@/lib/admin/action-result";
import { revalidateFor } from "@/lib/admin/revalidate";
import { collect, number, oneOf, requireId, text } from "@/lib/admin/validate";
import { LINK_SECTIONS, type EditableSection } from "./constants";

type LinkInput = {
  section: EditableSection;
  label: string;
  label_en: string | null;
  url: string | null;
  sort_order: number;
};

/**
 * `section` goes through oneOf() rather than text(): the column is plain text,
 * so the database would accept anything, and a value outside the union would
 * create a row no public page queries for.
 *
 * `label_en` is never required. text() already returns null for a blank field,
 * which is exactly what the fallback in lib/i18n's pick() needs — it treats a
 * blank English value as "not translated yet" and serves the Chinese instead.
 * Writing "" would work by luck (pick() trims first) but would make an emptied
 * field look different from a never-filled one in the database.
 */
function parse(form: FormData): { values?: LinkInput; fieldErrors?: Record<string, string> } {
  const section = oneOf(form, "section", "區塊", LINK_SECTIONS, { required: true });
  const label = text(form, "label", "卡片文字", { required: true, max: 100 });
  const labelEn = text(form, "label_en", "英文卡片文字", { max: 200 });
  const url = text(form, "url", "連結網址", { max: 500 });
  const sortOrder = number(form, "sort_order", "排序", { min: 0, max: 9999 });

  const fieldErrors = collect({
    section: section.error,
    label: label.error,
    label_en: labelEn.error,
    url: url.error,
    sort_order: sortOrder.error,
  });
  if (fieldErrors) return { fieldErrors };

  return {
    values: {
      section: section.value!,
      label: label.value!,
      label_en: labelEn.value,
      // Empty stays null; '#' is kept as-is because the seed data uses it and
      // the public card treats both the same way.
      url: url.value,
      sort_order: sortOrder.value ?? 0,
    },
  };
}

export async function createLink(_prev: ActionState, form: FormData): Promise<ActionState> {
  let newId: number;

  try {
    const { supabase } = await requireAdmin();

    const { values, fieldErrors } = parse(form);
    if (fieldErrors) return { ok: false, message: "請修正下列欄位", fieldErrors };

    const { data, error } = await supabase
      .from("links")
      .insert(values!)
      .select("id")
      .single();
    if (error) return { ok: false, message: toChineseError(error) };

    revalidateFor("links");
    newId = data.id as number;
  } catch (error) {
    const authState = toAuthErrorState(error);
    if (authState) return authState;
    throw error;
  }

  // Outside the try: redirect() signals by throwing, and a catch block here
  // would turn a successful save into an unexplained error.
  redirect(`/admin/links/${newId}?created=1`);
}

export async function updateLink(_prev: ActionState, form: FormData): Promise<ActionState> {
  try {
    const { supabase } = await requireAdmin();
    const id = requireId(form);

    const { values, fieldErrors } = parse(form);
    if (fieldErrors) return { ok: false, message: "請修正下列欄位", fieldErrors };

    const { error } = await supabase.from("links").update(values!).eq("id", id);
    if (error) return { ok: false, message: toChineseError(error) };

    revalidateFor("links");
    return { ok: true, message: "已儲存，前台已同步更新" };
  } catch (error) {
    const authState = toAuthErrorState(error);
    if (authState) return authState;
    throw error;
  }
}

export async function deleteLink(form: FormData): Promise<void> {
  try {
    const { supabase } = await requireAdmin();
    const id = requireId(form);

    const { error } = await supabase.from("links").delete().eq("id", id);
    if (error) {
      // A delete is fired from a dialog with nowhere to show a returned
      // message, so the failure goes to the server log and the row simply
      // stays put — visible to the user as "it didn't disappear".
      console.error("[admin/links] delete failed:", toChineseError(error));
      return;
    }

    revalidateFor("links");
  } catch (error) {
    if (toAuthErrorState(error)) return;
    throw error;
  }

  redirect("/admin/links");
}
