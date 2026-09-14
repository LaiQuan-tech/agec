import type { LinkItem } from "@/lib/data";
import { translate, type Lang } from "@/lib/i18n";
import { STUDENTS } from "@/lib/i18n/students";
import type { StudentsCopy } from "@/lib/page-copy/students";
import { EYEBROWS } from "@/lib/i18n/eyebrows";
import { SiteShell } from "./SiteShell";
import { InteriorHero } from "./InteriorHero";
import { LocalNav } from "./LocalNav";
import { SectionTitle } from "./SectionTitle";
import { NextRoute } from "./NextRoute";
import { MaybeLink } from "./MaybeLink";

/**
 * 學生專區 (/students) — route 07 / 08.
 *
 * §1–§3 的文字來自 `copy`（page_copy 表，後台 /admin/students 編輯；缺什麼退回
 * lib/i18n/students.ts 的字典，見 lib/page-copy/students.ts）。每一區的小標與
 * 說明句仍是字典裡的固定文案。`.resource-row` in `#section-4` 是 links 表
 * section='students' 的八張卡。
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

export function Students({
  lang,
  studentLinks,
  copy,
}: {
  lang: Lang;
  /** getLinks("students") —— 已依 sort_order 排好。空陣列時 §4 只剩小標。 */
  studentLinks: LinkItem[];
  /** resolveStudentsCopy() 的結果 —— 永遠是完整的 4 步驟／1＋5 部門。 */
  copy: StudentsCopy;
}) {
  const t = translate(STUDENTS, lang);
  const eb = translate(EYEBROWS, lang);
  // 步驟編號印在卡片左上，是版面的一部分而不是文案 —— 固定 01–04。
  const STEP_NUMBERS = ["01", "02", "03", "04"];

  return (
    <SiteShell lang={lang} variant="interior">
      <InteriorHero
        lang={lang}
        slug="students"
        titleZh={STUDENTS.title.zh}
        titleEn={STUDENTS.title.en}
        routeNo="07"
        lead={t.hero.lead}
        imageAlt={t.hero.imageAlt}
      />
      <LocalNav lang={lang} label={t.nav.label} items={t.nav.items} />
      <div className="interior-content">
        <section className="inner-section" id="section-1">
          <div className="container">
            <SectionTitle
              no="01"
              eyebrow={eb.startHere}
              heading={t.section1.heading}
              description={t.section1.description}
            />
            {/* `.steps article` is the only card selector — no wrapper div. */}
            <div className="steps">
              {copy.steps.map((step, i) => (
                <article key={STEP_NUMBERS[i]}>
                  <span>{STEP_NUMBERS[i]}</span>
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
                eyebrow={eb.campusLife}
                heading={copy.campus.heading}
              />
              {/* Styled by `.student-life-grid>div>p` — a direct child only. */}
              <p>{copy.campus.body}</p>
              {/* 校園小地圖之類的外站網址。External, so MaybeLink gives it a
                  plain <a target="_blank" rel="noopener noreferrer"> rather
                  than a next/link route；系辦把網址清空時按鈕留著但沒有去處
                  （MaybeLink 不給 href、不印箭頭）。 */}
              <MaybeLink
                className="button gold"
                href={copy.campus.url}
                arrow={<span> ↗︎</span>}
              >
                {copy.campus.cta}
              </MaybeLink>
            </div>
            <img src="/images/hero.jpg" alt={t.section2.imageAlt} />
          </div>
        </section>

        <section className="inner-section" id="section-3">
          <div className="container">
            <SectionTitle
              no="03"
              eyebrow={eb.studentAssociation}
              heading={t.section3.heading}
            />
            <div className="association-chart">
              {/* `.leader:after` draws the 65px connector down to the branch
                  row, so the leader box has to be the first child here. */}
              <div className="leader">
                <h3>{copy.leader.title}</h3>
                <p>{copy.leader.body}</p>
              </div>
              <div className="association-branches">
                {copy.branches.map((branch, i) => (
                  // key 用位置：五個格位是固定的，名稱是系辦可以改的文字
                  //（兩個部門同名也不該讓 React 撞 key）。
                  <article key={i}>
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
            <SectionTitle
              no="04"
              eyebrow={eb.learningResources}
              heading={t.section4.heading}
              description={t.section4.description}
            />
            {/* `.resource-row a` carries every border, min-height and hover
                state, so a row with no url still renders an <a> — MaybeLink
                removes only the href. `label` arrives from lib/data.ts already
                in the page's language. */}
            <div className="resource-row">
              {studentLinks.map((link) => (
                <MaybeLink
                  key={link.id}
                  href={link.url}
                  arrow={<span> ↗︎</span>}
                >
                  {link.label}
                </MaybeLink>
              ))}
            </div>
          </div>
        </section>
      </div>
      <NextRoute lang={lang} />
    </SiteShell>
  );
}
