import Link from "next/link";
import type { NewsItem, Program } from "@/lib/data";
import { SiteShell } from "./SiteShell";
import { HomeHero } from "./HomeHero";
import { formatNewsDate } from "./format";
import { padNo } from "./nav";

/**
 * 首頁 (/) — the only page with its own layout; the other 7 share
 * `.interior-page`.
 *
 * Section ids are deliberately offset from their content (`#about` on the intro
 * band, `#people` on the campus band, `#courses`/`#students` on two of the
 * `.admissions-links` anchors). That's what makes the menu overlay and the
 * institution bar's utility anchors all land somewhere on this page — don't
 * "tidy" them.
 *
 * Static copy lives here (A-class). Two blocks read the DB (B-class):
 * `.feature-story` + `.news-list` from getNewsHome, `.admission-grid` from
 * getPrograms.
 */

/** Four research areas. Deliberately hard-coded: these same four strings are
 *  also the value domain of `faculty.fields`, so keeping one copy in code beats
 *  two copies that can drift. */
const RESEARCH_AREAS = [
  { zh: "政策、制度與發展", en: "Policy, Institutions & Development" },
  { zh: "運銷、貿易與消費", en: "Marketing, Trade & Consumption" },
  { zh: "生產、管理與行為", en: "Production, Management & Behavior" },
  { zh: "土地、資源與環境", en: "Land, Resources & Environment" },
];

/** `.stat-row`. Reads like data, but it's editorial copy — and site.css pins the
 *  divider borders with `:last-child` / `:nth-child`, so a fifth entry would
 *  break the grid at 860px. */
const STATS = [
  { value: "1928", label: "學術源流" },
  { value: "4", label: "核心研究領域" },
  { value: "4", label: "完整學制" },
  { value: "∞", label: "跨域與國際連結" },
];

