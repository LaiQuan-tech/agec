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
import { ExamPapers } from "./ExamPapers";
import { EXAM_CATEGORY } from "@/lib/admissions-kinds";

/**
 * 一個學制的招生頁 (/admissions/[program])。
 *
 * 舊站「招生資訊」選單底下就是四頁（大學部招生／碩士班招生／博士班招生／
 * 碩士在職專班），每一頁是該學制的招生公告清單。這一頁照那個形狀做，再加上
 * 系辦標了學制的檔案與連結：
 *
 *   #notices  招生公告  —— news，category='招生' 且 program=這個學制
 *   #files    招生檔案  —— documents，section='admissions' 且 program=這個學制，
 *             **不含**分類「考古題」的列（依其餘分類分組）；一個都沒有整區不印
 *   #exams    考古題    —— documents 同上但分類＝「考古題」（EXAM_CATEGORY），
 *             一年度一列、科目並排（ExamPapers）；沒有考古題的學制（大學部）
 *             整區不印
 *   （相關連結）        —— links，section='admissions' 且 program=這個學制
 *
 * §4 三張入口卡（AdmissionKinds）：考古題卡帶著 `#exams` 進來；簡章／書面資料
 * 卡直接落在該學制最新一則相關公告 `/news/<id>`，只有找不到公告時才退回
 * `#notices` / `#files`。
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
  // 考古題與其他檔案分家：比對 category_zh（中文原值），/en 的分類英文有沒有
  // 填都不影響。兩邊各自維持 getDocumentsForProgram 的 sort_order。
  const exams = documents.filter((doc) => doc.category_zh === EXAM_CATEGORY);
  const files = documents.filter((doc) => doc.category_zh !== EXAM_CATEGORY);

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

        {/* 檔案、考古題與連結：一個都沒有時整區不印（SiteDocuments 自己會
            判斷；考古題與連結這裡判斷）—— 系辦在 /admin/documents、
            /admin/links 標了這個學制才會長出來。 */}
        {files.length > 0 ? (
          <section className="container post-section post-documents" id="files">
            <SiteDocuments
              lang={lang}
              documents={files}
              heading={p.files.heading}
              description={p.files.description}
            />
          </section>
        ) : null}

        {exams.length > 0 ? (
          <section className="container post-section" id="exams">
            <div className="forms-subhead">
              <h3>{p.exams.heading}</h3>
              <p>{p.exams.description}</p>
            </div>
            <ExamPapers lang={lang} documents={exams} />
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
