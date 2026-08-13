/**
 * Programs and course types currently in use on the site. Offered as
 * <datalist>s rather than closed <select>s for the same reason as
 * NEWS_CATEGORIES: both columns are free text, and the department adds new
 * programs (雙聯學位、學分學程…) faster than anyone updates this file.
 *
 * `program` also drives the tabs on the public /courses page, so a typo here
 * silently creates a tab with one course in it — hence the canonical spellings
 * being offered first.
 *
 * Lives outside actions.ts because a `"use server"` file may only export async
 * functions; exporting these arrays from there is a build error.
 */
// 國際專班 is deliberately absent: it was removed from the programs table in the
// 2026 IA revision, so a course filed under it would render a tab on /courses
// that no longer corresponds to a degree program.
export const COURSE_PROGRAMS = [
  "大學部",
  "碩士班",
  "博士班",
  "碩士在職專班",
] as const;

export const COURSE_TYPES = ["必修", "選修"] as const;
