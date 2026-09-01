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

  /** Shown in place of the list when a category has nothing in it. */
  categoryEmpty: {
    zh: "這個分類目前沒有消息。",
    en: "There is nothing in this category yet.",
  },
  /** Back to the unfiltered list, at the foot of a category page. */
  categoryBackToAll: { zh: "← 返回全部消息", en: "← Back to all news" },

  /** aria-label of the `.filter-tabs` row; the tabs are NEWS_FILTER_TABS. */
  filterLabel: { zh: "消息分類", en: "News categories" },

  /* --- 年份導覽 ------------------------------------------------------------
   * 585 則消息橫跨十一個年份，分類籤把它切成四份仍然是 17 到 20 頁一份。
   * 年份是第二個維度，與分類可以疊加（/news/category/admissions/year/2024）。
   */
  yearLabel: { zh: "年份", en: "Year" },
  /** 年份列的 aria-label。與分類籤分開命名，讀屏才分得出兩排是不同的東西。 */
  yearNavLabel: { zh: "依年份瀏覽消息", en: "Browse news by year" },
  /** 年份列的第一項：取消年份篩選。 */
  yearAll: { zh: "全部年份", en: "All years" },
  /** 單一年份連結的 aria-label；{year} 與 {count} 會被代換。 */
  yearHint: { zh: "{year} 年，共 {count} 則", en: "{year}, {count} items" },
  /** 該年份沒有消息時的說明（理論上不會出現——年份列只列出有資料的年份）。 */
  yearEmpty: {
    zh: "這一年沒有消息。",
    en: "There is no news from this year.",
  },
  /** 篩到某一年時，標題下方那句補充。{year} 會被代換。 */
  yearLead: {
    zh: "{year} 年的消息。",
    en: "News published in {year}.",
  },

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
  // #section-3…#section-5 (活動花絮 / 招生 / 徵才) used to sit here, inherited
  // from the reference site, which named three blocks it never built. LocalNav
  // dropped them at runtime because their targets do not exist, so they were
  // harmless — but they were also the three things the reader most plausibly
  // wanted, and the filter tabs now genuinely provide them. Keeping dead
  // anchors beside working links for the same three ideas would be the
  // confusing half of both.
] satisfies { href: string; label: Msg }[];

/**
 * The `.filter-tabs` labels on /news.
 *
 * ⚠️ `value` is a **query key**, not an identity string: it is matched against
 * `news.category` character for character, and `lib/news-categories.ts` maps
 * each one to a URL slug. Change one here without changing it there and the tab
 * links to a page that renders nothing.
 *
 * This note used to say the opposite — that the values deliberately did not
 * line up with the data ("the data says 招生資訊 where the tab says 招生"),
 * because the reference site's tabs never filtered anything and the mismatch
 * was therefore invisible. That was true of the port and is not true now: the
 * tabs navigate, and every value below matches a category the table actually
 * holds. The 榮譽 / 系友榮耀 categories that note mentioned no longer exist
 * either; the migrated data has exactly these four plus 演講公告.
 *
 * 演講公告 has no tab on purpose. Those rows are excluded from the list below
 * and live in `#section-2` and at /news/talks, whose rows carry a speaker, a
 * time and a venue that an announcement row has no room for.
 */
/**
 * Per-category page copy, keyed by the slug in lib/news-categories.ts.
 *
 * The heading is deliberately not the tab's own label. Every row a few
 * centimetres below already prints the category name in its second column, so
 * repeating it as the page heading says nothing — `Talks.tsx` faced the same
 * choice and went with 「歷年演講與研討會」 rather than 「演講公告」.
 *
 * `lead` is the hero standfirst; `description` sits under the section heading.
 */
export const NEWS_CATEGORY_PAGES = {
  announcements: {
    title: { zh: "最新公告", en: "Announcements" },
    lead: {
      zh: "系上與校方的公告、獎助學金、法規修訂與行政事項。",
      en: "Departmental and university notices, scholarships, regulatory changes and administrative matters.",
    },
    heading: { zh: "系上公告", en: "Departmental announcements" },
    description: {
      zh: "需要申請、需要留意期限的事情，都會出現在這一區。",
      en: "Anything with a form to file or a deadline to watch appears here.",
    },
  },
  highlights: {
    title: { zh: "活動剪影", en: "Event highlights" },
    lead: {
      zh: "系上活動、研討會與交流場合的紀錄。",
      en: "A record of departmental events, symposia and exchanges.",
    },
    heading: { zh: "活動紀錄", en: "Event coverage" },
    description: {
      zh: "從畢業典禮到國際交流研討會，現場留下來的影像與紀事。",
      en: "From the graduation ceremony to international symposia — what was photographed and written down on the day.",
    },
  },
  admissions: {
    title: { zh: "招生資訊", en: "Admissions" },
    lead: {
      zh: "大學部、碩士班、博士班、碩士在職專班與國際專班的招生公告。",
      en: "Admission notices for the undergraduate, master's, doctoral, executive master's and international programmes.",
    },
    heading: { zh: "招生資訊", en: "Admissions notices" },
    description: {
      zh: "簡章、書面資料格式、口試時間與錄取名單，依公告日期排列。",
      en: "Prospectuses, document formats, interview schedules and admission lists, newest first.",
    },
  },
  careers: {
    title: { zh: "求職徵才", en: "Careers" },
    lead: {
      zh: "系上與合作單位的職缺、研究助理與實習機會。",
      en: "Vacancies, research assistantships and internships at the department and its partners.",
    },
    heading: { zh: "職缺與徵才", en: "Openings and recruitment" },
    description: {
      zh: "專任、兼任、計畫助理與實習，來自系上、研究團隊與產學夥伴。",
      en: "Full-time, part-time, project and internship openings from the department, its research teams and its industry partners.",
    },
  },
} satisfies Record<string, Record<string, Msg>>;

export const NEWS_FILTER_TABS = [
  { value: "全部", label: { zh: "全部", en: "All" } },
  { value: "最新公告", label: { zh: "最新公告", en: "Announcements" } },
  { value: "活動剪影", label: { zh: "活動剪影", en: "Event highlights" } },
  { value: "招生", label: { zh: "招生", en: "Admissions" } },
  { value: "求職徵才", label: { zh: "求職徵才", en: "Careers" } },
] satisfies { value: string; label: Msg }[];
