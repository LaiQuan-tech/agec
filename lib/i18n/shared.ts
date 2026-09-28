import type { Msg } from "@/lib/i18n";

/**
 * Strings owned by the small components every interior page reuses
 * (InteriorHero, LocalNav, NextRoute, SiteShell). Page-specific copy lives in
 * the per-page dictionaries beside this file.
 */
export const SHARED = {
  skipToContent: { zh: "跳至主要內容", en: "Skip to main content" },
  home: { zh: "首頁", en: "Home" },
  breadcrumbLabel: { zh: "麵包屑導覽", en: "Breadcrumb" },
  /** `.local-nav` aria-label; the page name is prefixed by the component. */
  onThisPage: { zh: "頁內導覽", en: "on this page" },
  /**
   * `.next-route p`, the kicker above "Back to home".
   *
   * zh used to keep the Latin "KEEP EXPLORING ·" half too, matching the
   * "ENGLISH · 中文" pattern lib/i18n/home.ts's own eyebrows use (see that
   * file's header comment, which names this field as getting the same
   * treatment). The client asked 2026-09-28 that the Chinese site carry no
   * Latin text anywhere, so zh is now Chinese only. en is unchanged.
   */
  nextRouteKicker: {
    zh: "繼續探索",
    en: "KEEP EXPLORING · MORE OF AGEC",
  },
  backToHome: { zh: "回到首頁", en: "Back to home" },
  /**
   * Language toggle in the institution bar.
   *
   * 標籤寫的是「被提供的那個語言」，不是目前的語言：中文站顯示 EN、英文站顯示
   * 中文。SiteHeader 會把 `lang` 屬性標在標籤本身，讀屏才不會用英文腔念中文字。
   */
  switchLanguage: { zh: "Switch to English", en: "切換為中文" },
  languageLabel: { zh: "EN", en: "中文" },

  /* --- 檔案下載卡（components/site/SiteDocuments.tsx） -------------------
   * /courses §3 與 /admissions §4 共用同一個版型，這兩個字每一頁都一樣，
   * 所以放這裡而不是各自的頁面字典 —— 小標與說明才是每一頁自己的字。
   */
  /** `.document-grid>a>i` — 每張卡左下角的行動呼籲。 */
  download: { zh: "下載", en: "Download" },
  /** 從檔名推不出副檔名時，左上角徽章印這個。 */
  fileBadge: { zh: "檔案", en: "FILE" },

  /**
   * `.feature-story p` / `.inner-news-feature span` — the kicker on a
   * featured news card, shared by the home page (`Home.tsx`) and `/news`
   * (`News.tsx`). Used to be a hardcoded "FEATURED ·" printed unchanged on
   * both sites; the client asked, 2026-09-28, that the Chinese site carry no
   * Latin text anywhere, so zh now reads "精選 ·" while /en keeps the
   * original text untouched.
   */
  featuredKicker: { zh: "精選 ·", en: "FEATURED ·" },
} satisfies Record<string, Msg>;
