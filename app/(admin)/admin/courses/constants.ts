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
/**
 * 學制清單的**備援**，不是主要來源。
 *
 * 主要來源是 `programs` 資料表 —— 課程表單的下拉現在讀它（見 loadProgramNames），
 * 因為 `courses.program` 與 `programs.name` 是做文字比對的，寫死一份就會與系辦
 * 在「招生學制」頁面實際維護的資料漂移。
 *
 * 這一份只在那次查詢失敗時用，讓表單不至於變成一個只有「其他」的空選單。
 *
 * 國際專班 deliberately absent: it was removed from the programs table in the
 * 2026 IA revision.
 */
export const COURSE_PROGRAMS = [
  "大學部",
  "碩士班",
  "博士班",
  "碩士在職專班",
] as const;

export const COURSE_TYPES = ["必修", "選修"] as const;
