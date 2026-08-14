import type { LinkItem, Program } from "@/lib/data";
import { SiteShell } from "./SiteShell";
import { InteriorHero } from "./InteriorHero";
import { LocalNav } from "./LocalNav";
import { SectionTitle } from "./SectionTitle";
import { NextRoute } from "./NextRoute";
import { padNo } from "./nav";

/**
 * 招生資訊 (/admissions) — route 05 / 08.
 *
 * Data sources, per PORT-REPORT §2.3:
 *
 *   #section-1 `.program-grid`     B → getPrograms()  (4 rows, already trimmed
 *                                  from 5 — 國際專班 was dropped in the 2026 IA)
 *   #section-2 `.schedule-line`    B, but there is no table and no getter for
 *                                  it (§2.4). Hard-coded here on purpose: the
 *                                  grid is a fixed repeat(4,1fr) → repeat(2,1fr)
 *                                  → 1fr ladder and every article draws its own
 *                                  right/bottom border, so a 5th entry breaks
 *                                  the 1180px row without looking wrong at
 *                                  1440px. Adding a table is out of scope here.
 *   #section-3 `.capability-cloud` A, static tag cloud.
 *   #section-4 `.resource-row`     B → getLinks(). See RESOURCE_FALLBACK below.
 *
 * Layout traps in site.css for this page:
 *   .program-grid article  — cards must be <article>; the borders, the 450px
 *                            min-height and the padding all hang off that tag,
 *                            and `article:first-child{border-left}` +
 *                            `article:nth-child(3){border-left}` (≤1180px)
 *                            assume exactly 4 cards in a 4→2→1 column ladder.
 *   .program-grid article>span — direct child selector for the card number.
 *   .schedule-line article — same story with #ffffff3d borders on green.
 *   .resource-row a        — the border/min-height/flex live on the <a>. A row
 *                            rendered as <div> would lose all of it, so every
 *                            entry stays an anchor even when its url is "#".
 */

/**
 * Copy the reference site shows in each `.program-grid` card that `programs`
 * cannot supply: the `<h4>` tagline and the `<p>` admission routes. The table
 * only has one `description`, which the home page's `.admission-card` already
 * uses for a *different* sentence — see PORT-REPORT §2.4, which asks for two
 * new columns (`tagline`, `admission_methods`). Until those exist, the strings
 * live here, keyed by the Chinese program name, with `description` as the
 * fallback so a renamed or newly added program still renders a complete card.
 */
const PROGRAM_COPY: Record<string, { tagline: string; methods: string }> = {
  大學部: {
    tagline: "探索農業、經濟與永續發展的無限可能",
    methods: "繁星推薦 · 申請入學 · 分發入學",
  },
  碩士班: {
    tagline: "深化專業知識，培養研究與分析能力",
    methods: "甄試入學 · 一般招生考試",
  },
  博士班: {
    tagline: "培育具國際視野的農業經濟研究人才",
    methods: "一般招生 · 逕行修讀博士學位",
  },
  碩士在職專班: {
    tagline: "結合理論與實務，培育農業與產業領導人才",
    methods: "招生考試 · 彈性學習",
  },
};

/** `.schedule-line` — 4 重要時程. Static copy; see the note above. */
const KEY_DATES = [
  { en: "SEP", zh: "9 月", body: "碩、博士班甄試簡章公告與報名" },
  { en: "NOV", zh: "11 月", body: "碩、博士班甄試筆試與口試" },
  { en: "FEB–MAR", zh: "2–3 月", body: "大學部申請入學、在職專班簡章公告" },
  { en: "MAY", zh: "5 月", body: "第二階段口試與正備取名單公告" },
];

/** `.capability-cloud` — 8 static tags. */
const CAPABILITIES = [
  "經濟理論",
  "政策分析",
  "資料科學",
  "農企業管理",
  "國際貿易",
  "永續與 ESG",
  "跨域整合",
  "溝通決策",
];

