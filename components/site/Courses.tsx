import type { Course, LinkItem, Program } from "@/lib/data";
import { translate, type Lang } from "@/lib/i18n";
import { COURSES } from "@/lib/i18n/courses";
import { SiteShell } from "./SiteShell";
import { InteriorHero } from "./InteriorHero";
import { LocalNav } from "./LocalNav";
import { SectionTitle } from "./SectionTitle";
import { NextRoute } from "./NextRoute";
import { FilterTabs } from "./FilterTabs";
import { MaybeLink } from "./MaybeLink";

/**
 * 課程資訊 (/courses) — route 06 / 08.
 *
 * The only interior page whose hero is a looping <video> instead of a
 * <picture>, so there is no mobile art-directed still: the desktop hero image
 * doubles as the poster. `InteriorHero` handles that via its `video` prop.
 *
 * Two blocks read the DB (B-class): `.course-table` from getCourses and the
 * `.filter-tabs` labels from getPrograms. The rest is static copy (A-class)
 * and lives in lib/i18n/courses.ts.
 *
 * ⚠️ This page joins two tables on a *text* key — `courses.program` against
 * `programs.name` — in two places (the sort and the tabs). Both must match on
 * the Chinese value: `Program.name` is the translated display name, so keying
 * either of them on it works in Chinese and silently fails in English. See
 * `programRank` and `tabs` below.
 */

/**
 * `.software-line` — A-class. site.css pins this to `repeat(7,1fr)` at desktop
 * (then 4, then 2), so the seven entries are a layout constant, not data.
 * Not in the dictionary: they are product names, identical in both languages.
 */
const SOFTWARE = ["STATA", "R", "PYTHON", "SAS", "SPSS", "MATLAB", "GAMS"];

