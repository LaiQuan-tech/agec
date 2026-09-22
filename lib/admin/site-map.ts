import { navItems } from "@/lib/nav";
import { SITEMAP } from "@/lib/i18n/sitemap";
import { ABOUT } from "@/lib/i18n/about";
import { FACULTY } from "@/lib/i18n/faculty";
import { ADMISSIONS } from "@/lib/i18n/admissions";
import { COURSES } from "@/lib/i18n/courses";
import { STUDENTS } from "@/lib/i18n/students";
import { ALUMNI } from "@/lib/i18n/alumni";
import { GIVING } from "@/lib/i18n/giving";

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
 * programs 供應首頁、招生資訊、課程資訊；links 與 documents 各供應兩頁；news
 * 供應首頁、最新消息、各學制招生頁；events 供應最新消息（一般活動）與系友專區
 * （系友活動）。它們在每一頁底下各出現一次，links / documents 帶 `?section=`、
 * news 帶 `?category=`、events 帶 `?audience=`，讓列表先篩好那一頁的資料。
 *
 * ## 側欄永遠只亮一個
 *
 * 同一個模組出現在三處，三處一起亮看起來像壞掉（系辦真的問了）。規則在
 * `activeAdminBlock()`：網址上的參數對得上哪個入口就亮那個；對不上（列表在
 * 「全部」模式、新增／編輯頁）就亮標了 `primary` 的那個 —— 每個模組恰好一個。
 * 沒有參數也不是 primary 的入口是**捷徑**（例如「首頁 › 最新動態」）：點下去
 * 會落在 primary 那一項，側欄在它旁邊印「→ 最新消息」讓人知道會跳過去。
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
  /**
   * 這個模組的「本家」：網址對不到任何帶參數的入口時，側欄亮這一個。
   * 供應多頁的模組（news / programs / links / documents）各標一個，其餘模組
   * 只有一個入口，不必標。
   */
  primary?: boolean;
};

