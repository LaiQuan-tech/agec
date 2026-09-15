import type { Metadata } from "next";
import Link from "next/link";
import { requireAdminOrRedirect } from "@/lib/admin/auth";
import { Button } from "@/components/admin/ui/Button";
import { EmptyState, Table, TBody, TD, TH, THead, TR } from "@/components/admin/ui/Table";
import { DeleteButton } from "@/components/admin/ui/DeleteButton";
import { EnBadge, enProgress } from "../_components/EnBadge";
import { AppearsOn } from "../_components/AppearsOn";
import { FilterLink } from "../_components/FilterLink";
import { LINK_SECTIONS, isEditableSection, sectionLabel, sectionPath } from "./constants";
import { deleteLink } from "./actions";

export const metadata: Metadata = { title: "連結卡片" };
export const dynamic = "force-dynamic";

type Row = {
  id: number;
  section: string;
  label: string;
  label_en: string | null;
  url: string | null;
  program: string | null;
  sort_order: number;
};

export default async function LinksListPage({
  searchParams,
}: {
  // Next 16：searchParams 是 promise。後台是 force-dynamic，讀它沒有副作用。
  // `?section=` 是側欄「招生資訊 › 申請協助 · 資源連結」這類入口帶進來的，
  // 讓列表先篩好那一頁的卡片；不是清單裡的值就當「全部」。
  searchParams: Promise<{ section?: string }>;
}) {
  const { supabase } = await requireAdminOrRedirect();
  const { section: sectionParam } = await searchParams;
  const section = sectionParam && isEditableSection(sectionParam) ? sectionParam : null;

  // Grouped by section, then in display order — the same order the public
  // pages use, with the sections stacked so related cards stay together.
  //
  // Retired sections are listed too (in 「全部」), not filtered out: rows left
  // over from the 農經期刊 era are invisible on the site and the staff can only
  // clear them if they can see them here.
  let query = supabase
    .from("links")
    .select("id, section, label, label_en, url, program, sort_order")
    .order("section", { ascending: true })
    .order("sort_order", { ascending: true });
  if (section) query = query.eq("section", section);
  const { data, error } = await query.returns<Row[]>();

  if (error) {
    console.error("[admin/links] list failed:", error.message);
  }
  const rows = data ?? [];
  const newHref = section ? `/admin/links/new?section=${section}` : "/admin/links/new";

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-bold" style={{ color: "var(--brand-green)" }}>
            連結卡片{section ? ` · ${sectionLabel(section)}` : ""}
          </h1>
          <AppearsOn pathname="/admin/links" filters={{ section }} />
          <p className="mt-1 text-[13px]" style={{ color: "var(--muted)" }}>
            一張卡片一條連結，「區塊」欄決定它出現在哪一頁；招生資訊的卡片還可以標學制。
          </p>
        </div>
        <Link href={newHref}>
          <Button variant="primary">新增卡片</Button>
        </Link>
      </header>

      <nav className="flex flex-wrap gap-2" aria-label="依區塊篩選">
        <FilterLink label="全部" href="/admin/links" active={section === null} />
        {LINK_SECTIONS.map((sec) => (
          <FilterLink
            key={sec}
            label={sectionLabel(sec)}
            href={`/admin/links?section=${sec}`}
            active={section === sec}
          />
        ))}
      </nav>

      {error && (
        <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700">
          讀取失敗，請重新整理。若持續發生請回報。
        </p>
      )}

      {rows.length === 0 && !error ? (
        <EmptyState
          message={section ? `「${sectionLabel(section)}」目前沒有任何連結卡片` : "目前沒有任何連結卡片"}
          action={
            <Link href={newHref}>
              <Button variant="primary" size="sm">
                新增第一張卡片
              </Button>
            </Link>
          }
        />
      ) : (
        <Table>
          <THead>
            <TH className="w-[140px]">區塊</TH>
            <TH className="w-[70px]">排序</TH>
            <TH>卡片文字</TH>
            <TH>連結</TH>
            <TH className="w-[110px]">學制</TH>
            <TH className="w-[80px]">英文</TH>
            <TH className="w-[200px]">操作</TH>
          </THead>
          <TBody>
            {rows.map((row) => {
              const retired = !isEditableSection(row.section);
              // Matches the public card: '#' and null both render as plain text.
              const isPlainCard = !row.url || row.url === "#";
              // The URL is language-neutral, so 卡片文字 is the only pair here.
              const en = enProgress([[row.label, row.label_en]]);

              return (
                <TR key={row.id}>
                  <TD>
                    <span
                      className="rounded px-1.5 py-0.5 text-[12px]"
                      style={
                        retired
                          ? { background: "var(--hairline)", color: "var(--muted)" }
                          : { background: "var(--cream)", color: "var(--gold-deep)" }
                      }
                    >
                      {sectionLabel(row.section)}
                    </span>
                  </TD>
                  <TD className="tabular-nums">{row.sort_order}</TD>
                  <TD>
                    <Link href={`/admin/links/${row.id}`} className="hover:underline underline-offset-2">
                      {row.label}
                    </Link>
                  </TD>
                  <TD>
                    {isPlainCard ? (
                      <span className="text-[13px]" style={{ color: "var(--muted)" }}>
                        （純文字卡片）
                      </span>
                    ) : (
                      <span className="block max-w-[280px] truncate text-[13px]" title={row.url!}>
                        {row.url}
                      </span>
                    )}
                  </TD>
                  <TD className="text-[13px]">
                    {/* 只有招生資訊的卡片會用到這一欄；其他區塊留空是正確的，
                        所以不標記成缺漏。 */}
                    {row.program ? (
                      row.program
                    ) : (
                      <span style={{ color: "var(--muted)" }}>
                        {row.section === "admissions" ? "共通" : "—"}
                      </span>
                    )}
                  </TD>
                  <TD>
                    <EnBadge filled={en.filled} total={en.total} />
                  </TD>
                  <TD>
                    <div className="flex items-center gap-1">
                      <Link href={`/admin/links/${row.id}`}>
                        <Button variant="ghost" size="sm">
                          編輯
                        </Button>
                      </Link>
                      {/*
                        連到這張卡片實際出現的那一頁。
                        `sectionPath()` 從一開始就寫好了，但沒有任何地方呼叫它 ——
                        所以連結卡片是唯一一個「改完之後沒有辦法一鍵去看結果」
                        的實體。未使用的 section（journal）回 null，那一列就不
                        顯示這顆按鈕。
                      */}
                      {sectionPath(row.section) && (
                        <Link href={sectionPath(row.section)!} target="_blank">
                          <Button variant="ghost" size="sm" title="在新分頁開啟這張卡片所在的前台頁面">
                            前台 ↗︎
                          </Button>
                        </Link>
                      )}
                      <DeleteButton action={deleteLink} id={row.id} itemLabel={row.label} />
                    </div>
                  </TD>
                </TR>
              );
            })}
          </TBody>
        </Table>
      )}
    </div>
  );
}
