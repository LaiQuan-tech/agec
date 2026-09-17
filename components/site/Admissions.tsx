import type {
  AdmissionsPostRef,
  CapabilityItem,
  LinkItem,
  Program,
  SiteDocument,
} from "@/lib/data";
import { translate, type Lang } from "@/lib/i18n";
import { ADMISSIONS } from "@/lib/i18n/admissions";
import { EYEBROWS } from "@/lib/i18n/eyebrows";
import { localizePath } from "@/lib/i18n";
import { slugForProgram } from "@/lib/program-slugs";
import { SiteShell } from "./SiteShell";
import { InteriorHero } from "./InteriorHero";
import { LocalNav } from "./LocalNav";
import { SectionTitle } from "./SectionTitle";
import { NextRoute } from "./NextRoute";
import { AdmissionKinds } from "./AdmissionKinds";
import { SiteDocuments } from "./SiteDocuments";
import { MaybeLink } from "./MaybeLink";
import Link from "next/link";
import { padNo } from "./nav";

/**
 * 招生資訊 (/admissions) — route 05 / 08.
 *
 * Data sources, per PORT-REPORT §2.3:
 *
 *   #section-1 `.program-grid`     B → getPrograms()  (4 rows, already trimmed
 *                                  from 5 — 國際專班 was dropped in the 2026 IA)
 *   #section-2 `.schedule-line`    B, but there is no table and no getter for
 *                                  it (§2.4). Hard-coded here on purpose: the
 *                                  grid is a fixed repeat(4,1fr) → repeat(2,1fr)
 *                                  → 1fr ladder and every article draws its own
 *                                  right/bottom border, so a 5th entry breaks
 *                                  the 1180px row without looking wrong at
 *                                  1440px. Adding a table is out of scope here.
 *   #section-3 `.capability-cloud` B → getCapabilities()，空表時退回字典。
 *   #section-4 `.resource-row`     B → getLinks(). See the fallback below.
 *
 * All A-class copy lives in lib/i18n/admissions.ts.
 *
 * Layout traps in site.css for this page:
 *   .program-grid article  — cards must be <article>; the borders, the 450px
 *                            min-height and the padding all hang off that tag,
 *                            and `article:first-child{border-left}` +
 *                            `article:nth-child(3){border-left}` (≤1180px)
 *                            assume exactly 4 cards in a 4→2→1 column ladder.
 *   .program-grid article>span — direct child selector for the card number.
 *   .schedule-line article — same story with #ffffff3d borders on green.
 *   .resource-row a        — the border/min-height/flex live on the <a>. A row
 *                            rendered as <div> would lose all of it, so every
 *                            entry stays an anchor even with no destination —
 *                            MaybeLink drops the href, not the tag.
 */

