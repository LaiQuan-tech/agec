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

/**
 * 系上專屬表單（/courses §3 的下載卡）。
 *
 * 形狀照 /admin/capabilities 抄，多了檔案那一組欄位。檔案本身不經過這裡 ——
 * 瀏覽器先把它 POST 到 /admin/api/upload（見 components/admin/ui/UploadField），
 * 拿回公開網址與原始檔名之後，才跟著這張表單一起送出來。這支只存字串。
 *
 * ⚠️ `"use server"` 檔只能匯出 async function。要放常數得另開 constants.ts。
 */

type CourseFormInput = {
  label: string;
  label_en: string | null;
  description: string | null;
  description_en: string | null;
  file_url: string | null;
  file_name: string | null;
  sort_order: number;
};

function parse(form: FormData): {
  values?: CourseFormInput;
  fieldErrors?: Record<string, string>;
} {
  // 全部欄位都先跑完再一次 collect，不 early-return —— 使用者一次看到所有
  // 錯誤，而不是修好一個才發現下一個。
  const label = text(form, "label", "表單名稱", { required: true, max: 60 });
  const labelEn = text(form, "label_en", "英文表單名稱", { max: 120 });
  const description = text(form, "description", "說明", { max: 120 });
  const descriptionEn = text(form, "description_en", "英文說明", { max: 240 });
  const fileUrl = text(form, "file_url", "檔案網址", { max: 500 });
  const fileName = text(form, "file_name", "檔案名稱", { max: 200 });
  const sortOrder = number(form, "sort_order", "顯示順序", { min: 0, max: 9999 });

  const fieldErrors = collect({
    label: label.error,
    label_en: labelEn.error,
    description: description.error,
    description_en: descriptionEn.error,
    file_url: fileUrl.error,
    file_name: fileName.error,
    sort_order: sortOrder.error,
  });
  if (fieldErrors) return { fieldErrors };

  return {
    values: {
      label: label.value!,
      // text() 把空字串回成 null。刻意的：讓「清空過」與「從沒填過」在資料庫
      // 裡長得一樣，否則會出現兩種都代表「沒填」的值。
      label_en: labelEn.value,
      description: description.value,
      description_en: descriptionEn.value,
      file_url: fileUrl.value,
      // 網址被清掉時檔名也一起清 —— 留著一個指不到任何檔案的名字，只會讓
      // 前台的副檔名徽章繼續印 PDF 而卡片根本點不下去。
      file_name: fileUrl.value ? fileName.value : null,
      sort_order: sortOrder.value ?? 0,
    },
  };
}

export async function createCourseForm(
  _prev: ActionState,
  form: FormData
): Promise<ActionState> {
  let newId: number;

  try {
    const { supabase } = await requireAdmin();

    const { values, fieldErrors } = parse(form);
    if (fieldErrors) return { ok: false, message: "請修正下列欄位", fieldErrors };

    const { data, error } = await supabase
      .from("course_forms")
      .insert(values!)
      .select("id")
      .single();
    if (error) return { ok: false, message: toChineseError(error) };

    revalidateFor("course_forms");
    newId = data.id as number;
  } catch (error) {
    const authState = toAuthErrorState(error);
    if (authState) return authState;
    throw error;
  }

  // 🔴 redirect() 必須在 try 外面：Next 的 redirect 是靠 throw 實作的，包在
  // try 裡會被 catch 吃掉，把一次成功的儲存變成沒有說明的錯誤。
  redirect(`/admin/forms/${newId}?created=1`);
}

export async function updateCourseForm(
  _prev: ActionState,
  form: FormData
): Promise<ActionState> {
  try {
    const { supabase } = await requireAdmin();
    const id = requireId(form);

    const { values, fieldErrors } = parse(form);
    if (fieldErrors) return { ok: false, message: "請修正下列欄位", fieldErrors };

    const { error } = await supabase
      .from("course_forms")
      .update(values!)
      .eq("id", id);
    if (error) return { ok: false, message: toChineseError(error) };

    revalidateFor("course_forms");
    return { ok: true, message: "已儲存，前台已同步更新" };
  } catch (error) {
    const authState = toAuthErrorState(error);
    if (authState) return authState;
    throw error;
  }
}

/**
 * 簽章與另外兩支不同：沒有 `_prev`、回 void。它是從 DeleteButton 的 dialog
 * 送出的，沒有地方可以顯示 ActionState。
 *
 * ⚠️ 只刪資料列，不動 Storage 裡的檔案。檔案是不可變的（每次上傳都是一個新的
 * uuid key），而同一個網址可能已經被系辦貼到公告內文或別的地方；連帶刪檔會讓
 * 那些連結一起壞掉，而且救不回來。孤兒檔案的成本只是幾 KB 的儲存空間。
 */
export async function deleteCourseForm(form: FormData): Promise<void> {
  try {
    const { supabase } = await requireAdmin();
    const id = requireId(form);

    const { error } = await supabase.from("course_forms").delete().eq("id", id);
    if (error) {
      console.error("[admin/forms] delete failed:", toChineseError(error));
      return;
    }

    revalidateFor("course_forms");
  } catch (error) {
    if (toAuthErrorState(error)) return;
    throw error;
  }

  redirect("/admin/forms");
}
