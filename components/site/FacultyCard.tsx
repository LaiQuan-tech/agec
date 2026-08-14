import type { Faculty } from "@/lib/data";

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
  member,
  showCategory,
  visible = true,
}: {
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
  return (
    <article style={visible ? undefined : { display: "none" }}>
      {/* `has-photo` clears the green fill; `no-photo` keeps it and lets the
          42px serif initial show through. The reference site has a photo for
          all 22 cards, but photo_url is nullable, so the fallback is real. */}
      <div className={`faculty-portrait ${member.photo_url ? "has-photo" : "no-photo"}`}>
        {member.photo_url ? (
          // alt is composed as {姓名}{職稱}形象照 on every one of the 22 cards.
          <img src={member.photo_url} alt={`${member.name}${member.title}形象照`} />
        ) : (
          member.name.slice(0, 1)
        )}
      </div>
      <p>{member.title}</p>
      <h3>{member.name}</h3>
      {showCategory ? (
        <span className="faculty-category">{member.category}</span>
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
