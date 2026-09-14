/**
 * /admin/students 三組欄位的標題與說明。
 *
 * 住在 constants.ts 而不是 actions.ts：`"use server"` 檔只能匯出 async
 * function。欄位本身的清單在 lib/page-copy/students.ts（前台 resolver 也讀
 * 同一份，三方不會漂移）。
 */
export const STUDENTS_COPY_GROUPS: {
  key: "steps" | "campus" | "club";
  title: string;
  description: string;
  /** 前台對應的區塊，給「在前台查看」用。 */
  anchor: string;
}[] = [
  {
    key: "steps",
    title: "新生攻略",
    description:
      "四個步驟的標題與說明。這一區固定就是四格 —— 版面的格線是照四格畫的，所以沒有新增或刪除，只能改文字。",
    anchor: "#section-1",
  },
  {
    key: "campus",
    title: "校園生活",
    description:
      "深綠色那一段：標題、內文與那顆金色按鈕。按鈕網址留空的話按鈕還在，但點了不會去任何地方。",
    anchor: "#section-2",
  },
  {
    key: "club",
    title: "系學會",
    description:
      "組織圖：最上面的會長方塊，加底下固定五個部門的名稱與職掌。部門數量同樣是版面寫死的五格。",
    anchor: "#section-3",
  },
];
