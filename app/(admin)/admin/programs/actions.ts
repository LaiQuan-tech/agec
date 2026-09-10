"use server";

import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth";
import {
  toChineseError,
  toAuthErrorState,
  type ActionState,
} from "@/lib/admin/action-result";
import { revalidateFor } from "@/lib/admin/revalidate";
import sanitizeHtml from "sanitize-html";
import { RICH_TEXT_SANITIZE } from "@/lib/sanitize";
import { hasEditorContent } from "../news/constants";
import { slugForProgram } from "@/lib/program-slugs";
import { collect, number, requireId, text } from "@/lib/admin/validate";

type ProgramInput = {
  name: string;
  name_en: string | null;
  description: string | null;
  description_en: string | null;
  admission_url: string | null;
  requirements_html: string | null;
  requirements_json: unknown;
  requirements_html_en: string | null;
  requirements_json_en: unknown;
  sort_order: number;
};

/**
 * 修業規定的編輯器內容。與 /admin/faculty 的 parseBio 完全同形，理由也一樣：
 *
 *  - 先過濾再判斷。整段都是允許清單以外的標籤時，sanitizeHtml 會吐出空字串，
 *    那應該算「什麼都沒寫」而不是「寫了一段空的」。
 *  - Tiptap 從不回傳空字串 —— 開過又清空的文件會序列化成 `<p></p>`，所以沒有
 *    hasEditorContent() 那一層，空殼會被當成正常內容存下去。對這張表來說後果
 *    是：`requirements_html` 是不是 null 決定這個學制**有沒有**
 *    /courses/<代稱> 那一頁，存進空殼等於生出一個只有標題的空頁。
 *  - json 只跟著 html 一起清，不單獨留下。留著會出現「前台沒有頁面、後台卻
 *    打得開一整篇文字」的鬼故事。
 *
 * ⚠️ 沒有另外複製一份實作：hasEditorContent 從 ../news/constants import。
 */
function parseRequirements(
  form: FormData,
  htmlKey: string,
  jsonKey: string
): { html: string | null; json: unknown } {
  const html = sanitizeHtml(String(form.get(htmlKey) ?? ""), RICH_TEXT_SANITIZE);
  if (!hasEditorContent(html)) return { html: null, json: null };

  const raw = String(form.get(jsonKey) ?? "");
  if (!raw.trim()) return { html, json: null };
  try {
    return { html, json: JSON.parse(raw) };
  } catch {
    // html 才是渲染來源，它自己活得下去；為了一個使用者看不到的欄位讓整次
    // 儲存失敗，代價是他剛打的字。
    console.error(`[admin/programs] ${jsonKey} was not valid JSON; storing null`);
    return { html, json: null };
  }
}

/**
 * `name` is the only required column. The optional ones are written back as
 * null rather than "" so an emptied field behaves like a never-filled one.
 *
 * That matters most for the two English columns: lib/i18n's pick() reads a
 * blank English value as "not translated yet" and serves the Chinese instead,
 * so null is what "no English yet" is supposed to look like on this table.
 *
 * `name_en` carries a second job beyond this row's own card — getCourses()
 * resolves each course's English 學制 label through it, so filling it in here
 * also translates a tab on /en/courses. It is still optional; blank simply
 * leaves that tab in Chinese.
 */
function parse(form: FormData): { values?: ProgramInput; fieldErrors?: Record<string, string> } {
  const name = text(form, "name", "學制名稱", { required: true, max: 50 });
  const nameEn = text(form, "name_en", "英文學制名稱", { max: 120 });
  const description = text(form, "description", "簡介", { max: 500 });
  const descriptionEn = text(form, "description_en", "英文簡介", { max: 1000 });
  const admissionUrl = text(form, "admission_url", "招生資訊連結", { max: 500 });
  const sortOrder = number(form, "sort_order", "顯示順序", { min: 0, max: 999 });
  const req = parseRequirements(form, "requirements_html", "requirements_json");
  const reqEn = parseRequirements(form, "requirements_html_en", "requirements_json_en");

  const fieldErrors = collect({
    name: name.error,
    name_en: nameEn.error,
    description: description.error,
    description_en: descriptionEn.error,
    admission_url: admissionUrl.error,
    sort_order: sortOrder.error,
  });
  if (fieldErrors) return { fieldErrors };

  return {
    values: {
      name: name.value!,
      name_en: nameEn.value,
      description: description.value,
      description_en: descriptionEn.value,
      // 空字串會被 text() 收成 null，也就是「沒指定」—— 前台看到 null 才會
      // 退回 /news/category/admissions。存成 "" 的話那個判斷會失效。
      admission_url: admissionUrl.value,
      // 🔴 四欄一起寫。update 是 `.update(values)` 全欄覆蓋，漏掉任何一欄都會
      // 在存檔時把它清成 null —— 與 /admin/faculty 的 bio_* 同一個坑。
      requirements_html: req.html,
      requirements_json: req.json,
      requirements_html_en: reqEn.html,
      requirements_json_en: reqEn.json,
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

    // 帶上代稱：/courses/<代稱> 那一頁也要跟著失效，否則系辦改完規定、
    // 開那一頁看到的還是 300 秒前的版本。
    revalidateFor("programs", slugForProgram(values!.name) ?? undefined);
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

    // 帶上代稱：/courses/<代稱> 那一頁也要跟著失效，否則系辦改完規定、
    // 開那一頁看到的還是 300 秒前的版本。
    revalidateFor("programs", slugForProgram(values!.name) ?? undefined);
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
