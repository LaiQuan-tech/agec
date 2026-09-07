import type { Dict } from "./index";

/** 全站搜尋的介面文案。 */
export const SEARCH = {
  title: { zh: "搜尋", en: "Search" },
  /** header 上那顆 icon 的可及名稱。icon 本身沒有文字。 */
  openLabel: { zh: "搜尋全站", en: "Search this site" },
  inputLabel: { zh: "搜尋關鍵字", en: "Search keywords" },
  placeholder: { zh: "輸入關鍵字，例如：招生簡章、獎學金、教授姓名", en: "e.g. admissions, scholarship, a professor's name" },
  submit: { zh: "搜尋", en: "Search" },

  /** 還沒輸入任何字時的說明。 */
  idle: {
    zh: "可以搜尋最新消息、系所成員、課程與系友活動。",
    en: "Searches news, people, courses and alumni events.",
  },
  /** {n} 與 {q} 會被代換。 */
  count: { zh: "「{q}」找到 {n} 筆", en: "{n} results for “{q}”" },
  empty: {
    zh: "「{q}」沒有找到符合的內容。試試更短的關鍵字，或只打其中一個詞。",
    en: "Nothing matched “{q}”. Try a shorter keyword.",
  },
  failed: {
    zh: "搜尋時發生問題，請稍後再試一次。",
    en: "Something went wrong. Please try again.",
  },
  /** 結果只搜資料庫，不含八個靜態頁的內文 —— 說清楚比讓人以為漏東西好。 */
  scopeNote: {
    zh: "搜尋範圍是最新消息、系所成員、課程與系友活動的資料；本系簡介、招生資訊等頁面的說明文字不在其中。",
    en: "This searches news, people, courses and alumni events. The narrative copy on pages like About and Admissions is not included.",
  },
  backHome: { zh: "← 回到首頁", en: "← Back to home" },
} satisfies Dict;
