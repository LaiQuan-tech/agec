import type { Lang, Msg } from "@/lib/i18n";

/**
 * Copy for 系所成員 (/faculty).
 *
 * The people themselves come from the database and are already resolved into
 * one language by `lib/data.ts` — this file holds only what the page says
 * *around* them: section headings, the accordion titles and field labels.
 *
 * The `eyebrow`s (FULL-TIME FACULTY, VISITING FACULTY, …) are looked up from
 * the EYEBROWS dictionary (lib/i18n/eyebrows.ts) via `translate()` in the
 * component, not literal props — zh and en are deliberately different words
 * (中文小標／英文大寫), not the same string on /faculty and /en/faculty.
 * (This comment used to say the opposite; corrected 2026-09-28 — see
 * eyebrows.ts's own header for why the dictionary exists.)
 */

type FacultyDict = {
  /**
   * Page title, read both untranslated and through `translate()`:
   * `InteriorHero` prints one language as the kicker above the other, so it
   * needs the pair; `LocalNav` needs only the current one.
   */
  title: Msg;
  lead: Msg;
  heroImageAlt: Msg;
  /**
   * `.local-nav` jump links, one per `#section-N`.
   *
   * `{ href, label }` pairs rather than four bare labels — see the same note
   * on ABOUT.nav. /sitemap lists these anchors too, via lib/sitemap-tree.ts.
   */
  nav: {
    items: readonly { href: string; label: Msg }[];
  };
  fullTime: { heading: Msg; description: Msg };
  affiliated: { heading: Msg };
  legacy: {
    heading: Msg;
    description: Msg;
    /** `.legacy-group-title h3` — one per `details.legacy-group`. */
    visiting: Msg;
    emeritus: Msg;
    retired: Msg;
    /** `.visiting-profile-list` `<dt>`. */
    fieldsLabel: Msg;
    /** `.legacy-career` `<span>`, the label above the career summary. */
    experienceLabel: Msg;
  };
  administration: { heading: Msg };
  /**
   * Portrait alt text. `{name}` / `{title}` / `{category}` are filled in per
   * card by `fill()`.
   *
   * The two differ in more than wording: the standard card names the person's
   * 職稱 while the visiting profile names their 類別 — 柏靖峰客座教師形象照 on
   * a card whose title line reads 客座教師 · 助理教授. That is the reference
   * site's own composition and both are kept as they are.
   */
  cardPortraitAlt: Msg;
  visitingPortraitAlt: Msg;
  /**
   * 分機前面的那個詞。四種卡片版型共用。
   *
   * 分機號碼本身沒有 `_en` 欄位（跨語言相同的識別字串，與 email 同理，見
   * lib/data.ts 的 Faculty.extension），需要翻譯的只有這個標籤。
   */
  extensionLabel: Msg;
  /**
   * 站內個人頁那一行的字（→ /faculty/<id>）。四種卡片版型共用，所以只有一條。
   * 行政同仁以外每一位都有這一行 —— 每位師資都有頁（見 lib/data.ts getFacultyById）。
   */
  profileLabel: Msg;
  /**
   * 站外個人網站那一行的字（`homepage_url`，新分頁開）。與站內頁分成兩行，
   * 不再搶同一個位置。
   *
   * 是「個人網站」而不是印出網址本身：email 印出來是因為它同時是可複製的
   * 資訊，網址不是 —— 一長串 https:// 在 9px 的卡片底部只會換行三次。
   */
  homepageLabel: Msg;
  /**
   * 站內個人頁 `.profile-facts` `<dl>` 的 Email 標籤。四種卡片版型不需要這個
   * 字——信箱本身就是可點的 mailto 連結，整段文字已經在說「這是信箱」；只有
   * 個人頁把它放進定義清單，需要一個標籤字搭配 `<dd>`。同一個 `<dl>` 其他
   * 標籤（領域、分機、個人網站、重要經歷）本來就走字典，這裡原本寫死英文
   * "Email"，2026-09-28 客戶要求中文站全中文，一併移進來。
   */
  emailLabel: Msg;
  /** 個人頁底部回到 /faculty 的連結。 */
  backToList: Msg;
};

