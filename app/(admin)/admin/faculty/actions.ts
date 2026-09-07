"use server";

import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth";
import {
  toChineseError,
  toAuthErrorState,
  type ActionState,
} from "@/lib/admin/action-result";
import { revalidateFor } from "@/lib/admin/revalidate";
import { collect, email, number, requireId, text } from "@/lib/admin/validate";

type FacultyInput = {
  name: string;
  name_en: string | null;
  title: string;
  title_en: string | null;
  category: string;
  fields: string | null;
  fields_en: string | null;
  email: string | null;
  extension: string | null;
  homepage_url: string | null;
  experience_en: string | null;
  photo_url: string | null;
  sort_order: number;
};

/**
 * 🔴 `email`、`extension` 與 `homepage_url` 都在表單上，而 update 是 `.update(values)` 全欄
 * 覆寫 —— 所以 `[id]/page.tsx` 的 select 與 initial **必須**帶上這兩欄。漏掉
 * 的話，系辦只要打開任何一位老師按下儲存，那個人的信箱就會被寫成 null，而且
 * 畫面上不會有任何錯誤。37 個信箱會一個一個消失。
 *
 * （email 以前不在表單上，那時 values 裡沒有這個 key，所以 Supabase 根本不會
 * 碰那一欄 —— 舊版的安全是這樣來的，不是因為有防護。而它造成的問題是行政同仁
 * 的卡片只有姓名、職稱、email 三樣，從後台新增出來的必定缺一行信箱，看起來
 * 就像「新增不了」。2026-09 補上。）
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
  const emailValue = email(form, "email", "電子信箱", { max: 200 });
  // 分機是 text 不是 number：實際寫法有「5501」「5501、5502」「#12345」。
  const extension = text(form, "extension", "分機", { max: 30 });
  const homepageUrl = text(form, "homepage_url", "個人網頁", { max: 500 });
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
    email: emailValue.error,
    extension: extension.error,
    homepage_url: homepageUrl.error,
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
      email: emailValue.value,
      extension: extension.value,
      // 空字串收成 null，前台才會整行不印。
      homepage_url: homepageUrl.value,
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
