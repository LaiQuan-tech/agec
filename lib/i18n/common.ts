import type { Msg } from "@/lib/i18n";

/**
 * Strings owned by the site chrome — the institution bar, the masthead, the
 * menu overlay, the footer and the opening loader (SiteHeader / SiteFooter /
 * SiteLoader). They render on every page of both variants, so they sit here
 * rather than in any per-page dictionary beside this file.
 *
 * Some leaves carry the same text in both languages. That is deliberate, not
 * an unfilled row: the reference site already prints those lines in English on
 * the Chinese pages, so "translating" them for /en would be a change to the
 * Chinese site, not to the English one. Each such leaf says so below.
 */
export const COMMON = {
  /** Institution bar, first span. */
  university: { zh: "國立臺灣大學", en: "National Taiwan University" },
  /**
   * Institution bar, `.institution-en` (hidden by CSS below 600px).
   *
   * Same in both languages. The Chinese page already pairs the university's
   * Chinese name with the college's English one, and read straight through,
   * "National Taiwan University · College of Bioresources and Agriculture" is
   * exactly the lockup an English reader expects — so /en keeps the line as
   * it stands instead of swapping in a Chinese college name that appears
   * nowhere on the reference site.
   */
  college: {
    zh: "College of Bioresources and Agriculture",
    en: "College of Bioresources and Agriculture",
  },

  /**
   * The two utility links, which jump to the footer's `#contact` / `#sitemap`
   * anchors rather than navigating. Both are hidden below 600px
   * (`.utility-links a:first-child, .utility-links a:nth-child(2)`), leaving
   * the language toggle as the bar's only control on mobile.
   */
  contact: { zh: "聯絡我們", en: "Contact" },
  sitemap: { zh: "網站導覽", en: "Sitemap" },

  /** Department name; the alt text of the brand mark in header and footer. */
  departmentFull: {
    zh: "國立臺灣大學農業經濟學系",
    en: "Department of Agricultural Economics, National Taiwan University",
  },
  /**
   * aria-label of the brand link. It gets its own string because the brand is
   * the *only* way back to the home page — the desktop nav deliberately drops
   * that route — so the label has to say "home", not just name the department.
   */
  brandHome: {
    zh: "國立臺灣大學農業經濟學系首頁",
    en: "Department of Agricultural Economics, NTU — home page",
  },

  /** aria-labels of the three landmarks/controls in the masthead and overlay. */
  mainNav: { zh: "主要導覽", en: "Main navigation" },
  siteMenu: { zh: "全站選單", en: "Site menu" },
  openMenu: { zh: "開啟全站選單", en: "Open site menu" },
  closeMenu: { zh: "關閉全站選單", en: "Close site menu" },
  /**
   * `.eyebrow` above the menu grid. Same in both languages, like
   * SHARED.nextRouteKicker: the reference site sets its eyebrows in Latin
   * caps as a typographic device, and this one carries no Chinese to begin
   * with. "8" is the route count, which is the same list in both languages.
   */
  menuEyebrow: {
    zh: "EXPLORE AGEC · 8 MAIN PATHS",
    en: "EXPLORE AGEC · 8 MAIN PATHS",
  },

  /**
   * Footer postal address, split across the `<br>` the markup already has.
   *
   * ⚠️ The two lines are swapped between languages on purpose. A Chinese
   * address runs largest-to-smallest (postcode → city → street → floor) and an
   * English one runs the other way, so line 1 is the street in Chinese and the
   * building in English. Same two-line block, correct reading order in both;
   * translating them line-for-line would print an English address backwards.
   */
  addressLine1: {
    zh: "10617 臺北市大安區羅斯福路四段一號",
    en: "1F–2F, Agriculture Comprehensive Building",
  },
  addressLine2: {
    zh: "農業綜合館一、二樓",
    en: "No. 1, Sec. 4, Roosevelt Rd., Da’an Dist., Taipei 10617, Taiwan",
  },

  /**
   * `.footer-bottom`, both spans. English on the Chinese site already — the
   * copyright line is a legal identifier and the tagline is the department's
   * own English motto — so neither changes on /en.
   */
  copyright: {
    zh: "© 2026 Department of Agricultural Economics, NTU",
    en: "© 2026 Department of Agricultural Economics, NTU",
  },
  tagline: {
    zh: "Knowledge rooted in land. Vision connected to the world.",
    en: "Knowledge rooted in land. Vision connected to the world.",
  },

  /** SiteLoader's `.sr-only` text, announced by its `aria-live` region. */
  loading: { zh: "頁面載入中", en: "Loading page" },
} satisfies Record<string, Msg>;
