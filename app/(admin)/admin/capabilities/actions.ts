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
 * /admissions §3 的核心能力膠囊。
 *
 * 三個欄位而已，是全站最單純的一張表 —— 形狀與流程完全照 /admin/links 抄，
 * 差別只有沒有 section（膠囊只出現在一個地方，不需要分區）。
 *
 * ⚠️ `"use server"` 檔只能匯出 async function。要放常數（例如選項清單）得
 *    另開 constants.ts，不能寫在這裡 —— 那是 build error。這一版沒有常數。
 */

type CapabilityInput = {
  label: string;
  label_en: string | null;
  sort_order: number;
};

function parse(form: FormData): {
  values?: CapabilityInput;
  fieldErrors?: Record<string, string>;
} {
  // 全部欄位都先跑完再一次 collect，不 early-return —— 這樣使用者一次看到
  // 所有錯誤，而不是修好一個才發現下一個。
  const label = text(form, "label", "標籤文字", { required: true, max: 30 });
  const labelEn = text(form, "label_en", "英文標籤文字", { max: 60 });
  const sortOrder = number(form, "sort_order", "顯示順序", { min: 0, max: 9999 });

  const fieldErrors = collect({
    label: label.error,
    label_en: labelEn.error,
    sort_order: sortOrder.error,
  });
  if (fieldErrors) return { fieldErrors };

  return {
    values: {
      label: label.value!,
      // text() 把空字串回成 null，不是 ""。刻意的：讓「清空過」與「從沒填過」
      // 在資料庫裡長得一樣，否則 label_en 會出現兩種都代表「沒翻譯」的值。
      label_en: labelEn.value,
      sort_order: sortOrder.value ?? 0,
    },
  };
}

export async function createCapability(
  _prev: ActionState,
  form: FormData
): Promise<ActionState> {
  let newId: number;

  try {
    const { supabase } = await requireAdmin();

    const { values, fieldErrors } = parse(form);
    if (fieldErrors) return { ok: false, message: "請修正下列欄位", fieldErrors };

    const { data, error } = await supabase
      .from("capabilities")
      .insert(values!)
      .select("id")
      .single();
    if (error) return { ok: false, message: toChineseError(error) };

    revalidateFor("capabilities");
    newId = data.id as number;
  } catch (error) {
    const authState = toAuthErrorState(error);
    if (authState) return authState;
    throw error;
  }

  // 🔴 redirect() 必須在 try 外面：Next 的 redirect 是靠 throw 實作的，包在
  // try 裡會被 catch 吃掉，把一次成功的儲存變成沒有說明的錯誤。
  redirect(`/admin/capabilities/${newId}?created=1`);
}

export async function updateCapability(
  _prev: ActionState,
  form: FormData
): Promise<ActionState> {
  try {
    const { supabase } = await requireAdmin();
    const id = requireId(form);

    const { values, fieldErrors } = parse(form);
    if (fieldErrors) return { ok: false, message: "請修正下列欄位", fieldErrors };

    const { error } = await supabase
      .from("capabilities")
      .update(values!)
      .eq("id", id);
    if (error) return { ok: false, message: toChineseError(error) };

    revalidateFor("capabilities");
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
 */
export async function deleteCapability(form: FormData): Promise<void> {
  try {
    const { supabase } = await requireAdmin();
    const id = requireId(form);

    const { error } = await supabase.from("capabilities").delete().eq("id", id);
    if (error) {
      console.error("[admin/capabilities] delete failed:", toChineseError(error));
      return;
    }

    revalidateFor("capabilities");
  } catch (error) {
    if (toAuthErrorState(error)) return;
    throw error;
  }

  redirect("/admin/capabilities");
}
