import { navItems } from "@/lib/nav";
import { SITEMAP } from "@/lib/i18n/sitemap";
import { FACULTY } from "@/lib/i18n/faculty";
import { ADMISSIONS } from "@/lib/i18n/admissions";
import { COURSES } from "@/lib/i18n/courses";
import { STUDENTS } from "@/lib/i18n/students";
import { ALUMNI } from "@/lib/i18n/alumni";

/**
 * 後台的「網站地圖」：前台每一頁 → 那一頁上可以編輯的區塊 → 後台入口。
 *
 * 客戶的要求是「後台功能架構照網站 menu 呈現，管理員一進來就知道該頁的內容
 * 要去哪邊新增」。所以這裡的**主鍵是前台的頁面**，不是後台的模組：側欄
 * （components/admin/AdminNav.tsx）、儀表板（app/(admin)/admin/page.tsx）與每個
 * 列表頁 h1 底下那行「這裡的內容出現在…」（_components/AppearsOn.tsx）三個地方
 * 都讀這一份，改一處三處一起變。
 *
 * ## 標籤從哪裡來
 *
 *  - 頁名：lib/nav.ts 的 `navItems("zh")` —— 與前台選單同一個來源。
 *  - 區塊名：各頁字典的 `nav.items`（前台頁內導覽印的那些字），用 `href`
 *    （`#section-N`）查而不是用索引。components/site/README.md §93 的規則是
 *    「標籤要跟落點區塊一字不差」，系辦在前台看到什麼字、在後台就找什麼字。
 *
 * ## 供應多頁的模組
 *
 * programs 供應首頁、招生資訊、課程資訊；links 與 documents 各供應兩頁。它們在
 * 每一頁底下各出現一次，links / documents 帶 `?section=` 讓列表先篩好那一頁的
 * 資料。同一個模組在側欄亮好幾處是事實，不是 bug。
 *
 * ⚠️ 這裡只決定「顯示」。managerOnly 不是授權 —— 真正擋住的是那兩個頁面的
 *    `requireManagerOrRedirect()` 與資料庫的 `is_manager()`（見 AdminShell）。
 */

export type AdminBlock = {
  /** 前台區塊名（頁內導覽印的字）。 */
  label: string;
  /** 後台入口，可帶 `?section=`。 */
  href: string;
  /** 前台落點（新分頁開）。 */
  publicHref: string;
  /** 一句話補充，例如「內文在各學制的編輯頁」。 */
  note?: string;
  managerOnly?: boolean;
};

export type AdminPage = {
  /** 前台路徑，同 lib/nav.ts。 */
  href: string;
  label: string;
  blocks: AdminBlock[];
  /** 沒有任何可編輯區塊的頁面印這一句，例如本系簡介。 */
  note?: string;
};

type NavEntry = { href: string; label: { zh: string; en: string } };

/** 從某一頁字典的 nav.items 取區塊的中文名。找不到就把 href 印出來，讓錯誤看得見。 */
function section(items: readonly NavEntry[], href: string): string {
  return items.find((item) => item.href === href)?.label.zh ?? href;
}

const page = Object.fromEntries(navItems("zh").map((item) => [item.href, item.label])) as Record<
  string,
  string
>;

