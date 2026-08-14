import { SiteShell } from "./SiteShell";
import { InteriorHero } from "./InteriorHero";
import { LocalNav } from "./LocalNav";
import { SectionTitle } from "./SectionTitle";
import { NextRoute } from "./NextRoute";

/**
 * 系友專區 (/alumni) — route 08 / 08.
 *
 * All four sections are hard-coded A-class copy. Two of them need explaining:
 *
 *   `#section-2` `.story-grid` — PORT-REPORT §2.3 marks this B-class
 *   (`getLinks("alumni")`) but flags 形狀不符, and the mismatch is fatal rather
 *   than cosmetic:
 *     - a card is `<a><small>eyebrow</small><h3>title</h3><span>action</span></a>`,
 *       while `links` only stores `label` / `url` / `sort_order` — the
 *       `eyebrow` and `action_label` columns do not exist (§2.4 table).
 *     - the three cards are not one homogeneous list: card 1 is a dated news
 *       item (`2026.07.06 · 系友榮耀`), cards 2–3 are CTAs whose eyebrows are
 *       English labels, so no single column could feed all three.
 *     - `.story-grid{grid-template-columns:repeat(3,1fr)}` is a fixed 3-up grid
 *       and `.story-grid a{min-height:300px}` + `.story-grid h3{margin:70px 0 20px}`
 *       assume all three children exist; the `alumni` section currently holds 2
 *       rows, which would leave a hole in the row and drop the card heights.
 *   So this is written as static copy, same reasoning as `.schedule-line` /
 *   `ol.timeline` elsewhere in the port.
 *
 *   `#section-3` — the only章節 in the whole site with no
 *   `header.inner-section-title`; the section's `.container` carries
 *   `.donation-grid` directly. Do not add a SectionTitle here.
 */

/** `.story-grid` — 3 cards, fixed 3-up grid. See the note above. */
const STORIES = [
  {
    eyebrow: "2026.07.06 · 系友榮耀",
    title: "四位系友榮獲第 8 屆百大青年農民",
    action: "閱讀消息 ↗",
  },
  {
    eyebrow: "ALUMNI GATHERING",
    title: "跨世代交流，讓經驗成為共同資產",
    action: "近期活動 ↗",
  },
  {
    eyebrow: "STAY CONNECTED",
    title: "更新系友資料，與母系保持聯繫",
    action: "聯絡我們 ↗",
  },
];

/**
 * `.archive-grid` — 3 cards. `article:first-child{border-left}` paints the
 * grid's left edge, so the count is baked into the borders: a 4th entry would
 * wrap onto a second row with no left border at all.
 */
const ARCHIVE_ITEMS = [
  { no: "01", title: "求學紀事", body: "從農經學習到公共服務的生命軌跡" },
  { no: "02", title: "捐贈書目", body: "中文、英文、日文著作與期刊典藏" },
  { no: "03", title: "影像史料", body: "珍貴照片與重要紀念活動紀錄" },
];

/** `.alumni-sectors` — 5 tags; `grid-template-columns:repeat(5,1fr)`. */
const SECTORS = [
  "GOVERNMENT",
  "ACADEMIA",
  "FINANCE",
  "AGRIBUSINESS",
  "INTERNATIONAL",
];

export function Alumni() {
  return (
    <SiteShell variant="interior">
      <InteriorHero
        slug="alumni"
        title="系友專區"
        titleEn="Alumni"
        routeNo="08"
        lead="連結跨世代農經人，分享專業歷程、保存共同記憶，並以回饋延續下一代的學習與研究。"
        imageAlt="臺大椰林大道與騎乘腳踏車的學生"
      />

      <LocalNav
        label="系友專區"
        items={[
          { href: "#section-1", label: "傑出系友" },
          { href: "#section-2", label: "系友動態" },
          { href: "#section-3", label: "支持農經" },
          { href: "#section-4", label: "李登輝系友專區" },
        ]}
      />

      <div className="interior-content">
        <section className="inner-section" id="section-1">
          <div className="container">
            <SectionTitle
              no="01"
              eyebrow="DISTINGUISHED ALUMNI"
              heading={
                <>
                  農經人的影響力
                  <br />
                  遍及產官學研
                </>
              }
              description="從公共政策、學術研究到金融與農企業，系友以專業回應社會需求，也成為下一代的典範。"
            />
            {/* Exactly two children: `.alumni-feature` is a .85fr/1.15fr grid
                whose text column is addressed as `.alumni-feature>div` and whose
                photo must be a direct `<img>` child, not wrapped. */}
            <div className="alumni-feature">
              <div>
                <span>PUBLIC LEADERSHIP</span>
                <h3>
                  以農經訓練理解土地、
                  <br />
                  產業與人的關係。
                </h3>
                <p>
                  傑出系友專區將以人物故事呈現專業歷程與社會影響，建立可持續累積的系友知識典藏。
                </p>
                {/* Placeholder anchor, as on the reference site. */}
                <a href="#">探索系友故事 →</a>
              </div>
              <img src="/images/building.jpg" alt="臺大農業綜合館" />
            </div>
            <div className="alumni-sectors">
              {SECTORS.map((sector) => (
                <span key={sector}>{sector}</span>
              ))}
            </div>
          </div>
        </section>

        <section className="inner-section tint" id="section-2">
          <div className="container">
            {/* No description on this one — the reference site's second <div>
                holds only the <h2>. */}
            <SectionTitle no="02" eyebrow="ALUMNI NEWS" heading="持續發生的系友情誼" />
            <div className="story-grid">
              {STORIES.map((story) => (
                <a key={story.title} href="#">
                  <small>{story.eyebrow}</small>
                  <h3>{story.title}</h3>
                  <span>{story.action}</span>
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* The one section with no `header.inner-section-title`: `.donation-grid`
            is a class on the `.container` itself. */}
        <section className="inner-section donation-section" id="section-3">
          <div className="container donation-grid">
            <div>
              <p className="eyebrow light">SUPPORT AGEC</p>
              <h2>
                讓一份支持，
                <br />
                成為下一代的機會。
              </h2>
            </div>
            <div>
              <p>
                系友捐贈支持獎助學金、國際交流、研究設備與學生活動，讓農經教育持續回應新時代的挑戰。
              </p>
              <a className="button gold" href="#">
                前往捐贈專區 ↗
              </a>
            </div>
          </div>
        </section>

        <section className="inner-section" id="section-4">
          <div className="container">
            <SectionTitle
              no="04"
              eyebrow="LEE TENG-HUI ARCHIVE"
              heading="李登輝系友專區"
              description="彙整求學紀事、珍貴照片、著作、捐贈書目與紀念活動，保存系友與母系之間的歷史連結。"
            />
            {/* `<article>` is the only selector `.archive-grid` uses for its
                cards (border / min-height / padding all hang off it). */}
            <div className="archive-grid">
              {ARCHIVE_ITEMS.map((item) => (
                <article key={item.no}>
                  <span>{item.no}</span>
                  <h3>{item.title}</h3>
                  <p>{item.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      </div>

      <NextRoute />
    </SiteShell>
  );
}