export function Courses({
  lang,
  courses,
  programs,
  links,
}: {
  lang: Lang;
  courses: Course[];
  programs: Program[];
  links: LinkItem[];
}) {
  const t = translate(COURSES, lang);

  /**
   * `.resource-row` — 常用表格. Falls back to the reference site's four labels
   * when the section has no rows, so the four-column grid never renders empty.
   * DB rows arrive from lib/data.ts already resolved to the page's language,
   * the fallback comes from the dictionary — `label` is ready to print either
   * way, and must not be translated again here.
   */
  const forms: { id: number; label: string; url: string | null }[] =
    links.length > 0
      ? links
      : t.formsFallback.map((label, i) => ({ id: -(i + 1), label, url: null }));

  /**
   * The reference site hard-codes five tabs (全部 + four programs), the last of
   * which reads 在職專班. The DB now stores 碩士在職專班 and the 國際專班 row
   * was dropped in the 2026 IA revision, so the labels are derived from
   * `programs` instead of copied — a hard-coded list would drift the moment the
   * client edits a program name, and these tabs are cosmetic anyway (see
   * FilterTabs: site.js never filtered the table).
   *
   * `value` is the Chinese name and `label` the translated one, per FilterTab:
   * the value is a match key against `courses.program`, which is always
   * Chinese. "全部" keeps its Chinese value in both languages for the same
   * reason — it is the sentinel, not a label.
   */
  const tabs = [
    { value: "全部", label: t.tabs.all },
    ...programs.map((program) => ({
      value: program.name_zh,
      label: program.name,
    })),
  ];

  /**
   * getCourses() orders by `program` ascending, and Postgres collates the four
   * Chinese program names as 博士班 < 大學部 < 碩士在職專班 < 碩士班 — i.e. PhD
   * courses come first, which is the reverse of how every other page presents
   * the programs. Re-key the sort on the program's own `sort_order` so the
   * table reads 大學部 → 碩士班 → 博士班 → 在職專班 like the reference site.
   * Unknown program strings sort last rather than silently jumping to the top.
   *
   * ⚠️ The map is keyed on `name_zh`, never `name`. `Course.program` is always
   * the Chinese value; on /en `Program.name` is the English one, so keying on
   * it would make every lookup miss, drop every course to MAX_SAFE_INTEGER and
   * leave the table in raw Postgres collation order — with no error anywhere.
   */
  const programRank = new Map(programs.map((p) => [p.name_zh, p.sort_order]));
  const rows = [...courses].sort((a, b) => {
    const rankA = programRank.get(a.program) ?? Number.MAX_SAFE_INTEGER;
    const rankB = programRank.get(b.program) ?? Number.MAX_SAFE_INTEGER;
    return rankA - rankB || a.code.localeCompare(b.code);
  });

  return (
    <SiteShell lang={lang} variant="interior">
      <InteriorHero
        lang={lang}
        slug="courses"
        titleZh={COURSES.title.zh}
        titleEn={COURSES.title.en}
        routeNo="06"
        lead={t.hero.lead}
        imageAlt={t.hero.imageAlt}
        video="/videos/courses.mp4"
      />
      <LocalNav lang={lang} label={t.nav.label} items={t.nav.items} />
      <div className="interior-content">
        <section className="inner-section" id="section-1">
          <div className="container">
            <SectionTitle
              no="01"
              eyebrow="CURRICULUM"
              heading={t.section1.heading}
              description={t.section1.description}
            />
            {/* No `onChange`: on the reference site these tabs only light up. */}
            <FilterTabs tabs={tabs} ariaLabel={t.tabs.ariaLabel} />
            {/* `.course-table` is a 6-column grid declared on `.course-head`
                and on `.course-table>a` directly — every row must be an <a>
                holding exactly five <span>s plus the trailing <i>, or the
                columns stop lining up. */}
            <div className="course-table" role="table">
              <div className="course-head" role="row">
                <span>{t.table.code}</span>
                <span>{t.table.name}</span>
                <span>{t.table.credit}</span>
                <span>{t.table.program}</span>
                <span>{t.table.ctype}</span>
              </div>
              {rows.map((course) => (
                // Not clickable: there is no per-course page on either site and
                // `courses` has no url column, so the reference site's
                // `href="#"` was a row that looked like a link and scrolled to
                // the top. MaybeLink keeps the <a> the grid needs and drops the
                // behaviour. Give the table a destination by adding
                // `courses.url` and passing it here.
                <MaybeLink href={null} role="row" key={course.id}>
                  <span>{course.code}</span>
                  <span>{course.name}</span>
                  <span>{course.credit}</span>
                  {/* `program_label`, not `program`: the latter is the Chinese
                      match key the sort above needs and would print Chinese
                      into an otherwise English table. */}
                  <span>{course.program_label}</span>
                  <span>{course.ctype}</span>
                </MaybeLink>
              ))}
            </div>
          </div>
        </section>

        <section className="inner-section tint" id="section-2">
          <div className="container">
            <SectionTitle
              no="02"
              eyebrow="DEGREE REQUIREMENTS"
              heading={t.section2.heading}
            />
            {/* `.document-grid` — 修業規定 PDF cards.
                ⚠️ Static on purpose, for now. These want
                `links.section = 'course_docs'` plus a description and a
                file-type badge, but the `links` table has neither those rows
                nor those columns, and `LinkItem["section"]` has no
                'course_docs' member. Copy is reproduced verbatim from the
                reference site so the port is visually complete; move it to the
                DB once the schema gains those fields.

                site.css lays this out as `repeat(4,1fr)` → `repeat(2,1fr)` →
                `1fr`, so a fifth card is safe geometrically but breaks the 2x2
                pairing at 1180px. */}
            <div className="document-grid">
              {t.documents.map((doc) => (
                // No URLs for these PDFs anywhere yet — see the note above.
                <MaybeLink
                  href={null}
                  key={doc.title}
                  // `.document-grid i` is the gold "下載 ↗" footer, absolutely
                  // positioned at the card's bottom-left. It is the card's call
                  // to action, so it appears only once there is a file to open.
                  arrow={<i>{t.download} ↗︎</i>}
                >
                  {/* `.document-grid>a>span` is the gold file-type badge —
                      it has to be a direct child span. */}
                  <span>PDF</span>
                  <h3>{doc.title}</h3>
                  <p>{doc.description}</p>
                </MaybeLink>
              ))}
            </div>
          </div>
        </section>

        <section className="inner-section" id="section-3">
          <div className="container">
            <SectionTitle no="03" eyebrow="FORMS" heading={t.section3.heading} />
            {/* `.resource-row a` carries the cell borders and the 120px min
                height, so every cell stays an <a> — MaybeLink only removes the
                href when the row has no url, which is most of them until the
                office fills them in at /admin/links. */}
            <div className="resource-row">
              {forms.map((form) => (
                <MaybeLink
                  href={form.url}
                  key={form.id}
                  arrow={<span> ↗︎</span>}
                >
                  {form.label}
                </MaybeLink>
              ))}
            </div>
          </div>
        </section>

        <section className="inner-section dark-section" id="section-4">
          <div className="container">
            <SectionTitle
              no="04"
              eyebrow="LEARNING RESOURCES"
              heading={t.section4.heading}
            />
            <div className="software-line">
              {SOFTWARE.map((name) => (
                <span key={name}>{name}</span>
              ))}
            </div>
          </div>
        </section>
      </div>
      <NextRoute lang={lang} />
    </SiteShell>
  );
}
