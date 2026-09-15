"use server";

import { requireAdmin } from "@/lib/admin/auth";
import {
  toChineseError,
  toAuthErrorState,
  type ActionState,
} from "@/lib/admin/action-result";
import { revalidateFor } from "@/lib/admin/revalidate";
import { text } from "@/lib/admin/validate";
import { ABOUT_COPY_FIELDS, ABOUT_PAGE } from "@/lib/page-copy/about";

/**
 * 本系簡介的文案格位，一次存整張表單 —— 與 students/actions.ts 同一套：
 *
 *  - **沒有新增／刪除**：42 個格位是固定的（見 lib/page-copy/about.ts 檔頭），
 *    所以只有一支 save，用 upsert（page, name 唯一）。
 *  - **只寫有變的格位**：先讀現值、比對、只 upsert 不同的列，免得系辦改一個字
 *    就有 42 列進稽核日誌（log_admin_change 是 per-row trigger）。
 *
 * 欄位名是 `<name>.zh` / `<name>.en`。中文必填 —— 清空一格的結果如果是「退回
 * 字典」，系辦會以為改沒有效；所以擋在這裡，要改就改成別的字。
 *
 * 語言中立的格位（里程碑年份、榮譽徽章字；`kind: "neutral"`）只有 `.zh` 一個
 * 輸入框，必填，存的時候 zh 與 en 存同一個值。
 */
export async function saveAboutCopy(
  _prev: ActionState,
  form: FormData
): Promise<ActionState> {
  try {
    const { supabase } = await requireAdmin();

    const fieldErrors: Record<string, string> = {};
    const values: { name: string; zh: string; en: string }[] = [];

    for (const field of ABOUT_COPY_FIELDS) {
      if (field.bilingual) {
        const zh = text(form, `${field.name}.zh`, field.label, { required: true, max: field.max });
        // 英文本來就比較長，上限放寬到兩倍；留空＝英文站顯示中文。
        const en = text(form, `${field.name}.en`, `${field.label}（英文）`, { max: field.max * 2 });
        if (zh.error) fieldErrors[`${field.name}.zh`] = zh.error;
        if (en.error) fieldErrors[`${field.name}.en`] = en.error;
        values.push({ name: field.name, zh: zh.value ?? "", en: en.value ?? "" });
      } else {
        // 語言中立：一個值、必填，兩個語言欄存同一個字。
        const value = text(form, `${field.name}.zh`, field.label, { required: true, max: field.max });
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
      .eq("page", ABOUT_PAGE)
      .returns<{ name: string; zh: string; en: string }[]>();
    if (readError) return { ok: false, message: toChineseError(readError) };

    const byName = new Map((current ?? []).map((row) => [row.name, row]));
    const changed = values
      .filter((v) => {
        const row = byName.get(v.name);
        return !row || row.zh !== v.zh || row.en !== v.en;
      })
      .map((v) => ({ page: ABOUT_PAGE, ...v, updated_at: new Date().toISOString() }));

    if (changed.length > 0) {
      const { error } = await supabase
        .from("page_copy")
        .upsert(changed, { onConflict: "page,name" });
      if (error) return { ok: false, message: toChineseError(error) };
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
    console.error("[admin/about] save failed:", error instanceof Error ? error.message : error);
    return { ok: false, message: "儲存失敗，請稍後再試；若持續發生請回報。" };
  }
}
