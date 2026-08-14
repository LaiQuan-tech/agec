import type { Faculty as FacultyMember } from "@/lib/data";
import { SiteShell } from "./SiteShell";
import { InteriorHero } from "./InteriorHero";
import { LocalNav } from "./LocalNav";
import { SectionTitle } from "./SectionTitle";
import { NextRoute } from "./NextRoute";
import { FacultyCard } from "./FacultyCard";
import { FacultyFilterGrid } from "./FacultyFilterGrid";

/**
 * 系所成員 (/faculty) — route 04 / 08. The most layout-heavy of the eight
 * pages: 37 people, seven `category` values and *four* unrelated card shapes.
 *
 * | 區塊       | 容器                          | 版型                                   |
 * |------------|-------------------------------|----------------------------------------|
 * | #section-1 | `.faculty-grid`               | 標準卡（含 `.faculty-category`）22 人   |
 * | #section-2 | `.faculty-grid-secondary`     | 標準卡（去掉分類）— 同 10 人再印一次    |
 * | #section-3 | `.visiting-profile-list`      | `figure` + `<dl>`，1 人                 |
 * | #section-3 | `.legacy-resume-list` × 2     | 無照片履歷列（英文名 + 經歷），5 + 6 人 |
 * | #section-4 | `.admin-grid`                 | 深底行政卡，3 人                        |
 *
 * ⚠️ `#section-2` is a *re-render of the same ten people* as the tail of
 * `#section-1`, not ten more members. The reference HTML does exactly this and
 * the seed SQL counts them once. Do not "fix" it into a distinct list.
 *
 * ⚠️ Photo filenames are numbered out of step with the display order (楊子霆
 * is 13th but uses `23-…jpg`, and `13-…jpg` belongs to the visiting professor,
 * who is 23rd). Filenames therefore always come from the row's `photo_url` —
 * never from an array index.
 *
 * Null-safety is not defensive padding here: every optional column is genuinely
 * absent for some category (no photo for 14 people, no email for the visiting
 * professor, no `fields` for the legacy and admin rows, `name_en`/`experience`
 * only for the legacy rows), and the two 2026 migrations may not have run yet
 * on the live DB, in which case `getFaculty()` degrades to an empty array.
 */

/** Categories whose members get their own, non-card layout. */
const VISITING = "客座教師";
const EMERITUS = "名譽教授";
const RETIRED = "退休師資";
const ADMINISTRATION = "行政同仁";

/**
 * `#section-2` shows the 合聘 + 兼任 subset of the standard cards. Selecting by
 * category (rather than slicing the last ten) keeps the section honest if the
 * department ever hires a thirteenth 專任 member.
 */
const AFFILIATED = ["合聘師資", "兼任師資"];

/** `details.legacy-group` — native disclosure, no JS anywhere in the port.
 *
 * site.css depends on the real element: `.legacy-group[open]>.legacy-group-title i`
 * rotates the ＋ into an ✕, `.legacy-group-title::-webkit-details-marker` hides
 * the native triangle, and `.legacy-group+.legacy-group{margin-top:72px}` is the
 * only adjacent-sibling selector in the whole stylesheet — so the three groups
 * must be siblings with nothing wrapped around them.
 */
function LegacyGroup({
  eyebrow,
  heading,
  children,
}: {
  eyebrow: string;
  heading: string;
  children: React.ReactNode;
}) {
  return (
    <details className="legacy-group">
      <summary className="legacy-group-title">
        <span>{eyebrow}</span>
        <h3>{heading}</h3>
        <i aria-hidden="true">＋</i>
      </summary>
      {children}
    </details>
  );
}

/**
 * `.legacy-resume-list` — 名譽教授 and 退休師資. Three grid columns per row:
 * name block / career block / mailto. The middle `<div>` is rendered even when
 * `experience` is null so the mailto stays in the third column.
 */
function LegacyResumeList({ members }: { members: FacultyMember[] }) {
  return (
    <div className="legacy-resume-list">
      {members.map((member) => (
        <article key={member.id}>
          <div className="legacy-person-name">
            {member.name_en ? <p>{member.name_en}</p> : null}
            <h4>{member.name}</h4>
          </div>
          <div className="legacy-career">
            {member.experience ? (
              <>
                <span>重要經歷</span>
                <p>{member.experience}</p>
              </>
            ) : null}
          </div>
          {member.email ? (
            <a href={`mailto:${member.email}`}>{member.email} ↗</a>
          ) : null}
        </article>
      ))}
    </div>
  );
}

