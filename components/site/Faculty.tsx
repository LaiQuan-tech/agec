import type { Faculty as FacultyMember } from "@/lib/data";
import { translate, type Lang } from "@/lib/i18n";
import { FACULTY, categoryLabel, displayName, fill, namePair } from "@/lib/i18n/faculty";
import { EYEBROWS } from "@/lib/i18n/eyebrows";
import { SiteShell } from "./SiteShell";
import { InteriorHero } from "./InteriorHero";
import { LocalNav } from "./LocalNav";
import { SectionTitle } from "./SectionTitle";
import { NextRoute } from "./NextRoute";
import { FacultyCard } from "./FacultyCard";

/**
 * 系所成員 (/faculty) — route 04 / 08. The most layout-heavy of the eight
 * pages: 37 people, seven `category` values and *four* unrelated card shapes.
 *
 * | 區塊       | 容器                          | 版型                                   |
 * |------------|-------------------------------|----------------------------------------|
 * | #section-1 | `.faculty-grid`               | 標準卡，專任 12 人                      |
 * | #section-2 | `.faculty-grid-secondary`     | 標準卡，合聘與兼任 10 人                |
 * | #section-3 | `.visiting-profile-list`      | `figure` + `<dl>`，1 人                 |
 * | #section-3 | `.legacy-resume-list` × 2     | 無照片履歷列（英文名 + 經歷），5 + 6 人 |
 * | #section-4 | `.admin-grid`                 | 深底行政卡，3 人                        |
 *
 * §1 和 §2 現在是互斥的兩份名單，這是 2026-09 依客戶要求改的。
 *
 * 在那之前 §1 印全部 22 人（上面一排 `.filter-tabs` 可以篩），§2 再把其中的
 * 合聘＋兼任 10 人原封不動印第二次 —— 參考站的 HTML 就是這樣，移植時照做。
 * 結果是同一頁上有兩排長得很像、字又重疊的控制項（頁內導覽的「合聘與兼任」
 * 與篩選籤的「合聘師資」「兼任師資」），而底下是同一批人；而且 §1 的標題
 * 寫著「專任師資」，裡面卻有 10 張合聘與兼任的卡。
 *
 * 現在 §1 只放專任、§2 只放合聘與兼任，篩選籤整排移除（`.local-nav` 就是
 * 這一頁的篩選）。四個區塊剛好把 37 個人分完，每個標題都成立。
 *
 * ⚠️ 因此 `fullTime` 是「standard 扣掉 affiliated」而不是
 * `category === "專任師資"`。差別在沒被認得的分類：前者仍然會落到 §1，
 * 後者會讓它從兩個區塊裡同時消失 —— 那正是下面 `standard` 那段註解
 * （migration 20260814090400 的約定）要防的事。
 *
 * ⚠️ Photo filenames are numbered out of step with the display order (楊子霆
 * is 13th but uses `23-…jpg`, and `13-…jpg` belongs to the visiting professor,
 * who is 23rd). Filenames therefore always come from the row's `photo_url` —
 * never from an array index.
 *
 * ⚠️ `category` is the one column lib/data.ts does not translate: the four
 * constants below and the filter both compare it against Chinese literals. Run
 * it through `categoryLabel()` wherever a visitor reads it, and never through
 * anything that decides layout.
 *
 * Null-safety is not defensive padding here: every optional column is genuinely
 * absent for some category (no photo for 14 people, no email for the visiting
 * professor, no `fields` for the legacy and admin rows, `name_en`/`experience`
 * only for the legacy rows), and the two 2026 migrations may not have run yet
 * on the live DB, in which case `getFaculty()` degrades to an empty array.
 */

/**
 * §1 的主體。用於決定要不要印分類籤 —— 見下面 `showCategory` 那一行：
 * 一整區都是專任師資時，每張卡再印一次「專任師資」只是雜訊。
 */
const FULL_TIME = "專任師資";

/** Categories whose members get their own, non-card layout. */
const VISITING = "客座教師";
const EMERITUS = "名譽教授";
const RETIRED = "退休師資";
const ADMINISTRATION = "行政同仁";

/**
 * `#section-2` 的兩個分類。用分類選而不是切末尾十筆，系上多聘一位專任時
 * 這一區才不會跟著跑掉。
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
  /** Uppercase Latin kicker — a design element, identical in both languages. */
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
 *
 * `experienceLabel` arrives already translated rather than as a `lang`, because
 * the caller has the dictionary open anyway and this list is the only thing on
 * the page that needs that one string.
 */
