import type { AboutCopyGroup } from "@/lib/page-copy/about";

/**
 * /admin/about 五組欄位的標題與說明。
 *
 * 住在 constants.ts 而不是 actions.ts：`"use server"` 檔只能匯出 async
 * function。欄位本身的清單在 lib/page-copy/about.ts（前台 resolver 也讀同一份，
 * 三方不會漂移）。標題用前台頁內導覽印的字（lib/i18n/about.ts 的 nav.items），
 * 系辦在前台看到什麼字、在這裡就找什麼字。
 */
export const ABOUT_COPY_GROUPS: {
  key: AboutCopyGroup;
  title: string;
  description: string;
  /** 前台對應的區塊，給「在前台查看」用；頁首沒有錨點。 */
  anchor: string;
}[] = [
  {
    key: "hero",
    title: "頁首",
    description: "大標「本系簡介」底下那段導言。標題本身是選單名，不在這裡改。",
    anchor: "",
  },
  {
    key: "history",
    title: "系史沿革",
    description:
      "標題、說明、照片下那行斜體字，與右側時間軸固定五個里程碑的年份／標題／內文。里程碑數量是版面畫死的五格，沒有新增或刪除，只能改文字。年份不分語言，中英文站印同一個。",
    anchor: "#section-1",
  },
  {
    key: "mission",
    title: "使命與願景",
    description:
      "標題、引言，與底下固定四張卡片的標題／說明。卡片左上角的 01–04 是版面的一部分，不能改。",
    anchor: "#section-2",
  },
  {
    key: "honors",
    title: "系所榮譽",
    description:
      "標題，與固定四張卡片各自的徽章字（TOP 2%、AJAE 那種大字，不分語言）與說明。四格是版面畫死的棋盤格，沒有新增或刪除。",
    anchor: "#section-3",
  },
  {
    key: "environment",
    title: "環境與設備",
    description:
      "標題，與三張照片各自的圖說。照片本身固定（一張橫幅大圖加兩張），這裡只改圖說文字。",
    anchor: "#section-4",
  },
];
