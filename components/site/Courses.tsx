import type { Course, Program } from "@/lib/data";
import { SiteShell } from "./SiteShell";
import { InteriorHero } from "./InteriorHero";
import { LocalNav } from "./LocalNav";
import { SectionTitle } from "./SectionTitle";
import { NextRoute } from "./NextRoute";
import { FilterTabs } from "./FilterTabs";

/**
 * 課程資訊 (/courses) — route 06 / 08.
 *
 * The only interior page whose hero is a looping <video> instead of a
 * <picture>, so there is no mobile art-directed still: the desktop hero image
 * doubles as the poster. `InteriorHero` handles that via its `video` prop.
 *
 * Two blocks read the DB (B-class): `.course-table` from getCourses and the
 * `.filter-tabs` labels from getPrograms. The rest is static copy (A-class) —
 * see the notes on DOCUMENTS / FORMS below.
 */

/**
 * `.document-grid` — 修業規定 PDF cards.
 *
 * ⚠️ Static on purpose, for now. These want `links.section = 'course_docs'`
 * plus a description and a file-type badge, but the `links` table has neither
 * those rows nor those columns, and `LinkItem["section"]` has no 'course_docs'
 * member. Copy is reproduced verbatim from the reference site so the port is
 * visually complete; move it to the DB once the schema gains those fields.
 *
 * site.css lays this out as `repeat(4,1fr)` → `repeat(2,1fr)` → `1fr`, so a
 * fifth card is safe geometrically but breaks the 2x2 pairing at 1180px.
 */
const DOCUMENTS = [
  {
    title: "大學部修業規定",
    description: "畢業學分、必修課程與跨域修課說明",
  },
  {
    title: "碩士班修業規定",
    description: "修業年限、學位考試與論文相關規範",
  },
  {
    title: "博士班修業規定",
    description: "資格考核、研究訓練與學位要求",
  },
  {
    title: "在職專班修業規定",
    description: "課程安排、專題研究與畢業要求",
  },
];

/**
 * `.resource-row` — 常用表格.
 *
 * ⚠️ Also static for now. Shape-wise this is a perfect fit for getLinks()
 * (label + url only), but the table has no `section = 'courses'` rows and the
 * `LinkItem["section"]` union does not accept that value either.
 */
const FORMS = ["選課相關表格", "學位考試申請", "離校程序表格", "研究計畫申請"];

/**
 * `.software-line` — A-class. site.css pins this to `repeat(7,1fr)` at desktop
 * (then 4, then 2), so the seven entries are a layout constant, not data.
 */
const SOFTWARE = ["STATA", "R", "PYTHON", "SAS", "SPSS", "MATLAB", "GAMS"];

export function Courses({
  courses,
  programs,
}: {
  courses: Course[];
  programs: Program[];
}) {
  /**
   * The reference site hard-codes five tabs (全部 + four programs), the last of
   * which reads 在職專班. The DB now stores 碩士在職專班 and the 國際專班 row
   * was dropped in the 2026 IA revision, so the labels are derived from
   * `programs` instead of copied — a hard-coded list would drift the moment the
   * client edits a program name, and these tabs are cosmetic anyway (see
   * FilterTabs: site.js never filtered the table).
   */
  const tabs = ["全部", ...programs.map((program) => program.name)];

  /**
   * getCourses() orders by `program` ascending, and Postgres collates the four
   * Chinese program names as 博士班 < 大學部 < 碩士在職專班 < 碩士班 — i.e. PhD
   * courses come first, which is the reverse of how every other page presents
   * the programs. Re-key the sort on the program's own `sort_order` so the
   * table reads 大學部 → 碩士班 → 博士班 → 在職專班 like the reference site.
   * Unknown program strings sort last rather than silently jumping to the top.
   */
  const programRank = new Map(programs.map((p) => [p.name, p.sort_order]));
  const rows = [...courses].sort((a, b) => {
    const rankA = programRank.get(a.program) ?? Number.MAX_SAFE_INTEGER;
    const rankB = programRank.get(b.program) ?? Number.MAX_SAFE_INTEGER;
    return rankA - rankB || a.code.localeCompare(b.code);
  });

  return (
    <SiteShell variant="interior">
      <InteriorHero
        slug="courses"
        title="課程資訊"
        titleEn="Courses & Curriculum"
        routeNo="06"
        lead="以經濟理論為基礎，連結資料分析、政策、產業、環境與國際視野，建立可自由探索的學習路徑。"
        imageAlt="農經系課堂與學生討論"
        video="/videos/courses.mp4"
      />
      <LocalNav
        label="課程資訊"
        items={[
          { href: "#section-1", label: "各學制課程表" },
          { href: "#section-2", label: "修業規定" },
          { href: "#section-3", label: "常用表格" },
          { href: "#section-4", label: "學習資源" },
        ]}
      />
      <div className="interior-content">
        <section className="inner-section" id="section-1">
          <div className="container">
            <SectionTitle
              no="01"
              eyebrow="CURRICULUM"
              heading="各學制課程表"
              description="依學制與課程類別快速篩選，完整課程內容及實際開課情形以最新公告為準。"
            />
            {/* No `onChange`: on the reference site these tabs only light up. */}
            <FilterTabs tabs={tabs} ariaLabel="課程學制篩選" />
            {/* `.course-table` is a 6-column grid declared on `.course-head`
                and on `.course-table>a` directly — every row must be an <a>
                holding exactly five <span>s plus the trailing <i>, or the
                columns stop lining up. */}
            <div className="course-table" role="table">
              <div className="course-head" role="row">
                <span>課號</span>
                <span>課程名稱</span>
                <span>學分</span>
                <span>學制</span>
                <span>類別</span>
              </div>
              {rows.map((course) => (
                // href="#" matches the reference site: there are no
                // per-course pages on either side, and `courses` has no url.
                <a href="#" role="row" key={course.id}>
                  <span>{course.code}</span>
                  <span>{course.name}</span>
                  <span>{course.credit}</span>
                  <span>{course.program}</span>
                  <span>{course.ctype}</span>
                  <i>↗</i>
                </a>
              ))}
            </div>
          </div>
        </section>

        <section className="inner-section tint" id="section-2">
          <div className="container">
            <SectionTitle no="02" eyebrow="DEGREE REQUIREMENTS" heading="修業規定" />
            <div className="document-grid">
              {DOCUMENTS.map((doc) => (
                <a href="#" key={doc.title}>
                  {/* `.document-grid>a>span` is the gold file-type badge —
                      it has to be a direct child span. */}
                  <span>PDF</span>
                  <h3>{doc.title}</h3>
                  <p>{doc.description}</p>
                  <i>下載 ↗</i>
                </a>
              ))}
            </div>
          </div>
        </section>

        <section className="inner-section" id="section-3">
          <div className="container">
            <SectionTitle no="03" eyebrow="FORMS" heading="常用表格" />
            {/* `.resource-row a` carries the cell borders and the 120px min
                height, so every cell stays an <a> even though the reference
                site's hrefs are all placeholders. */}
            <div className="resource-row">
              {FORMS.map((form) => (
                <a href="#" key={form}>
                  {form} <span>↗</span>
                </a>
              ))}
            </div>
          </div>
        </section>

        <section className="inner-section dark-section" id="section-4">
          <div className="container">
            <SectionTitle
              no="04"
              eyebrow="LEARNING RESOURCES"
              heading="讓資料成為理解世界的工具"
            />
            <div className="software-line">
              {SOFTWARE.map((name) => (
                <span key={name}>{name}</span>
              ))}
            </div>
          </div>
        </section>
      </div>
      <NextRoute />
    </SiteShell>
  );
}
