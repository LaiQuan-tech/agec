"use server";

import { redirect } from "next/navigation";
import sanitizeHtml from "sanitize-html";
import { RICH_TEXT_SANITIZE } from "@/lib/sanitize";
import { hasEditorContent } from "../news/constants";
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
  bio_html: string | null;
  bio_html_en: string | null;
  bio_json: unknown;
  bio_json_en: unknown;
  experience_en: string | null;
  photo_url: string | null;
  sort_order: number;
};

/**
 * 🔴 `email`、`extension`、`homepage_url` 與 `bio_*` 四欄都在表單上，而 update 是 `.update(values)` 全欄
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
/**
 * 一組編輯器的 `bio_html*` / `bio_json*`，或兩個 null。
 *
 * 與 /admin/news 的 parseEditorBody 完全同形，理由也一樣：
 *
 *  - 先過濾再判斷。整段都是允許清單以外的標籤時，sanitizeHtml 會吐出空字串，
 *    那應該算「什麼都沒寫」而不是「寫了一段空的」。
 *  - Tiptap 從不回傳空字串 —— 開過又清空的文件會序列化成 `<p></p>`，
 *    所以沒有 hasEditorContent() 那層，這個空殼會被當成正常內容存下去。
 *    對這張表來說後果特別大：`bio_html` 是不是 null 決定這位老師**有沒有**
 *    /faculty/<id> 這一頁，存進空殼等於生出一個只有標題的空頁。
 *  - json 只跟著 html 一起清，不單獨留下。留著會出現「前台沒有頁面、後台
 *    卻打得開一整篇文字」的鬼故事。
 *
 * ⚠️ 沒有另外複製一份實作：hasEditorContent 從 ../news/constants import。
 *    那個檔是純常數與純函式（不是 "use server"），跨目錄 import 沒問題，而
 *    複製一份判斷「什麼算空」的邏輯正是最容易悄悄走鐘的東西。
 */
function parseBio(
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
    console.error(`[admin/faculty] ${jsonKey} was not valid JSON; storing null`);
    return { html, json: null };
  }
}

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
  const bio = parseBio(form, "bio_html", "bio_json");
  const bioEn = parseBio(form, "bio_html_en", "bio_json_en");
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
      // 🔴 四欄一起寫。update 是 `.update(values)` 全欄覆蓋，漏掉任何一欄
      // 都會在存檔時把它清成 null —— 見這個檔上面關於 email 的同一段警告。
      bio_html: bio.html,
      bio_json: bio.json,
      bio_html_en: bioEn.html,
      bio_json_en: bioEn.json,
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

    revalidateFor("faculty", String(data.id));
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

    // 帶上 id：個人頁 /faculty/<id> 也要跟著失效，否則系辦改完介紹、
    // 開那一頁看到的還是 300 秒前的版本。
    revalidateFor("faculty", String(id));
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

    revalidateFor("faculty", String(id));
  } catch (error) {
    if (toAuthErrorState(error)) return;
    throw error;
  }

  redirect("/admin/faculty");
}
