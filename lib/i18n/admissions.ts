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
      { href: "#section-1", label: { zh: "學制與班別", en: "Programs" } },
      { href: "#section-2", label: { zh: "重要時程", en: "Key dates" } },
      {
        href: "#section-3",
        label: { zh: "核心能力", en: "Core competencies" },
      },
      /* 「常見問題／FAQ」是錯的，不只是不一致：這一區是四條資源連結
         （當年度招生簡章、書面資料格式、考古題專區、聯絡系辦），站上沒有
         任何 FAQ。改成小標本來就在說的「申請協助」。 */
      { href: "#section-4", label: { zh: "申請協助", en: "Need help?" } },
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
    /**
     * 同一顆按鈕，但目的地在站外時用的版本。
     *
     * 箭頭是寫死在字串裡的，不是另外一個節點 —— 這個檔開頭那條規則：拆成兩個
     * text node 之後瀏覽器會分兩段排版，實測會讓字符位移。所以「內部用 →、
     * 外部用 ↗︎」只能是兩條字串，不能在元件裡拼。
     *
     * ↗︎ 在這個站是「會離開這一頁」的承諾（見 MaybeLink），系辦把學制卡指到
     * 教務處或在職專班自己的網站時，讀者要先知道。
     */
    ctaExternal: { zh: "查看招生資訊 ↗︎", en: "View admission details ↗︎" },
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
      // "core competencies"，不是 "capabilities"：頁內導覽那一格寫的是
      // Core competencies，中文那邊「核心能力」也原字出現在大標裡。英文
      // 用另一個同義字，等於只有英文站的讀者按下去看不到自己按的詞。
      en: "The core competencies you build at AGEC",
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
    /**
     * §4 的招生檔案下載區（components/site/SiteDocuments.tsx）。
     *
     * 這一區是為了把舊系網上的招生簡章、書面資料格式與考古題搬過來 ——
     * 那些是系上自己的檔案，不該長期寄居在舊站。底下那排 .resource-row 則是
     * 教務處等**別的單位**維護的系統，留在外連才是對的，不會搬。
     *
     * ⚠️ 一個檔都沒有時整區（含小標）不印，§4 就跟原本一模一樣。
     */
    documents: {
      heading: { zh: "招生檔案", en: "Admission documents" },
      description: {
        zh: "各學制共用的招生檔案，由系辦維護，點卡片即可下載。",
        en: "Admission documents shared by all programs — maintained by the department office.",
      },
    },
    heading: {
      zh: "開始申請前，先找到你需要的資訊",
      en: "Find what you need before you apply",
    },
    /**
     * §4 的三張學制入口卡（components/site/AdmissionKinds.tsx）：每一張底下列
     * 四個學制，點哪個學制就落在**那個學制真正對應的資料**上。這三種東西在
     * 舊站都是「按學制分開」的（recruit1–4 的公告、link5 的考古題四組），所以
     * 是程式裡的固定結構，不是 links 表的資料。
     *
     * `key` 決定落點怎麼算（lib/admissions-kinds.ts）：
     *
     *   guide / forms  該學制最新一則標題含關鍵字的招生公告 `/news/<id>`；
     *                  找不到公告才退回 `anchor`（學制招生頁的公告區／檔案區）
     *   exams          學制招生頁的考古題區 `anchor`（#exams），只列有考古題的學制
     *
     * 客戶回饋：「每個點進去都是招生資訊，點進去應該要是對應的資料檔才對。」
     * 2026-09 之前四條全部連到 `/admissions/<slug>#notices`，讀者要自己在整頁
     * 公告裡找簡章。
     *
     * `anchor` 對應 ProgramAdmissions.tsx 裡的區塊 id。
     */
    kinds: [
      {
        key: "guide" as const,
        anchor: "#notices",
        label: { zh: "當年度招生簡章", en: "Current admission guidelines" },
        description: {
          zh: "各學制最新一期的招生簡章公告。",
          en: "Each program's most recent admission guidelines.",
        },
      },
      {
        key: "forms" as const,
        anchor: "#files",
        label: { zh: "書面資料格式", en: "Application document formats" },
        description: {
          zh: "各學制申請時要繳交的表格與格式。",
          en: "The forms and formats each program asks applicants to submit.",
        },
      },
      {
        key: "exams" as const,
        anchor: "#exams",
        label: { zh: "考古題專區", en: "Past examination papers" },
        description: {
          zh: "各學制歷年的入學考試題目。",
          en: "Past entrance examination papers, by program.",
        },
      },
    ],
    /** 三張入口卡上「大學部 ›」這種學制連結的無障礙前綴。 */
    kindsLabel: { zh: "依學制查看", en: "By program" },
    /**
     * 學制連結後面那個小字的學年度，`{year}` 由 AdmissionKinds 換成標題抓到的
     * 數字（「115」）。中文是民國學年度，英文用 AY（academic year）—— 不加
     * 「R.O.C.」，英文讀者看的是 /news/<id> 那一頁的日期。
     */
    kindsYear: { zh: "{year} 學年度", en: "AY {year}" },
    /** 考古題卡一個學制都沒有時（documents 還沒匯入）印這一行，不印空的 <ul>。 */
    kindsEmpty: { zh: "尚無資料", en: "Nothing yet" },
    /**
     * `.resource-row` fallback, used only while `links.section='admissions'`
     * has no rows. Rows that do come from the DB are already in the right
     * language and must not be translated again here. Like the reference
     * site, the entry points at the footer contact block.
     */
    resourcesFallback: [
      { url: "#contact", label: { zh: "聯絡系辦", en: "Contact the department office" } },
    ],
  },
  /**
   * 各學制的招生頁（/admissions/[program]）。與舊站的 recruit1–4 對應：
   * 該學制的招生公告清單，加上系辦標了學制的檔案與連結。
   */
  programPage: {
    /** `.post-byline`，印在學制名上面。 */
    kicker: { zh: "招生資訊", en: "Admissions" },
    /** h1：中文「大學部招生」，英文 "Undergraduate Admissions"。 */
    titleSuffix: { zh: "招生", en: " Admissions" },
    official: { zh: "官方簡章／報名系統 ↗︎", en: "Official guidelines / application system ↗︎" },
    notices: {
      heading: { zh: "招生公告", en: "Admission notices" },
      description: {
        zh: "簡章、書面資料下載、筆試與口試時間，依日期排列，最新的在前。",
        en: "Guidelines, document downloads and examination schedules, newest first.",
      },
      /** 年份籤（AdmissionNoticeList）：字與 lib/i18n/news.ts 的年份列一致。 */
      yearLabel: { zh: "年份", en: "Year" },
      allYears: { zh: "全部年份", en: "All years" },
      yearNavLabel: { zh: "依年份篩選招生公告", en: "Filter admission notices by year" },
      yearHint: { zh: "{year} 年的招生公告，共 {count} 則", en: "{count} notices from {year}" },
      empty: {
        zh: "目前沒有這個學制的招生公告。",
        en: "No admission notices for this program yet.",
      },
    },
    files: {
      heading: { zh: "招生檔案", en: "Admission documents" },
      description: {
        zh: "這個學制專屬的簡章與書面資料格式，由系辦維護，點卡片即可下載。",
        en: "Guidelines and document formats specific to this program — maintained by the department office.",
      },
    },
    /**
     * `#exams`（components/site/ExamPapers.tsx）：documents 裡 category='考古題'
     * 的列，依年度標題（description）一列一年、科目並排。`other` 是沒填年度
     * 標題那一組的標題，排在最後。
     */
    exams: {
      heading: { zh: "考古題", en: "Past exam papers" },
      description: {
        zh: "歷年入學考試題目，依年度整理。",
        en: "Past entrance examination papers by academic year.",
      },
      other: { zh: "其他", en: "Other" },
    },
    links: { heading: { zh: "相關連結", en: "Related links" } },
    back: { zh: "← 回到招生資訊", en: "← Back to Admissions" },
    otherPrograms: { zh: "其他學制", en: "Other programs" },
  },
} satisfies Dict;