export const ADMIN_SITE_MAP: AdminPage[] = [
  {
    href: "/",
    label: page["/"],
    blocks: [
      {
        label: section(SITEMAP.home.items, "#news"),
        href: "/admin/news",
        publicHref: "/#news",
        note: "首頁只印最新的幾則",
      },
      {
        label: section(SITEMAP.home.items, "#admissions"),
        href: "/admin/programs",
        publicHref: "/#admissions",
        note: "四個學制的名稱與簡介",
      },
    ],
  },
  {
    href: "/news",
    label: page["/news"],
    blocks: [
      {
        label: "消息、演講與研討會",
        href: "/admin/news",
        publicHref: "/news",
      },
    ],
  },
  {
    href: "/about",
    label: page["/about"],
    blocks: [],
    note: "這一頁目前是固定文案，沒有可編輯的內容。",
  },
  {
    href: "/faculty",
    label: page["/faculty"],
    blocks: [
      {
        label: "師資與行政同仁",
        href: "/admin/faculty",
        publicHref: "/faculty",
        note: `${section(FACULTY.nav.items, "#section-1")}到${section(FACULTY.nav.items, "#section-4")}四區都在這裡，用「分類」欄位決定落在哪一區`,
      },
    ],
  },
  {
    href: "/admissions",
    label: page["/admissions"],
    blocks: [
      {
        label: section(ADMISSIONS.nav.items, "#section-1"),
        href: "/admin/programs",
        publicHref: "/admissions#section-1",
      },
      {
        label: section(ADMISSIONS.nav.items, "#section-3"),
        href: "/admin/capabilities",
        publicHref: "/admissions#section-3",
      },
      {
        label: `${section(ADMISSIONS.nav.items, "#section-4")} · 招生檔案`,
        href: "/admin/documents?section=admissions",
        publicHref: "/admissions#section-4",
      },
      {
        label: `${section(ADMISSIONS.nav.items, "#section-4")} · 資源連結`,
        href: "/admin/links?section=admissions",
        publicHref: "/admissions#section-4",
      },
    ],
  },
  {
    href: "/courses",
    label: page["/courses"],
    blocks: [
      {
        label: section(COURSES.nav.items, "#section-1"),
        href: "/admin/courses",
        publicHref: "/courses#section-1",
      },
      {
        label: section(COURSES.nav.items, "#section-2"),
        href: "/admin/programs",
        publicHref: "/courses#section-2",
        note: "各學制的修業規定內文在學制的編輯頁",
      },
      {
        label: `${section(COURSES.nav.items, "#section-2")} · 系上表單`,
        href: "/admin/documents?section=courses",
        publicHref: "/courses#section-2",
      },
    ],
  },
  {
    href: "/students",
    label: page["/students"],
    blocks: [
      {
        label: `${section(STUDENTS.nav.items, "#section-1")}／${section(STUDENTS.nav.items, "#section-2")}／${section(STUDENTS.nav.items, "#section-3")}`,
        href: "/admin/students",
        publicHref: "/students#section-1",
      },
      {
        label: section(STUDENTS.nav.items, "#section-4"),
        href: "/admin/links?section=students",
        publicHref: "/students#section-4",
      },
    ],
  },
  {
    href: "/alumni",
    label: page["/alumni"],
    blocks: [
      {
        label: section(ALUMNI.nav.items, "#section-events"),
        href: "/admin/events",
        publicHref: "/alumni#section-events",
      },
    ],
  },
];

/** 不屬於任何前台頁面的設定類功能。 */
export const ADMIN_SYSTEM: AdminBlock[] = [
  { label: "人員管理", href: "/admin/users", publicHref: "", managerOnly: true },
  { label: "操作日誌", href: "/admin/logs", publicHref: "", managerOnly: true },
];

export type AppearsOnEntry = { page: string; block: string; publicHref: string; note?: string };

/**
 * 反查：這個後台頁面供應前台的哪些頁面／區塊。
 *
 * `pathname` 是後台路徑（例如 `/admin/links`），`sectionParam` 是列表頁目前的
 * `?section=`。有指定 section 時只回該 section 的入口；沒指定時回這個模組的
 * 全部入口（連結卡片列表在「全部」模式下會列出它供應的兩頁）。
 */
export function appearsOn(pathname: string, sectionParam?: string | null): AppearsOnEntry[] {
  const out: AppearsOnEntry[] = [];
  for (const p of ADMIN_SITE_MAP) {
    for (const b of p.blocks) {
      const [path, query] = b.href.split("?");
      if (path !== pathname) continue;
      const blockSection = query ? new URLSearchParams(query).get("section") : null;
      if (sectionParam && blockSection && blockSection !== sectionParam) continue;
      out.push({ page: p.label, block: b.label, publicHref: b.publicHref, note: b.note });
    }
  }
  return out;
}
