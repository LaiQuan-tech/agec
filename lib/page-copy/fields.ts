import type { Lang } from "@/lib/i18n";

/**
 * 頁面文案格位（page_copy 表）—— 各頁共用的型別與挑字規則。
 *
 * 每一頁一個檔（students.ts、about.ts）列自己的格位清單、字典預設值與
 * resolver；這裡只放三頁以上都會抄到一樣的東西：格位的型別、資料列的型別、
 * 「某個 key 在某個語言下要印哪個字」的規則。抄三份的話，改一條規則就會漂移。
 */

/**
 * 格位的種類。
 *
 *   text / textarea  中英各一格（`<name>.zh` / `<name>.en`）
 *   url              只有一個值，存在 zh 欄、en 留空；可以留空（學生專區的按鈕網址）
 *   neutral          語言中立的字 —— 年份、「TOP 2%」這種徽章 —— 後台只給一個
 *                    輸入框，存的時候 zh 與 en 存**同一個值**，兩個語言的前台印
 *                    同一個字。與 url 不同：必填、不驗網址格式、en 欄不是空的
 */
export type CopyKind = "text" | "textarea" | "url" | "neutral";

export type CopyField<Group extends string = string> = {
  /** `page_copy.name` —— 同時是 FormData 的欄位名前綴（`<name>.zh` / `<name>.en`）。 */
  name: string;
  /** 後台表單的分組。 */
  group: Group;
  /** 後台欄位的標籤。 */
  label: string;
  kind: CopyKind;
  /** 中文欄的長度上限；英文欄放寬到兩倍（英文本來就比較長）。 */
  max: number;
  /** false = 只有一個輸入框（url 存 zh 欄；neutral 存 zh 與 en 同一個值）。 */
  bilingual: boolean;
  /**
   * true = 可以留空：bilingual 存 zh=""／en=""，neutral 存 ""。
   *
   * 學生專區與本系簡介不設（中文必填）：那兩頁每一格都有字典可退，清空一格的
   * 結果是「退回字典」，系辦會以為改沒有效。匯款帳號頁（giving.ts）沒有字典
   * 可退 —— 分行、SWIFT 這種欄位系上不一定有，留空就是「前台不印這一列」，
   * 所以才需要這個旗標。後台表單的 `required` 與 action 的驗證都看它。
   */
  optional?: boolean;
};

/** page_copy 的一列（page 由呼叫端決定，不在這裡）。 */
export type CopyRow = { name: string; zh: string; en: string };

/**
 * 一個 key 在某個語言下要印的字。
 *
 *   有列、該語言有值      → 那個值
 *   有列、英文空白        → 中文（與 lib/data.ts 的 pickNullable 同一個約定：
 *                            系辦可以只填中文，不必一次翻完）
 *   沒有列（表沒建／缺 key）→ 字典（`defaults`）
 */
export function pickCopy(
  defaults: Record<string, { zh: string; en: string }>,
  byName: Map<string, CopyRow>,
  name: string,
  lang: Lang
): string {
  const row = byName.get(name);
  if (row) {
    const own = (lang === "en" ? row.en : row.zh).trim();
    if (own) return own;
    if (lang === "en" && row.zh.trim()) return row.zh.trim();
  }
  const fallback = defaults[name];
  return fallback ? (lang === "en" ? fallback.en : fallback.zh) : "";
}
