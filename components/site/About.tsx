import { SiteShell } from "./SiteShell";
import { InteriorHero } from "./InteriorHero";
import { LocalNav } from "./LocalNav";
import { SectionTitle } from "./SectionTitle";
import { NextRoute } from "./NextRoute";

/**
 * 本系簡介 (/about) — route 03 / 08.
 *
 * Every block on this page is A-class static copy: the reference site has no
 * data source behind any of it, and PORT-REPORT §2.4 lists `ol.timeline`,
 * `.principle-grid`, `.honor-grid` and `.about-photo-grid` as B-class-but-no-getter
 * (no table, no DDL). They are hard-coded here on purpose — site.css pins each
 * grid's borders with positional selectors, so a 5th entry breaks the layout at
 * the 1180px / 860px breakpoints while still looking correct on desktop.
 *
 *   .principle-grid   — 4 items; `article:nth-child(3){border-left}` +
 *                       `article:last-child{border-right}` assume exactly 4.
 *   .honor-grid       — 4 items; `article:nth-child(2n)` paints the checkerboard,
 *                       so the count must stay even.
 *   ol.timeline       — 5 items; `.timeline li{grid-template-columns:100px 1fr}`
 *                       needs the literal <ol><li><strong>+<div> shape.
 *   .about-photo-grid — 3 <figure>; layout is hard-wired 1 wide + 2 normal via
 *                       `.about-photo-wide{grid-column:1/-1}`.
 */

/** `ol.timeline` — 系史沿革 5 筆. */
const MILESTONES = [
  {
    year: "1928",
    title: "農業經濟講座設立",
    body: "臺北帝國大學時期，開啟農業經濟教學與研究的學術源流。",
  },
  {
    year: "1950",
    title: "農業經濟學系成立",
    body: "國立臺灣大學農學院成立農業經濟學系，奠定人才培育基礎。",
  },
  {
    year: "1960",
    title: "研究所教育展開",
    body: "成立農村社會經濟研究所，招收碩士班研究生。",
  },
  {
    year: "1987",
    title: "博士班成立",
    body: "建構完整高等教育與研究體系，深化國際學術交流。",
  },
  {
    year: "NOW",
    title: "面向全球挑戰",
    body: "串連 AI、資料科學、永續治理與糧食安全，持續引領農經研究。",
  },
];

/** `.principle-grid` — 四項教育原則. Exactly 4; see the note above. */
const PRINCIPLES = [
  {
    no: "01",
    title: "扎實理論",
    body: "建立經濟學、統計學、計量分析與管理學基礎。",
  },
  {
    no: "02",
    title: "實證研究",
    body: "運用資料科學與嚴謹方法，回應真實世界問題。",
  },
  {
    no: "03",
    title: "跨域整合",
    body: "連結農業、環境、政策、產業與全球市場。",
  },
  {
    no: "04",
    title: "國際影響",
    body: "拓展研究合作、交換學習與全球學術能見度。",
  },
];

/** `.honor-grid` — 系所榮譽. Keep the count even (checkerboard背景). */
const HONORS = [
  { label: "TOP 2%", body: "教師入選史丹佛大學全球前 2% 頂尖科學家" },
  { label: "AJAE", body: "研究成果發表於國際農業經濟重要期刊" },
  { label: "NSTC", body: "國科會傑出研究獎與吳大猷先生紀念獎" },
  { label: "IMPACT", body: "系友遍布產、官、學、研及國際組織" },
];

/** `.about-photo-grid` — 1 wide + 2 normal figures, in DOM order. */
const PHOTOS = [
  {
    src: "/images/about/office-corridor.jpg",
    alt: "臺大農經系辦公室外廊",
    caption: "Department Corridor · 系辦外廊",
    wide: true,
  },
  {
    src: "/images/about/courtyard-detail.jpg",
    alt: "農業綜合館中庭窗景與格柵",
    caption: "Architectural Detail · 建築細節",
    wide: false,
  },
  {
    src: "/images/about/courtyard.jpg",
    alt: "農業綜合館中庭與綠地",
    caption: "Courtyard · 中庭環境",
    wide: false,
  },
];

