import type { Msg } from "@/lib/i18n";

/**
 * Copy owned by the home page — `components/site/Home.tsx` and its hero.
 *
 * Four exports rather than one object, because they are consumed differently:
 *
 *  - `HOME_HERO` is read by HomeHero.tsx, which is a client component. Whatever
 *    it imports is shipped to the browser in both languages, so the rest of the
 *    page's copy stays in a separate binding the bundler can drop from that
 *    chunk.
 *  - `HOME` is the server-rendered remainder.
 *  - `HOME_STATS` and `RESEARCH_AREAS` are lists, and the second one is not a
 *    dictionary at all — see its note.
 *
 * On eyebrows: the reference site writes them as "ENGLISH · 中文", so /en keeps
 * the two-part shape and translates the second half into Latin caps, the same
 * treatment `SHARED.nextRouteKicker` gets. The three kickers that carry no
 * Chinese to begin with — "AGRICULTURAL ECONOMICS · NTU", "FROM NTU TO THE
 * WORLD" — are pure typographic devices and stay inline in the components,
 * unchanged on both sites. (A third, the `.hero-index` list, was removed from
 * the hero entirely.)
 *
 * On headings: every `<h2>` here is broken across a hard `<br>` that the design
 * depends on, so each one is stored as two lines rather than one string. The
 * break lands where the English reads best, which is not always where the
 * Chinese breaks.
 */

/** `section.hero#top` — the only strings HomeHero.tsx sends to the client. */
export const HOME_HERO = {
  /**
   * The `<h1>`, across two `<br>`s. Three short lines are the whole point of
   * the composition — the type is clamped against the viewport, so a single
   * long line would re-wrap unpredictably over the video.
   */
  titleLine1: { zh: "以經濟洞見，", en: "Economic insight" },
  titleLine2: { zh: "回應世界的", en: "for the world's" },
  titleLine3: { zh: "農業挑戰。", en: "agricultural challenges." },
  lead: {
    zh: "培育具備經濟分析、農業專業與國際視野的人才，從臺灣出發，連結土地、市場與全球。",
    en: "Educating graduates who combine economic analysis, agricultural expertise and an international outlook — starting in Taiwan, connecting land, markets and the world.",
  },
  explore: { zh: "探索本系", en: "Explore the department" },
  admissions: { zh: "招生資訊", en: "Admissions" },

  /** alt text of slide 2. Slide 1 is a video and is `aria-hidden`. */
  gateAlt: {
    zh: "國立臺灣大學正門與校園景觀",
    en: "The main gate and campus of National Taiwan University",
  },
  // indexLabel / paginationLabel / slide lived here until `.hero-index`, the
  // 01 / 02 buttons and the SCROLL cue were removed from the hero. They were
  // the aria-labels of exactly those three elements and have no other reader,
  // so they are gone rather than left as dead entries.
} satisfies Record<string, Msg>;

