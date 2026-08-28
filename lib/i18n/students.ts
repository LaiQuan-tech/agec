import type { Dict } from "@/lib/i18n";

/**
 * Every hard-coded string on 學生專區 (/students).
 *
 * Only `.resource-row` in `#section-4` reads the DB (getLinks("students")),
 * so almost the whole page lives here. `SectionTitle`'s `eyebrow` stays
 * uppercase Latin in both languages and is not in here.
 *
 * Arrows (`↗`) are part of the string rather than a separate node: React
 * would otherwise emit two text nodes and the browser shapes the run in two
 * pieces, which measurably shifts the glyph — the same trap documented on
 * InteriorHero's route number.
 */

export const STUDENTS = {
  /**
   * The hero shows both languages at once (title + the other language as its
   * kicker), so this pair is read off the raw `Msg` — `STUDENTS.title.zh` /
   * `STUDENTS.title.en` — not off the translated tree. English matches
   * lib/site-routes.ts so the <h1> and the <title> agree.
   */
  title: { zh: "學生專區", en: "Students" },
  hero: {
    lead: {
      zh: "從入學準備、校園生活到學習資源，讓每一位農經學生都能清楚找到下一步。",
      en: "From enrolment and campus life to learning resources, every AGEC student can see clearly what comes next.",
    },
    imageAlt: {
      zh: "農業綜合館周邊校園環境",
      en: "The campus around the Agriculture Complex Building",
    },
  },
  nav: {
    label: { zh: "學生專區", en: "Students" },
    items: [
      { href: "#section-1", label: { zh: "新生攻略", en: "New students" } },
      { href: "#section-2", label: { zh: "校園生活", en: "Campus life" } },
      {
        href: "#section-3",
        label: { zh: "系學會", en: "Student association" },
      },
      { href: "#section-4", label: { zh: "常用資源", en: "Resources" } },
    ],
  },
  section1: {
    heading: { zh: "新生攻略", en: "A guide for new students" },
    description: {
      zh: "把重要流程整理成可依序完成的清單，安心展開在臺大的第一學期。",
      en: "The essential steps, ordered as a checklist, so your first semester at NTU starts with confidence.",
    },
    /** `.steps` — exactly four; the 1180px border rules assume that count. */
    steps: [
      {
        no: "01",
        title: { zh: "完成入學程序", en: "Complete enrolment" },
        body: {
          zh: "註冊、學雜費、健康檢查與學生證辦理。",
          en: "Registration, tuition and fees, the health check and your student ID card.",
        },
      },
      {
        no: "02",
        title: { zh: "安排校園生活", en: "Settle into campus life" },
        body: {
          zh: "住宿申請、交通、餐飲與學生服務。",
          en: "Housing applications, transport, dining and student services.",
        },
      },
      {
        no: "03",
        title: { zh: "認識課程系統", en: "Learn the course system" },
        body: {
          zh: "選課、學分規劃與跨域學習資源。",
          en: "Course selection, credit planning and cross-disciplinary resources.",
        },
      },
      {
        no: "04",
        title: { zh: "加入農經社群", en: "Join the AGEC community" },
        body: {
          zh: "迎新、系學會、導生與同儕支持。",
          en: "Orientation, the student association, advising groups and peer support.",
        },
      },
    ],
  },
  section2: {
    heading: {
      zh: "從農綜館開始，認識臺大生活",
      en: "Start at the Agriculture Complex and get to know NTU",
    },
    body: {
      zh: "小地圖整理農業綜合館周邊的學生餐廳、教學館與日常服務；椰林攻略則提供選課、校園資源與系所資訊，讓新生更快融入。",
      en: "The mini-map gathers the dining halls, teaching buildings and everyday services around the Agriculture Complex Building, while the Royal Palm Boulevard guide covers course selection, campus resources and department information so new students settle in sooner.",
    },
    cta: { zh: "開啟校園小地圖 ↗︎", en: "Open the campus mini-map ↗︎" },
    imageAlt: {
      zh: "臺大椰林大道",
      en: "Royal Palm Boulevard at NTU",
    },
  },
  section3: {
    heading: {
      zh: "由學生共同創造的農經生活",
      en: "AGEC life, made by students",
    },
    leader: {
      title: { zh: "會長・副會長", en: "President · Vice President" },
      body: {
        zh: "統籌組織方向與跨部門協作",
        en: "Sets the association's direction and coordinates across its branches",
      },
    },
    /**
     * `.association-branches` — exactly five; `article:first-child` paints the
     * grid's left edge and the 1180px rules assume that count.
     */
    branches: [
      {
        name: { zh: "活動部", en: "Events" },
        body: {
          zh: "活動籌備・企劃發想",
          en: "Event planning · Programme ideas",
        },
      },
      {
        name: { zh: "公關部", en: "Public Relations" },
        body: {
          zh: "系間交流・社群資訊",
          en: "Inter-department exchange · Community updates",
        },
      },
      {
        name: { zh: "文書部", en: "Secretariat" },
        body: {
          zh: "會議記錄・內容製作",
          en: "Meeting minutes · Content production",
        },
      },
      {
        name: { zh: "總務部", en: "General Affairs" },
        body: {
          zh: "預算與費用管理",
          en: "Budget and expense management",
        },
      },
      {
        name: { zh: "美宣部", en: "Design and Publicity" },
        body: {
          zh: "視覺設計・文宣製作",
          en: "Visual design · Promotional materials",
        },
      },
    ],
  },
  section4: {
    heading: { zh: "常用資源", en: "Frequently used resources" },
  },
} satisfies Dict;
