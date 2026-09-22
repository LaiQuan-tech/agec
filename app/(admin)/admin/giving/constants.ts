import type { GivingCopyGroup } from "@/lib/page-copy/giving";

/**
 * /admin/giving 唯一一組欄位的標題與說明。
 *
 * 住在 constants.ts 而不是 actions.ts：`"use server"` 檔只能匯出 async
 * function（與 about/constants.ts 同一個理由）。欄位本身的清單在
 * lib/page-copy/giving.ts（前台 resolver 也讀同一份，三方不會漂移）。
 */
export const GIVING_COPY_GROUPS: {
  key: GivingCopyGroup;
  title: string;
  description: string;
  /** 前台對應的頁面，給「在前台查看」用。 */
  anchor: string;
}[] = [
  {
    key: "account",
    title: "匯款帳號",
    description:
      "系上收受捐款的銀行帳戶。銀行名稱、帳號、戶名必填；銀行代碼、分行、SWIFT／BIC、說明、聯絡窗口可留空，留空的欄位前台不印。銀行代碼、帳號、SWIFT 不分語言，中英文站印同一個。",
    anchor: "",
  },
];
