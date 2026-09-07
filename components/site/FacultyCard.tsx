import type { Faculty } from "@/lib/data";
import { translate, type Lang } from "@/lib/i18n";
import {
  categoryLabel,
  displayName,
  fill,
  namePair,
  FACULTY,
} from "@/lib/i18n/faculty";

/**
 * `.faculty-grid article` — the standard portrait card, used by `#section-1`
 * (12 專任) and `#section-2` (10 合聘與兼任).
 *
 * 兩區都不印 `.faculty-category`：每一區的標題已經說了那是什麼分類，而合聘與
 * 兼任的 `title` 本來就寫著「兼任師資 · 國立臺灣師範大學」。唯一會印籤的是
 * 分類認不得的資料 —— 見 Faculty.tsx 的 `showCategory`。
 *
 * A plain server component: this page has no client JavaScript at all since the
 * filter came out (see Faculty.tsx's header).
 *
 * Every element here is addressed positionally by site.css and none of them
 * may gain a wrapper:
 *   .faculty-grid article        border / min-height / padding / hover target
 *   .faculty-grid article>p      the 10px 職稱 line — a *direct* child <p>
 *   .faculty-grid h3             the 24px serif name
 *   .faculty-grid a              absolutely positioned at the card's bottom
 * The portrait's own `img` is stretched by 2px and offset -1px to hide the
 * circle's antialiased edge, so it must stay the portrait div's only child.
 */
export function FacultyCard({
  lang,
  member,
  showCategory,
}: {
  lang: Lang;
  member: Faculty;
  /** 印不印 `.faculty-category` 籤。兩區都是 false，除非分類認不得。 */
  showCategory: boolean;
}) {
  const t = translate(FACULTY, lang);

  /**
   * The chair gets the full-width banner variant: two name slots (the other
   * language sits under the heading as `.faculty-english-name`), a portrait on
   * the left and the text left-aligned beside it. Everyone else keeps the
   * standard portrait card, which has one name slot and has to pick a language.
   *
   * The DOM stays flat and in the same order for both — site.css addresses
   * `.faculty-grid article>p` as a *direct* child, so wrapping the banner's
   * text in a container would drop the title's styling. The two-column layout
   * comes from explicit grid placement in site-extensions.css instead.
   */
  const names = member.is_chair ? namePair(member, lang) : null;
  const shownName = names ? names.heading : displayName(member, lang);

  return (
    <article className={member.is_chair ? "faculty-chair" : undefined}>
      {/* `has-photo` clears the green fill; `no-photo` keeps it and lets the
          42px serif initial show through. The reference site has a photo for
          all 22 cards, but photo_url is nullable, so the fallback is real. */}
      <div className={`faculty-portrait ${member.photo_url ? "has-photo" : "no-photo"}`}>
        {member.photo_url ? (
          // alt is composed as {姓名}{職稱}形象照 on every one of the 22 cards;
          // English keeps the same two facts in English word order — see
          // FACULTY.cardPortraitAlt.
          <img
            src={member.photo_url}
            alt={fill(t.cardPortraitAlt, {
              name: shownName,
              title: member.title,
            })}
          />
        ) : (
          // The initial stays Chinese in both languages: it is a graphic
          // element sized for one 42px serif glyph, and a Latin initial in
          // that slot reads as a typo rather than a monogram.
          member.name.slice(0, 1)
        )}
      </div>
      <p>{member.title}</p>
      <h3>{shownName}</h3>
      {names?.kicker ? (
        // Class name borrowed from `.faculty-resume-card`'s unused rules in
        // site.css — the same 11px Latin caps treatment this needs.
        <p className="faculty-english-name">{names.kicker}</p>
      ) : null}
      {showCategory ? (
        // `category` itself is never translated — it selects the card layout —
        // so the chip goes through the dictionary. Nothing reads this text
        // back any more (site.js matched its filter against the chip's
        // textContent; that filter is gone), so the label is free to change
        // language.
        <span className="faculty-category">
          {categoryLabel(member.category, lang)}
        </span>
      ) : null}
      {member.fields ? (
        <span className="faculty-field">{member.fields}</span>
      ) : null}
      {member.email ? (
        <a href={`mailto:${member.email}`}>{member.email} ↗︎</a>
      ) : null}
    </article>
  );
}
