import type { Metadata } from "next";
import { requireManagerOrRedirect } from "@/lib/admin/auth";
import { EmptyState, Table, TBody, TD, TH, THead, TR } from "@/components/admin/ui/Table";
import { UserForm } from "./UserForm";
import { RowActions } from "./RowActions";
import { createUser } from "./actions";
import { ROLE_LABEL, toAdminRole } from "./constants";

export const metadata: Metadata = { title: "人員管理" };
export const dynamic = "force-dynamic";

type Row = {
  user_id: string;
  email: string | null;
  note: string | null;
  role: string;
  created_at: string;
  created_by: string | null;
};

function taipei(iso: string): string {
  return new Intl.DateTimeFormat("zh-TW", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(iso));
}

const ROLE_STYLE: Record<string, { background: string; color: string }> = {
  admin: { background: "#dcfce7", color: "#166534" },
  operator: { background: "#e5e7eb", color: "#374151" },
};

export default async function UsersPage() {
  // ⚠️ 管理員限定。AdminShell 對操作人員不渲染這個選單項目，但那只是畫面 ——
  // 知道網址就打得到，所以這一行才是實際的守門。資料庫的 is_manager() policy
  // 是第三道。
  const { supabase, userId: selfId } = await requireManagerOrRedirect();

  const { data, error } = await supabase
    .from("admin_users")
    .select("user_id, email, note, role, created_at, created_by")
    .order("created_at", { ascending: true })
    .returns<Row[]>();

  if (error) console.error("[admin/users] 讀取失敗:", error.code, error.message);
  const rows = data ?? [];

  // 「誰加的」：created_by 指向 auth.users，沒辦法直接 join 回 admin_users，
  // 所以在這裡用已經撈回來的清單自己對。加他的人若已經被移除，就顯示 —— 而不是
  // 一串沒有意義的 uuid。
  const emailById = new Map(rows.map((r) => [r.user_id, r.email ?? r.user_id]));
  const managerCount = rows.filter((r) => toAdminRole(r.role) === "admin").length;

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-[22px] font-bold" style={{ color: "var(--brand-green)" }}>
          人員管理
        </h1>
        <p className="mt-1 text-[13px]" style={{ color: "var(--muted)" }}>
          只有「管理員」看得到這一頁。操作人員可以編輯所有內容，但不能管理人員、
          也看不到操作日誌。
        </p>
      </header>

      {error && (
        <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700">
          {error.code === "42P01"
            ? "資料表還沒更新。請先在 Supabase Dashboard 執行 supabase/migrations/20260902100000_admin_user_management.sql。"
            : "讀取失敗，請重新整理。"}
        </p>
      )}

      {rows.length === 0 && !error ? (
        <EmptyState message="目前沒有任何後台人員" />
      ) : (
        <Table>
          <THead>
            <TH>電子信箱</TH>
            <TH className="w-[100px]">層級</TH>
            <TH className="w-[120px]">備註</TH>
            <TH className="w-[110px]">加入時間</TH>
            <TH className="w-[160px]">加入者</TH>
            <TH className="w-[330px]">操作</TH>
          </THead>
          <TBody>
            {rows.map((row) => {
              const role = toAdminRole(row.role);
              return (
                <TR key={row.user_id}>
                  <TD>{row.email ?? "（沒有信箱）"}</TD>
                  <TD>
                    <span
                      className="rounded px-1.5 py-0.5 text-[12px] font-medium"
                      style={ROLE_STYLE[role]}
                    >
                      {ROLE_LABEL[role]}
                    </span>
                  </TD>
                  <TD className="text-[12px]">{row.note ?? "—"}</TD>
                  <TD className="whitespace-nowrap tabular-nums text-[12px]">
                    {taipei(row.created_at)}
                  </TD>
                  <TD className="text-[12px]" style={{ color: "var(--muted)" }}>
                    {row.created_by ? (emailById.get(row.created_by) ?? "（已離開）") : "—"}
                  </TD>
                  <TD>
                    <RowActions
                      userId={row.user_id}
                      email={row.email ?? row.user_id}
                      role={role}
                      isSelf={row.user_id === selfId}
                    />
                  </TD>
                </TR>
              );
            })}
          </TBody>
        </Table>
      )}

      {managerCount <= 1 && rows.length > 0 && (
        <p className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-[13px] text-amber-800">
          ⚠️ 目前只有一位管理員。系統不允許把最後一位管理員移除或降級（資料庫層
          會擋下來），但建議至少指定兩位，避免那個人休假時沒有人能開帳號。
        </p>
      )}

      <section className="max-w-xl">
        <h2 className="mb-1 text-[16px] font-bold" style={{ color: "var(--brand-green)" }}>
          新增人員
        </h2>
        <p className="mb-4 text-[13px]" style={{ color: "var(--muted)" }}>
          建立一個全新的後台帳號。若這個信箱已經有帳號（例如先前被移除權限），
          系統會直接把他加回後台人員，密碼維持原本的那組。
        </p>
        <UserForm action={createUser} />
      </section>
    </div>
  );
}
