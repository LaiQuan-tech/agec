/**
 * Categories currently in use on the site. Offered as a <datalist> rather than
 * a closed <select> — the column is free text and the office staff will
 * eventually need a category nobody thought of.
 *
 * Lives outside actions.ts because a `"use server"` file may only export async
 * functions; exporting this array from there is a build error.
 */
/**
 * All seven values drive a different card layout on /faculty — see the switch in
 * components/site/Faculty.tsx. A value outside this list still saves and still
 * renders, but falls through to the standard card, so a typo here shows up as a
 * 名譽教授 rendered with an empty photo frame rather than as an error.
 */
export const FACULTY_CATEGORIES = [
  "專任師資",
  "合聘師資",
  "兼任師資",
  "客座教師",
  "名譽教授",
  "退休師資",
  "行政同仁",
] as const;

/**
 * The three categories whose card renders `name_en` as its own line under the
 * Chinese name. Authoritative source is the column comment written by
 * supabase/migrations/20260814090400_faculty_extend.sql: "客座／名譽／退休師資的
 * 卡片會獨立顯示這一行；專任、合聘、兼任與行政同仁不需要，留 null。"
 *
 * Used by the list page so the English-progress badge doesn't hold a 專任師資
 * permanently short of a field their card would never show anyway.
 */
export const NAME_EN_CATEGORIES: readonly string[] = ["客座教師", "名譽教授", "退休師資"];

/** Whether this row's card shows an English name line at all. */
export function showsNameEn(category: string): boolean {
  return NAME_EN_CATEGORIES.includes(category);
}
