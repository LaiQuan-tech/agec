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
  nextRouteKicker: {
    zh: "KEEP EXPLORING · 繼續探索",
    en: "KEEP EXPLORING · MORE OF AGEC",
  },
  backToHome: { zh: "回到首頁", en: "Back to home" },
  /** Language toggle in the institution bar. */
  switchLanguage: { zh: "Switch to English", en: "切換為中文" },
  languageLabel: { zh: "EN", en: "中" },
} satisfies Record<string, Msg>;
