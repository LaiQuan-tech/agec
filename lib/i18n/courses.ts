import type { Dict } from "@/lib/i18n";

/**
 * Every hard-coded string on 課程資訊 (/courses).
 *
 * Not in here, on purpose:
 *   - the course table itself and the `.filter-tabs` labels — both come from
 *     the DB already resolved to the right language (lib/data.ts).
 *   - `SectionTitle`'s `eyebrow` and the `.software-line` names, which are
 *     uppercase Latin in the reference design and stay identical in both
 *     languages.
 *
 * Arrows (`↗`, `→`) are part of the string rather than a separate node: React
 * would otherwise emit two text nodes and the browser shapes the run in two
 * pieces, which measurably shifts the glyph — the same trap documented on
 * InteriorHero's route number.
 */

export const COURSES = {
  /**
   * The hero shows both languages at once (title + the other language as its
   * kicker), so this pair is read off the raw `Msg` — `COURSES.title.zh` /
   * `COURSES.title.en` — not off the translated tree. English matches
   * lib/site-routes.ts so the <h1> and the <title> agree.
   */
  title: { zh: "課程資訊", en: "Courses & Curriculum" },
  hero: {
    lead: {
      zh: "以經濟理論為基礎，連結資料分析、政策、產業、環境與國際視野，建立可自由探索的學習路徑。",
      en: "Grounded in economic theory and reaching into data analysis, policy, industry, the environment and international affairs, the curriculum gives every student a path they are free to shape.",
    },
    imageAlt: {
      zh: "農經系課堂與學生討論",
      en: "Students in discussion during an AGEC class",
    },
  },
  nav: {
    label: { zh: "課程資訊", en: "Courses" },
    items: [
      {
        href: "#section-1",
        label: { zh: "各學制課程表", en: "Course listings" },
      },
      { href: "#section-2", label: { zh: "修業規定", en: "Requirements" } },
      { href: "#section-3", label: { zh: "常用表格", en: "Forms" } },
      { href: "#section-4", label: { zh: "學習資源", en: "Resources" } },
    ],
  },
  section1: {
    heading: { zh: "各學制課程表", en: "Course listings by program" },
    description: {
      zh: "依學制與課程類別快速篩選，完整課程內容及實際開課情形以最新公告為準。",
      en: "Filter by program and course type. Full course content and the courses actually offered follow the department's latest announcements.",
    },
  },
  tabs: {
    ariaLabel: { zh: "課程學制篩選", en: "Filter courses by program" },
    /**
     * The "no filter" tab. Its *value* stays the Chinese "全部" in both
     * languages — see the note on `programRank` in components/site/Courses.tsx:
     * tab values are match keys against Chinese data, only the label is
     * translated.
     */
    all: { zh: "全部", en: "All" },
  },
  /** `.course-head` — five cells, matching the five <span>s in every row. */
  table: {
    code: { zh: "課號", en: "Code" },
    name: { zh: "課程名稱", en: "Course title" },
    credit: { zh: "學分", en: "Credits" },
    program: { zh: "學制", en: "Program" },
    ctype: { zh: "類別", en: "Type" },
  },
  section2: {
    heading: { zh: "修業規定", en: "Degree requirements" },
  },
  /** `.document-grid` — 4 cards; a 5th breaks the 2x2 pairing at 1180px. */
  documents: [
    {
      title: {
        zh: "大學部修業規定",
        en: "Undergraduate degree requirements",
      },
      description: {
        zh: "畢業學分、必修課程與跨域修課說明",
        en: "Graduation credits, required courses and cross-disciplinary study",
      },
    },
    {
      title: {
        zh: "碩士班修業規定",
        en: "Master's degree requirements",
      },
      description: {
        zh: "修業年限、學位考試與論文相關規範",
        en: "Time limits, degree examinations and thesis regulations",
      },
    },
    {
      title: {
        zh: "博士班修業規定",
        en: "Doctoral degree requirements",
      },
      description: {
        zh: "資格考核、研究訓練與學位要求",
        en: "Qualifying examinations, research training and degree requirements",
      },
    },
    {
      title: {
        zh: "在職專班修業規定",
        en: "Executive master's degree requirements",
      },
      description: {
        zh: "課程安排、專題研究與畢業要求",
        en: "Course scheduling, independent study and graduation requirements",
      },
    },
  ],
  /** `.document-grid>a>i` — the download affordance on each PDF card. */
  download: { zh: "下載 ↗", en: "Download ↗" },
  section3: {
    heading: { zh: "常用表格", en: "Forms" },
  },
  /**
   * `.resource-row` fallback labels, used only while `links.section='courses'`
   * has no rows. Rows that do come from the DB are already in the right
   * language and must not be translated again here.
   */
  formsFallback: [
    { zh: "選課相關表格", en: "Course registration forms" },
    { zh: "學位考試申請", en: "Degree examination application" },
    { zh: "離校程序表格", en: "Departure clearance forms" },
    { zh: "研究計畫申請", en: "Research project application" },
  ],
  section4: {
    heading: {
      zh: "讓資料成為理解世界的工具",
      en: "Turning data into a way of understanding the world",
    },
  },
} satisfies Dict;
