import type { Lang } from "@/lib/i18n";
import { pickCopy, type CopyField as CopyFieldOf, type CopyRow } from "./fields";

/**
 * 匯款帳號資訊（/alumni/giving）後台可編輯的格位 —— page_copy 表的第三頁，
 * 與學生專區、本系簡介同一套機制（固定格位、只改文字、一張表單）。
 *
 * ## 為什麼預設全空、為什麼不種子
 *
 * 前兩頁的字典是「前台現在印的字」，種子逐字抄字典，所以上線那一刻前台一個字
 * 都不會變。這一頁反過來：銀行、帳號、戶名**只有系辦知道**，程式裡沒有任何
 * 可信的值可以當預設 —— 編一個假帳號進字典，退回字典的那一刻就是把假帳號印給
 * 捐款人看。所以：
 *
 *   - `GIVING_COPY_DEFAULTS` 每一格都是 `{ zh: "", en: "" }`；
 *   - 沒有 migration 種子（scripts/page-copy-seed.ts 仍然能印它，只是印出來的
 *     是八列空字串，沒有貼進 migration 的理由）；
 *   - 第一筆資料由系辦在 /admin/giving 第一次儲存時 upsert 出來。
 *
 * 在那之前 `resolveGivingCopy()` 回 `ready: false`：/alumni/giving 只印
 * 「整理中」，/alumni#section-3 那顆「匯款帳號資訊」按鈕不出現。判準是
 * **帳號有沒有填** —— 沒有帳號的匯款資訊頁沒有意義；銀行名稱與戶名雖然在
 * 後台是必填，前台不拿它們當開關，免得系辦先存了帳號、還沒補戶名時頁面忽隱忽現。
 *
 * ## 格位
 *
 * 只有一組（account）、八格，順序＝後台表單的順序＝前台 <dl> 的順序：
 *
 *   bank         銀行名稱   中英          必填
 *   bankCode     銀行代碼   語言中立      可留空
 *   branch       分行       中英          可留空
 *   account      帳號       語言中立      必填（也是 `ready` 的開關）
 *   accountName  戶名       中英          必填
 *   swift        SWIFT／BIC 語言中立      可留空（海外匯款才用得到）
 *   note         說明       中英 textarea 可留空（例如指定用途、收據怎麼開）
 *   contact      聯絡窗口   中英          可留空
 *
 * 語言中立（`kind: "neutral"`）的三格是數字碼，兩邊語言印同一個字，後台只有
 * 一個輸入框（見 fields.ts）。可留空的五格標 `optional: true`：後台不加
 * `required`、action 不擋空值、前台空的那一列直接不印。
 */

export const GIVING_PAGE = "giving" as const;

export type GivingCopyGroup = "account";

/** 匯款帳號的格位：一組 fieldset。型別本體在 ./fields.ts。 */
export type CopyField = CopyFieldOf<GivingCopyGroup>;
export type { CopyRow };

/** 8 個格位，順序 = 後台表單的順序 = 前台列表的順序。 */
export const GIVING_COPY_FIELDS: readonly CopyField[] = [
  { name: "bank", group: "account", label: "銀行名稱", kind: "text", max: 60, bilingual: true },
  {
    name: "bankCode",
    group: "account",
    label: "銀行代碼",
    kind: "neutral",
    max: 10,
    bilingual: false,
    optional: true,
  },
  { name: "branch", group: "account", label: "分行", kind: "text", max: 60, bilingual: true, optional: true },
  { name: "account", group: "account", label: "帳號", kind: "neutral", max: 40, bilingual: false },
  { name: "accountName", group: "account", label: "戶名", kind: "text", max: 80, bilingual: true },
  {
    name: "swift",
    group: "account",
    label: "SWIFT／BIC",
    kind: "neutral",
    max: 20,
    bilingual: false,
    optional: true,
  },
  { name: "note", group: "account", label: "說明", kind: "textarea", max: 400, bilingual: true, optional: true },
  { name: "contact", group: "account", label: "聯絡窗口", kind: "text", max: 120, bilingual: true, optional: true },
];

/**
 * 全部空字串 —— 見檔頭「為什麼預設全空」。形狀與前兩頁相同，所以
 * scripts/page-copy-seed.ts 與後台 page.tsx 的「缺列用字典補」不必特判。
 */
export const GIVING_COPY_DEFAULTS: Record<string, { zh: string; en: string }> = Object.fromEntries(
  GIVING_COPY_FIELDS.map((field) => [field.name, { zh: "", en: "" }])
);

/** 前台要的形狀：八個字串（空字串＝這一列不印）加一個開關。 */
export type GivingCopy = {
  bank: string;
  bankCode: string;
  branch: string;
  account: string;
  accountName: string;
  swift: string;
  note: string;
  contact: string;
  /** 帳號有填才是 true；false 時前台只印「整理中」、/alumni 的按鈕不出現。 */
  ready: boolean;
};

/**
 * 把 page_copy 的列解析成前台要的形狀。挑字規則在 fields.ts 的 pickCopy
 * （該語言有值 → 英文空白退中文 → 沒有列退字典，而這一頁的字典是空字串）。
 * 英文頁上系辦沒翻的欄位會印中文 —— 帳號與戶名本來就不該「翻」。
 */
export function resolveGivingCopy(rows: CopyRow[], lang: Lang): GivingCopy {
  const byName = new Map(rows.map((row) => [row.name, row]));
  const pick = (name: string) => pickCopy(GIVING_COPY_DEFAULTS, byName, name, lang);

  const account = pick("account");
  return {
    bank: pick("bank"),
    bankCode: pick("bankCode"),
    branch: pick("branch"),
    account,
    accountName: pick("accountName"),
    swift: pick("swift"),
    note: pick("note"),
    contact: pick("contact"),
    ready: account.trim() !== "",
  };
}
