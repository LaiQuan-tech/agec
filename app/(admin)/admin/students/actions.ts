"use server";

import { requireAdmin } from "@/lib/admin/auth";
import {
  toChineseError,
  toAuthErrorState,
  type ActionState,
} from "@/lib/admin/action-result";
import { revalidateFor } from "@/lib/admin/revalidate";
import { text } from "@/lib/admin/validate";
import { STUDENTS_COPY_FIELDS, STUDENTS_PAGE } from "@/lib/page-copy/students";

/**
 * 學生專區的文案格位，一次存整張表單。
 *
 * 與其他模組不同的兩點：
 *
 *  - **沒有新增／刪除**：24 個格位是固定的（見 lib/page-copy/students.ts 檔頭
 *    為什麼），所以只有一支 save，用 upsert（page, name 唯一）。
 *  - **只寫有變的格位**：先讀現值、比對、只 upsert 不同的列。不這樣做的話每存
 *    一次就有 24 列進稽核日誌（log_admin_change 是 per-row trigger），系辦改一個
 *    字會在操作日誌裡看到二十幾筆「更新」，真正改了什麼反而找不到。
 *
 * 欄位名是 `<name>.zh` / `<name>.en`（網址只有 `.zh`）。中文必填 —— 清空一格的
 * 結果如果是「退回字典」，系辦會以為改沒有效；所以擋在這裡，要改就改成別的字。
 */
export async function saveStudentsCopy(
  _prev: ActionState,
  form: FormData
): Promise<ActionState> {
  try {
    const { supabase } = await requireAdmin();

    const fieldErrors: Record<string, string> = {};
    const values: { name: string; zh: string; en: string }[] = [];

    for (const field of STUDENTS_COPY_FIELDS) {
      if (field.bilingual) {
        const zh = text(form, `${field.name}.zh`, field.label, { required: true, max: field.max });
        // 英文本來就比較長，上限放寬到兩倍；留空＝英文站顯示中文。
        const en = text(form, `${field.name}.en`, `${field.label}（英文）`, { max: field.max * 2 });
        if (zh.error) fieldErrors[`${field.name}.zh`] = zh.error;
        if (en.error) fieldErrors[`${field.name}.en`] = en.error;
        values.push({ name: field.name, zh: zh.value ?? "", en: en.value ?? "" });
      } else {
        // 網址：不分語言，存在 zh 欄；可以留空（按鈕就沒有去處）。
        const url = text(form, `${field.name}.zh`, field.label, { max: field.max });
        if (url.error) fieldErrors[`${field.name}.zh`] = url.error;
        else if (url.value && !/^https?:\/\//i.test(url.value)) {
          fieldErrors[`${field.name}.zh`] = `${field.label}請以 http:// 或 https:// 開頭`;
        }
        values.push({ name: field.name, zh: url.value ?? "", en: "" });
      }
    }
    if (Object.keys(fieldErrors).length > 0) {
      return { ok: false, message: "請修正下列欄位", fieldErrors };
    }

    const { data: current, error: readError } = await supabase
      .from("page_copy")
      .select("name, zh, en")
      .eq("page", STUDENTS_PAGE)
      .returns<{ name: string; zh: string; en: string }[]>();
    if (readError) return { ok: false, message: toChineseError(readError) };

    const byName = new Map((current ?? []).map((row) => [row.name, row]));
    const changed = values
      .filter((v) => {
        const row = byName.get(v.name);
        return !row || row.zh !== v.zh || row.en !== v.en;
      })
      .map((v) => ({ page: STUDENTS_PAGE, ...v, updated_at: new Date().toISOString() }));

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
    throw error;
  }
}
