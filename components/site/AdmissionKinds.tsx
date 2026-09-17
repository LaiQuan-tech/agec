import Link from "next/link";
import type { AdmissionsPostRef, Program, SiteDocument } from "@/lib/data";
import { localizePath, translate, type Lang } from "@/lib/i18n";
import { ADMISSIONS } from "@/lib/i18n/admissions";
import {
  EXAM_CATEGORY,
  KIND_KEYWORDS,
  latestAdmissionsPost,
} from "@/lib/admissions-kinds";
import { slugForProgram } from "@/lib/program-slugs";

/**
 * /admissions §4 的三張學制入口卡：當年度招生簡章／書面資料格式／考古題專區，
 * 每一張底下列學制，點哪個學制就落在那個學制**真正對應的資料**上：
 *
 *   簡章／書面資料  該學制最新一則標題含關鍵字的招生公告 `/news/<id>`，學制名
 *                  後面印一個小字的學年度（「大學部 → 115 學年度」）。沒有這種
 *                  公告的學制退回學制招生頁的公告區／檔案區，不印年度。
 *   考古題          學制招生頁的 `#exams` 區，只列 documents 裡真的有考古題的
 *                  學制（大學部沒有，所以不出現）；一個都沒有時印「尚無資料」。
 *
 * 落點的判斷（關鍵字、年度、哪些學制有考古題）在 lib/admissions-kinds.ts，
 * 這裡只負責把它畫出來。
 *
 * ## 為什麼是程式裡的固定結構，不是 links 表的資料
 *
 * 客戶回饋：「點選後建議能分別顯示大學部、碩士班、博士班及在職專班各自的
 * 相關資訊」，之後再回饋：「每個點進去都是招生資訊，點進去應該要是對應的
 * 資料檔才對。」這三種東西在舊站本來就是按學制分開的（recruit1–4 的公告、
 * link5 的考古題四組），是招生資訊的骨架 —— 與四個學制一樣不是「內容」。
 * 落點跟著公告與檔案走：系辦每年照舊發簡章公告、上傳考古題，卡片自己更新。
 *
 * ## 標記
 *
 * 不是 `.resource-row`（那是一格一個 <a> 的網格，放不下一張卡四條連結），
 * 是自己的 `.admission-kinds` —— 樣式在 site-extensions.css，仿 `.resource-row a`
 * 的邊框、留白與 hover。年度是 `<span class="admission-kind-year">`，跟在
 * 箭頭後面（連結整條可點，年度只是註記）。
 */
export function AdmissionKinds({
  lang,
  programs,
  posts,
  documents,
}: {
  lang: Lang;
  /** getPrograms() 的順序 —— 四個學制。沒有代稱（不在 lib/program-slugs.ts）的略過。 */
  programs: Program[];
  /** getAdmissionsPostIndex() —— 全部招生公告的索引，新的在前。 */
  posts: AdmissionsPostRef[];
  /** getDocuments('admissions') 全部（含標了學制的），只用來判斷哪些學制有考古題。 */
  documents: SiteDocument[];
}) {
  const t = translate(ADMISSIONS, lang);
  const targets = programs
    .map((p) => ({ program: p, slug: slugForProgram(p.name_zh) }))
    .filter((x): x is { program: Program; slug: string } => Boolean(x.slug));

  // 比對用 category_zh（中文原值），不是翻譯後的 category —— /en 的分類英文
  // 可能有填、可能沒填，用翻譯後的字比對會讓英文頁少一整張卡。
  const programsWithExams = new Set(
    documents
      .filter((doc) => doc.category_zh === EXAM_CATEGORY && doc.program)
      .map((doc) => doc.program)
  );

  return (
    <div className="admission-kinds">
      {t.section4.kinds.map((kind) => {
        const rows =
          kind.key === "exams"
            ? targets
                .filter(({ program }) => programsWithExams.has(program.name_zh))
                .map(({ program, slug }) => ({
                  slug,
                  label: program.name,
                  href: `${localizePath(`/admissions/${slug}`, lang)}${kind.anchor}`,
                  year: null as string | null,
                }))
            : targets.map(({ program, slug }) => {
                const hit = latestAdmissionsPost(posts, program.name_zh, KIND_KEYWORDS[kind.key]);
                return hit
                  ? {
                      slug,
                      label: program.name,
                      href: localizePath(`/news/${hit.id}`, lang),
                      year: hit.year,
                    }
                  : {
                      slug,
                      label: program.name,
                      // 退路：這個學制沒有含關鍵字的公告，至少落在它的招生頁。
                      href: `${localizePath(`/admissions/${slug}`, lang)}${kind.anchor}`,
                      year: null,
                    };
              });

        return (
          <article key={kind.key}>
            <h3>{kind.label}</h3>
            <p>{kind.description}</p>
            {rows.length > 0 ? (
              <ul aria-label={`${kind.label} · ${t.section4.kindsLabel}`}>
                {rows.map((row) => (
                  <li key={row.slug}>
                    <Link href={row.href}>
                      {row.label} →
                      {row.year ? (
                        <span className="admission-kind-year">
                          {t.section4.kindsYear.replace("{year}", row.year)}
                        </span>
                      ) : null}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="admission-kinds-empty">{t.section4.kindsEmpty}</p>
            )}
          </article>
        );
      })}
    </div>
  );
}