function LegacyResumeList({
  lang,
  members,
  experienceLabel,
  extensionLabel,
}: {
  lang: Lang;
  members: FacultyMember[];
  experienceLabel: string;
  extensionLabel: string;
}) {
  return (
    <div className="legacy-resume-list">
      {members.map((member) => (
        <article key={member.id}>
          <div className="legacy-person-name">
            {/* Both names always show — `name_en` is the person's own English
                name shown beside their Chinese one, not a translation that
                replaces it. Which one is the <h4> follows the same mirroring
                rule as InteriorHero and the admission cards: the heading is
                the page's language, the small line above it is the other. */}
            {namePair(member, lang).kicker ? (
              <p>{namePair(member, lang).kicker}</p>
            ) : null}
            <h4>{namePair(member, lang).heading}</h4>
          </div>
          {/*
            ⚠️ 分機放在 .legacy-career **裡面**，不是當第四個直接子元素。
            `.legacy-resume-list article` 是三欄 grid（姓名塊／經歷塊／mailto），
            多一個直接子元素會掉到第二列第一欄，看起來像壞掉。
            這個 <div> 就算 experience 是 null 也一定渲染（見上面第 89-92 行的
            說明），所以它是這個版型裡唯一安全的落點。
          */}
          <div className="legacy-career">
            {member.experience ? (
              <>
                <span>{experienceLabel}</span>
                <p>{member.experience}</p>
              </>
            ) : null}
            {member.extension ? (
              <p className="faculty-ext">
                {extensionLabel} {member.extension}
              </p>
            ) : null}
          </div>
          {member.email ? (
            <a href={`mailto:${member.email}`}>{member.email} ↗︎</a>
          ) : null}
        </article>
      ))}
    </div>
  );
}

