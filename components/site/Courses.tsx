import type { Course, SiteDocument, Program } from "@/lib/data";
import { translate, type Lang } from "@/lib/i18n";
import { COURSES } from "@/lib/i18n/courses";
import { EYEBROWS } from "@/lib/i18n/eyebrows";
import { SiteShell } from "./SiteShell";
import { InteriorHero } from "./InteriorHero";
import { LocalNav } from "./LocalNav";
import { SectionTitle } from "./SectionTitle";
import { NextRoute } from "./NextRoute";
import { SiteDocuments } from "./SiteDocuments";
import { CourseTable } from "./CourseTable";
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

export function Courses({
  lang,
  courses,
  programs,
  courseDocuments,
}: {
  lang: Lang;
  courses: Course[];
  programs: Program[];
  /**
   * 系上表單（`documents` 表 section='courses'）。空陣列時 SiteDocuments
   * 整區不印。掛在 §2 而不是 §3 —— §3 現在整段是臺大官方系統的入口。
   */
  courseDocuments: SiteDocument[];
}) {
  const t = translate(COURSES, lang);
  const eb = translate(EYEBROWS, lang);

  /**
   * The reference site hard-codes five tabs (全部 + four programs), the last of
   * which reads 在職專班. The DB now stores 碩士在職專班 and the 國際專班 row
   * was dropped in the 2026 IA revision, so the labels are derived from
   * `programs` instead of copied — a hard-coded list would drift the moment the
   * client edits a program name.
   *
   * ⚠️ 四個學制**全部列出**，即使某一個目前一門課都沒有（`courses` 現在
   * 只有 6 列，碩士在職專班是 0）。藏起來會讓讀者以為系上沒有那個學制 ——
   * 而 /admissions 那一頁正列著四個。空的學制由 CourseTable 印一句
   * 「這個學制目前沒有課程」，那是資料還沒補齊，不是結構上不存在。
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
              eyebrow={eb.curriculum}
              heading={t.section1.heading}
              description={t.section1.description}
            />
            {/* 籤與表格一起交給 client 元件：這排籤現在真的會篩。
                以前只會亮不會篩（參考站行為），見 CourseTable 的檔頭。 */}
            <CourseTable lang={lang} rows={rows} tabs={tabs} />
          </div>
        </section>

        <section className="inner-section tint" id="section-2">
          <div className="container">
            <SectionTitle
              no="02"
              eyebrow={eb.degreeRequirements}
              heading={t.section2.heading}
            />
            {/* `.document-grid` — 修業規定 cards.
                The four department PDFs are static placeholders for now. They want
                `links.section = 'course_docs'` plus a description and a
                file-type badge, but the `links` table has neither those rows
                nor those columns, and `LinkItem["section"]` has no
                'course_docs' member. Copy is reproduced verbatim from the
                reference site so the port is visually complete; move it to the
                DB once the schema gains those fields.

                The first four are pending department PDFs; the final two are
                maintained by NTU and therefore link to the official sites. */}
            <div className="document-grid">
              {t.documents.map((doc) => (
                <MaybeLink
                  href={doc.url || null}
                  key={doc.title}
                  // `.document-grid i` is the gold action footer, absolutely
                  // positioned at the card's bottom-left. It is the card's call
                  // to action, so it appears only once there is a file to open.
                  arrow={<i>{doc.action} ↗︎</i>}
                >
                  {/* `.document-grid>a>span` is the gold file-type badge —
                      it has to be a direct child span. */}
                  <span>{doc.type}</span>
                  <h3>{doc.title}</h3>
                  <p>{doc.description}</p>
                </MaybeLink>
              ))}
            </div>

            {/* 系上表單，接在四份修業規定與兩個臺大入口後面。
                同一區是因為它們是同一類東西：系上自己的文件。§3 已經整段
                讓給臺大的官方系統了，把系辦上傳的檔案放進去會讓那個標題
                名實不符。一個檔都沒有時整區（含小標）不印。 */}
            <SiteDocuments
              lang={lang}
              documents={courseDocuments}
              heading={t.section3.forms.heading}
              description={t.section3.forms.description}
            />
          </div>
        </section>

        <section className="inner-section" id="section-3">
          <div className="container">
            <SectionTitle
              no="03"
              eyebrow={eb.courseResources}
              heading={t.section3.heading}
              description={t.section3.description}
            />
            <div className="resource-row">
              {t.section3.links.map((link) => (
                <MaybeLink
                  href={link.url}
                  key={link.url}
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
