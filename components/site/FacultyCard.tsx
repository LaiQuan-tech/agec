import { FACULTY_NO_PAGE_CATEGORY, type Faculty } from "@/lib/data";
import Link from "next/link";
import { localizePath, translate, type Lang } from "@/lib/i18n";
import {
  categoryLabel,
  displayName,
  fill,
  namePair,
  FACULTY,
} from "@/lib/i18n/faculty";

/**
 * 卡片底部的兩條連結，五種版型共用：
 *
 *   個人網頁 →   站內 /faculty/<id>。行政同仁以外**每一位都有**（每位師資都有頁，
 *                見 lib/data.ts getFacultyById），與有沒有寫介紹無關。
 *   個人網站 ↗︎  站外 `homepage_url`，有填才印，新分頁開。
 *
 * 2026-09-15 之前兩者搶同一個位置（有介紹連站內、否則連站外）；客戶要的是
 * 「每位教授點選進去都有個人網頁」，所以站內那一條變成常駐，站外另成一行。
 *
 * 寫成一個元件而不是各自 if：五個落點的判斷一旦分家，日後只會改到其中四個。
 * 每一條都是平行的 <a>、不包 wrapper —— `.faculty-grid` 底下的元素被 site.css
 * 按位置定址，多一個兄弟元素沒問題，多一層包裝才會掉樣式。
 *
 * `profileClassName`：標準卡與系主任橫幅上，站內那一條還帶 `faculty-profile-link`
 * —— site-extensions.css 用它的 ::after 把整張卡撐成可點的區域（stretched link），
 * 讀者點照片或姓名都會進個人頁，而 DOM 一個字不用動。
 */
export function ProfileLinks({
  lang,
  member,
  stretch = false,
}: {
  lang: Lang;
  member: Faculty;
  /** 標準卡／系主任橫幅：站內連結撐滿整張卡。列表版型不要（會蓋住 mailto）。 */
  stretch?: boolean;
}) {
  const t = translate(FACULTY, lang);
  const hasPage = member.category !== FACULTY_NO_PAGE_CATEGORY;
  return (
    <>
      {hasPage ? (
        <Link
          className={stretch ? "faculty-home faculty-profile-link" : "faculty-home"}
          href={localizePath(`/faculty/${member.id}`, lang)}
        >
          {t.profileLabel} →
        </Link>
      ) : null}
      {member.homepage_url ? (
        <a
          className="faculty-home faculty-site-link"
          href={member.homepage_url}
          target="_blank"
          rel="noopener noreferrer"
        >
          {t.homepageLabel} ↗︎
        </a>
      ) : null}
    </>
  );
}

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
      {/*
        分機。是一個平行的 <span>，不是把 email 跟它包成一個 <div> —— 上面
        第 19-27 行那份合約說得很清楚：`.faculty-grid` 底下的元素被 site.css
        按位置定址，任何一個被包一層 wrapper 都會掉樣式。多一個兄弟元素沒有
        違反那條，多一層包裝才有。

        位置在 email 之前但**顯示在它上面**：`.faculty-grid a` 是
        position:absolute 釘在卡片底部的（卡片的 padding-bottom:70px 就是為它
        留的），所以這個 span 留在正常流裡，不會撞到。

        沒填分機就整行不印，不留空位。
      */}
      {member.extension ? (
        <span className="faculty-ext">
          {t.extensionLabel} {member.extension}
        </span>
      ) : null}
      {/*
        個人網頁（站內，常駐）與個人網站（站外，有填才印）—— 見上面 ProfileLinks。

        ⚠️ `.faculty-grid a` 是 `position:absolute` 釘在卡片底部的（卡片的
        padding-bottom:70px 就是為那一條 mailto 留的），所以這兩條**必須**
        用 `.faculty-home` 把定位改回 static，否則會疊在同一個位置。
        規則在 site-extensions.css；同一處還有把整張卡撐成可點區域的 ::after。
      */}
      <ProfileLinks lang={lang} member={member} stretch />
      {member.email ? (
        <a href={`mailto:${member.email}`}>{member.email} ↗︎</a>
      ) : null}
    </article>
  );
}
