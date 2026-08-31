import type { Msg } from "@/lib/i18n";

/**
 * Copy owned by 最新消息 (/news, /en/news) — `components/site/News.tsx`.
 *
 * The page's `SectionTitle` eyebrow ("LATEST UPDATES") is not here: eyebrows
 * are Latin-caps typography rather than content and read the same on both
 * sites, so they stay inline in the component.
 */

/**
 * The page title, in both languages at once.
 *
 * ⚠️ Not a dictionary entry — never pass it through `translate()`.
 * `InteriorHero` needs the pair intact: it prints one language as the `<h1>`
 * and the other as the kicker above it, whichever way round the page is.
 */
export const NEWS_TITLE = {
  zh: "最新消息",
  en: "News & Announcements",
} satisfies Msg;

export const NEWS = {
  /** `.interior-lead`, the standfirst under the hero title row. */
  lead: {
    zh: "掌握本系公告、國際學術交流、活動紀錄與職涯機會，見證農經知識如何持續流動。",
    en: "Follow departmental announcements, international academic exchange, event coverage and career opportunities, and see how knowledge in agricultural economics keeps moving.",
  },
  heroAlt: {
    zh: "臺大農經系辦公空間",
    en: "Office space in the NTU Department of Agricultural Economics",
  },
  /**
   * `.local-nav-label`. Deliberately shorter than the hero's English title:
   * the bar is a compact sticky strip, and this matches the label the route
   * carries in the site-wide navigation (lib/nav.ts).
   */
  localNavLabel: { zh: "最新消息", en: "News" },

  /**
   * `SectionTitle` heading. Not "Latest updates" — that is verbatim the
   * eyebrow printed immediately to its left, and the reference layout puts the
   * two within a few centimetres of each other.
   */
  sectionHeading: { zh: "最新動態", en: "Recent developments" },
  sectionDescription: {
    zh: "以清楚分類與時間排序，讓每一則重要資訊都能快速抵達需要的人。",
    en: "Clear categories and a strict chronological order, so every announcement reaches the people who need it.",
  },

  /** aria-label of the `.filter-tabs` toolbar; the tabs are NEWS_FILTER_TABS. */
  filterLabel: { zh: "消息分類", en: "News categories" },

  /** alt of `.inner-news-feature>img` when the first row has no cover of its own. */
  featureAlt: {
    zh: "農業綜合館中庭",
    en: "The courtyard of the Agriculture Comprehensive Building",
  },
  /** The feature card's read-more link. The arrow is part of the label. */
  featureLink: { zh: "閱讀完整消息 →", en: "Read the full story →" },

  /**
   * `#section-2`, the talks-only block. Its heading is deliberately not the
   * category label 「演講公告」 printed on each row a few centimetres below —
   * the same rule `sectionHeading` follows for `LATEST UPDATES`.
   */
  talksHeading: { zh: "演講與研討會", en: "Talks and seminars" },
  talksDescription: {
    zh: "系上與跨校的演講、研討會與學術交流場次，獨立成區以便快速查找。",
    en: "Departmental and inter-university talks, seminars and academic exchange, listed on their own so they are easy to find.",
  },

  /**
   * The 「查看全部演講」 link under the talks block, and the archive page it
   * opens.
   *
   * `{n}` is the total number of talks. It is in the label deliberately: the
   * block shows ten of two hundred and fifty-six, and without the count the
   * link reads as "there might be a few more" rather than "there are nine years
   * of these".
   */
  talksAll: { zh: "查看全部 {n} 場演講", en: "See all {n} talks" },
  talksArchiveTitle: { zh: "演講公告", en: "Talks and seminars" },
  talksArchiveLead: {
    zh: "本系歷年演講、研討會與學術交流場次，依公告日期排列。",
    en: "Every talk, seminar and academic exchange the department has announced, newest first.",
  },
  talksArchiveHeading: { zh: "歷年演講與研討會", en: "Talks and seminars, year by year" },
  /** Back link at the foot of the archive. */
  talksBackToNews: { zh: "← 返回最新消息", en: "← Back to news" },

  /** Link out to /blog, which has no place in the site-wide navigation. */
  toBlog: { zh: "閱讀專欄文章", en: "Read our features" },

  /** `.pagination`: its aria-label, then the two non-numeric labels. */
  paginationLabel: { zh: "消息分頁", en: "News pagination" },
  paginationNext: { zh: "下一頁 →", en: "Next →" },
  paginationPrev: { zh: "← 上一頁", en: "← Previous" },
  /** aria-label of one page number. `{n}` is the page. */
  paginationPage: { zh: "第 {n} 頁", en: "Page {n}" },

  /* --- 單則消息 /news/[id] --- */

  /** Breadcrumb segment between 首頁 and the item's own title. */
  breadcrumbList: { zh: "最新消息", en: "News" },
  /** Back link at the foot of a single item. */
  backToList: { zh: "← 返回最新消息", en: "← Back to all news" },
  /**
   * Shown in place of the body when an item is a one-line announcement with
   * nothing more to read. Not an error — most announcements are exactly that.
   */
  noBody: {
    zh: "這則公告沒有進一步的內容。",
    en: "There is nothing further to this announcement.",
  },

  /* --- 演講場次與附件 --- */

  /**
   * Labels for the talk details block on 演講公告.
   *
   * A definition list rather than a sentence, because the three are looked up
   * rather than read: someone deciding whether to attend wants the time, and
   * wants it without reading a paragraph.
   */
  eventSpeaker: { zh: "講者", en: "Speaker" },
  eventTime: { zh: "時間", en: "Time" },
  eventVenue: { zh: "地點", en: "Venue" },
  /** aria-label of the block, which has no visible heading of its own. */
  eventLabel: { zh: "演講場次資訊", en: "Talk details" },

  /** Heading above the download list at the foot of an item. */
  attachmentsHeading: { zh: "附件下載", en: "Attachments" },
  /**
   * Appended to each download link for screen readers. `{name}` is the
   * filename and `{size}` the human-readable size — both already on screen,
   * but a link announced as just the filename gives no warning that following
   * it starts a download.
   */
  attachmentHint: { zh: "下載 {name}，{size}", en: "Download {name}, {size}" },
} satisfies Record<string, Msg>;

