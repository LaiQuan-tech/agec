import type { Dict } from "@/lib/i18n";

/**
 * Every hard-coded string on 招生資訊 (/admissions).
 *
 * The `.program-grid` cards are half DB (`getPrograms`) and half copy that no
 * column exists for — see `programs` below. `SectionTitle`'s `eyebrow` stays
 * uppercase Latin in both languages, so it is not in here.
 *
 * Arrows (`↗`, `→`) are part of the string rather than a separate node: React
 * would otherwise emit two text nodes and the browser shapes the run in two
 * pieces, which measurably shifts the glyph — the same trap documented on
 * InteriorHero's route number.
 */

export const ADMISSIONS = {
  /**
   * The hero shows both languages at once (title + the other language as its
   * kicker), so this pair is read off the raw `Msg` — `ADMISSIONS.title.zh` /
   * `ADMISSIONS.title.en` — not off the translated tree. English matches
   * lib/site-routes.ts so the <h1> and the <title> agree.
   */
  title: { zh: "招生資訊", en: "Admissions" },
  hero: {
    lead: {
      zh: "為不同學習階段建立清楚入口，從大學部到博士班，找到最適合自己的農經學習路徑。",
      en: "A clear entry point for every stage of study — from the undergraduate program to the doctorate, find the agricultural economics path that fits you.",
    },
    imageAlt: {
      zh: "國立臺灣大學校園",
      en: "The National Taiwan University campus",
    },
  },
  nav: {
    label: { zh: "招生資訊", en: "Admissions" },
    items: [
      { href: "#section-1", label: { zh: "四學制入口", en: "Four programs" } },
      { href: "#section-2", label: { zh: "重要時程", en: "Key dates" } },
      {
        href: "#section-3",
        label: { zh: "核心能力", en: "Core competencies" },
      },
      { href: "#section-4", label: { zh: "常見問題", en: "FAQ" } },
    ],
  },
  section1: {
    heading: { zh: "選擇你的學習路徑", en: "Choose your path of study" },
    description: {
      zh: "四個學制共用同一套清楚架構，招生方式、課程特色、研究資源與職涯發展一目了然。",
      en: "All four programs share one clear structure, so admission routes, curriculum focus, research resources and career paths are easy to compare.",
    },
    /** `.program-grid article>a` — placeholder link, as on the reference site. */
    cta: { zh: "查看招生資訊 →", en: "View admission details →" },
  },
  /**
   * Per-program copy the `programs` table cannot supply, matched on the
   * *Chinese* program name (`Program.name_zh`) — never on `Program.name`,
   * which is the translated display name and matches nothing on /en.
   *
   * These need the two columns PORT-REPORT §2.4 asks for (`tagline`,
   * `admission_methods`); until those exist they live here. The card's Latin
   * kicker is *not* here: that is `programs.name_en`, a real column the office
   * already maintains, which `Program` exposes directly.
   */
  programs: [
    {
      match: "大學部",
      tagline: {
        zh: "探索農業、經濟與永續發展的無限可能",
        en: "Explore the possibilities of agriculture, economics and sustainable development",
      },
      methods: {
        zh: "繁星推薦 · 申請入學 · 分發入學",
        en: "Stars Program · Individual Application · Examination Placement",
      },
    },
    {
      match: "碩士班",
      tagline: {
        zh: "深化專業知識，培養研究與分析能力",
        en: "Deepen your expertise and build research and analytical capability",
      },
      methods: {
        zh: "甄試入學 · 一般招生考試",
        en: "Recommendation and Screening · General Entrance Examination",
      },
    },
    {
      match: "博士班",
      tagline: {
        zh: "培育具國際視野的農業經濟研究人才",
        en: "Training agricultural economics researchers with an international outlook",
      },
      methods: {
        zh: "一般招生 · 逕行修讀博士學位",
        en: "General Admission · Direct Doctoral Study",
      },
    },
    {
      match: "碩士在職專班",
      tagline: {
        zh: "結合理論與實務，培育農業與產業領導人才",
        en: "Bringing theory and practice together to develop leaders in agriculture and industry",
      },
      methods: {
        zh: "招生考試 · 彈性學習",
        en: "Entrance Examination · Flexible Study",
      },
    },
  ],
  section2: {
    heading: { zh: "重要時程", en: "Key dates" },
    note: {
      zh: "實際日期及規定以當學年度最新招生簡章與本系公告為準。",
      en: "Actual dates and regulations follow the current academic year's admission guidelines and the department's announcements.",
    },
  },
  /**
   * `.schedule-line` — exactly 4 entries; the grid is a fixed
   * repeat(4,1fr) → repeat(2,1fr) → 1fr ladder with per-article borders.
   *
   * `code` is the uppercase Latin month shown in `<strong>` and is a design
   * element, identical in both languages; `month` is the readable form beside
   * it, so on /en the pair reads "SEP · September".
   */
  keyDates: [
    {
      code: "SEP",
      month: { zh: "9 月", en: "September" },
      body: {
        zh: "碩、博士班甄試簡章公告與報名",
        en: "Master's and doctoral screening guidelines released; applications open",
      },
    },
    {
      code: "NOV",
      month: { zh: "11 月", en: "November" },
      body: {
        zh: "碩、博士班甄試筆試與口試",
        en: "Written and oral examinations for master's and doctoral screening",
      },
    },
    {
      code: "FEB–MAR",
      month: { zh: "2–3 月", en: "February–March" },
      body: {
        zh: "大學部申請入學、在職專班簡章公告",
        en: "Undergraduate individual applications; executive master's guidelines released",
      },
    },
    {
      code: "MAY",
      month: { zh: "5 月", en: "May" },
      body: {
        zh: "第二階段口試與正備取名單公告",
        en: "Second-stage interviews; admitted and waitlisted candidates announced",
      },
    },
  ],
  section3: {
    heading: {
      zh: "在農經系建立的核心能力",
      en: "The capabilities you build at AGEC",
    },
    /** `.capability-cloud` — 8 static tags. */
    capabilities: [
      { zh: "經濟理論", en: "Economic theory" },
      { zh: "政策分析", en: "Policy analysis" },
      { zh: "資料科學", en: "Data science" },
      { zh: "農企業管理", en: "Agribusiness management" },
      { zh: "國際貿易", en: "International trade" },
      { zh: "永續與 ESG", en: "Sustainability and ESG" },
      { zh: "跨域整合", en: "Interdisciplinary integration" },
      { zh: "溝通決策", en: "Communication and decision-making" },
    ],
  },
  section4: {
    heading: {
      zh: "開始申請前，先找到你需要的資訊",
      en: "Find what you need before you apply",
    },
    /**
     * `.resource-row` fallback, used only while `links.section='admissions'`
     * has no rows. Rows that do come from the DB are already in the right
     * language and must not be translated again here. Like the reference
     * site, the last entry points at the footer contact block.
     */
    resourcesFallback: [
      { url: "#", label: { zh: "當年度招生簡章", en: "Current admission guidelines" } },
      { url: "#", label: { zh: "書面資料格式", en: "Application document formats" } },
      { url: "#", label: { zh: "考古題專區", en: "Past examination papers" } },
      { url: "#contact", label: { zh: "聯絡系辦", en: "Contact the department office" } },
    ],
  },
} satisfies Dict;