export const FACULTY = {
  title: { zh: "系所成員", en: "Faculty & Staff" },
  lead: {
    zh: "由跨領域學者與專業行政團隊共同形成的知識社群，連結教學、研究、政策與產業實務。",
    en: "A scholarly community of cross-disciplinary researchers and professional administrative staff, connecting teaching, research, policy and industry practice.",
  },
  heroImageAlt: {
    zh: "臺大農業綜合館入口",
    en: "Entrance to the Agriculture Comprehensive Building at NTU",
  },

  nav: {
    items: [
      { href: "#section-1", label: { zh: "專任師資", en: "Full-time" } },
      // 英文刻意比中文長一點："Joint & adjunct" 不是大標
      // "Jointly appointed and adjunct faculty" 的前綴，讀者按下去看不到自己
      // 按的詞；中文的「合聘與兼任」對「合聘與兼任師資」則是。
      {
        href: "#section-2",
        label: { zh: "合聘與兼任", en: "Jointly appointed & adjunct" },
      },
      {
        href: "#section-3",
        label: { zh: "客座、名譽與退休", en: "Visiting, emeritus & retired" },
      },
      { href: "#section-4", label: { zh: "行政同仁", en: "Administration" } },
    ],
  },

  fullTime: {
    heading: { zh: "專任師資", en: "Full-time faculty" },
    description: {
      zh: "研究橫跨政策、制度、發展、運銷、貿易、消費、生產、管理、土地、資源與環境。",
      en: "Research spanning policy, institutions, development, marketing, trade, consumption, production, management, land, resources and the environment.",
    },
  },

  affiliated: {
    heading: { zh: "合聘與兼任師資", en: "Jointly appointed and adjunct faculty" },
  },

  legacy: {
    heading: {
      zh: "客座、名譽與退休教師",
      en: "Visiting, emeritus and retired faculty",
    },
    description: {
      zh: "長年累積的教學與研究傳承，是本系持續前進的重要基礎。",
      en: "The teaching and research handed down over many years remain an essential foundation for the department's continued progress.",
    },
    visiting: { zh: "客座教師", en: "Visiting faculty" },
    emeritus: { zh: "名譽教授", en: "Emeritus professors" },
    retired: { zh: "退休師資", en: "Retired faculty" },
    fieldsLabel: { zh: "研究與授課領域", en: "Research and teaching areas" },
    experienceLabel: { zh: "重要經歷", en: "Career highlights" },
  },

  administration: {
    heading: { zh: "行政同仁", en: "Administrative staff" },
  },

  cardPortraitAlt: {
    zh: "{name}{title}形象照",
    en: "Portrait of {name}, {title}",
  },
  visitingPortraitAlt: {
    zh: "{name}{category}形象照",
    en: "Portrait of {name}, {category}",
  },
  extensionLabel: { zh: "分機", en: "Ext." },
  profileLabel: { zh: "個人網頁", en: "Profile" },
  homepageLabel: { zh: "個人網站", en: "Website" },
  emailLabel: { zh: "電子郵件", en: "Email" },
  backToList: { zh: "← 回到系所成員", en: "← Back to Faculty & Staff" },
} satisfies FacultyDict;

/**
 * Display labels for `faculty.category`, keyed by the Chinese value stored in
 * the database.
 *
 * `category` is never translated in `lib/data.ts` — it selects the card layout,
 * and the four renderers compare it against these Chinese literals — so this
 * map is the *only* place a visitor's language reaches it. The keys must
 * therefore stay byte-identical to FACULTY_CATEGORIES in
 * app/(admin)/admin/faculty/constants.ts.
 *
 * 以前這裡還有一個「全部」的假分類，那是 §1 篩選籤的「不篩選」值。篩選籤在
 * 2026-09 移除了（見 components/site/Faculty.tsx 的檔頭），它跟著一起走。
 */
