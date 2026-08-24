import type { Msg } from "@/lib/i18n";

/**
 * Copy for 本系簡介 (/about).
 *
 * The whole page is editorial: it has no getter and no table (see the block
 * comment at the top of components/site/About.tsx), so this file is the only
 * place its text exists in either language.
 *
 * Rows keep their non-text fields — a milestone's year, a principle's ordinal,
 * a figure's `src` and `wide` flag — beside the copy they belong to, so one
 * entry stays one row. Hoisting them back into the component would mean
 * zipping two arrays by index and trusting the two orders never drift.
 *
 * The section `eyebrow`s (OUR HISTORY, MISSION & VISION, HONORS, ENVIRONMENT)
 * are deliberately *not* here. They are Latin-caps typographic devices that
 * already read as English on the Chinese site, so they stay literal props in
 * the component and are identical on /about and /en/about.
 */

/**
 * One `ol.timeline` entry. `year` is a numeral or the literal "NOW" — a glyph,
 * not a word, so it is the same on both sites.
 */
type Milestone = { year: string; title: Msg; body: Msg };

/** One `.principle-grid` card. `no` is its "01"–"04" ordinal. */
type Principle = { no: string; title: Msg; body: Msg };

/**
 * One `.honor-grid` card. `label` is the Latin badge the design prints large
 * (TOP 2% / AJAE / NSTC / IMPACT); all four are acronyms or figures and carry
 * no Chinese to translate.
 */
type Honor = { label: string; body: Msg };

/** One `.about-photo-grid` figure. `wide` selects `.about-photo-wide`. */
type Photo = { src: string; wide: boolean; alt: Msg; caption: Msg };

type AboutDict = {
  /**
   * Page title. Read *untranslated* by the component as well as through
   * `translate()`: `InteriorHero` needs both halves at once (it prints the
   * other language as the kicker above the <h1>), while `LocalNav` needs only
   * the current one. Hence `ABOUT.title.zh` / `.en` beside `t.title`.
   */
  title: Msg;
  lead: Msg;
  heroImageAlt: Msg;
  /** `.local-nav` jump links, one per `#section-N`. */
  nav: {
    history: Msg;
    mission: Msg;
    honors: Msg;
    environment: Msg;
  };
  history: {
    heading: Msg;
    description: Msg;
    imageAlt: Msg;
    imageCaption: Msg;
    milestones: Milestone[];
  };
  mission: {
    heading: Msg;
    quote: Msg;
    principles: Principle[];
  };
  honors: {
    heading: Msg;
    items: Honor[];
  };
  environment: {
    heading: Msg;
    photos: Photo[];
  };
};

