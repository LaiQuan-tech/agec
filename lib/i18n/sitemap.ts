import type { Dict, Msg } from "@/lib/i18n";

/**
 * 網站導覽 (/sitemap, /en/sitemap) 的頁面文案。
 *
 * ⚠️ 這個檔只放「這一頁自己的字」。導覽樹上每一條連結的標籤都不在這裡 ——
 * 它們從 lib/nav.ts 與各頁的 `nav.items` 推導（見 lib/sitemap-tree.ts）。
 * 在這裡再抄一份，就是讓某一頁把區塊改名之後，網站導覽仍然理直氣壯地
 * 印著舊名字 —— 而網站導覽正是最不能說謊的那一頁。
 *
 * 唯二的例外是下面的 `home` 與 `more`：
 *   - 首頁的六個區塊有 id（#about…#alumni）卻沒有 `.local-nav`，所以沒有
 *     現成的標籤可以借；而且它們的標題是兩行式的大字（HOME.introHeadingTop /
 *     Bottom），拿來當目錄項會變成一整句話。
 *   - 全站搜尋與這一頁本身不是 lib/nav.ts 的八條路線，沒有任何清單收容它們。
 */
export const SITEMAP = {
  title: { zh: "網站導覽", en: "Sitemap" },

  lead: {
    zh: "本頁列出系網的所有區塊與細項。標題連到該頁，底下每一條連到頁面中對應的段落。",
    en: "Every section of this site and what sits inside it. Each heading links to the page; each item below it links to that part of the page.",
  },

  /**
   * 首頁六個區塊的目錄標籤。
   *
   * href 是首頁上真的存在的 id（components/site/Home.tsx）。
   * ⚠️ 標籤刻意不等於路線名稱：#about 這一區叫「認識本系」而不是「本系簡介」，
   * 否則同一頁上會有兩個「本系簡介」指向兩個不同的地方（首頁的區塊，與
   * 03 本系簡介那一整頁），而讀者無從分辨。
   */
  home: {
    items: [
      { href: "#about", label: { zh: "認識本系", en: "Who we are" } },
      { href: "#news", label: { zh: "最新動態", en: "Latest news" } },
      { href: "#research", label: { zh: "研究領域", en: "Research areas" } },
      {
        href: "#admissions",
        label: { zh: "招生與課程入口", en: "Admissions & courses" },
      },
      { href: "#people", label: { zh: "校園與系所成員", en: "Campus & people" } },
      { href: "#alumni", label: { zh: "加入農經", en: "Join AGEC" } },
    ],
  },

  /** /news 底下「全部消息」那一條 —— 分類頁的標籤來自 NEWS_CATEGORY_PAGES。 */
  newsAll: { zh: "全部消息", en: "All news" },

  /**
   * 最後一組：不屬於八條路線、但確實是站上的頁面。
   *
   * 沒有編號是刻意的。八條路線的編號（01–08）印在每一個內頁的 hero 上，寫成
   * 「NN / 08」；在這裡多編一個 09 出來，等於在全站唯一一頁宣稱有九條路線。
   */
  more: {
    label: { zh: "其他", en: "More" },
    search: { zh: "全站搜尋", en: "Search" },
  },
} satisfies Dict;

/** 導覽樹上一條連結的原始（未翻譯）形狀。 */
export type SitemapSource = { href: string; label: Msg };
