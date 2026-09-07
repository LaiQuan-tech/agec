import type { CourseForm } from "@/lib/data";
import { translate, type Lang } from "@/lib/i18n";
import { COURSES } from "@/lib/i18n/courses";
import { MaybeLink } from "./MaybeLink";

/**
 * 系上專屬表單 —— /courses §3「常用表格」底下的下載卡。
 *
 * ## 為什麼是新的一區，而不是塞進既有那排連結
 *
 * §3 原本只有一排 `.resource-row`，四條裡有三條指向臺大教務處
 * （aca.ntu.edu.tw）——那是**校方**的表格。系上自己的表單（申請書、計畫變更、
 * 實習同意…）在站上沒有任何位置，系辦也無從自己維護。把它們混進同一排會讓
 * 讀者分不出哪些是系上的、哪些要跳到學校的系統。
 *
 * ## 為什麼用 `.document-grid` 而不是 `.resource-row`
 *
 * 那是 §2 修業規定在用的下載卡版型：左上角一個副檔名徽章、標題、說明，
 * 左下角一句「下載 ↗︎」。它本來就是為「這裡有一個檔案可以拿走」設計的，
 * 而 `.resource-row` 是一行字加箭頭的連結格。樣式已經存在，這一區不需要
 * 任何新的 CSS。
 *
 * 卡片數量沒有上限：site.css 是 `repeat(4,1fr)` → `repeat(2,1fr)` → `1fr`，
 * 第五張以後會自動換行。
 *
 * ## 空的時候不印任何東西
 *
 * 包含小標。表還沒建、或系辦還沒上傳任何表單時，§3 就跟今天一模一樣 ——
 * 所以 migration 與程式碼誰先上線都可以（見 lib/data.ts 的 getCourseForms）。
 * 這也是為什麼呼叫端不需要自己判斷，直接把陣列丟進來就好。
 */

/**
 * 卡片左上角的徽章文字。
 *
 * 從檔名推導而不是多開一個欄位讓系辦填：他們上傳的就是那個檔，副檔名是檔案
 * 自己的事實，多一格只是多一個可以填錯的地方。`file_name` 是上傳時的原始
 * 檔名（見 app/(admin)/admin/api/upload/route.ts —— 存進 Storage 的 key 是
 * uuid，原始檔名只活在資料列裡），沒有它就退回從網址猜，再不行就印「檔案」。
 *
 * ⚠️ 用 lastIndexOf 而不是 split(".").pop()：「農經系_實習同意書.v2.pdf」
 * 這種檔名很常見，split 之後要取哪一段還是得判斷，直接找最後一個點更短。
 */
function badgeFor(form: CourseForm, fallback: string): string {
  const source = form.file_name ?? form.file_url;
  if (!source) return fallback;

  // 網址可能帶 ?token=… 或 #page=2，副檔名在那之前。
  const clean = source.split(/[?#]/)[0];
  const dot = clean.lastIndexOf(".");
  if (dot === -1 || dot === clean.length - 1) return fallback;

  const ext = clean.slice(dot + 1);
  // 8 個字以上的「副檔名」不是副檔名，是檔名裡剛好有個點。
  if (ext.length > 8 || !/^[A-Za-z0-9]+$/.test(ext)) return fallback;
  return ext.toUpperCase();
}

export function CourseForms({
  lang,
  forms,
}: {
  lang: Lang;
  /** 已依 sort_order 排好 —— lib/data.ts 的 getCourseForms。 */
  forms: CourseForm[];
}) {
  if (forms.length === 0) return null;

  const t = translate(COURSES, lang);

  return (
    <>
      <div className="forms-subhead">
        <h3>{t.section3.forms.heading}</h3>
        <p>{t.section3.forms.description}</p>
      </div>

      <div className="document-grid">
        {forms.map((form) => (
          <MaybeLink
            href={form.file_url}
            key={form.id}
            // `.document-grid i` 是左下角那句金色的行動呼籲，絕對定位。
            // 交給 MaybeLink 的 `arrow`，所以只有真的有檔案時才會出現 ——
            // 一張還沒上傳檔案的卡片不會承諾一個點不到的下載。
            arrow={<i>{t.download} ↗︎</i>}
          >
            {/* `.document-grid>a>span` 是金色的副檔名徽章，必須是直接子元素。 */}
            <span>{badgeFor(form, t.section3.forms.fileBadge)}</span>
            <h3>{form.label}</h3>
            {form.description ? <p>{form.description}</p> : null}
          </MaybeLink>
        ))}
      </div>
    </>
  );
}
