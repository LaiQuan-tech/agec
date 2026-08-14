import type { LinkItem } from "@/lib/data";
import { SiteShell } from "./SiteShell";
import { InteriorHero } from "./InteriorHero";
import { LocalNav } from "./LocalNav";
import { SectionTitle } from "./SectionTitle";
import { NextRoute } from "./NextRoute";

/**
 * 學生專區 (/students) — route 07 / 08.
 *
 * Three of the four sections are static copy (A-class); only `.resource-row`
 * in `#section-4` reads the DB via getLinks("students").
 *
 * `.steps` and `.association-branches` are deliberately hard-coded. site.css
 * draws their dividers positionally:
 *   .steps article{border-right:0} + .steps article:last-child{border-right:1px}
 *   @1180 .steps{grid-template-columns:repeat(2,1fr)}
 *          .steps article:nth-child(3){border-left:1px}
 *   .association-branches article:first-child{border-left:1px}
 *   @1180 .association-branches{repeat(2,1fr)} … @600 {1fr}
 * A fifth step or a sixth branch would draw borders in the wrong cells at the
 * 1180px breakpoint while still looking correct on a desktop viewport — the
 * easiest kind of regression to miss. Keep these counts at 4 and 5.
 */

/** `.steps` — 新生攻略, exactly four. */
const STEPS = [
  {
    no: "01",
    title: "完成入學程序",
    body: "註冊、學雜費、健康檢查與學生證辦理。",
  },
  {
    no: "02",
    title: "安排校園生活",
    body: "住宿申請、交通、餐飲與學生服務。",
  },
  {
    no: "03",
    title: "認識課程系統",
    body: "選課、學分規劃與跨域學習資源。",
  },
  {
    no: "04",
    title: "加入農經社群",
    body: "迎新、系學會、導生與同儕支持。",
  },
];

/** `.association-branches` — 系學會五個部門, exactly five. */
const BRANCHES = [
  { name: "活動部", body: "活動籌備・企劃發想" },
  { name: "公關部", body: "系間交流・社群資訊" },
  { name: "文書部", body: "會議記錄・內容製作" },
  { name: "總務部", body: "預算與費用管理" },
  { name: "美宣部", body: "視覺設計・文宣製作" },
];

export function Students({ links }: { links: LinkItem[] }) {
  return (
    <SiteShell variant="interior">
      <InteriorHero
        slug="students"
        title="學生專區"
        titleEn="Students"
        routeNo="07"
        lead="從入學準備、校園生活到學習資源，讓每一位農經學生都能清楚找到下一步。"
        imageAlt="農業綜合館周邊校園環境"
      />
      <LocalNav
        label="學生專區"
        items={[
          { href: "#section-1", label: "新生攻略" },
          { href: "#section-2", label: "校園生活" },
          { href: "#section-3", label: "系學會" },
          { href: "#section-4", label: "常用資源" },
        ]}
      />
      <div className="interior-content">
        <section className="inner-section" id="section-1">
          <div className="container">
            <SectionTitle
              no="01"
              eyebrow="START HERE"
              heading="新生攻略"
              description="把重要流程整理成可依序完成的清單，安心展開在臺大的第一學期。"
            />
            {/* `.steps article` is the only card selector — no wrapper div. */}
            <div className="steps">
              {STEPS.map((step) => (
                <article key={step.no}>
                  <span>{step.no}</span>
                  <h3>{step.title}</h3>
                  <p>{step.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="inner-section student-life" id="section-2">
          {/* `.student-life-grid>img` must stay a direct child: the two-column
              grid places the copy block and the photo as siblings. */}
          <div className="container student-life-grid">
            <div>
              <SectionTitle
                no="02"
                eyebrow="CAMPUS LIFE"
                heading="從農綜館開始，認識臺大生活"
              />
              {/* Styled by `.student-life-grid>div>p` — a direct child only. */}
              <p>
                小地圖整理農業綜合館周邊的學生餐廳、教學館與日常服務；椰林攻略則提供選課、校園資源與系所資訊，讓新生更快融入。
              </p>
              <a className="button gold" href="#">
                開啟校園小地圖 ↗
              </a>
            </div>
            <img src="/images/hero.jpg" alt="臺大椰林大道" />
          </div>
        </section>

        <section className="inner-section" id="section-3">
          <div className="container">
            <SectionTitle
              no="03"
              eyebrow="STUDENT ASSOCIATION"
              heading="由學生共同創造的農經生活"
            />
            <div className="association-chart">
              {/* `.leader:after` draws the 65px connector down to the branch
                  row, so the leader box has to be the first child here. */}
              <div className="leader">
                <h3>會長・副會長</h3>
                <p>統籌組織方向與跨部門協作</p>
              </div>
              <div className="association-branches">
                {BRANCHES.map((branch) => (
                  <article key={branch.name}>
                    <h3>{branch.name}</h3>
                    <p>{branch.body}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="inner-section tint" id="section-4">
          <div className="container">
            <SectionTitle no="04" eyebrow="QUICK ACCESS" heading="常用資源" />
            {/* `.resource-row a` carries every border, min-height and hover
                state — a placeholder row must still render an <a>, exactly as
                the reference site does with href="#". */}
            <div className="resource-row">
              {links.map((link) => (
                <a key={link.id} href={link.url || "#"}>
                  {link.label} <span>↗</span>
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
