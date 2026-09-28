import type { Msg } from "@/lib/i18n";

/**
 * Strings owned by the site chrome — the institution bar, the masthead, the
 * menu overlay, the footer and the opening loader (SiteHeader / SiteFooter /
 * SiteLoader). They render on every page of both variants, so they sit here
 * rather than in any per-page dictionary beside this file.
 *
 * A couple of leaves still carry the same text in both languages —
 * `copyright` and `tagline` below, each with its own note on why. `college`
 * and `menuEyebrow` used to as well: the reference site prints those in
 * English on the Chinese pages too, and this dictionary mirrored that until
 * the client asked, 2026-09-28, that the Chinese site carry no Latin text
 * anywhere, `.eyebrow` labels included. Those two now have their own Chinese
 * strings; /en is unchanged. The leaves that are still deliberately
 * identical say so where they are defined.
 */
export const COMMON = {
  /** Institution bar, first span. */
  university: { zh: "國立臺灣大學", en: "National Taiwan University" },
  /**
   * Institution bar, `.institution-en` (hidden by CSS below 600px).
   *
   * Used to be the same string in both languages: the Chinese page paired
   * the university's Chinese name with the college's English one on purpose,
   * so the bar read as one bilingual lockup. The client asked 2026-09-28
   * that the Chinese site carry no Latin text anywhere, this line included,
   * so zh now holds the college's Chinese name instead. /en is unchanged —
   * "National Taiwan University · College of Bioresources and Agriculture"
   * is still exactly the lockup an English reader expects.
   */
  college: {
    zh: "生物資源暨農學院",
    en: "College of Bioresources and Agriculture",
  },

  /**
   * 機構列的兩條工具連結。`contact` 跳到頁尾的 `#contact`；`sitemap` 現在
   * 是一整頁（/sitemap），不再是跳到頁尾那兩欄的錨點。
   *
   * 兩條在 860px 以下都會被藏起來（`.utility-links a:first-child,
   * .utility-links a:nth-child(2)`），那個斷點下語言切換是這一列唯一的控制項
   * —— 同一個斷點開始出現的選單覆蓋層會把這兩條再放一次（SiteHeader 的
   * `.menu-utility`），否則窄螢幕就到不了網站導覽。
   */
  contact: { zh: "聯絡我們", en: "Contact" },

  /* --- 頁尾的外部連結 ------------------------------------------------------
   * 站外的兩個去處。`university` 已經存在（機構列在用），這裡直接沿用同一個
   * 名稱 —— 同一個機構在同一頁上有兩種寫法會讓人以為是兩個東西。
   */
  facebook: { zh: "農經系 Facebook", en: "AGEC on Facebook" },
  /** 這一組連結的 aria-label，讓讀屏使用者知道接下來是站外連結。 */
  externalLinksLabel: { zh: "相關連結", en: "Related links" },
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
   * `.eyebrow` above the menu grid.
   *
   * Used to be the same Latin-caps string in both languages, like
   * SHARED.nextRouteKicker used to be — the reference site sets its
   * eyebrows in Latin caps as a typographic device, and this one carried no
   * Chinese to begin with. The client asked 2026-09-28 that the Chinese
   * site carry no Latin text anywhere, so zh is now Chinese; en is
   * unchanged. "8" / "八" is the route count, the same list in both
   * languages.
   */
  menuEyebrow: {
    zh: "探索農經 · 八條主要路線",
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
    zh: "©︎ 2026 Department of Agricultural Economics, NTU",
    en: "©︎ 2026 Department of Agricultural Economics, NTU",
  },
  tagline: {
    zh: "Knowledge rooted in land. Vision connected to the world.",
    en: "Knowledge rooted in land. Vision connected to the world.",
  },

  /** SiteLoader's `.sr-only` text, announced by its `aria-live` region. */
  loading: { zh: "頁面載入中", en: "Loading page" },
} satisfies Record<string, Msg>;
