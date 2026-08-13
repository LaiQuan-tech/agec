export type NavItem = {
  href: string;
  label: string;
};

/**
 * Canonical 8-item site navigation (design_handoff_agec/README.md §資訊架構).
 * components/classic/Shell.tsx imports this for both the desktop nav and the
 * mobile dropdown, so the route list and Chinese labels can never drift apart.
 */
export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "首頁" },
  { href: "/news", label: "最新消息" },
  { href: "/about", label: "本系簡介" },
  { href: "/faculty", label: "系所成員" },
  { href: "/admissions", label: "招生資訊" },
  { href: "/courses", label: "課程資訊" },
  { href: "/students", label: "學生專區" },
  { href: "/alumni", label: "系友專區" },
];