export function Home({
  newsHome,
  programs,
}: {
  newsHome: NewsItem[];
  programs: Program[];
}) {
  const [feature, ...rest] = newsHome;
  // `.admission-card` hard-assumes exactly four cards across four different
  // positional rules (last-child, nth-child(2), nth-child(-n+2), plus a 600px
  // override). A fifth program row would draw borders in the wrong places at
  // 1180px, so the home page shows the first four only.
  const cards = programs.slice(0, 4);

  return (
    <SiteShell variant="home">
      <HomeHero />

      <section className="intro section" id="about">
        <div className="container intro-grid">
          <div>
            <p className="eyebrow">WHO WE ARE · 本系簡介</p>
            <span className="section-number">01</span>
          </div>
          <div>
            <h2>
              農業不只關於生產，
              <br />
              更關於每一個人的未來。
            </h2>
            <div className="intro-body">
              <p>
                本系以嚴謹的經濟分析與實證研究，回應糧食安全、氣候變遷、國際貿易與產業轉型。近百年的學術傳承，持續轉化為面向世界的知識與行動。
              </p>
              <a className="inline-link" href="#research">
                認識我們的使命 <span>↗</span>
              </a>
            </div>
          </div>
        </div>
        {/* Bare <div> children: site.css draws every column divider through
            `.stat-row div` + positional selectors. A <StatItem> component that
            emitted an extra wrapper, or <li>s, would silently lose all of it. */}
        <div className="container stat-row" aria-label="本系概況">
          {STATS.map((stat) => (
            <div key={stat.label}>
              <strong>{stat.value}</strong>
              <span>{stat.label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="news-section section" id="news">
        <div className="container section-heading-row">
          <div>
            <p className="eyebrow">LATEST · 最新動態</p>
            <h2>
              觀點持續發生，
              <br />
              知識正在流動。
            </h2>
          </div>
          <Link className="circle-link" href="/news" aria-label="查看全部消息">
            全部
            <br />
            消息 ↗
          </Link>
        </div>
        <div className="container news-layout" id="news-list">
          {feature ? (
            <article className="feature-story">
              {/* Direct <img> child — `.feature-story img` positions it
                  absolutely as the full-bleed background. */}
              <img
                src={feature.cover_url ?? "/images/auditorium.jpg"}
                alt={feature.cover_url ? feature.title : "農經系大講堂"}
              />
              <div className="feature-overlay">
                <p>FEATURED · {feature.category}</p>
                <h3>{feature.title}</h3>
                <Link href="/news">
                  掌握近期演講 <span>→</span>
                </Link>
              </div>
            </article>
          ) : null}
          <div className="news-list">
            {rest.map((item) => {
              const date = formatNewsDate(item.published_at);
              return (
                <Link className="news-item" href="/news" key={item.id}>
                  {/* `.news-item time strong` / `time span` — the <time> needs
                      exactly these two element children. */}
                  <time dateTime={item.published_at.slice(0, 10)}>
                    <strong>{date.monthDay}</strong>
                    <span>{date.year}</span>
                  </time>
                  <div>
                    <span className="tag">{item.category}</span>
                    <h3>{item.title}</h3>
                  </div>
                  <span className="news-arrow">↗</span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="research section" id="research">
        <div className="container research-intro">
          <p className="eyebrow light">RESEARCH · 研究領域</p>
          <h2>
            從土地到全球市場，
            <br />
            以研究推動更好的選擇。
          </h2>
          <p>
            我們將經濟理論、計量方法與資料科學帶進真實世界，讓研究成果成為政策、產業與社會的決策依據。
          </p>
        </div>
        <div className="container research-list">
          {RESEARCH_AREAS.map((area, i) => (
            <a href="#research" className="research-item" key={area.zh}>
              <span>{padNo(i + 1)}</span>
              <h3>{area.zh}</h3>
              <p>{area.en}</p>
              <i>↗</i>
            </a>
          ))}
        </div>
      </section>

      <section className="admissions section" id="admissions">
        <div className="container admissions-heading">
          <div>
            <p className="eyebrow">STUDY WITH US · 招生資訊</p>
            <h2>
              在這裡，建立改變
              <br />
              農業與世界的能力。
            </h2>
          </div>
          <p>
            無論你正展開大學旅程、深化研究，或將實務經驗帶回課堂，都能找到適合自己的學習路徑。
          </p>
        </div>
        <div className="container admission-grid">
          {cards.map((program, i) => (
            <a className="admission-card" href="#admissions" key={program.id}>
              <span className="card-no">{padNo(i + 1)}</span>
              <div>
                <small>{program.name_en}</small>
                <h3>{program.name}</h3>
                <p>{program.description}</p>
              </div>
              <span className="card-arrow">→</span>
            </a>
          ))}
        </div>
        {/* The first two are nav routes carrying the `#courses` / `#students`
            anchor targets the menu overlay links to. */}
        <div className="container admissions-links">
          <Link href="/courses" id="courses">
            課程資訊 ↗
          </Link>
          <Link href="/students" id="students">
            學生專區 ↗
          </Link>
          <Link href="/admissions">重要招生時程 ↗</Link>
        </div>
      </section>

      <section className="campus section" id="people">
        <div className="container campus-grid">
          <div className="campus-copy">
            <p className="eyebrow">OUR PLACE · 我們所在之處</p>
            <h2>
              扎根臺灣，
              <br />
              面向世界。
            </h2>
            <p>
              在農業綜合館裡，教學、研究與交流每天發生。從一場課堂討論，到一項跨國研究合作，讓知識走出校園、進入真實世界。
            </p>
            <Link className="button dark" href="/faculty">
              認識系所成員 <span>↗</span>
            </Link>
          </div>
          {/* <figure>/<figcaption> are load-bearing: `.campus figure` and
              `.campus figure img` are the only selectors that reach these. */}
          <figure className="campus-main">
            <img src="/images/building.jpg" alt="臺大農業綜合館入口" />
          </figure>
          <figure className="campus-small">
            <img src="/images/office.jpg" alt="農經系辦公室" />
          </figure>
          <div className="campus-note">
            <span>25.0173° N</span>
            <span>121.5398° E</span>
            <p>
              National Taiwan University
              <br />
              Taipei, Taiwan
            </p>
          </div>
        </div>
      </section>

      <section className="closing" id="alumni">
        {/* `.closing>img` — must stay a direct child or it stops being the
            absolutely-positioned backdrop and renders inline. */}
        <img
          src="/images/home-closing-agec.jpg"
          alt="國立臺灣大學農業經濟學系識別標誌與苔蘚植栽牆"
        />
        <div className="container closing-content">
          <p className="eyebrow light">FROM NTU TO THE WORLD</p>
          <h2>
            下一個影響農業未來的答案，
            <br />
            從這裡開始。
          </h2>
          <div>
            <Link className="button gold" href="/admissions">
              加入臺大農經 <span>↗</span>
            </Link>
            <Link className="text-action light-action" href="/alumni">
              系友專區 <span>→</span>
            </Link>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
