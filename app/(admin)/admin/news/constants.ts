/**
 * Categories currently in use on the site. Offered as a <datalist> rather than
 * a closed <select> — the column is free text and the office staff will
 * eventually need a category nobody thought of.
 *
 * Lives outside actions.ts because a `"use server"` file may only export async
 * functions; exporting this array from there is a build error.
 */
export const NEWS_CATEGORIES = [
  "最新公告",
  "演講公告",
  "招生",
  "求職徵才",
  "活動剪影",
  "活動",
  "榮譽",
] as const;