export type AdminPage = {
  /** 前台路徑，同 lib/nav.ts。 */
  href: string;
  label: string;
  blocks: AdminBlock[];
  /**
   * 沒有任何可編輯區塊的頁面印這一句。本系簡介接上 page_copy 之後目前沒有這種
   * 頁，欄位留著給下一個純靜態的頁。
   */
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
        primary: true,
      },
      {
        // 與 NEWS_LOCAL_NAV / EYEBROWS.eventsRegistration 同一個字。
        label: "活動報名",
        // 一般活動（alumni_events.audience = general）。同一個模組另一個入口在
        // 系友專區底下（?audience=alumni，primary）。
        href: "/admin/events?audience=general",
        publicHref: "/news#section-2",
        note: "對象選「一般活動」；任何人都能報名，報名表不收畢業年度與學制。沒有開放中的一般活動時，前台整區不印",
      },
    ],
  },
  {
    href: "/about",
    label: page["/about"],
    blocks: [
      {
        label: "全頁文案",
        href: "/admin/about",
        publicHref: "/about",
        note: `頁首導言，加${section(ABOUT.nav.items, "#section-1")}到${section(ABOUT.nav.items, "#section-4")}四區的標題與內文；圖片與各區上方的英文大寫字固定`,
      },
    ],
  },
  {
    href: "/faculty",
    label: page["/faculty"],
    blocks: [
      {
        label: "師資與行政同仁",
        href: "/admin/faculty",
        publicHref: "/faculty",
        note: `${section(FACULTY.nav.items, "#section-1")}到${section(FACULTY.nav.items, "#section-4")}四區都在這裡，用「分類」欄位決定落在哪一區；每位老師的個人頁內文也在各自的編輯頁`,
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
        note: "學制卡；每個學制的「官方簡章／報名系統」網址也在這裡填",
        primary: true,
      },
      {
        label: "各學制招生頁 · 招生公告",
        // slug 與前台 /news/category/admissions 同一套（lib/news-categories.ts）。
        href: "/admin/news?category=admissions",
        publicHref: "/admissions/undergraduate#notices",
        note: "分類選「招生」、再選學制，就會出現在該學制的招生頁",
      },
      {
        label: section(ADMISSIONS.nav.items, "#section-3"),
        href: "/admin/capabilities",
        publicHref: "/admissions#section-3",
      },
      {
        label: `${section(ADMISSIONS.nav.items, "#section-4")} · 招生檔案與考古題`,
        href: "/admin/documents?section=admissions",
        publicHref: "/admissions#section-4",
        note: "沒標學制的檔案印在招生資訊頁最下方；標了學制的印在該學制的招生頁。考古題：分類填「考古題」、**一定要選學制**、標籤填科目、說明填年度標題（例如 111碩士班招生考題），同一年度標題會排成一列；沒選學制的考古題會掉到共用檔案區",
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
        primary: true,
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
        primary: true,
      },
    ],
  },
  {
    href: "/alumni",
    label: page["/alumni"],
    blocks: [
      {
        label: section(ALUMNI.nav.items, "#section-events"),
        // 系友活動（alumni_events.audience = alumni）。活動模組現在供應兩頁
        // （另一個入口是「最新消息 › 活動報名」），所以這裡要標 primary。
        href: "/admin/events?audience=alumni",
        publicHref: "/alumni#section-events",
        note: "對象選「系友活動」；報名表會收畢業年度與學制",
        primary: true,
      },
      {
        // 支持農經 → 系上匯款帳號的內頁（page_copy，page=giving）。標籤前半是
        // §3 的區塊名、後半是內頁的標題，系辦在前台按鈕上看到的就是後半那幾個字。
        label: `${section(ALUMNI.nav.items, "#section-3")} · ${GIVING.title.zh}`,
        href: "/admin/giving",
        publicHref: "/alumni/giving",
        note: "系友專區「前往支持農經」按鈕與頁尾連結都到這一頁；沒填帳號時頁上印「整理中」",
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

/** 把入口的 href 拆成路徑與 `?key=value`。 */
function splitHref(href: string): { path: string; query: URLSearchParams } {
  const [path, query] = href.split("?");
  return { path, query: new URLSearchParams(query ?? "") };
}

/** 列表頁目前的篩選參數；`get()` 與 URLSearchParams 同形，所以兩邊都能餵。 */
export type ParamReader = { get(name: string): string | null };

/** 入口的每一個 `?key=` 都與網址一致才算對上；沒有參數的入口不在這裡判斷。 */
function queryMatches(query: URLSearchParams, params: ParamReader): boolean {
  if (query.toString() === "") return false;
  for (const [key, value] of query) if (params.get(key) !== value) return false;
  return true;
}

/**
 * 反查：這個後台頁面供應前台的哪些頁面／區塊。
 *
 * `pathname` 是後台路徑（例如 `/admin/links`），`filters` 是列表頁目前的篩選
 * （`{ section }` 或 `{ category }`）。有篩選時只回符合的入口；沒篩選（值為
 * null）時回這個模組的全部入口 —— 列表在「全部」模式下列出它供應的每一頁。
 */
export function appearsOn(
  pathname: string,
  filters?: Record<string, string | null | undefined> | null
): AppearsOnEntry[] {
  const out: AppearsOnEntry[] = [];
  for (const p of ADMIN_SITE_MAP) {
    for (const b of p.blocks) {
      const { path, query } = splitHref(b.href);
      if (path !== pathname) continue;
      let skip = false;
      for (const [key, value] of query) {
        const current = filters?.[key];
        if (current && current !== value) skip = true;
      }
      if (skip) continue;
      out.push({ page: p.label, block: b.label, publicHref: b.publicHref, note: b.note });
    }
  }
  return out;
}

const ALL_BLOCKS: AdminBlock[] = [...ADMIN_SITE_MAP.flatMap((p) => p.blocks), ...ADMIN_SYSTEM];

/**
 * 側欄要亮的那一個入口（恰好一個，或 null）。
 *
 *  1. 網址在這個模組底下（`/admin/news`、`/admin/news/12`…）的入口是候選。
 *  2. 候選裡帶參數、而且參數與網址完全一致的 → 它（`?section=students`、
 *     `?category=admissions`）。
 *  3. 否則亮 `primary`；沒有人標 primary 的模組只有一個入口，就是它。
 *
 * 回傳的是 ADMIN_SITE_MAP 裡同一個物件，呼叫端用 `===` 比對即可。
 */
export function activeAdminBlock(pathname: string, params: ParamReader): AdminBlock | null {
  const candidates = ALL_BLOCKS.filter((b) => {
    const { path } = splitHref(b.href);
    return pathname === path || pathname.startsWith(`${path}/`);
  });
  if (candidates.length === 0) return null;
  const exact = candidates.find((b) => queryMatches(splitHref(b.href).query, params));
  if (exact) return exact;
  return candidates.find((b) => b.primary) ?? candidates[0];
}

/**
 * 捷徑入口會落到哪一組：沒帶參數、也不是 primary、但同一個模組另有 primary
 * 入口的，回那個 primary 所在頁的名字（「最新消息」）；其他入口回 null。
 * 側欄用它在捷徑旁邊印「→ 最新消息」。
 */
export function aliasTarget(block: AdminBlock): string | null {
  if (block.primary) return null;
  const { path, query } = splitHref(block.href);
  if (query.toString() !== "") return null;
  for (const p of ADMIN_SITE_MAP) {
    const primary = p.blocks.find((b) => b.primary && splitHref(b.href).path === path);
    if (primary) return p.label;
  }
  return null;
}
