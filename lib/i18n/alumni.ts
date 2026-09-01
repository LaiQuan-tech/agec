import type { Dict } from "@/lib/i18n";

/**
 * Every string on 系友專區 (/alumni) — the one interior page with no DB reads
 * at all, so the whole page is in here.
 *
 * Two kinds of string deliberately stay identical in both languages: the
 * uppercase Latin eyebrows the design uses as kickers (`SectionTitle`'s
 * `eyebrow`, `PUBLIC LEADERSHIP`, `SUPPORT AGEC`, two of the three
 * `.story-grid` eyebrows and the five `.alumni-sectors` tags) and the dates.
 *
 * Headings that the reference site breaks across two lines are stored as two
 * `Msg`s rather than one string with a marker in it: the `<br />` is a layout
 * decision that has to survive translation, and English rarely breaks where
 * Chinese does.
 *
 * Arrows (`↗`, `→`) are part of the string rather than a separate node: React
 * would otherwise emit two text nodes and the browser shapes the run in two
 * pieces, which measurably shifts the glyph — the same trap documented on
 * InteriorHero's route number.
 */

export const ALUMNI = {
  /**
   * The hero shows both languages at once (title + the other language as its
   * kicker), so this pair is read off the raw `Msg` — `ALUMNI.title.zh` /
   * `ALUMNI.title.en` — not off the translated tree. English matches
   * lib/site-routes.ts so the <h1> and the <title> agree.
   */
  title: { zh: "系友專區", en: "Alumni" },
  hero: {
    lead: {
      zh: "連結跨世代農經人，分享專業歷程、保存共同記憶，並以回饋延續下一代的學習與研究。",
      en: "Connecting AGEC alumni across generations to share professional journeys, preserve a common memory and, through giving back, sustain the learning and research of those who follow.",
    },
    imageAlt: {
      zh: "臺大椰林大道與騎乘腳踏車的學生",
      en: "Students cycling along Royal Palm Boulevard at NTU",
    },
  },
  nav: {
    label: { zh: "系友專區", en: "Alumni" },
    items: [
      {
        href: "#section-1",
        label: { zh: "傑出系友", en: "Distinguished alumni" },
      },
      { href: "#section-2", label: { zh: "系友動態", en: "Alumni news" } },
      /* 系友回娘家。id 是 `#section-events` 而不是接續的 `#section-3`：
         參考站的四個區塊已經佔掉 1–4，改號會動到既有的錨點，而這一區是這次
         新增的功能區塊，不是原設計的第五段。 */
      { href: "#section-events", label: { zh: "系友回娘家", en: "Homecoming" } },
      { href: "#section-3", label: { zh: "支持農經", en: "Support AGEC" } },
      {
        href: "#section-4",
        label: { zh: "李登輝系友專區", en: "Lee Teng-hui Archive" },
      },
    ],
  },
  section1: {
    /** Two lines, broken by a `<br />`. See the note at the top of the file. */
    heading: {
      line1: { zh: "農經人的影響力", en: "AGEC alumni make their mark across" },
      line2: {
        zh: "遍及產官學研",
        en: "government, academia, industry and research",
      },
    },
    description: {
      zh: "從公共政策、學術研究到金融與農企業，系友以專業回應社會需求，也成為下一代的典範。",
      en: "From public policy and academic research to finance and agribusiness, alumni answer society's needs with their expertise — and set the example for the generation behind them.",
    },
    /** `.alumni-feature` — the .85fr/1.15fr text-and-photo split. */
    feature: {
      heading: {
        line1: {
          zh: "以農經訓練理解土地、",
          en: "Agricultural economics as a way to read",
        },
        line2: {
          zh: "產業與人的關係。",
          en: "land, industry and the people between them.",
        },
      },
      body: {
        zh: "傑出系友專區將以人物故事呈現專業歷程與社會影響，建立可持續累積的系友知識典藏。",
        en: "This section will present alumni through their own stories — the careers they built and the difference they made — as an archive that keeps growing.",
      },
      /** Placeholder anchor, as on the reference site. */
      // Arrow lives on MaybeLink, not here — see students.ts section2.cta.
      cta: { zh: "探索系友故事", en: "Explore alumni stories" },
      imageAlt: {
        zh: "臺大農業綜合館",
        en: "The Agriculture Complex Building at NTU",
      },
    },
  },
  section2: {
    heading: { zh: "持續發生的系友情誼", en: "Alumni ties, still being made" },
    /**
     * `.story-grid` — exactly 3 cards, and not one homogeneous list: the first
     * is a dated news item, the other two are calls to action whose eyebrows
     * are Latin labels in the reference design and stay that way in Chinese.
     *
     * `url` sits beside the copy the same way `section4.resourcesFallback`
     * carries one, and "#" means the same thing to MaybeLink as an empty
     * value: no destination, so no link and no arrow. Only the third card has
     * somewhere to go — `footer#contact` is rendered on every page by
     * SiteShell, so the anchor stays on /alumni rather than routing home.
     */
    stories: [
      {
        eyebrow: {
          zh: "2026.07.06 · 系友榮耀",
          en: "2026.07.06 · ALUMNI HONORS",
        },
        title: {
          zh: "四位系友榮獲第 8 屆百大青年農民",
          en: "Four alumni selected for the 8th Hundred Outstanding Young Farmers program",
        },
        action: { zh: "閱讀消息", en: "Read the news" },
        // The 百大青年農民 item is not in `news` and has no source URL.
        url: "#",
      },
      {
        eyebrow: { zh: "ALUMNI GATHERING", en: "ALUMNI GATHERING" },
        title: {
          zh: "跨世代交流，讓經驗成為共同資產",
          en: "Exchange across generations turns experience into shared ground",
        },
        action: { zh: "近期活動", en: "Upcoming events" },
        // No events page or table on either site yet.
        url: "#",
      },
      {
        eyebrow: { zh: "STAY CONNECTED", en: "STAY CONNECTED" },
        title: {
          zh: "更新系友資料，與母系保持聯繫",
          en: "Update your alumni record and stay in touch with the department",
        },
        action: { zh: "聯絡我們", en: "Contact us" },
        url: "#contact",
      },
    ],
  },
  /** `.donation-grid` — the one section with no `header.inner-section-title`. */
  section3: {
    heading: {
      line1: { zh: "讓一份支持，", en: "Let your support become" },
      line2: { zh: "成為下一代的機會。", en: "the next generation's opportunity." },
    },
    body: {
      zh: "系友捐贈支持獎助學金、國際交流、研究設備與學生活動，讓農經教育持續回應新時代的挑戰。",
      en: "Alumni giving funds scholarships, international exchange, research equipment and student activities, keeping an AGEC education equal to the challenges of a new era.",
    },
    // Arrow lives on MaybeLink, not here — see students.ts section2.cta.
    cta: { zh: "前往捐贈專區", en: "Visit the giving page" },
  },
  section4: {
    heading: { zh: "李登輝系友專區", en: "The Lee Teng-hui Alumni Archive" },
    description: {
      zh: "彙整求學紀事、珍貴照片、著作、捐贈書目與紀念活動，保存系友與母系之間的歷史連結。",
      en: "Study records, rare photographs, publications, donated books and commemorative events, gathered to preserve the historical bond between alumni and their department.",
    },
    /**
     * `.archive-grid` — exactly 3 cards; `article:first-child{border-left}`
     * paints the grid's left edge, so a 4th would wrap with no left border.
     */
    items: [
      {
        no: "01",
        title: { zh: "求學紀事", en: "Student years" },
        body: {
          zh: "從農經學習到公共服務的生命軌跡",
          en: "A life that ran from agricultural economics to public service",
        },
      },
      {
        no: "02",
        title: { zh: "捐贈書目", en: "Donated books" },
        body: {
          zh: "中文、英文、日文著作與期刊典藏",
          en: "Chinese, English and Japanese works and journals in the collection",
        },
      },
      {
        no: "03",
        title: { zh: "影像史料", en: "Photographic records" },
        body: {
          zh: "珍貴照片與重要紀念活動紀錄",
          en: "Rare photographs and records of major commemorative events",
        },
      },
    ],
  },
} satisfies Dict;
