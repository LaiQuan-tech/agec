import type { Metadata } from "next";
import Link from "next/link";
import { requireAdminOrRedirect } from "@/lib/admin/auth";
import { Button } from "@/components/admin/ui/Button";
import { EmptyState, Table, TBody, TD, TH, THead, TR } from "@/components/admin/ui/Table";
import { DeleteButton } from "@/components/admin/ui/DeleteButton";
import { EnBadge, enProgress } from "../_components/EnBadge";
import { AppearsOn } from "../_components/AppearsOn";
import { FilterLink } from "../_components/FilterLink";
import { deleteDocument } from "./actions";
import {
  DOCUMENT_SECTIONS,
  documentSectionLabel,
  documentSectionPath,
  type DocumentSection,
} from "./constants";

export const metadata: Metadata = { title: "檔案下載" };
export const dynamic = "force-dynamic";

type Row = {
  id: number;
  section: string;
  category: string | null;
  program: string | null;
  label: string;
  label_en: string | null;
  description: string | null;
  description_en: string | null;
  file_url: string | null;
  file_name: string | null;
  sort_order: number;
};

function isDocumentSection(value: string): value is DocumentSection {
  return (DOCUMENT_SECTIONS as readonly string[]).includes(value);
}

export default async function SiteDocumentsListPage({
  searchParams,
}: {
  // Next 16：searchParams 是 promise。`?section=` 是側欄「課程資訊 › 修業規定 ·
  // 系上表單」這類入口帶進來的，讓列表先篩好那一頁的檔案；不在清單裡就當「全部」。
  searchParams: Promise<{ section?: string }>;
}) {
  const { supabase } = await requireAdminOrRedirect();
  const { section: sectionParam } = await searchParams;
  const section = sectionParam && isDocumentSection(sectionParam) ? sectionParam : null;

  let query = supabase
    .from("documents")
    .select(
      "id, section, category, program, label, label_en, description, description_en, file_url, file_name, sort_order"
    )
    .order("section", { ascending: true })
    .order("sort_order", { ascending: true })
    .order("id", { ascending: true });
  if (section) query = query.eq("section", section);
  const { data, error } = await query.returns<Row[]>();

  if (error) {
    console.error("[admin/documents] list failed:", error.message);
  }
  const rows = data ?? [];
  const newHref = section ? `/admin/documents/new?section=${section}` : "/admin/documents/new";

  // 資料表還沒建（migration 未執行）與「真的一筆都沒有」要分開講：兩種情況
  // 前台都不會印出這一區，但該做的事完全不同。
  const tableMissing = error?.code === "42P01" || error?.code === "PGRST205";
  const missingFile = rows.filter((row) => !row.file_url).length;

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-bold" style={{ color: "var(--brand-green)" }}>
            檔案下載{section ? ` · ${documentSectionLabel(section)}` : ""}
          </h1>
          <AppearsOn pathname="/admin/documents" filters={{ section }} />
          <p className="mt-1 text-[13px]" style={{ color: "var(--muted)" }}>
            系上自己的檔案，存在這個網站上。「課程資訊」的出現在課程資訊頁的「系上表單」，
            「招生資訊」的出現在招生資訊頁的「招生檔案」（招生簡章、書面資料格式、考古題）。
            填了「分類」的檔案會依分類分組、各組一個小標；標了「學制」的檔案還會多出現在
            該學制的修業規定頁底下（招生檔案則是依學制篩選）。
            某一個區塊一筆都沒有時，那一區不會出現在前台，旁邊那排外部連結不受影響。
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/courses#section-3" target="_blank">
            <Button variant="ghost" size="sm" title="在新分頁開啟課程資訊的系上表單">
              課程 ↗︎
            </Button>
          </Link>
          <Link href="/admissions#section-4" target="_blank">
            <Button variant="ghost" size="sm" title="在新分頁開啟招生資訊的招生檔案">
              招生 ↗︎
            </Button>
          </Link>
          <Link href={newHref}>
            <Button variant="primary">新增檔案</Button>
          </Link>
        </div>
      </header>

      <nav className="flex flex-wrap gap-2" aria-label="依區塊篩選">
        <FilterLink label="全部" href="/admin/documents" active={section === null} />
        {DOCUMENT_SECTIONS.map((sec) => (
          <FilterLink
            key={sec}
            label={documentSectionLabel(sec)}
            href={`/admin/documents?section=${sec}`}
            active={section === sec}
          />
        ))}
      </nav>

      {tableMissing ? (
        <p role="alert" className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-[13px] text-amber-800">
          資料表還沒建立。請先在 Supabase Dashboard 執行
          <code className="mx-1">supabase/migrations/20260908120000_documents.sql</code>
          。在那之前這一區不會出現在前台，網站其他部分不受影響。
        </p>
      ) : error ? (
        <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700">
          讀取失敗，請重新整理。若持續發生請回報。
        </p>
      ) : null}

      {missingFile > 0 && (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-[13px] text-amber-800">
          有 {missingFile} 筆還沒有上傳檔案。這不是錯誤 —— 那幾張卡片會照常出現在前台，
          只是還不能點，等你補上檔案就會自動變成可下載。
        </p>
      )}

      {rows.length === 0 && !error ? (
        <EmptyState
          message={
            section
              ? `「${documentSectionLabel(section)}」目前沒有任何檔案（那一區不會出現在前台）`
              : "目前沒有任何檔案（前台的「系上表單」與「招生檔案」區塊都不會出現）"
          }
          action={
            <Link href={newHref}>
              <Button variant="primary" size="sm">
                新增第一個檔案
              </Button>
            </Link>
          }
        />
      ) : rows.length > 0 ? (
        <Table>
          <THead>
            <TH className="w-[170px]">區塊</TH>
            <TH className="w-[150px]">分類／學制</TH>
            <TH className="w-[70px]">排序</TH>
            <TH>檔案名稱</TH>
            <TH>檔案</TH>
            <TH className="w-[80px]">翻譯</TH>
            <TH className="w-[160px]">操作</TH>
          </THead>
          <TBody>
            {rows.map((row) => {
              // 兩對中英欄位一起算，跟其他列表頁的徽章同一個口徑。
              const en = enProgress([
                [row.label, row.label_en],
                [row.description, row.description_en],
              ]);
              return (
                <TR key={row.id}>
                  <TD className="text-[13px]">
                    <a
                      href={documentSectionPath(row.section)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline underline-offset-2"
                      title="在新分頁開啟這一區的前台位置"
                    >
                      {documentSectionLabel(row.section)}
                    </a>
                  </TD>
                  <TD className="text-[13px]">
                    {/* 分類決定前台的分組小標，學制決定它會不會多出現在該學制的
                        修業規定頁 —— 兩個都空白時印一個灰字，讓「還沒填」看得見。 */}
                    {row.category || row.program ? (
                      <>
                        {row.category && <div>{row.category}</div>}
                        {row.program && (
                          <div style={{ color: "var(--muted)" }}>{row.program}</div>
                        )}
                      </>
                    ) : (
                      <span style={{ color: "var(--muted)" }}>—</span>
                    )}
                  </TD>
                  <TD className="tabular-nums">{row.sort_order}</TD>
                  <TD>
                    <Link
                      href={`/admin/documents/${row.id}`}
                      className="hover:underline underline-offset-2"
                    >
                      {row.label}
                    </Link>
                    {row.description && (
                      <p className="mt-0.5 text-[12px]" style={{ color: "var(--muted)" }}>
                        {row.description}
                      </p>
                    )}
                  </TD>
                  <TD className="text-[13px]">
                    {row.file_url ? (
                      // 直接連過去，讓系辦點一下就能確認上傳的是不是正確的檔案。
                      <a
                        href={row.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline underline-offset-2"
                      >
                        {row.file_name ?? "檔案"} ↗︎
                      </a>
                    ) : (
                      <span style={{ color: "var(--muted)" }}>（尚未上傳）</span>
                    )}
                  </TD>
                  <TD>
                    <EnBadge filled={en.filled} total={en.total} />
                  </TD>
                  <TD>
                    <div className="flex items-center gap-1">
                      <Link href={`/admin/documents/${row.id}`}>
                        <Button variant="ghost" size="sm">
                          編輯
                        </Button>
                      </Link>
                      <DeleteButton
                        action={deleteDocument}
                        id={row.id}
                        itemLabel={row.label}
                      />
                    </div>
                  </TD>
                </TR>
              );
            })}
          </TBody>
        </Table>
      ) : null}
    </div>
  );
}
