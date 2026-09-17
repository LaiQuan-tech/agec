import type { SiteDocument } from "@/lib/data";
import { translate, type Lang } from "@/lib/i18n";
import { ADMISSIONS } from "@/lib/i18n/admissions";
import { SHARED } from "@/lib/i18n/shared";
import { groupExamPapers } from "@/lib/admissions-kinds";
import { badgeFor } from "./document-badge";

/**
 * 學制招生頁的考古題區（/admissions/[program]#exams）：一個年度一列，左邊是
 * 年度標題（documents.description，例如「111碩士班招生考題」），右邊是該年度
 * 的科目連結並排（documents.label，例如「農業經濟學」），每條帶副檔名徽章。
 *
 * ## 為什麼不是 SiteDocuments 的卡片
 *
 * 舊站 link5 的考古題是 97 個檔：碩士班 36、博士班 18、碩士在職專班 43。
 * `.document-grid` 一張卡 280px 高、兩欄（`.post-documents` 的 760px 版），
 * 在職專班 43 個檔會是 22 列、六千多 px 的一面牆，而每張卡上的資訊只有
 * 「哪一年、哪一科」兩個詞。舊站是一張表：年度一列、科目一格。這裡照那個
 * 形狀做 —— 讀者找的是「我要考的那一年那一科」，掃一列比翻 22 列快。
 *
 * ## 分組
 *
 * `groupExamPapers`（lib/admissions-kinds.ts）依 description 分組、保留首次出現
 * 的順序，所以 DB 的 sort_order 決定年度順序（新的在前）與組內科目順序；沒填
 * 年度標題的列排在最後一組「其他」。
 *
 * ## 連結
 *
 * 直接 `<a href={file_url} target="_blank" rel="noopener">`，不是 MaybeLink：
 * 考古題是 PDF／Word，新分頁開；沒有 file_url 的列（系辦先列科目、檔案晚點補）
 * 印成不可點的 <span>，不承諾一個點不到的下載。
 *
 * ## 標記
 *
 * `.exam-papers > .exam-year`（h4 ＋ ul）—— 樣式在 site-extensions.css：≥860px
 * 年度與科目同一列（grid 200px 1fr），窄螢幕堆疊；科目是白底小卡、hover 同
 * `.resource-row a`，徽章沿用 `.document-grid>a>span` 的金色小字。
 */
export function ExamPapers({
  lang,
  documents,
}: {
  lang: Lang;
  /** 只有 category_zh === EXAM_CATEGORY 的列，已依 sort_order 排好（ProgramAdmissions 篩過）。 */
  documents: SiteDocument[];
}) {
  if (documents.length === 0) return null;

  const t = translate(ADMISSIONS, lang);
  const shared = translate(SHARED, lang);
  const groups = groupExamPapers(documents);

  return (
    <div className="exam-papers">
      {groups.map((group) => (
        <div className="exam-year" key={group.key ?? "__other__"}>
          <h4>{group.heading ?? t.programPage.exams.other}</h4>
          <ul>
            {group.items.map((doc) => (
              <li key={doc.id}>
                {doc.file_url ? (
                  <a href={doc.file_url} target="_blank" rel="noopener">
                    {doc.label}
                    <span>{badgeFor(doc, shared.fileBadge)}</span>
                  </a>
                ) : (
                  <span className="exam-pending">{doc.label}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
