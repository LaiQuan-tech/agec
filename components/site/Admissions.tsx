import Link from "next/link";
import type { LinkItem, Program } from "@/lib/data";
import { translate, type Lang } from "@/lib/i18n";
import { ADMISSIONS } from "@/lib/i18n/admissions";
import { EYEBROWS } from "@/lib/i18n/eyebrows";
import { newsPath } from "@/lib/news-categories";
import { SiteShell } from "./SiteShell";
import { InteriorHero } from "./InteriorHero";
import { LocalNav } from "./LocalNav";
import { SectionTitle } from "./SectionTitle";
import { NextRoute } from "./NextRoute";
import { MaybeLink } from "./MaybeLink";
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
 *   #section-3 `.capability-cloud` A, static tag cloud.
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
}: {
  lang: Lang;
  /** getPrograms() — 4 學制, in sort_order. */
  programs: Program[];
  /** getLinks('admissions') — 4 resource cards. Empty until the rows exist. */
  links: LinkItem[];
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
  const resources: { label: string; url: string | null }[] = links.length
    ? links.map((link) => ({ label: link.label, url: link.url }))
    // The fallback rows exist so the four-column grid never renders empty when
    // the `links` table has nothing for this section. Three of the four carry
    // a literal "#" and MaybeLink treats that as no destination; the fourth is
    // the real in-page anchor to the footer's contact block.
    : t.section4.resourcesFallback.map((row) => ({
        label: row.label,
        url: row.url,
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
                      原本是 `href="#section-2"`，也就是同一頁的「重要時程」。
                      那在站上還沒有招生內容時是唯一能指的地方；現在 /news 有
                      157 則招生公告（簡章、口試時間、報名系統、正備取名單），
                      「查看招生資訊」該指的就是那裡。

                      四張卡指向同一個網址是刻意的：招生消息沒有「這則屬於哪個
                      學制」的欄位，學制只寫在標題裡。與其用關鍵字猜著篩、篩錯
                      還沒人會發現，不如四張都進同一份完整清單 —— 讀者在那一頁
                      還有年份可以縮小範圍。

                      走 newsPath() 而不是自己拼字串：消息的網址只能有一個產生
                      處，否則哪天路由改了，這裡會變成一個沒人記得要改的死連結。
                    */}
                    <Link href={newsPath(1, lang, "admissions")}>
                      {t.section1.cta}
                    </Link>
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
              {t.section3.capabilities.map((item) => (
                <span key={item}>{item}</span>
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
            {/* Anchors, never <div>s — `.resource-row a` owns the cell border,
                the 120px min-height and the flex alignment. */}
            <div className="resource-row">
              {resources.map((resource) => (
                <MaybeLink
                  href={resource.url}
                  key={resource.label}
                  arrow={<span> ↗︎</span>}
                >
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