export function About() {
  return (
    <SiteShell variant="interior">
      <InteriorHero
        slug="about"
        title="本系簡介"
        titleEn="About AGEC"
        routeNo="03"
        lead="承繼近百年農業經濟研究傳統，以經濟分析、資料與跨域協作，回應臺灣及全球的關鍵課題。"
        imageAlt="臺大農業經濟學系系名牌與校舍"
      />

      <LocalNav
        label="本系簡介"
        items={[
          { href: "#section-1", label: "系史沿革" },
          { href: "#section-2", label: "目標與使命" },
          { href: "#section-3", label: "系所榮譽" },
          { href: "#section-4", label: "環境與設備" },
        ]}
      />

      <div className="interior-content">
        <section className="inner-section" id="section-1">
          <div className="container">
            <SectionTitle
              no="01"
              eyebrow="OUR HISTORY"
              heading="從臺灣出發的農經學術傳承"
              description="本系歷史可追溯至 1928 年臺北帝國大學設立的農業經濟講座，逐步建立完整的學士、碩士與博士教育體系。"
            />
            <div className="history-layout">
              {/* `.history-image` is a bare <div>, and its caption is a direct
                  <p> child (`.history-image p` sets the italic serif style). */}
              <div className="history-image">
                <img
                  src="/images/about/building-exterior.jpg"
                  alt="臺大農業經濟學系所在建築外觀"
                />
                <p>
                  Knowledge rooted in place, passed forward across generations.
                </p>
              </div>
              {/* <ol><li><strong> + <div> is load-bearing: `.timeline li` is a
                  100px/1fr grid whose first column is the <strong>. */}
              <ol className="timeline">
                {MILESTONES.map((item) => (
                  <li key={item.year}>
                    <strong>{item.year}</strong>
                    <div>
                      <h3>{item.title}</h3>
                      <p>{item.body}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        <section className="inner-section tint" id="section-2">
          <div className="container">
            <SectionTitle
              no="02"
              eyebrow="MISSION & VISION"
              heading="以世界一流之教學與研究，提升農業經濟學術地位"
            />
            <blockquote className="mission-quote">
              培育兼具農業專業知識、經濟分析能力、資料應用能力及國際視野之專業人才。
            </blockquote>
            {/* Cards must be <article>: `.principle-grid article` carries the
                border / min-height / padding, and the divider fix-ups are
                :nth-child(3) and :last-child. */}
            <div className="principle-grid">
              {PRINCIPLES.map((item) => (
                <article key={item.no}>
                  <span>{item.no}</span>
                  <h3>{item.title}</h3>
                  <p>{item.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="inner-section" id="section-3">
          <div className="container">
            <SectionTitle
              no="03"
              eyebrow="HONORS"
              heading="研究與人才，在世界舞臺持續被看見"
            />
            <div className="honor-grid">
              {HONORS.map((item) => (
                <article key={item.label}>
                  <strong>{item.label}</strong>
                  <p>{item.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="inner-section photo-band" id="section-4">
          <div className="container">
            <SectionTitle
              no="04"
              eyebrow="ENVIRONMENT"
              heading="讓學習、研究與交流自然發生"
            />
            {/* <figure>/<figcaption> can't be swapped for <div>s —
                `.about-photo-grid figure/img/figcaption` is the only hook. */}
            <div className="about-photo-grid">
              {PHOTOS.map((photo) => (
                <figure
                  key={photo.src}
                  className={photo.wide ? "about-photo-wide" : undefined}
                >
                  <img src={photo.src} alt={photo.alt} />
                  <figcaption>{photo.caption}</figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>
      </div>

      <NextRoute />
    </SiteShell>
  );
}
