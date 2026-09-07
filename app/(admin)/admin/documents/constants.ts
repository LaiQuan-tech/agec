/**
 * 檔案下載卡可以掛在哪一頁。
 *
 * 封閉列舉，與資料庫的 `documents_section_check` 對齊（migration
 * 20260908150000）—— 選一個沒有頁面會渲染的區塊，等於存進一筆看不到的資料。
 *
 * 住在 constants.ts 而不是 actions.ts：`"use server"` 檔只能匯出 async
 * function，把常數寫在那裡是 build error。
 */
export const DOCUMENT_SECTIONS = ["courses", "admissions"] as const;

export type DocumentSection = (typeof DOCUMENT_SECTIONS)[number];

const SECTION_LABELS: Record<DocumentSection, string> = {
  courses: "課程資訊 · 系上表單",
  admissions: "招生資訊 · 招生檔案",
};

export function documentSectionLabel(section: string): string {
  return SECTION_LABELS[section as DocumentSection] ?? `${section}（未使用）`;
}

const SECTION_PATHS: Record<DocumentSection, string> = {
  courses: "/courses#section-3",
  admissions: "/admissions#section-4",
};

/** 這個區塊的卡片會出現在前台的哪一段。 */
export function documentSectionPath(section: string): string {
  return SECTION_PATHS[section as DocumentSection] ?? "/";
}
