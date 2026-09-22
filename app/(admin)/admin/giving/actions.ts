"use server";

import { requireAdmin } from "@/lib/admin/auth";
import {
  toChineseError,
  toAuthErrorState,
  type ActionState,
} from "@/lib/admin/action-result";
import { revalidateFor } from "@/lib/admin/revalidate";
import { text } from "@/lib/admin/validate";
import { GIVING_COPY_FIELDS, GIVING_PAGE } from "@/lib/page-copy/giving";

/**
 * 匯款帳號的八個格位，一次存整張表單 —— 與 about/actions.ts 同一套：沒有
 * 新增／刪除、只有一支 save、用 upsert（page, name 唯一）、只寫有變的格位。
 *
 * 與前兩頁唯一的差別是 `optional`（見 lib/page-copy/fields.ts）：
 *
 *  - 沒標的（銀行名稱、帳號、戶名）中文必填，語言中立的必填。
 *  - 標了的（銀行代碼、分行、SWIFT、說明、聯絡窗口）可以留空 —— bilingual
 *    存 zh=""／en=""、neutral 存 ""，前台那一列就不印。前兩頁擋空值是因為
 *    清空會「退回字典」讓系辦以為改沒有效；這一頁的字典是空字串，留空就是
 *    留空，沒有那個陷阱。
 *
 * 英文欄一律可空（英文站退回中文）；語言中立的格位 zh 與 en 存同一個值。
 */
export async function saveGivingCopy(
  _prev: ActionState,
  form: FormData
): Promise<ActionState> {
  try {
    const { supabase } = await requireAdmin();

    const fieldErrors: Record<string, string> = {};
    const values: { name: string; zh: string; en: string }[] = [];

    for (const field of GIVING_COPY_FIELDS) {
      const required = !field.optional;
      if (field.bilingual) {
        const zh = text(form, `${field.name}.zh`, field.label, { required, max: field.max });
        // 英文本來就比較長，上限放寬到兩倍；留空＝英文站顯示中文。
        const en = text(form, `${field.name}.en`, `${field.label}（英文）`, { max: field.max * 2 });
        if (zh.error) fieldErrors[`${field.name}.zh`] = zh.error;
        if (en.error) fieldErrors[`${field.name}.en`] = en.error;
        values.push({ name: field.name, zh: zh.value ?? "", en: en.value ?? "" });
      } else {
        // 語言中立：一個值，兩個語言欄存同一個字。
        const value = text(form, `${field.name}.zh`, field.label, { required, max: field.max });
        if (value.error) fieldErrors[`${field.name}.zh`] = value.error;
        values.push({ name: field.name, zh: value.value ?? "", en: value.value ?? "" });
      }
    }
    if (Object.keys(fieldErrors).length > 0) {
      return { ok: false, message: "請修正下列欄位", fieldErrors };
    }

    const { data: current, error: readError } = await supabase
      .from("page_copy")
      .select("name, zh, en")
      .eq("page", GIVING_PAGE)
      .returns<{ name: string; zh: string; en: string }[]>();
    if (readError) return { ok: false, message: toChineseError(readError) };

    const byName = new Map((current ?? []).map((row) => [row.name, row]));
    const changed = values
      .filter((v) => {
        const row = byName.get(v.name);
        return !row || row.zh !== v.zh || row.en !== v.en;
      })
      .map((v) => ({ page: GIVING_PAGE, ...v, updated_at: new Date().toISOString() }));

    if (changed.length > 0) {
      const { error } = await supabase
        .from("page_copy")
        .upsert(changed, { onConflict: "page,name" });
      if (error) return { ok: false, message: toChineseError(error) };
      // /alumni/giving 本身，加上 /alumni（§3 那顆按鈕看 `account` 有沒有填）。
      revalidateFor("page_copy");
    }

    return {
      ok: true,
      message:
        changed.length > 0
          ? `已儲存 ${changed.length} 個欄位，前台已同步更新`
          : "沒有任何變更",
    };
  } catch (error) {
    const authState = toAuthErrorState(error);
    if (authState) return authState;
    // 網路層的例外（fetch TypeError、專案暫停時的 DNS 失敗）不是 { error } 而是
    // throw：不接住就會落到 Next 的 error boundary，系辦看到通用錯誤頁而不是
    // 表單上的一行字。
    console.error("[admin/giving] save failed:", error instanceof Error ? error.message : error);
    return { ok: false, message: "儲存失敗，請稍後再試；若持續發生請回報。" };
  }
}
