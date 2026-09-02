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
 * 「這個編輯器內文裡有東西嗎？」
 *
 * 這個判準是「什麼要存成 null」的唯一規則：actions.ts 存檔前用它，page.tsx
 * 又用它算英文完成度的徽章。兩處必須是同一份，否則哪天有人教它認得另一種
 * 「沒有文字但有意義」的標籤（它已經認得 <img> 與 <hr>），被漏掉的那一邊就
 * 會繼續靜默地把那種內文丟掉。
 *
 * 這一段原本是從部落格區 re-export 過來的。部落格收掉之後，最新消息是唯一的
 * 使用者，所以整段搬進這個檔 —— 少一層跨區的相依。
 */
/** Entities that stand in for a space, alongside the character itself. */
const HTML_WHITESPACE = /&nbsp;|&#0*160;|&#x0*a0;|\u00a0/gi;

/** Any other `&…;` is a real visible character; "&" is a safe stand-in for it. */
const HTML_ENTITY = /&(?:[a-z][a-z0-9]*|#\d+|#x[0-9a-f]+);/gi;

/**
 * Whether an editor body holds anything worth storing.
 *
 * Tiptap never hands back an empty string: a document someone opened and then
 * cleared serialises as `<p></p>`, and that shell would be stored as a
 * perfectly ordinary value. For the English body that matters — lib/i18n's
 * pick() only falls back to the Chinese when the English side is blank, so a
 * stored shell would render /en/news/<id> as an item with no body at all. The
 * column is nullable precisely so "not translated yet" is representable, which
 * means the shell has to be recognised and written back as null.
 *
 * The test is "is there any text left once the tags are gone", with one
 * exception: <img> and <hr> carry the whole meaning of the block they sit in
 * and leave no text behind, so a body that is nothing but a picture would
 * otherwise be discarded on save without anyone being told.
 *
 * Only ever run on HTML that has already been through sanitize-html, which
 * escapes `>` inside attribute values — that is what makes stripping tags with
 * a regex safe here, on `<a href="?a=1&gt;2">` as much as on anything else.
 *
 * Shared with the list page, which scores the same columns for its 英文 badge:
 * "filled" there has to mean exactly what "stored" means here, or the badge
 * would count a body the action had already turned back into null.
 */
export function hasEditorContent(html: string | null | undefined): boolean {
  if (!html) return false;
  if (/<(?:img|hr)\b/i.test(html)) return true;

  const textOnly = html
    .replace(/<[^>]*>/g, "")
    .replace(HTML_WHITESPACE, " ")
    .replace(HTML_ENTITY, "&");
  return textOnly.trim().length > 0;
}
