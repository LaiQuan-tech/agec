import type { Msg } from "@/lib/i18n";

/**
 * Copy for 本系簡介 (/about).
 *
 * Two kinds of string live here:
 *
 *  - page furniture (title, nav labels, image alt text) — still hard-coded,
 *    read straight from this file;
 *  - **the editable slots** — the hero lead; §1's heading, description,
 *    photo caption and five milestones (year / title / body); §2's heading,
 *    quote and four cards; §3's heading and four badges; §4's heading and
 *    three photo captions. Those are the `page_copy` table's business
 *    (lib/page-copy/about.ts; edited at /admin/about). The values kept here
 *    are the seed migration 20260916100000 copied into the table and the
 *    fallback the page prints when the table has no row for a key. So
 *    changing a value here changes nothing on the live site once the row
 *    exists — edit it in the admin instead.
 *
 * Rows keep their non-text fields — a milestone's year, a principle's ordinal,
 * a figure's `src` and `wide` flag — beside the copy they belong to, so one
 * entry stays one row. Hoisting them back into the component would mean
 * zipping two arrays by index and trusting the two orders never drift. The
 * resolver in lib/page-copy/about.ts keeps that rule: it builds each list from
 * this file's arrays and hands the component complete rows.
 *
 * The section `eyebrow`s (OUR HISTORY, MISSION & VISION, HONORS, ENVIRONMENT)
 * are deliberately *not* here. They are Latin-caps typographic devices that
 * already read as English on the Chinese site, so they stay literal props in
 * the component and are identical on /about and /en/about.
 */

/**
 * One `ol.timeline` entry. `year` is a numeral for four of the five rows — the
 * same glyph on both sites — but the fifth row's value is the word "NOW",
 * which reads as English on the Chinese page.
 *
 * 🔴 2026-09-28 客戶要求中文站只能出現中文：「NOW」那一格改成中文「現在」，
 * `/en` 維持 "NOW"；其餘四格是數字，兩種語言仍然相同。年份因此是 `Msg`
 * 而不是單一字串 —— 型別上不再保證五格都跨語言相同，只是多數剛好相同。
 */
type Milestone = { year: Msg; title: Msg; body: Msg };

/** One `.principle-grid` card. `no` is its "01"–"04" ordinal. */
type Principle = { no: string; title: Msg; body: Msg };

/**
 * One `.honor-grid` card. `label` is the Latin badge the design prints large.
 * Three of the four (TOP 2% / AJAE / NSTC) are acronyms or figures the client
 * chose to keep exactly as written on both sites — no Chinese translation.
 *
 * 🔴 2026-09-28 客戶要求中文站只能出現中文：第四個（IMPACT）是例外，中文頁
 * 改印「影響力」，`/en` 維持 "IMPACT"。`label` 因此是 `Msg` 而不是單一字串 ——
 * 型別上不再保證四格都跨語言相同，只是其中三個剛好相同。
 */
type Honor = { label: Msg; body: Msg };

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
  /**
   * `.local-nav` jump links, one per `#section-N`.
   *
   * An array of `{ href, label }` rather than four bare labels, matching
   * ADMISSIONS / COURSES / STUDENTS / ALUMNI. The four labels used to be
   * named keys and About.tsx paired each one with its `#section-N` by hand;
   * /sitemap now lists the same four anchors, and a shape whose hrefs live at
   * the call site is a shape two callers spell two ways. lib/sitemap-tree.ts
   * reads this list directly.
   */
  nav: {
    items: readonly { href: string; label: Msg }[];
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
    items: [
      { href: "#section-1", label: { zh: "系史沿革", en: "History" } },
      { href: "#section-2", label: { zh: "使命與願景", en: "Mission & Vision" } },
      { href: "#section-3", label: { zh: "系所榮譽", en: "Honors" } },
      { href: "#section-4", label: { zh: "環境與設備", en: "Environment" } },
    ],
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
     * `.history-image p` — the italic serif line under the photo.
     *
     * 2026-09-28 前 zh 印的是與 en 一字不差的英文句子（在 COMMON.tagline 的
     * 同一種精神下：整句本來就是用英文寫的，/en 沒有另外造一個版本）。客戶
     * 要求中文站只能出現中文之後，zh 改成中文翻譯；`/en` 不變，仍是原本那句
     * 英文。
     */
    imageCaption: {
      zh: "知識紮根土地，世代相傳。",
      en: "Knowledge rooted in place, passed forward across generations.",
    },
    milestones: [
      {
        year: { zh: "1928", en: "1928" },
        title: { zh: "農業經濟講座設立", en: "Chair of agricultural economics established" },
        body: {
          zh: "臺北帝國大學時期，開啟農業經濟教學與研究的學術源流。",
          en: "Founded in the Taihoku Imperial University era, opening the line of agricultural economics teaching and research that continues here.",
        },
      },
      {
        year: { zh: "1950", en: "1950" },
        title: { zh: "農業經濟學系成立", en: "Department of Agricultural Economics founded" },
        body: {
          zh: "國立臺灣大學農學院成立農業經濟學系，奠定人才培育基礎。",
          en: "The College of Agriculture at National Taiwan University founded the department, laying the groundwork for educating the field's next generation.",
        },
      },
      {
        year: { zh: "1960", en: "1960" },
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
        year: { zh: "1987", en: "1987" },
        title: { zh: "博士班成立", en: "Doctoral program established" },
        body: {
          zh: "建構完整高等教育與研究體系，深化國際學術交流。",
          en: "Completing the department's structure for advanced study and research, and deepening its international academic exchange.",
        },
      },
      {
        year: { zh: "現在", en: "NOW" },
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
        label: { zh: "TOP 2%", en: "TOP 2%" },
        body: {
          zh: "教師入選史丹佛大學全球前 2% 頂尖科學家",
          en: "Faculty named in Stanford University's list of the world's top 2% of scientists",
        },
      },
      {
        label: { zh: "AJAE", en: "AJAE" },
        body: {
          zh: "研究成果發表於國際農業經濟重要期刊",
          en: "Research published in the leading international journals of agricultural economics",
        },
      },
      {
        label: { zh: "NSTC", en: "NSTC" },
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
        label: { zh: "影響力", en: "IMPACT" },
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
     * 2026-09-28 前 zh `caption` 是 `English · Chinese` 的雙語裝置（同一個
     * 意思印兩遍），瞄準的是中文讀者；`/en` 從來只有英文那一半，沒有跟著印
     * 兩遍。客戶要求中文站只能出現中文之後，zh 拿掉英文那一半與分隔符，只
     * 留中文；`/en` 不受影響，本來就是純英文。`figcaption` carries no
     * positional CSS, so this changes nothing but the words.
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
          zh: "系辦外廊",
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
          zh: "建築細節",
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
          zh: "中庭環境",
          en: "Courtyard",
        },
      },
    ],
  },
} satisfies AboutDict;
