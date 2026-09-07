import { navItems, navHref } from "@/lib/nav";
import { padNo } from "./nav";
import { localizePath, type Lang, type Msg } from "@/lib/i18n";
import { NEWS_CATEGORIES } from "@/lib/news-categories";
import { NEWS, NEWS_CATEGORY_PAGES } from "@/lib/i18n/news";
import { SITEMAP } from "@/lib/i18n/sitemap";
import { ABOUT } from "@/lib/i18n/about";
import { FACULTY } from "@/lib/i18n/faculty";
import { ADMISSIONS } from "@/lib/i18n/admissions";
import { COURSES } from "@/lib/i18n/courses";
import { STUDENTS } from "@/lib/i18n/students";
import { ALUMNI } from "@/lib/i18n/alumni";

/**
 * The tree 網站導覽 (/sitemap) prints — every public section of the site and
 * what sits inside it.
 *
 * 🔴 **Nothing here is a list of labels.** Every string is read out of the
 * dictionary the page itself renders from: the eight route names come from
 * lib/nav.ts (the same list the header, the menu overlay and the footer read),
 * and each route's sub-items come from that page's own `nav.items` — the very
 * array its sticky `.local-nav` is built from. Rename a section on /alumni and
 * this page renames it too, in both languages, without anyone remembering to.
 *
 * That is the whole point of the file. A sitemap maintained by hand is a
 * sitemap that is wrong: it is the one page nobody re-reads after a rename,
 * and the one page a reader trusts to be complete.
 *
 * The two lists that are *not* derived are the home page's blocks and the
 * trailing 其他 group — lib/i18n/sitemap.ts explains why each has nowhere
 * else to come from.
 *
 * ## 為什麼住在 components/site/ 而不是 lib/
 *
 * 它要用 `padNo`（就在隔壁的 nav.ts），而那支檔案是 lib/nav.ts 的「給站台
 * 元件用的推導層」—— 這一份是同一類東西。反過來從 lib/ 去 import
 * components/ 會把相依方向倒過來。
 */

/** One link in the tree, already resolved to a language. */
export type SitemapLink = {
  /** Ready to render: `/en` already applied, fragment already appended. */
  href: string;
  label: string;
  /** "01-3" — the NTU sitemap's numbering, and this site's own "NN / 08".
   *  null in the unnumbered 其他 group. */
  no: string | null;
};

export type SitemapGroup = {
  /** "01".."08", or null for the unnumbered 其他 group. */
  no: string | null;
  /** The group heading's own page — null when the heading names no page. */
  href: string | null;
  label: string;
  children: SitemapLink[];
};

/**
 * Per-route sub-items, keyed by the language-neutral path in lib/nav.ts.
 *
 * `/` and `/news` are absent on purpose and handled below: the home page's
 * blocks have ids but no `.local-nav` to borrow labels from, and /news's
 * children are four other *routes* (the category pages) rather than anchors
 * into one.
 */
const SECTION_ITEMS: Record<string, readonly { href: string; label: Msg }[]> = {
  "/about": ABOUT.nav.items,
  "/faculty": FACULTY.nav.items,
  "/admissions": ADMISSIONS.nav.items,
  "/courses": COURSES.nav.items,
  "/students": STUDENTS.nav.items,
  "/alumni": ALUMNI.nav.items,
};

/**
 * /news 的子項是四個分類頁加上演講封存 —— 都是各自獨立的網址。
 *
 * 用 `#section-N` 錨點會比較「一致」，但那是把讀者送到一頁裡的兩個區塊；
 * 分類頁才是他要找的東西（見 lib/news-categories.ts 的說明）。順序跟著
 * NEWS_CATEGORIES 走，與 /news 上那排籤同一份。
 */
function newsChildren(lang: Lang): { href: string; label: Msg }[] {
  const categories = NEWS_CATEGORIES.map((category) => {
    const page =
      NEWS_CATEGORY_PAGES[category.slug as keyof typeof NEWS_CATEGORY_PAGES];
    return {
      href: localizePath(`/news/category/${category.slug}`, lang),
      label: page.title,
    };
  });

  return [
    { href: localizePath("/news", lang), label: SITEMAP.newsAll },
    ...categories,
    // 演講公告 has no category page — it is excluded from /news's list and
    // has its own archive. lib/news-categories.ts explains the split.
    { href: localizePath("/news/talks", lang), label: NEWS.talksArchiveTitle },
  ];
}

/** The whole tree for one language. */
export function sitemapTree(lang: Lang): SitemapGroup[] {
  const groups: SitemapGroup[] = navItems(lang).map((route, i) => {
    // Numbered by position, exactly like the menu overlay's 01–08 cards and
    // the "NN / 08" every interior hero prints. Home is 01 there too.
    const no = padNo(i + 1);
    const base = navHref(route.href, lang);

    const sources: readonly { href: string; label: Msg }[] =
      route.href === "/"
        ? SITEMAP.home.items
        : route.href === "/news"
          ? newsChildren(lang)
          : (SECTION_ITEMS[route.href] ?? []);

    return {
      no,
      href: base,
      label: route.label,
      children: sources.map((item, j) => ({
        // A fragment hangs off the route; an absolute path (the news
        // children) is already a whole URL and must not be prefixed again.
        href: item.href.startsWith("#") ? `${base}${item.href}` : item.href,
        label: item.label[lang],
        no: `${no}-${j + 1}`,
      })),
    };
  });

  // 其他：站上真實存在、但不在 lib/nav.ts 八條路線裡的頁面。
  // `href: null` —— 「其他」本身不是一頁，標題就不該是連結；八條路線的標題
  // 都是連結，這裡給一個假的目的地只會讓那個約定變得不可信。
  groups.push({
    no: null,
    href: null,
    label: SITEMAP.more.label[lang],
    children: [
      {
        href: localizePath("/search", lang),
        label: SITEMAP.more.search[lang],
        no: null,
      },
      // 這一頁自己。列出來不是為了讓人點，而是因為一份漏掉自己的目錄，
      // 讀者沒辦法判斷它到底漏了什麼。渲染時會標成 aria-current="page"。
      {
        href: localizePath("/sitemap", lang),
        label: SITEMAP.title[lang],
        no: null,
      },
    ],
  });

  return groups;
}