export const ABOUT = {
  title: { zh: "本系簡介", en: "About AGEC" },
  lead: {
    zh: "承繼近百年農業經濟研究傳統，以經濟分析、資料與跨域協作，回應臺灣及全球的關鍵課題。",
    en: "Building on nearly a century of agricultural economics research, we answer the questions that matter to Taiwan and the world through economic analysis, data and cross-disciplinary collaboration.",
  },
  heroImageAlt: {
    zh: "臺大農業經濟學系系名牌與校舍",
    en: "The Department of Agricultural Economics nameplate and its building at NTU",
  },

  nav: {
    history: { zh: "系史沿革", en: "History" },
    mission: { zh: "目標與使命", en: "Mission & Vision" },
    honors: { zh: "系所榮譽", en: "Honors" },
    environment: { zh: "環境與設備", en: "Environment" },
  },

  history: {
    heading: {
      zh: "從臺灣出發的農經學術傳承",
      en: "A scholarly tradition in agricultural economics, rooted in Taiwan",
    },
    description: {
      zh: "本系歷史可追溯至 1928 年臺北帝國大學設立的農業經濟講座，逐步建立完整的學士、碩士與博士教育體系。",
      en: "The department traces its origins to the chair of agricultural economics established at Taihoku Imperial University in 1928, and has since built a complete education system spanning the bachelor's, master's and doctoral levels.",
    },
    imageAlt: {
      zh: "臺大農業經濟學系所在建築外觀",
      en: "Exterior of the building that houses the Department of Agricultural Economics at NTU",
    },
    /**
     * `.history-image p` — the italic serif line under the photo. English on
     * the Chinese site already, in the same spirit as COMMON.tagline, so /en
     * keeps it word for word rather than inventing a second version of a line
     * that was written in English to begin with.
     */
    imageCaption: {
      zh: "Knowledge rooted in place, passed forward across generations.",
      en: "Knowledge rooted in place, passed forward across generations.",
    },
    milestones: [
      {
        year: "1928",
        title: { zh: "農業經濟講座設立", en: "Chair of agricultural economics established" },
        body: {
          zh: "臺北帝國大學時期，開啟農業經濟教學與研究的學術源流。",
          en: "Founded in the Taihoku Imperial University era, opening the line of agricultural economics teaching and research that continues here.",
        },
      },
      {
        year: "1950",
        title: { zh: "農業經濟學系成立", en: "Department of Agricultural Economics founded" },
        body: {
          zh: "國立臺灣大學農學院成立農業經濟學系，奠定人才培育基礎。",
          en: "The College of Agriculture at National Taiwan University founded the department, laying the groundwork for educating the field's next generation.",
        },
      },
      {
        year: "1960",
        title: { zh: "研究所教育展開", en: "Graduate education begins" },
        body: {
          zh: "成立農村社會經濟研究所，招收碩士班研究生。",
          /**
           * The institute's Chinese name is kept alongside the rendering: it
           * was folded into the department decades ago and has no English
           * name in current use, so naming it in English alone would assert a
           * title no NTU source carries.
           */
          en: "The Graduate Institute of Rural Socio-Economics (農村社會經濟研究所) was established and began admitting master's students.",
        },
      },
      {
        year: "1987",
        title: { zh: "博士班成立", en: "Doctoral program established" },
        body: {
          zh: "建構完整高等教育與研究體系，深化國際學術交流。",
          en: "Completing the department's structure for advanced study and research, and deepening its international academic exchange.",
        },
      },
      {
        year: "NOW",
        title: { zh: "面向全球挑戰", en: "Facing global challenges" },
        body: {
          zh: "串連 AI、資料科學、永續治理與糧食安全，持續引領農經研究。",
          en: "Drawing together AI, data science, sustainable governance and food security to keep leading research in agricultural economics.",
        },
      },
    ],
  },

  mission: {
    heading: {
      zh: "以世界一流之教學與研究，提升農業經濟學術地位",
      en: "Advancing the standing of agricultural economics through world-class teaching and research",
    },
    quote: {
      zh: "培育兼具農業專業知識、經濟分析能力、資料應用能力及國際視野之專業人才。",
      en: "To educate professionals who combine agricultural expertise, economic analysis, command of data and an international outlook.",
    },
    principles: [
      {
        no: "01",
        title: { zh: "扎實理論", en: "Solid theory" },
        body: {
          zh: "建立經濟學、統計學、計量分析與管理學基礎。",
          en: "Building foundations in economics, statistics, econometrics and management.",
        },
      },
      {
        no: "02",
        title: { zh: "實證研究", en: "Empirical research" },
        body: {
          zh: "運用資料科學與嚴謹方法，回應真實世界問題。",
          en: "Answering real-world questions with data science and rigorous method.",
        },
      },
      {
        no: "03",
        title: { zh: "跨域整合", en: "Cross-disciplinary integration" },
        body: {
          zh: "連結農業、環境、政策、產業與全球市場。",
          en: "Connecting agriculture, the environment, policy, industry and global markets.",
        },
      },
      {
        no: "04",
        title: { zh: "國際影響", en: "International impact" },
        body: {
          zh: "拓展研究合作、交換學習與全球學術能見度。",
          en: "Extending research collaboration, exchange study and global academic visibility.",
        },
      },
    ],
  },

  honors: {
    heading: {
      zh: "研究與人才，在世界舞臺持續被看見",
      en: "Research and people that keep earning recognition worldwide",
    },
    items: [
      {
        label: "TOP 2%",
        body: {
          zh: "教師入選史丹佛大學全球前 2% 頂尖科學家",
          en: "Faculty named in Stanford University's list of the world's top 2% of scientists",
        },
      },
      {
        label: "AJAE",
        body: {
          zh: "研究成果發表於國際農業經濟重要期刊",
          en: "Research published in the leading international journals of agricultural economics",
        },
      },
      {
        label: "NSTC",
        /**
         * Both awards are named here as their grantor names them in English:
         * 國科會 is the National Science and Technology Council (the "NSTC" of
         * the badge) and 吳大猷先生紀念獎 is its Ta-You Wu Memorial Award.
         */
        body: {
          zh: "國科會傑出研究獎與吳大猷先生紀念獎",
          en: "NSTC Outstanding Research Award and Ta-You Wu Memorial Award",
        },
      },
      {
        label: "IMPACT",
        body: {
          zh: "系友遍布產、官、學、研及國際組織",
          en: "Alumni across industry, government, academia, research institutes and international organizations",
        },
      },
    ],
  },

  environment: {
    heading: {
      zh: "讓學習、研究與交流自然發生",
      en: "Where learning, research and exchange happen naturally",
    },
    /**
     * `.about-photo-grid` — 1 wide + 2 normal figures, in DOM order.
     *
     * Each `caption` is an `English · Chinese` pair of the *same* phrase, which
     * is a bilingual device aimed at a Chinese reader; on /en the second half
     * would just repeat the first, so the English caption is the English half
     * alone. `figcaption` carries no positional CSS, so dropping the separator
     * changes nothing but the words.
     */
    photos: [
      {
        src: "/images/about/office-corridor.jpg",
        wide: true,
        alt: {
          zh: "臺大農經系辦公室外廊",
          en: "The corridor outside the department office",
        },
        caption: {
          zh: "Department Corridor · 系辦外廊",
          en: "Department Corridor",
        },
      },
      {
        src: "/images/about/courtyard-detail.jpg",
        wide: false,
        alt: {
          zh: "農業綜合館中庭窗景與格柵",
          en: "Window view and lattice screen in the courtyard of the Agriculture Comprehensive Building",
        },
        caption: {
          zh: "Architectural Detail · 建築細節",
          en: "Architectural Detail",
        },
      },
      {
        src: "/images/about/courtyard.jpg",
        wide: false,
        alt: {
          zh: "農業綜合館中庭與綠地",
          en: "The courtyard and lawn of the Agriculture Comprehensive Building",
        },
        caption: {
          zh: "Courtyard · 中庭環境",
          en: "Courtyard",
        },
      },
    ],
  },
} satisfies AboutDict;
