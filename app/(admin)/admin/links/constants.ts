import type { LinkItem } from "@/lib/data";

/**
 * The sections a link card may be assigned to.
 *
 * A closed <select> rather than the free-text <datalist> the news categories
 * use: LinkItem["section"] is a TypeScript union and only the pages listed
 * here render the table, so a section typed by hand would be a row no page can
 * ever show.
 *
 * 只剩兩個有頁面在讀的 section：
 *   students   /students §4 學習與發展資源（八張卡）
 *   admissions /admissions §4 申請協助（可標學制）
 *
 * 'courses' 與 'alumni' 退場了：/courses 早就不讀 links（那四條教務處表格
 * 在 migration 20260914110000 搬到 students），/alumni 移植後也沒有
 * `.resource-row`。既有的 alumni 列還在表裡，與 journal 一樣列出來讓系辦能
 * 刪，但不能再新增 —— 新增一張沒有頁面會印的卡片，只是一筆看不到的資料。
 *
 * Lives outside actions.ts because a `"use server"` file may only export async
 * functions; exporting these from there is a build error.
 */
export const LINK_SECTIONS = ["students", "admissions"] as const;

export type EditableSection = (typeof LINK_SECTIONS)[number];

/**
 * 'journal' is retired — 農經期刊 became 學生專區 in the 2026 IA revision and no
 * route reads those rows any more. They still exist in the table, so the admin
 * has to be able to show and delete them even though they can't be created.
 */
const SECTION_LABELS: Record<LinkItem["section"], string> = {
  students: "學生專區",
  admissions: "招生資訊",
  courses: "課程資訊（未使用）",
  alumni: "系友專區（未使用）",
  journal: "農經期刊（未使用）",
};

export function isEditableSection(value: string): value is EditableSection {
  return (LINK_SECTIONS as readonly string[]).includes(value);
}

/** Falls back to marking anything unrecognised as unused, same as 'journal'. */
export function sectionLabel(section: string): string {
  return SECTION_LABELS[section as LinkItem["section"]] ?? `${section}（未使用）`;
}

const SECTION_PATHS: Record<EditableSection, string> = {
  students: "/students#section-4",
  admissions: "/admissions#section-4",
};

/** The public route a section's cards appear on; null for retired sections. */
export function sectionPath(section: string): string | null {
  return isEditableSection(section) ? SECTION_PATHS[section] : null;
}
