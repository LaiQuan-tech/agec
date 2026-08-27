import type { Dict, Msg } from "@/lib/i18n";

/**
 * Copy owned by 專欄文章 (/blog, /en/blog) — components/site/Blog.tsx and
 * BlogPost.tsx.
 *
 * `SectionTitle` eyebrows are not here: they are Latin-caps typography rather
 * than content and read the same on both sites, so they stay inline in the
 * components (same rule as every other page's dictionary).
 */

/**
 * The page title, in both languages at once.
 *
 * ⚠️ Not a dictionary entry — never pass it through `translate()`.
 * `InteriorHero` needs the pair intact: it prints one language as the `<h1>`
 * and the other as the kicker above it, whichever way round the page is.
 */
export const BLOG_TITLE = {
  zh: "專欄文章",
  en: "Features & Essays",
} satisfies Msg;

export const BLOG = {
  /** `.interior-lead`, the standfirst under the hero title row. */
  lead: {
    zh: "系上師生的專題文章、研究隨筆與觀點分享，較長的篇幅、較慢的節奏。",
    en: "Longer-form writing from the department: research notes, essays and perspectives that need more room than an announcement.",
  },
  /**
   * alt of the hero photo. The image is shared with /news (see Blog.tsx), so
   * the wording describes what is actually in the frame rather than the page.
   */
  heroAlt: {
    zh: "臺大農經系辦公空間",
    en: "Office space in the NTU Department of Agricultural Economics",
  },
  localNavLabel: { zh: "專欄文章", en: "Features" },

  nav: {
    latest: { zh: "最新文章", en: "Latest" },
    news: { zh: "回到最新消息", en: "Back to news" },
  },

  listHeading: { zh: "近期文章", en: "Recent writing" },
  listDescription: {
    zh: "依發布日期排序，點入可閱讀全文。",
    en: "In order of publication. Open one to read it in full.",
  },

  /** Shown in place of the list when nothing has been published yet. */
  empty: {
    zh: "目前尚無文章。",
    en: "Nothing published yet.",
  },

  /** The feature card's read-more link. The arrow is part of the label. */
  readMore: { zh: "閱讀全文 →", en: "Read in full →" },

  /** Byline prefix on a single post. `{name}` is the author. */
  byline: { zh: "文／{name}", en: "By {name}" },

  /** Back link at the foot of a single post. */
  backToList: { zh: "← 返回專欄文章", en: "← Back to all posts" },

  /** Breadcrumb trail on a single post, between 首頁 and the post title. */
  breadcrumbList: { zh: "專欄文章", en: "Features" },
} satisfies Dict;