/**
 * `nav.local-nav` anchors, verbatim from the reference.
 *
 * #section-2 (演講 / Talks) now has a real target: the talks were pulled out
 * into their own block at the client's request, and it took the id the anchor
 * was already pointing at.
 *
 * #section-3 … #section-5 still have none — the page renders no 活動花絮 /
 * 招生 / 徵才 blocks. That is the reference site's own behaviour; don't "fix"
 * it by inventing sections.
 *
 * They are safe to leave in this list: LocalNav checks each href against the
 * DOM and drops the ones with no target, so a reader never sees an item that
 * cannot be reached or highlighted. Build those sections one day and the
 * matching entries come back on their own.
 */
export const NEWS_LOCAL_NAV = [
  { href: "#section-1", label: { zh: "全部消息", en: "All news" } },
  { href: "#section-2", label: { zh: "演講", en: "Talks" } },
  { href: "#section-3", label: { zh: "活動花絮", en: "Event highlights" } },
  { href: "#section-4", label: { zh: "招生", en: "Admissions" } },
  { href: "#section-5", label: { zh: "徵才", en: "Careers" } },
] satisfies { href: string; label: Msg }[];

/**
 * The `.filter-tabs` labels, copied from the reference markup rather than
 * derived from the data.
 *
 * The reference ships six. 演講公告 is dropped here because those rows moved to
 * their own `#section-2`: a tab for a category the list below it no longer
 * contains would be the one place the tabs' cosmetic-only nature actually
 * misleads someone.
 *
 * They deliberately do NOT line up with `news.category`: the data also has
 * 榮譽/系友榮耀, which has no tab, and the data says 招生資訊 where the tab says
 * 招生. On the reference site the tabs never filter anything (site.js only moves
 * the `active` class), so the mismatch is invisible there — and deriving the
 * list from the rows instead would make this port render a different tab strip
 * from the original. PORT-REPORT §2.4 flags this as a decision to record: we
 * keep the reference's six.
 *
 * `value` is only an identity for the active-tab state, since nothing here
 * filters. It holds the Chinese label so the key stays stable across languages
 * — and so it would already be the right shape if these tabs ever did start
 * matching `news.category`, which is Chinese in the database.
 */
export const NEWS_FILTER_TABS = [
  { value: "全部", label: { zh: "全部", en: "All" } },
  { value: "最新公告", label: { zh: "最新公告", en: "Announcements" } },
  { value: "活動剪影", label: { zh: "活動剪影", en: "Event highlights" } },
  { value: "招生", label: { zh: "招生", en: "Admissions" } },
  { value: "求職徵才", label: { zh: "求職徵才", en: "Careers" } },
] satisfies { value: string; label: Msg }[];
