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
      {
        href: "#section-3",
        label: { zh: "臺大課程資源", en: "NTU course resources" },
      },
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
    /**
     * `.course-empty` —— 選到的學制一門課都沒有時取代整張表。
     *
     * 這不是防禦性的補丁：`courses` 目前只有 6 列，碩士在職專班一列都沒有，
     * 所以這句話是預設就會被看見的。措辭刻意說「尚未列出」而不是「沒有課程」
     * —— 系上當然有課，是這張表還沒補齊。
     */
    empty: {
      zh: "這個學制的課程尚未列出。",
      en: "Courses for this program have not been listed yet.",
    },
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
  /** `.document-grid` — four department documents plus two official NTU resources. */
  documents: [
    {
      type: { zh: "PDF", en: "PDF" },
      url: "",
      action: { zh: "下載", en: "Download" },
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
      type: { zh: "PDF", en: "PDF" },
      url: "",
      action: { zh: "下載", en: "Download" },
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
      type: { zh: "PDF", en: "PDF" },
      url: "",
      action: { zh: "下載", en: "Download" },
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
      type: { zh: "PDF", en: "PDF" },
      url: "",
      action: { zh: "下載", en: "Download" },
      title: {
        zh: "在職專班修業規定",
        en: "Executive master's degree requirements",
      },
      description: {
        zh: "課程安排、專題研究與畢業要求",
        en: "Course scheduling, independent study and graduation requirements",
      },
    },
    {
      type: { zh: "臺大教務處", en: "NTU Academic Affairs" },
      url: "https://gra108.aca.ntu.edu.tw/graVoxCourse/index.php",
      action: { zh: "前往查詢", en: "Open website" },
      title: {
        zh: "必修科目及應修學分查詢",
        en: "Required courses and credits",
      },
      description: {
        zh: "依入學年度與學制查詢系所必修科目、應修學分及相關規定",
        en: "Look up required courses, credits and related rules by entry year and degree level.",
      },
    },
    {
      type: { zh: "臺大共同教育中心", en: "NTU Center for General Education" },
      url: "https://cge.ntu.edu.tw/cp_n_199444.html",
      action: { zh: "查看規定", en: "View requirements" },
      title: {
        zh: "通識課程修習與指定領域",
        en: "General education requirements and designated areas",
      },
      description: {
        zh: "查看通識學分、各院系指定領域、充抵與學分採計規定",
        en: "Review general education credits, designated areas, substitutions and credit-recognition rules.",
      },
    },
  ],
  section3: {
    heading: { zh: "臺大課程資源", en: "NTU course resources" },
    description: {
      zh: "從選課公告、課程查詢到課程地圖，集中連結臺大教務處提供的官方系統。必修科目與應修學分可於上方「修業規定」查詢。",
      en: "Official NTU systems for course-selection notices, course searches and curriculum maps. Required courses and credits are available in Degree requirements above.",
    },
    links: [
      {
        label: { zh: "教務處選課專區", en: "Academic Affairs course-selection portal" },
        url: "https://www.aca.ntu.edu.tw/w/aca/UAADForms_21102811111810357",
      },
      {
        label: { zh: "臺大課程網 1", en: "NTU Online course search 1" },
        url: "https://nol.ntu.edu.tw/nol/guest/index.php",
      },
      {
        label: { zh: "臺大課程網 2", en: "NTU Online course search 2" },
        url: "https://nol2.aca.ntu.edu.tw/nol/guest/index.php",
      },
      {
        label: { zh: "新版臺大課程網", en: "New NTU course search" },
        url: "https://course.ntu.edu.tw/search/quick",
      },
      {
        label: { zh: "臺大課程地圖", en: "NTU curriculum map" },
        url: "https://coursemap.aca.ntu.edu.tw/course_map_all/index.php",
      },
    ],

    /**
     * 系上表單那一區的小標（components/site/SiteDocuments.tsx）。
     *
     * ⚠️ 它不在 §3。§3 現在整段是**臺大官方系統**的入口，把系上自己的檔案
     * 混進去會讓那個標題名實不符。系上表單改掛在 §2「修業規定」底下 ——
     * 那一區本來就是系上自己的文件（四份修業規定 PDF），DB 上傳的檔案接在
     * 後面是同一類東西。字串留在 section3 底下純粹是歷史，搬走會讓這次的
     * 合併多一個不必要的衝突面；下次動這個檔時再搬。
     *
     * ⚠️ 資料表是空的時候整區（連同這兩行小標）都不會印出來。
     */
    forms: {
      heading: { zh: "系上表單", en: "Departmental forms" },
      description: {
        zh: "由系辦維護，點卡片即可下載。",
        en: "Maintained by the department office — select a card to download.",
      },
    },
  },
} satisfies Dict;
