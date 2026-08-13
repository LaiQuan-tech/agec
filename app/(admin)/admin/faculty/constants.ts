/**
 * Categories currently in use on the site. Offered as a <datalist> rather than
 * a closed <select> — the column is free text and the office staff will
 * eventually need a category nobody thought of.
 *
 * Lives outside actions.ts because a `"use server"` file may only export async
 * functions; exporting this array from there is a build error.
 */
export const FACULTY_CATEGORIES = [
  "專任師資",
  "合聘師資",
  "兼任師資",
  "名譽教授",
] as const;