/** Everything below the hero. */
export const HOME = {
  /* .intro#about ------------------------------------------------------- */
  introEyebrow: { zh: "WHO WE ARE · 本系簡介", en: "WHO WE ARE · ABOUT AGEC" },
  introHeadingTop: {
    zh: "農業不只關於生產，",
    en: "Agriculture is not only about what we produce,",
  },
  introHeadingBottom: {
    zh: "更關於每一個人的未來。",
    en: "but about everyone's future.",
  },
  introBody: {
    zh: "本系以嚴謹的經濟分析與實證研究，回應糧食安全、氣候變遷、國際貿易與產業轉型。近百年的學術傳承，持續轉化為面向世界的知識與行動。",
    en: "Through rigorous economic analysis and empirical research, the department responds to food security, climate change, international trade and industrial transformation. Nearly a century of scholarly tradition continues to become knowledge and action that engage the wider world.",
  },
  introLink: { zh: "認識我們的使命", en: "Discover our mission" },
  /** aria-label of `.stat-row`, whose figures live in HOME_STATS. */
  statsLabel: { zh: "本系概況", en: "The department at a glance" },

  /* .news-section#news ------------------------------------------------- */
  newsEyebrow: { zh: "LATEST · 最新動態", en: "LATEST · NEWS & EVENTS" },
  newsHeadingTop: { zh: "觀點持續發生，", en: "Ideas keep emerging," },
  newsHeadingBottom: { zh: "知識正在流動。", en: "knowledge keeps moving." },
  /** `.circle-link`: its aria-label, then its own two lines inside the circle. */
  newsAllLabel: { zh: "查看全部消息", en: "View all news" },
  newsAllTop: { zh: "全部", en: "All" },
  newsAllBottom: { zh: "消息 ↗", en: "News ↗" },
  /** alt of `.feature-story img` when the pinned item has no cover of its own. */
  newsFeatureAlt: {
    zh: "農經系大講堂",
    en: "The department's main lecture hall",
  },
  newsFeatureLink: { zh: "掌握近期演講", en: "See recent talks" },

  /* .research#research ------------------------------------------------- */
  researchEyebrow: {
    zh: "RESEARCH · 研究領域",
    en: "RESEARCH · FIELDS OF INQUIRY",
  },
  researchHeadingTop: {
    zh: "從土地到全球市場，",
    en: "From the land to global markets,",
  },
  researchHeadingBottom: {
    zh: "以研究推動更好的選擇。",
    en: "research that informs better choices.",
  },
  researchBody: {
    zh: "我們將經濟理論、計量方法與資料科學帶進真實世界，讓研究成果成為政策、產業與社會的決策依據。",
    en: "We bring economic theory, econometric methods and data science to real-world problems, so that our findings inform decisions in policy, industry and society.",
  },

  /* .admissions#admissions --------------------------------------------- */
  admissionsEyebrow: {
    zh: "STUDY WITH US · 招生資訊",
    en: "STUDY WITH US · ADMISSIONS",
  },
  admissionsHeadingTop: {
    zh: "在這裡，建立改變",
    en: "Here you build the ability",
  },
  admissionsHeadingBottom: {
    zh: "農業與世界的能力。",
    en: "to change agriculture, and the world.",
  },
  admissionsBody: {
    zh: "無論你正展開大學旅程、深化研究，或將實務經驗帶回課堂，都能找到適合自己的學習路徑。",
    en: "Whether you are beginning an undergraduate journey, deepening your research, or bringing professional experience back to the classroom, there is a path of study that fits.",
  },
  /**
   * The three `.admissions-links`. The first two also carry the `#courses` /
   * `#students` anchor ids the menu overlay points at, so they are written out
   * here rather than derived from lib/nav.ts — the arrow is part of the label
   * on the reference site and stays inside the string.
   */
  admissionsCourses: { zh: "課程資訊 ↗", en: "Courses ↗" },
  admissionsStudents: { zh: "學生專區 ↗", en: "Students ↗" },
  admissionsSchedule: { zh: "重要招生時程 ↗", en: "Key admission dates ↗" },

  /* .campus#people ----------------------------------------------------- */
  campusEyebrow: {
    zh: "OUR PLACE · 我們所在之處",
    en: "OUR PLACE · WHERE WE WORK",
  },
  campusHeadingTop: { zh: "扎根臺灣，", en: "Rooted in Taiwan," },
  campusHeadingBottom: { zh: "面向世界。", en: "facing the world." },
  campusBody: {
    zh: "在農業綜合館裡，教學、研究與交流每天發生。從一場課堂討論，到一項跨國研究合作，讓知識走出校園、進入真實世界。",
    en: "Teaching, research and exchange happen every day inside the Agriculture Comprehensive Building. From a single classroom discussion to an international research collaboration, knowledge leaves the campus and enters the world.",
  },
  campusCta: { zh: "認識系所成員", en: "Meet our people" },
  campusMainAlt: {
    zh: "臺大農業綜合館入口",
    en: "The entrance to the Agriculture Comprehensive Building at NTU",
  },
  campusSmallAlt: {
    zh: "農經系辦公室",
    en: "The Department of Agricultural Economics office",
  },

  /* .closing#alumni ---------------------------------------------------- */
  closingImageAlt: {
    zh: "國立臺灣大學農業經濟學系識別標誌與苔蘚植栽牆",
    en: "The Department of Agricultural Economics logo on a moss-planted wall",
  },
  closingHeadingTop: {
    zh: "下一個影響農業未來的答案，",
    en: "The next answer that shapes the future of agriculture",
  },
  closingHeadingBottom: { zh: "從這裡開始。", en: "starts here." },
  closingJoin: { zh: "加入臺大農經", en: "Join NTU AGEC" },
  closingAlumni: { zh: "系友專區", en: "Alumni" },
} satisfies Record<string, Msg>;

/**
 * `.stat-row`. Reads like data, but it's editorial copy — and site.css pins the
 * divider borders with `:last-child` / `:nth-child`, so a fifth entry would
 * break the grid at 860px.
 *
 * `value` is language-neutral and stays beside its label so the pair can't
 * drift; `translate()` passes plain strings through untouched.
 */
export const HOME_STATS = [
  { value: "1928", label: { zh: "學術源流", en: "Scholarly origins" } },
  { value: "4", label: { zh: "核心研究領域", en: "Core research areas" } },
  { value: "4", label: { zh: "完整學制", en: "Degree programs" } },
  {
    value: "∞",
    label: { zh: "跨域與國際連結", en: "Cross-domain and global links" },
  },
] satisfies { value: string; label: Msg }[];

/**
 * The four research areas. Deliberately hard-coded: these same four Chinese
 * strings are also the value domain of `faculty.fields`, so keeping one copy in
 * code beats two copies that can drift.
 *
 * ⚠️ Shaped like `Msg` but it is NOT a dictionary entry — never pass it through
 * `translate()`, which would collapse each pair to one string. Both languages
 * are on screen at once: `.research-item h3` takes the page's language and
 * `.research-item p` takes the other, the same swap `InteriorHero` does with
 * its title, so the row keeps its two-line rhythm on /en instead of printing
 * an English caption under an English heading.
 */
export const RESEARCH_AREAS = [
  { zh: "政策、制度與發展", en: "Policy, Institutions & Development" },
  { zh: "運銷、貿易與消費", en: "Marketing, Trade & Consumption" },
  { zh: "生產、管理與行為", en: "Production, Management & Behavior" },
  { zh: "土地、資源與環境", en: "Land, Resources & Environment" },
] satisfies Msg[];