export function Admissions({
  lang,
  programs,
  links,
  capabilities,
  documents,
  posts,
}: {
  lang: Lang;
  /** getPrograms() — 4 學制, in sort_order. */
  programs: Program[];
  /** getLinks('admissions') — 4 resource cards. Empty until the rows exist. */
  links: LinkItem[];
  /**
   * getCapabilities() —— §3 的膠囊。空陣列時退回字典裡那 8 顆，所以資料表
   * 還沒建（程式先上線）或系辦把標籤全刪了，都不會留下一塊空白。
   */
  capabilities: CapabilityItem[];
  /**
   * getDocuments('admissions') —— §4 的招生檔案。共通的（沒標學制）印成下載卡，
   * 空陣列時整區不印；標了學制的不在這一頁印，但三張入口卡要靠它們判斷哪些
   * 學制有考古題。
   */
  documents: SiteDocument[];
  /**
   * getAdmissionsPostIndex() —— 全部招生公告的索引。三張入口卡的簡章／書面
   * 資料連結落在各學制最新一則相關公告上（AdmissionKinds）。
   */
  posts: AdmissionsPostRef[];
}) {
  const t = translate(ADMISSIONS, lang);
  const eb = translate(EYEBROWS, lang);

  // Same guard as the home page: the grid's positional border rules assume at
  // most 4 cards, so extra rows are dropped rather than allowed to break the
  // 1180px layout.
  const cards = programs.slice(0, 4);
  // DB rows arrive from lib/data.ts already resolved to the page's language;
  // the fallback comes from the dictionary. Either way `label` is ready to
  // print and must not be translated again here.
  // 與 resources 同一個模式：DB 的 label 在 lib/data.ts 就已經解析成當前語言，
  // 這裡不能再翻一次。key 用 id 而不是文字 —— 兩個標籤同名是合法的，用文字當
  // key 會讓 React 在其中一個被刪掉時更新錯的節點。
  const tags: { key: string; label: string }[] = capabilities.length
    ? capabilities.map((c) => ({ key: `db-${c.id}`, label: c.label }))
    : t.section3.capabilities.map((label, i) => ({ key: `fallback-${i}`, label }));

  const resources: {
    key: string;
    label: string;
    url: string | null;
    program: string | null;
  }[] = links.length
    ? links
        // 標了學制的連結屬於那個學制的招生頁（/admissions/[program]）；
        // 總覽頁只印共通的。
        .filter((link) => !link.program)
        .map((link) => ({
          // key 用 id：兩張卡同名是合法的，用文字當 key 會讓 React 在其中一張
          // 被刪掉時更新錯的節點。
          key: `db-${link.id}`,
          label: link.label,
          url: link.url,
          program: link.program,
        }))
    // The fallback row exists so the grid never renders empty when the `links`
    // table has nothing for this section: the in-page anchor to the footer's
    // contact block. 簡章／書面資料／考古題三張卡已經是程式裡的固定結構
    //（AdmissionKinds），不再需要備援。
    : t.section4.resourcesFallback.map((row, i) => ({
        key: `fallback-${i}`,
        label: row.label,
        url: row.url,
        program: null,
      }));

  return (
    <SiteShell lang={lang} variant="interior">
      <InteriorHero
        lang={lang}
        slug="admissions"
        titleZh={ADMISSIONS.title.zh}
        titleEn={ADMISSIONS.title.en}
        routeNo="05"
        lead={t.hero.lead}
        imageAlt={t.hero.imageAlt}
      />

      <LocalNav lang={lang} label={t.nav.label} items={t.nav.items} />

      <div className="interior-content">
        <section className="inner-section" id="section-1">
          <div className="container">
            <SectionTitle
              no="01"
              eyebrow={eb.programs}
              heading={t.section1.heading}
              description={t.section1.description}
            />
            <div className="program-grid">
              {cards.map((program, i) => {
                // Matched on `name_zh`, never `name`: the dictionary is keyed
                // by the Chinese program name, while `name` is the translated
                // display name and would match nothing on /en — every card
                // would silently fall back to `description` twice over.
                const copy = t.programs.find(
                  (entry) => entry.match === program.name_zh
                );
                return (
                  <article key={program.id}>
                    <span>{padNo(i + 1)}</span>
                    {/* The kicker above the heading is the program's name in
                        the *other* language — the same rule InteriorHero uses
                        for its title, and why `Program` exposes `name_en`
                        alongside the already-resolved `name`. Null `name_en`
                        renders an empty <small>, as it did before /en existed. */}
                    <small>
                      {lang === "en" ? program.name_zh : program.name_en}
                    </small>
                    <h3>{program.name}</h3>
                    <h4>{copy?.tagline ?? program.description}</h4>
                    <p>{copy?.methods ?? program.description}</p>
                    {/*
                      各學制自己的招生頁（/admissions/<代稱>）：該學制的招生
                      公告、檔案與連結都在那一頁；系辦在 /admin/programs 填的
                      官方簡章／報名系統網址也印在那一頁最上面，不再在這裡當
                      去處 —— 卡片連到站內頁，讀者一律先看到本系整理的資訊。

                      2026-09 之前四張卡全部連到最新消息的招生區塊（消息沒有
                      學制欄位）；客戶回饋無法區分學制，所以做了學制頁。
                      沒有代稱的學制（不在 lib/program-slugs.ts）沒有頁，
                      退回招生區塊 —— 現在四個都有，這條退路實務上走不到。
                    */}
                    {slugForProgram(program.name_zh) ? (
                      <Link href={localizePath(`/admissions/${slugForProgram(program.name_zh)}`, lang)}>
                        {t.section1.cta}
                      </Link>
                    ) : (
                      <Link href={localizePath("/news/category/admissions", lang)}>
                        {t.section1.cta}
                      </Link>
                    )}
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="inner-section schedule-section" id="section-2">
          <div className="container">
            <SectionTitle
              no="02"
              eyebrow={eb.keyDates}
              heading={t.section2.heading}
            />
            <div className="schedule-line">
              {t.keyDates.map((date) => (
                <article key={date.code}>
                  <strong>{date.code}</strong>
                  <span>{date.month}</span>
                  <p>{date.body}</p>
                </article>
              ))}
            </div>
            <p className="schedule-note">{t.section2.note}</p>
          </div>
        </section>

        <section className="inner-section" id="section-3">
          <div className="container">
            <SectionTitle
              no="03"
              eyebrow={eb.whatYouWillBuild}
              heading={t.section3.heading}
            />
            <div className="capability-cloud">
              {tags.map((tag) => (
                <span key={tag.key}>{tag.label}</span>
              ))}
            </div>
          </div>
        </section>

        <section className="inner-section tint" id="section-4">
          <div className="container">
            <SectionTitle
              no="04"
              eyebrow={eb.needHelp}
              heading={t.section4.heading}
            />
            {/* 三張學制入口卡：當年度招生簡章／書面資料格式／考古題專區。
                簡章與書面資料落在各學制最新一則相關公告（/news/<id>），考古題
                落在學制招生頁的 #exams —— 判斷在 lib/admissions-kinds.ts。 */}
            <AdmissionKinds lang={lang} programs={cards} posts={posts} documents={documents} />

            {/* 系辦上傳的共通檔案（沒標學制的）。標了學制的在各學制頁。
                一個檔都沒有時整區不印。 */}
            <SiteDocuments
              lang={lang}
              documents={documents.filter((doc) => !doc.program)}
              heading={t.section4.documents.heading}
              description={t.section4.documents.description}
            />

            {/* 共通的連結（聯絡系辦…）。Anchors, never <div>s — `.resource-row a`
                owns the cell border, the 120px min-height and the flex alignment. */}
            <div className="resource-row">
              {resources.map((resource) => (
                <MaybeLink href={resource.url} key={resource.key} arrow={<span> ↗︎</span>}>
                  {resource.label}
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