/**
 * `.resource-row` — used when `links` is empty.
 *
 * The `links` table has no `section = 'admissions'` rows yet (PORT-REPORT §2.4
 * lists it as a required addition, alongside widening `LinkItem["section"]`),
 * so today this fallback is what renders. It keeps the section visually
 * identical to the reference site; as soon as the rows are seeded the DB wins.
 * Like the reference, the last entry points at the footer contact block.
 */
const RESOURCE_FALLBACK = [
  { label: "當年度招生簡章", url: "#" },
  { label: "書面資料格式", url: "#" },
  { label: "考古題專區", url: "#" },
  { label: "聯絡系辦", url: "#contact" },
];

export function Admissions({
  programs,
  links,
}: {
  /** getPrograms() — 4 學制, in sort_order. */
  programs: Program[];
  /** getLinks('admissions') — 4 resource cards. Empty until the rows exist. */
  links: LinkItem[];
}) {
  // Same guard as the home page: the grid's positional border rules assume at
  // most 4 cards, so extra rows are dropped rather than allowed to break the
  // 1180px layout.
  const cards = programs.slice(0, 4);
  const resources = links.length
    ? links.map((link) => ({ label: link.label, url: link.url ?? "#" }))
    : RESOURCE_FALLBACK;

  return (
    <SiteShell variant="interior">
      <InteriorHero
        slug="admissions"
        title="招生資訊"
        titleEn="Admissions"
        routeNo="05"
        lead="為不同學習階段建立清楚入口，從大學部到博士班，找到最適合自己的農經學習路徑。"
        imageAlt="國立臺灣大學校園"
      />

      <LocalNav
        label="招生資訊"
        items={[
          { href: "#section-1", label: "四學制入口" },
          { href: "#section-2", label: "重要時程" },
          { href: "#section-3", label: "核心能力" },
          { href: "#section-4", label: "常見問題" },
        ]}
      />

      <div className="interior-content">
        <section className="inner-section" id="section-1">
          <div className="container">
            <SectionTitle
              no="01"
              eyebrow="PROGRAMS"
              heading="選擇你的學習路徑"
              description="四個學制共用同一套清楚架構，招生方式、課程特色、研究資源與職涯發展一目了然。"
            />
            <div className="program-grid">
              {cards.map((program, i) => {
                const copy = PROGRAM_COPY[program.name];
                return (
                  <article key={program.id}>
                    <span>{padNo(i + 1)}</span>
                    <small>{program.name_en}</small>
                    <h3>{program.name}</h3>
                    <h4>{copy?.tagline ?? program.description}</h4>
                    <p>{copy?.methods ?? program.description}</p>
                    <a href="#section-2">查看招生資訊 →</a>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="inner-section schedule-section" id="section-2">
          <div className="container">
            <SectionTitle no="02" eyebrow="KEY DATES" heading="重要時程" />
            <div className="schedule-line">
              {KEY_DATES.map((date) => (
                <article key={date.en}>
                  <strong>{date.en}</strong>
                  <span>{date.zh}</span>
                  <p>{date.body}</p>
                </article>
              ))}
            </div>
            <p className="schedule-note">
              實際日期及規定以當學年度最新招生簡章與本系公告為準。
            </p>
          </div>
        </section>

        <section className="inner-section" id="section-3">
          <div className="container">
            <SectionTitle
              no="03"
              eyebrow="WHAT YOU WILL BUILD"
              heading="在農經系建立的核心能力"
            />
            <div className="capability-cloud">
              {CAPABILITIES.map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
          </div>
        </section>

        <section className="inner-section tint" id="section-4">
          <div className="container">
            <SectionTitle
              no="04"
              eyebrow="NEED HELP?"
              heading="開始申請前，先找到你需要的資訊"
            />
            {/* Anchors, never <div>s — `.resource-row a` owns the cell border,
                the 120px min-height and the flex alignment. */}
            <div className="resource-row">
              {resources.map((resource) => (
                <a href={resource.url} key={resource.label}>
                  {resource.label} <span>↗</span>
                </a>
              ))}
            </div>
          </div>
        </section>
      </div>

      <NextRoute />
    </SiteShell>
  );
}
