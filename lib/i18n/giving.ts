import { ALUMNI } from "./alumni";
import type { Dict } from "@/lib/i18n";
import { EYEBROWS } from "@/lib/i18n/eyebrows";

/**
 * 匯款帳號資訊頁（/alumni/giving）的頁面家具 —— 標題、麵包屑、欄位標籤、
 * 複製鈕的字、還沒填資料時的那一句。
 *
 * 帳號本身**不在這裡**：銀行、帳號、戶名那些值住在 page_copy（page=`giving`，
 * 見 lib/page-copy/giving.ts），由系辦在 /admin/giving 填。這一份只有「印在
 * 值旁邊的字」，與 lib/i18n/alumni-events.ts 對活動頁的分工相同。
 *
 * `kicker` 直接引用 EYEBROWS.supportAgec：這一頁是 /alumni#section-3「支持
 * 農經」的內頁，eyebrow 要與那一區的小標一字不差，才看得出從哪裡來。
 */
export const GIVING = {
  /** 也是 <title> 與 sitemap 上的名字（lib/site-routes.ts 的 listingMetadata 讀它）。 */
  title: { zh: "匯款帳號資訊", en: "Bank transfer details" },
  /** 頁尾那條連結的字：與 /alumni §3 的按鈕同一組（客戶要兩處都叫「前往支持農經」）。 */
  linkLabel: ALUMNI.section3.cta,
  kicker: EYEBROWS.supportAgec,
  lead: {
    zh: "捐款可直接匯入以下帳戶。匯款後請與系辦聯絡，方便我們確認並致謝。",
    en: "Donations can be transferred directly to the account below. Please let the department office know once the transfer is made so we can confirm it and thank you.",
  },
  /** 八個格位的標籤，順序＝lib/page-copy/giving.ts 的格位順序。 */
  fields: {
    bank: { zh: "銀行名稱", en: "Bank" },
    bankCode: { zh: "銀行代碼", en: "Bank code" },
    branch: { zh: "分行", en: "Branch" },
    account: { zh: "帳號", en: "Account number" },
    accountName: { zh: "戶名", en: "Account name" },
    swift: { zh: "SWIFT／BIC", en: "SWIFT / BIC" },
    note: { zh: "說明", en: "Notes" },
    contact: { zh: "聯絡窗口", en: "Contact" },
  },
  /** 「複製全部」拼出來的多行文字裡，標籤與值之間的分隔。 */
  colon: { zh: "：", en: ": " },
  copy: { zh: "複製", en: "Copy" },
  copied: { zh: "已複製", en: "Copied" },
  copyAll: { zh: "複製全部匯款資訊", en: "Copy all details" },
  /** 每顆複製鈕的 aria-label；`{label}` 換成欄位標籤。 */
  copyAria: { zh: "複製{label}", en: "Copy {label}" },
  /** 系辦還沒填帳號時整頁只印這一句（/alumni 那顆按鈕也不會出現）。 */
  pending: {
    zh: "匯款資訊整理中，請直接聯絡系辦。",
    en: "Bank details are being finalised — please contact the office.",
  },
  back: { zh: "← 返回系友專區", en: "← Back to alumni" },
} satisfies Dict;
