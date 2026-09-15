/**
 * 分類下拉的選項。
 *
 * 🔴 直接引用 lib/news-categories.ts 的推導結果，這裡不再自己維護一份。
 *
 * 之前這個檔有一份寫死的七個值，比公開站多了「活動」與「榮譽」——選了之後
 * 前台沒有籤、沒有分類頁、沒有英文標籤，資料等於進了死路。四份清單各自維護
 * 就是會這樣漂移。
 */
export { NEWS_CATEGORY_CHOICES as NEWS_CATEGORIES } from "@/lib/news-categories";

import {
  NEWS_CATEGORY_CHOICES,
  TALKS_CATEGORY,
  TALKS_SLUG,
  slugForCategory,
} from "@/lib/news-categories";

/**
 * 列表頁的分類籤（`/admin/news?category=<slug>`）。
 *
 * slug 與前台分類頁同一套（`/news/category/admissions` ↔ `?category=admissions`），
 * 所以側欄「招生資訊 › 各學制招生頁 · 招生公告」那個入口的網址可以寫死在
 * lib/admin/site-map.ts。演講公告前台沒有分類頁（它有自己的 /news/talks），
 * 但後台 256 則一定要能篩出來，所以這裡用 TALKS_SLUG 補上。順序照下拉選單。
 */
export const NEWS_ADMIN_FILTERS: readonly { slug: string; category: string }[] =
  NEWS_CATEGORY_CHOICES.flatMap((category) => {
    const slug = category === TALKS_CATEGORY ? TALKS_SLUG : slugForCategory(category);
    return slug ? [{ slug, category }] : [];
  });

/** `?category=` 的 slug → 中文分類；不認得的值當成沒篩（不報錯，列表印全部）。 */
export function adminCategoryForSlug(slug: string | undefined): string | null {
  if (!slug) return null;
  return NEWS_ADMIN_FILTERS.find((f) => f.slug === slug)?.category ?? null;
}

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