export function Faculty({
  lang,
  faculty,
}: {
  lang: Lang;
  faculty: FacultyMember[];
}) {
  const t = translate(FACULTY, lang);
  const eb = translate(EYEBROWS, lang);

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
   * §1。刻意是「扣掉 §2」而不是「等於專任師資」—— 見檔頭的說明：認不得的
   * 分類必須有地方落，否則它會從兩個區塊裡同時消失。
   */
  const fullTime = standard.filter((m) => !AFFILIATED.includes(m.category));

  /**
   * The chair's card spans the whole grid row, so it only reads as a feature
   * banner while it is the *first* cell — anywhere else it cuts the grid in
   * half. `sort_order` happens to put her first today; hoisting makes that true
   * by construction instead of by luck, and takes only the first match so a
   * transitional period with two 系主任 titles cannot produce two banners.
   */
  const chairIndex = fullTime.findIndex((m) => m.is_chair);
  const ordered =
    chairIndex > 0
      ? [
          fullTime[chairIndex],
          ...fullTime.filter((_, i) => i !== chairIndex),
        ]
      : fullTime;


  return (
    <SiteShell lang={lang} variant="interior">
      {/* Both titles: the hero prints whichever is not the page's language as
          the kicker above the <h1>, so this reads the untranslated pair. */}
      <InteriorHero
        lang={lang}
        slug="faculty"
        titleZh={FACULTY.title.zh}
        titleEn={FACULTY.title.en}
        routeNo="04"
        lead={t.lead}
        imageAlt={t.heroImageAlt}
      />
      <LocalNav lang={lang} label={t.title} items={[...t.nav.items]} />
      <div className="interior-content">
        <section className="inner-section" id="section-1">
          <div className="container">
            {/* `eyebrow` stays a literal here and in the three sections below:
                the uppercase Latin kicker is a typographic device and is the
                same string on /faculty and /en/faculty. */}
            <SectionTitle
              no="01"
              eyebrow={eb.fullTimeFaculty}
              heading={t.fullTime.heading}
              description={t.fullTime.description}
            />
            {/* 這裡以前是 `FacultyFilterGrid`（篩選籤＋筆數＋格線的 client
                元件）。整區現在都是專任師資，篩選沒有東西可以篩，所以格線
                直接由 server 元件印出來 —— 這一頁不再需要任何 client JS。 */}
            <div className="faculty-grid">
              {ordered.map((member) => (
                <FacultyCard
                  key={member.id}
                  lang={lang}
                  member={member}
                  /* 只有認不得的分類才印籤。整區都是專任師資，每張卡再寫一次
                     區塊標題已經說過的話是雜訊；但萬一有筆資料的分類不在
                     預期內（見上面 `fullTime` 的註解），籤是它唯一會被看見的
                     地方。 */
                  showCategory={member.category !== FULL_TIME}
                />
              ))}
            </div>
          </div>
        </section>

        <section className="inner-section tint" id="section-2">
          <div className="container">
            <SectionTitle
              no="02"
              eyebrow={eb.affiliatedFaculty}
              heading={t.affiliated.heading}
            />
            {/* Still `.faculty-grid` as well — both classes are required.
                Cards here drop `.faculty-category`.

                site.css makes this 3 columns indented 28%; site-extensions.css
                overrides it to 4 columns flush left above 860px, so the cards
                come out the same 369.75px as §1's. See the note there. */}
            <div className="faculty-grid faculty-grid-secondary">
              {affiliated.map((member) => (
                <FacultyCard
                  key={member.id}
                  lang={lang}
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
              eyebrow={eb.legacyVisiting}
              heading={t.legacy.heading}
              description={t.legacy.description}
            />
            {/* A group is skipped entirely when its category is empty: an
                accordion whose panel has nothing in it is worse than no
                accordion. All three are populated by the 2026 seed, so this
                matches the reference site one-for-one with real data. */}
            {visiting.length > 0 ? (
              <LegacyGroup eyebrow={eb.visitingFaculty} heading={t.legacy.visiting}>
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
                          // while the title reads 客座教師 · 助理教授. The
                          // category has to go through `categoryLabel()` — it is
                          // the one column that is never translated upstream.
                          <img
                            src={member.photo_url}
                            alt={fill(t.visitingPortraitAlt, {
                              name: member.name,
                              category: categoryLabel(member.category, lang),
                            })}
                          />
                        ) : null}
                      </figure>
                      <div>
                        {/* Both names, heading in the page's language — see
                            LegacyResumeList above. */}
                        {namePair(member, lang).kicker ? (
                          <p>{namePair(member, lang).kicker}</p>
                        ) : null}
                        <h4>{namePair(member, lang).heading}</h4>
                        <small>{member.title}</small>
                        {/* 一個 <dl> 裝兩組，而不是各自一個 —— 定義清單本來
                            就是為「標籤 + 值」設計的，而這個版型已經有一個。
                            條件是「兩者任一有值」，不是只看 fields：只有分機
                            沒有領域時仍然要印得出來。 */}
                        {member.fields || member.extension ? (
                          <dl>
                            {member.fields ? (
                              <>
                                <dt>{t.legacy.fieldsLabel}</dt>
                                <dd>{member.fields}</dd>
                              </>
                            ) : null}
                            {member.extension ? (
                              <>
                                <dt>{t.extensionLabel}</dt>
                                <dd>{member.extension}</dd>
                              </>
                            ) : null}
                          </dl>
                        ) : null}
                      </div>
                    </article>
                  ))}
                </div>
              </LegacyGroup>
            ) : null}
            {emeritus.length > 0 ? (
              <LegacyGroup eyebrow={eb.emeritusFaculty} heading={t.legacy.emeritus}>
                <LegacyResumeList
                  lang={lang}
                  members={emeritus}
                  experienceLabel={t.legacy.experienceLabel}
                  extensionLabel={t.extensionLabel}
                />
              </LegacyGroup>
            ) : null}
            {retired.length > 0 ? (
              <LegacyGroup eyebrow={eb.retiredFaculty} heading={t.legacy.retired}>
                <LegacyResumeList
                  lang={lang}
                  members={retired}
                  experienceLabel={t.legacy.experienceLabel}
                  extensionLabel={t.extensionLabel}
                />
              </LegacyGroup>
            ) : null}
          </div>
        </section>

        <section className="inner-section dark-section" id="section-4">
          <div className="container">
            <SectionTitle
              no="04"
              eyebrow={eb.administration}
              heading={t.administration.heading}
            />
            {/* `.admin-grid article` is the card selector. Note these mailto
                links have no trailing ↗︎ — the only email style on the page
                that does not. */}
            <div className="admin-grid">
              {administration.map((member) => (
                <article key={member.id}>
                  {/* One name slot, same rule as the portrait card. */}
                  <h3>{displayName(member, lang)}</h3>
                  <p>{member.title}</p>
                  {/* `.admin-grid article` 是單純的 flow 排版（沒有 grid
                      placement、也沒有絕對定位），所以在 <p> 與 <a> 之間插一個
                      元素是這一頁最安全的落點。 */}
                  {member.extension ? (
                    <p className="faculty-ext">
                      {t.extensionLabel} {member.extension}
                    </p>
                  ) : null}
                  {member.email ? (
                    <a href={`mailto:${member.email}`}>{member.email}</a>
                  ) : null}
                </article>
              ))}
            </div>
          </div>
        </section>
      </div>
      <NextRoute lang={lang} />
    </SiteShell>
  );
}
