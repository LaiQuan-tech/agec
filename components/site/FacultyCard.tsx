import type { Faculty } from "@/lib/data";
import { translate, type Lang } from "@/lib/i18n";
import { categoryLabel, fill, FACULTY } from "@/lib/i18n/faculty";

/**
 * `.faculty-grid article` — the standard portrait card, used by both
 * `#section-1` (22 cards, with `.faculty-category`) and `#section-2`
 * (the same 10 合聘/兼任 people again, without it).
 *
 * Deliberately NOT a client component so the server-rendered `#section-2`
 * grid can reuse it without pulling the card into the client bundle;
 * `FacultyFilterGrid` imports the very same module for `#section-1`.
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
  visible = true,
}: {
  lang: Lang;
  member: Faculty;
  /** `#section-1` renders `.faculty-category`; `#section-2` omits it. */
  showCategory: boolean;
  /**
   * Filter state. site.js hides cards with an inline `display:none` rather
   * than unmounting them, and the count line reads the same array, so the
   * card stays in the DOM either way — matching the reference exactly and
   * keeping the grid's border cells stable.
   */
  visible?: boolean;
}) {
  const t = translate(FACULTY, lang);

  return (
    <article style={visible ? undefined : { display: "none" }}>
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
              name: member.name,
              title: member.title,
            })}
          />
        ) : (
          member.name.slice(0, 1)
        )}
      </div>
      <p>{member.title}</p>
      <h3>{member.name}</h3>
      {showCategory ? (
        // `category` itself is never translated — it selects the card layout —
        // so the chip goes through the dictionary. Unlike the reference site,
        // nothing reads this text back: site.js matched the filter against the
        // chip's textContent, while FacultyFilterGrid compares the data, so the
        // visible label is free to change language.
        <span className="faculty-category">
          {categoryLabel(member.category, lang)}
        </span>
      ) : null}
      {member.fields ? (
        <span className="faculty-field">{member.fields}</span>
      ) : null}
      {member.email ? (
        <a href={`mailto:${member.email}`}>{member.email} ↗</a>
      ) : null}
    </article>
  );
}
