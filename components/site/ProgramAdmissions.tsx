import Link from "next/link";
import type { LinkItem, NewsItem, Program, SiteDocument } from "@/lib/data";
import { localizePath, translate, type Lang } from "@/lib/i18n";
import { ADMISSIONS } from "@/lib/i18n/admissions";
import { SHARED } from "@/lib/i18n/shared";
import { formatNewsDate } from "./format";
import { slugForProgram } from "@/lib/program-slugs";
import { SiteShell } from "./SiteShell";
import { NextRoute } from "./NextRoute";
import { MaybeLink } from "./MaybeLink";
import { SiteDocuments } from "./SiteDocuments";

/**
 * 一個學制的招生頁 (/admissions/[program])。
 *
 * 舊站「招生資訊」選單底下就是四頁（大學部招生／碩士班招生／博士班招生／
 * 碩士在職專班），每一頁是該學制的招生公告清單。這一頁照那個形狀做，再加上
 * 系辦標了學制的檔案與連結：
 *
 *   #notices  招生公告  —— news，category='招生' 且 program=這個學制
 *   #files    招生檔案  —— documents，section='admissions' 且 program=這個學制
 *             （依分類分組：簡章／書面資料／考古題由系辦自己開分類）
 *   （相關連結）        —— links，section='admissions' 且 program=這個學制
 *
 * §4 三張入口卡的學制連結帶著 `#notices` / `#files` 進來（AdmissionKinds）。
 *
 * ## 版型
 *
 * 沿用 `.post-*`（與 /courses/[program] 修業規定頁相同）：麵包屑、標題、內文
 * 寬度 760px。公告清單用 /news 的 `.inner-news-list`（日期／分類／標題／箭頭，
 * 沒有 :nth-child 規則，列數自由），檔案卡用 `.post-documents` 的兩欄。
 */
export function ProgramAdmissions({
  lang,
  program,
  notices,
  documents,
  links,
  programs,
}: {
  lang: Lang;
  program: Program;
  /** getAdmissionsNews(program.name_zh) —— 新的在前。 */
  notices: NewsItem[];
  /** getDocumentsForProgram("admissions", program.name_zh) */
  documents: SiteDocument[];
  /** getLinksForProgram("admissions", program.name_zh) */
  links: LinkItem[];
  /** 全部學制，給底部「其他學制」用。 */
  programs: Program[];
}) {
  const t = translate(ADMISSIONS, lang);
  const shared = translate(SHARED, lang);
  const p = t.programPage;
  const admissionsPath = localizePath("/admissions", lang);
  const title = lang === "en" ? `${program.name}${p.titleSuffix}` : `${program.name}${p.titleSuffix}`;
  // §1 卡片上那句標語，當這一頁的小標 —— 讀者從卡片點進來，第一眼要對得上。
  const copy = t.programs.find((entry) => entry.match === program.name_zh);
  const others = programs
    .filter((other) => other.id !== program.id)
    .map((other) => ({ other, slug: slugForProgram(other.name_zh) }))
    .filter((x): x is { other: Program; slug: string } => Boolean(x.slug));

  return (
    <SiteShell lang={lang} variant="interior">
      <article className="post-page">
        <div className="container post-head" id="content">
          <div className="breadcrumb">
            <Link href={localizePath("/", lang)}>{shared.home}</Link>
            <span>/</span>
            <Link href={admissionsPath}>{t.title}</Link>
            <span>/</span>
            <span>{title}</span>
          </div>

          <p className="post-byline">{p.kicker}</p>
          <h1>{title}</h1>
          {copy ? <p className="post-standfirst">{copy.tagline}</p> : null}
          {copy ? <p className="program-methods">{copy.methods}</p> : null}

          {/* 系辦在 /admin/programs 填的官方簡章／報名系統網址：有填才印，
              放在最上面 —— 那是真的要報名的人最需要的一條。 */}
          {program.admission_url ? (
            <p className="program-official">
              <MaybeLink className="button gold" href={program.admission_url}>
                {p.official}
              </MaybeLink>
            </p>
          ) : null}
        </div>

        <section className="container post-section" id="notices">
          <div className="forms-subhead">
            <h3>{p.notices.heading}</h3>
            <p>{p.notices.description}</p>
          </div>
          {notices.length > 0 ? (
            <div className="inner-news-list">
              {notices.map((item) => (
                <Link href={localizePath(`/news/${item.id}`, lang)} key={item.id}>
                  <time dateTime={item.published_at.slice(0, 10)}>
                    {formatNewsDate(item.published_at).full}
                  </time>
                  <span>{item.category}</span>
                  <h3>{item.title}</h3>
                  <i>↗︎</i>
                </Link>
              ))}
            </div>
          ) : (
            <p className="news-empty">{p.notices.empty}</p>
          )}
        </section>

        {/* 檔案與連結：一個都沒有時整區不印（SiteDocuments 自己會判斷；連結
            這裡判斷）—— 系辦在 /admin/documents、/admin/links 標了這個學制
            才會長出來。 */}
        {documents.length > 0 ? (
          <section className="container post-section post-documents" id="files">
            <SiteDocuments
              lang={lang}
              documents={documents}
              heading={p.files.heading}
              description={p.files.description}
            />
          </section>
        ) : null}

        {links.length > 0 ? (
          <section className="container post-section" id="links">
            <div className="forms-subhead">
              <h3>{p.links.heading}</h3>
            </div>
            <div className="resource-row">
              {links.map((link) => (
                <MaybeLink key={link.id} href={link.url} arrow={<span> ↗︎</span>}>
                  {link.label}
                </MaybeLink>
              ))}
            </div>
          </section>
        ) : null}

        <div className="container post-foot">
          <Link href={admissionsPath}>{p.back}</Link>
          {others.length > 0 ? (
            <p className="program-others">
              <span>{p.otherPrograms}：</span>
              {others.map(({ other, slug }, i) => (
                <span key={slug}>
                  {i > 0 ? " · " : ""}
                  <Link href={localizePath(`/admissions/${slug}`, lang)}>{other.name}</Link>
                </span>
              ))}
            </p>
          ) : null}
        </div>
      </article>
      <NextRoute lang={lang} />
    </SiteShell>
  );
}
