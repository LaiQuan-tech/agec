import Link from "next/link";
import type { Program } from "@/lib/data";
import { localizePath, translate, type Lang } from "@/lib/i18n";
import { ADMISSIONS } from "@/lib/i18n/admissions";
import { slugForProgram } from "@/lib/program-slugs";

/**
 * /admissions §4 的三張學制入口卡：當年度招生簡章／書面資料格式／考古題專區，
 * 每一張底下列四個學制，點哪個學制就到那個學制招生頁（/admissions/[program]）
 * 的對應區塊。
 *
 * ## 為什麼是程式裡的固定結構，不是 links 表的資料
 *
 * 客戶回饋：「點選後建議能分別顯示大學部、碩士班、博士班及在職專班各自的
 * 相關資訊」。這三種東西在舊站本來就是按學制分開的（recruit1–4 的公告、link5
 * 的考古題四組），是招生資訊的骨架 —— 與四個學制一樣不是「內容」。先前的做法
 * （links 標學制才長出篩選籤）要等系辦先把資料拆成四筆，畫面上才會有變化；
 * 客戶看不到差別，所以退回來重做。
 *
 * ## 標記
 *
 * 不是 `.resource-row`（那是一格一個 <a> 的網格，放不下一張卡四條連結），
 * 是自己的 `.admission-kinds` —— 樣式在 site-extensions.css，仿 `.resource-row a`
 * 的邊框、留白與 hover。
 */
export function AdmissionKinds({
  lang,
  programs,
}: {
  lang: Lang;
  /** getPrograms() 的順序 —— 四個學制。沒有代稱（不在 lib/program-slugs.ts）的略過。 */
  programs: Program[];
}) {
  const t = translate(ADMISSIONS, lang);
  const targets = programs
    .map((p) => ({ program: p, slug: slugForProgram(p.name_zh) }))
    .filter((x): x is { program: Program; slug: string } => Boolean(x.slug));

  return (
    <div className="admission-kinds">
      {t.section4.kinds.map((kind) => (
        <article key={kind.label}>
          <h3>{kind.label}</h3>
          <p>{kind.description}</p>
          <ul aria-label={`${kind.label} · ${t.section4.kindsLabel}`}>
            {targets.map(({ program, slug }) => (
              <li key={slug}>
                <Link href={`${localizePath(`/admissions/${slug}`, lang)}${kind.anchor}`}>
                  {program.name} →
                </Link>
              </li>
            ))}
          </ul>
        </article>
      ))}
    </div>
  );
}