const CATEGORY_LABELS = {
  專任師資: { zh: "專任師資", en: "Full-time faculty" },
  合聘師資: { zh: "合聘師資", en: "Jointly appointed faculty" },
  兼任師資: { zh: "兼任師資", en: "Adjunct faculty" },
  客座教師: { zh: "客座教師", en: "Visiting faculty" },
  名譽教授: { zh: "名譽教授", en: "Emeritus professor" },
  退休師資: { zh: "退休師資", en: "Retired faculty" },
  行政同仁: { zh: "行政同仁", en: "Administrative staff" },
} satisfies Record<string, Msg>;

/**
 * One `faculty.category` value, resolved for display.
 *
 * The office edits `category` freely from the admin, and an unrecognised value
 * still renders a standard card (see components/site/Faculty.tsx), so an
 * unknown key falls back to the stored Chinese rather than to a blank chip —
 * the same rule `pick()` follows for the database's own `_en` columns: a
 * missing translation is a mixed-language page, never an empty one.
 *
 * The cast is what lets an arbitrary string be looked up in an object whose
 * keys are literals; it is confined to this function so the map above keeps
 * its exhaustiveness check.
 */
export function categoryLabel(category: string, lang: Lang): string {
  const label = (CATEGORY_LABELS as Record<string, Msg | undefined>)[category];
  return label ? label[lang] : category;
}

/**
 * Substitutes `{placeholder}` tokens in a dictionary string.
 *
 * Page copy is data, so the sentences above carry their own word order and
 * this fills the holes — building them with template literals in the component
 * would put one language's grammar (「{姓名}{職稱}形象照」 has no separator and
 * no preposition) into code that has to serve both. An unknown token is left
 * as written so a typo shows up on the page instead of vanishing.
 */
export function fill(
  template: string,
  values: Record<string, string | number>
): string {
  return template.replace(/\{(\w+)\}/g, (token, key: string) =>
    key in values ? String(values[key]) : token
  );
}

/**
 * The name to print where a layout has only one name slot — the standard
 * portrait card and the administration card.
 *
 * The legacy layouts (名譽/退休/客座) and the chair's banner do *not* use
 * this: they have two slots. On `/en` both are filled — `name_en` prints
 * above the Chinese name, because that pair is how the reference site shows
 * those people. 中文頁 2026-09-28 起只用第一個位置（見下面 `namePair` 的
 * 說明），第二個位置固定不印。
 *
 * Falls back to the Chinese name when `name_en` is null. That is one real row
 * today — the staff member whose English name the department's own English
 * site has not updated (it still lists a predecessor) — and showing their
 * Chinese name is better than inventing a romanisation for a real person.
 */
export function displayName(
  member: { name: string; name_en: string | null },
  lang: Lang
): string {
  return lang === "en" ? (member.name_en ?? member.name) : member.name;
}

/**
 * The name(s) a legacy card shows (名譽 / 退休 / 客座) — and the chair's
 * banner card, the other layout with two name slots.
 *
 * On `/en`, nothing is dropped: those layouts have a slot for each name, the
 * page's own language leads as the heading and the other sits above it as a
 * kicker, the same mirroring InteriorHero applies to page titles and the
 * admission cards apply to programme names.
 *
 * 🔴 2026-09-28 客戶要求中文站只能出現中文：中文頁固定不帶 kicker，即使
 * 資料庫的 `name_en` 有值也不印在姓名旁邊——這一頁以前拿 `name_en` 當中文頁
 * 的旁註（英文姓名），現在只有 `/en` 會用到 `name_en`。`kicker: null` 的四個
 * 呼叫點都已經是 `kicker ? (<p>…</p>) : null` 的寫法，所以中文頁不會留下
 * 空元素，只是那一行不印。
 *
 * `/en` 缺 `name_en` 時同樣沒有第二個名字可以當 kicker，退回單一中文姓名
 * （與 `displayName` 同一條退回規則）——這個情況本來就會落到 `kicker: null`，
 * 與中文頁的新規則殊途同歸，所以下面只有一個 fallback 分支。
 */
export function namePair(
  member: { name: string; name_en: string | null },
  lang: Lang
): { heading: string; kicker: string | null } {
  if (lang === "en" && member.name_en) {
    return { heading: member.name_en, kicker: member.name };
  }
  return { heading: member.name, kicker: null };
}
