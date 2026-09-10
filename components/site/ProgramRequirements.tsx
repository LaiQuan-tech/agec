import Link from "next/link";
import sanitizeHtml from "sanitize-html";
import type { Program } from "@/lib/data";
import { localizePath, translate, type Lang } from "@/lib/i18n";
import { COURSES } from "@/lib/i18n/courses";
import { SHARED } from "@/lib/i18n/shared";
import { RICH_TEXT_SANITIZE } from "@/lib/sanitize";
import { SiteShell } from "./SiteShell";
import { NextRoute } from "./NextRoute";

/**
 * 一個學制的修業規定 (/courses/[program])。
 *
 * ## 版型
 *
 * 沿用 `.post-*`（與 /news/[id]、/faculty/[id]、/alumni/events/[slug] 相同），
 * 不另外做一套：這幾頁的形狀一樣（麵包屑、標題、內文），而且共用一份 prose
 * 樣式才跟得上 sanitiser 的允許清單 —— 見 lib/sanitize.ts 檔頭那條
 * 「三件事一起動」。
 *
 * 這一頁的內文表格特別多（大學部兩張替代科目對照表、博士班五張學門表），
 * 而 `.post-body table` 的樣式與橫向捲動本來就在那一套裡，這是沿用它最實際的
 * 理由。
 *
 * ## 為什麼渲染時再過濾一次
 *
 * 存檔時已經過濾過了，這裡再一次是刻意的：Server Action 不是唯一能寫進這張表
 * 的路徑（SQL editor、帶 service-role key 的腳本），而這裡是 HTML 送進瀏覽器前
 * 的最後一關。同 NewsPost 與 FacultyProfile。
 */
export function ProgramRequirements({
  lang,
  program,
}: {
  lang: Lang;
  program: Program;
}) {
  const t = translate(COURSES, lang);
  const shared = translate(SHARED, lang);

  // getProgramByName 保證 requirements_html 非空，但型別上仍是 nullable ——
  // 這裡的 ?? "" 是型別窄化，不是防禦。
  const html = sanitizeHtml(program.requirements_html ?? "", RICH_TEXT_SANITIZE);
  const coursesPath = localizePath("/courses", lang);

  return (
    <SiteShell lang={lang} variant="interior">
      <article className="post-page">
        <div className="container post-head" id="content">
          <div className="breadcrumb">
            <Link href={localizePath("/", lang)}>{shared.home}</Link>
            <span>/</span>
            <Link href={coursesPath}>{t.title}</Link>
            <span>/</span>
            <span>{program.name}</span>
          </div>

          {/* 「修業規定」在學制名上面，與 /faculty/[id] 把職稱放在名字上面
              是同一個處理：讀者從 §2 的卡片點進來，第一眼要對得上他剛剛
              看到的東西。 */}
          <p className="post-byline">{t.requirements.label}</p>
          <h1>{program.name}</h1>
          {/* 另一種語言的學制名當小標。name_en 不是「取代 name 的翻譯」而是
              並排印的 Latin kicker（見 lib/data.ts 的 Program.name_en），所以
              中文頁印英文、英文頁印中文。 */}
          {lang === "en" ? (
            <p className="post-standfirst">{program.name_zh}</p>
          ) : program.name_en ? (
            <p className="post-standfirst">{program.name_en}</p>
          ) : null}

          {/* 英文頁正在顯示中文原文時才出現。規範性文字硬翻的風險比不翻高，
              所以這裡是說明而不是道歉 —— 讀者需要知道他看到的是官方版本。 */}
          {program.requirements_untranslated ? (
            <p className="post-standfirst" lang="en">
              {t.requirements.chineseOnly}
            </p>
          ) : null}
        </div>

        <div
          className="container post-body"
          dangerouslySetInnerHTML={{ __html: html }}
        />

        <div className="container post-foot">
          <Link href={coursesPath}>{t.requirements.back}</Link>
        </div>
      </article>

      <NextRoute lang={lang} />
    </SiteShell>
  );
}
