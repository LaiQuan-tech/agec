import type { Lang, Msg } from "@/lib/i18n";

/**
 * Copy for 系所成員 (/faculty).
 *
 * The people themselves come from the database and are already resolved into
 * one language by `lib/data.ts` — this file holds only what the page says
 * *around* them: section headings, the accordion titles, field labels, the
 * filter's accessible name and its result count.
 *
 * The `eyebrow`s (FULL-TIME FACULTY, VISITING FACULTY, …) stay literal props
 * in the component: they are Latin-caps typographic devices that already read
 * as English on the Chinese site.
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
  /** `.local-nav` jump links, one per `#section-N`. */
  nav: {
    fullTime: Msg;
    affiliated: Msg;
    legacy: Msg;
    administration: Msg;
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
  filter: {
    ariaLabel: Msg;
    /**
     * `.faculty-result-count`. `{n}` is replaced with the number of visible
     * cards — see `fill()`. Chinese has no plural, so both zh values are the
     * same sentence and only the English pair differs; keeping two keys makes
     * "Showing 1 members" impossible rather than merely unlikely.
     */
    resultCount: Msg;
    resultCountOne: Msg;
    /** `.faculty-empty`, the row that replaces an empty grid. */
    empty: Msg;
  };
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
    fullTime: { zh: "專任師資", en: "Full-time" },
    affiliated: { zh: "合聘與兼任", en: "Joint & adjunct" },
    legacy: { zh: "客座、名譽與退休", en: "Visiting, emeritus & retired" },
    administration: { zh: "行政同仁", en: "Administration" },
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

  filter: {
    ariaLabel: { zh: "依師資類別篩選", en: "Filter by faculty category" },
    resultCount: { zh: "顯示 {n} 位成員", en: "Showing {n} members" },
    resultCountOne: { zh: "顯示 {n} 位成員", en: "Showing {n} member" },
    empty: { zh: "此分類目前沒有成員。", en: "No members in this category yet." },
  },

  cardPortraitAlt: {
    zh: "{name}{title}形象照",
    en: "Portrait of {name}, {title}",
  },
  visitingPortraitAlt: {
    zh: "{name}{category}形象照",
    en: "Portrait of {name}, {category}",
  },
} satisfies FacultyDict;

/**
 * Display labels for `faculty.category`, keyed by the Chinese value stored in
 * the database.
 *
 * `category` is never translated in `lib/data.ts` — it selects the card layout,
 * and both the four renderers and the filter compare it against these Chinese
 * literals — so this map is the *only* place a visitor's language reaches it.
 * The keys must therefore stay byte-identical to FACULTY_CATEGORIES in
 * app/(admin)/admin/faculty/constants.ts, plus the "全部" pseudo-category the
 * filter uses to mean "no filter".
 */
const CATEGORY_LABELS = {
  全部: { zh: "全部", en: "All" },
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
 * The legacy layouts (名譽/退休/客座) do *not* use this: they have two slots
 * and print `name_en` above the Chinese name on both sites, because that pair
 * is how the reference site shows those people.
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
 * The two names a legacy card shows at once (名譽 / 退休 / 客座).
 *
 * Unlike `displayName`, nothing is dropped here — those layouts have a slot
 * for each. What changes with the language is which one is the heading: the
 * page's own language leads and the other sits above it as a kicker, the same
 * mirroring InteriorHero applies to page titles and the admission cards apply
 * to programme names.
 *
 * `kicker` is null when the pair would repeat itself — a legacy row with no
 * `name_en`, where there is only one name to show.
 */
export function namePair(
  member: { name: string; name_en: string | null },
  lang: Lang
): { heading: string; kicker: string | null } {
  if (lang === "en" && member.name_en) {
    return { heading: member.name_en, kicker: member.name };
  }
  return { heading: member.name, kicker: member.name_en };
}
