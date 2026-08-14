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