export function Faculty({ faculty }: { faculty: FacultyMember[] }) {
  const visiting = faculty.filter((m) => m.category === VISITING);
  const emeritus = faculty.filter((m) => m.category === EMERITUS);
  const retired = faculty.filter((m) => m.category === RETIRED);
  const administration = faculty.filter((m) => m.category === ADMINISTRATION);

  /**
   * Anything that is not one of the four special categories falls through to
   * the standard card. That is the contract written into migration
   * 20260814090400 ("前台用 switch 分派版型、default 走標準卡"): the department
   * edits `category` freely from the admin, and an unrecognised value should
   * still show up on the page rather than disappear silently.
   */
  const standard = faculty.filter(
    (m) =>
      m.category !== VISITING &&
      m.category !== EMERITUS &&
      m.category !== RETIRED &&
      m.category !== ADMINISTRATION
  );
  const affiliated = standard.filter((m) => AFFILIATED.includes(m.category));

  /**
   * The reference site hard-codes 全部/專任師資/合聘師資/兼任師資. Deriving the
   * same four labels from the data in source order reproduces them exactly
   * while keeping the tabs in sync with `category` — and the filter compares
   * tab text against `category` by exact string equality, so a hard-coded list
   * would silently match nothing the day a label is edited.
   */
  const tabs = [
    "全部",
    ...standard.reduce<string[]>(
      (acc, m) => (acc.includes(m.category) ? acc : [...acc, m.category]),
      []
    ),
  ];

  return (
    <SiteShell variant="interior">
      <InteriorHero
        slug="faculty"
        title="系所成員"
        titleEn="Faculty & Staff"
        routeNo="04"
        lead="由跨領域學者與專業行政團隊共同形成的知識社群，連結教學、研究、政策與產業實務。"
        imageAlt="臺大農業綜合館入口"
      />
      <LocalNav
        label="系所成員"
        items={[
          { href: "#section-1", label: "專任師資" },
          { href: "#section-2", label: "合聘與兼任" },
          { href: "#section-3", label: "客座、名譽與退休" },
          { href: "#section-4", label: "行政同仁" },
        ]}
      />
      <div className="interior-content">
        <section className="inner-section" id="section-1">
          <div className="container">
            <SectionTitle
              no="01"
              eyebrow="FULL-TIME FACULTY"
              heading="專任師資"
              description="研究橫跨政策、制度、發展、運銷、貿易、消費、生產、管理、土地、資源與環境。"
            />
            <FacultyFilterGrid members={standard} tabs={tabs} />
          </div>
        </section>

        <section className="inner-section tint" id="section-2">
          <div className="container">
            <SectionTitle
              no="02"
              eyebrow="AFFILIATED FACULTY"
              heading="合聘與兼任師資"
            />
            {/* `.faculty-grid-secondary` narrows the grid to 3 columns and
                indents it by 28%; it is still `.faculty-grid`, so both classes
                are required. Cards here drop `.faculty-category`. */}
            <div className="faculty-grid faculty-grid-secondary">
              {affiliated.map((member) => (
                <FacultyCard
                  key={member.id}
                  member={member}
                  showCategory={false}
                />
              ))}
            </div>
          </div>
        </section>

        <section className="inner-section" id="section-3">
          <div className="container">
            <SectionTitle
              no="03"
              eyebrow="LEGACY & VISITING"
              heading="客座、名譽與退休教師"
              description="長年累積的教學與研究傳承，是本系持續前進的重要基礎。"
            />
            {/* A group is skipped entirely when its category is empty: an
                accordion whose panel has nothing in it is worse than no
                accordion. All three are populated by the 2026 seed, so this
                matches the reference site one-for-one with real data. */}
            {visiting.length > 0 ? (
              <LegacyGroup eyebrow="VISITING FACULTY" heading="客座教師">
                <div className="visiting-profile-list">
                  {visiting.map((member) => (
                    <article key={member.id}>
                      {/* `.visiting-profile-list figure` is the left grid
                          column and carries the 360px min-height, so it is
                          rendered even without a photo. */}
                      <figure>
                        {member.photo_url ? (
                          // Unlike the standard card, this alt is composed from
                          // the *category*, not the title: 柏靖峰客座教師形象照
                          // while the title reads 客座教師 · 助理教授.
                          <img
                            src={member.photo_url}
                            alt={`${member.name}${member.category}形象照`}
                          />
                        ) : null}
                      </figure>
                      <div>
                        {member.name_en ? <p>{member.name_en}</p> : null}
                        <h4>{member.name}</h4>
                        <small>{member.title}</small>
                        {member.fields ? (
                          <dl>
                            <dt>研究與授課領域</dt>
                            <dd>{member.fields}</dd>
                          </dl>
                        ) : null}
                      </div>
                    </article>
                  ))}
                </div>
              </LegacyGroup>
            ) : null}
            {emeritus.length > 0 ? (
              <LegacyGroup eyebrow="EMERITUS FACULTY" heading="名譽教授">
                <LegacyResumeList members={emeritus} />
              </LegacyGroup>
            ) : null}
            {retired.length > 0 ? (
              <LegacyGroup eyebrow="RETIRED FACULTY" heading="退休師資">
                <LegacyResumeList members={retired} />
              </LegacyGroup>
            ) : null}
          </div>
        </section>

        <section className="inner-section dark-section" id="section-4">
          <div className="container">
            <SectionTitle
              no="04"
              eyebrow="ADMINISTRATION"
              heading="行政同仁"
            />
            {/* `.admin-grid article` is the card selector. Note these mailto
                links have no trailing ↗ — the only email style on the page
                that does not. */}
            <div className="admin-grid">
              {administration.map((member) => (
                <article key={member.id}>
                  <h3>{member.name}</h3>
                  <p>{member.title}</p>
                  {member.email ? (
                    <a href={`mailto:${member.email}`}>{member.email}</a>
                  ) : null}
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
