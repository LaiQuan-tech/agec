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

/**
 * "Does this editor body hold anything?", borrowed from the blog section rather
 * than copied into this one.
 *
 * 最新消息 and 部落格 now run the same Tiptap editor over the same four
 * `content_*` columns, and this predicate is the single rule deciding what gets
 * stored as null: actions.ts applies it before saving, and page.tsx applies it
 * again to score the 英文 badge. A second copy here would be a second thing to
 * keep in step — the day someone teaches it about another tag that carries
 * meaning without leaving text behind (it already knows <img> and <hr>),
 * whichever section was forgotten would go on silently discarding those bodies
 * on save.
 *
 * Re-exported through this file so both callers can `import … from "./constants"`
 * exactly as the blog's do, and so this note only has to be written once.
 *
 * Editor.tsx is shared across the two sections the same way — see the note in
 * NewsForm.tsx. Both really belong in admin/_components/ beside EnBadge; moving
 * them means editing the blog section, which this pass was scoped out of.
 */
export { hasEditorContent } from "../posts/constants";
