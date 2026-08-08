import type { Metadata } from "next";
import Link from "next/link";
import { requireAdminOrRedirect } from "@/lib/admin/auth";
import { ADMIN_SECTIONS } from "@/components/admin/AdminShell";

export const metadata: Metadata = { title: "總覽" };
export const dynamic = "force-dynamic";

/** Tables backing each section, for the row counts on the dashboard. */
const COUNT_TARGETS = [
  { table: "news", label: "最新消息", href: "/admin/news" },
  { table: "posts", label: "部落格文章", href: "/admin/posts" },
  { table: "faculty", label: "系所成員", href: "/admin/faculty" },
  { table: "courses", label: "課程", href: "/admin/courses" },
  { table: "programs", label: "招生學制", href: "/admin/programs" },
  { table: "links", label: "連結卡片", href: "/admin/links" },
] as const;

export default async function AdminDashboard() {
  // Re-checked here rather than relying on the layout — see lib/admin/auth.ts.
  const { supabase, email } = await requireAdminOrRedirect();

  const counts = await Promise.all(
    COUNT_TARGETS.map(async (t) => {
      const { count, error } = await supabase
        .from(t.table)
        .select("id", { count: "exact", head: true });
      if (error) {
        console.error(`[admin] count ${t.table} failed:`, error.message);
        return { ...t, count: null as number | null };
      }
      return { ...t, count: count ?? 0 };
    })
  );

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-[22px] font-bold" style={{ color: "var(--brand-green)" }}>
          總覽
        </h1>
        <p className="mt-1 text-[14px]" style={{ color: "var(--muted)" }}>
          {email ? `${email}，` : ""}選擇左側的區塊開始編輯。前台頁面最多 5 分鐘內會同步更新。
        </p>
      </header>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        {counts.map((c) => (
          <Link
            key={c.table}
            href={c.href}
            className="rounded-lg border bg-white p-4 transition-shadow hover:shadow-sm"
            style={{ borderColor: "var(--hairline)" }}
          >
            <p className="text-[13px]" style={{ color: "var(--muted)" }}>
              {c.label}
            </p>
            <p className="mt-1 text-[26px] font-bold" style={{ color: "var(--ink)" }}>
              {c.count ?? "—"}
              <span className="ml-1 text-[13px] font-normal" style={{ color: "var(--muted)" }}>
                筆
              </span>
            </p>
          </Link>
        ))}
      </section>

      <section
        className="rounded-lg border p-4 text-[13px]"
        style={{ borderColor: "var(--cream-border)", background: "var(--cream)" }}
      >
        <p className="font-medium" style={{ color: "var(--ink)" }}>
          小提醒
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-5" style={{ color: "var(--ink-soft)" }}>
          <li>「最新消息」放短公告，「部落格」放有內文的長文章。</li>
          <li>刪除無法復原，刪除前系統會再問一次。</li>
          <li>存檔後前台會立刻更新；若沒看到變化，重新整理一次瀏覽器。</li>
        </ul>
      </section>

      <nav className="flex flex-wrap gap-2">
        {ADMIN_SECTIONS.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="rounded-md border bg-white px-3 py-1.5 text-[13px] hover:bg-neutral-50"
            style={{ borderColor: "var(--hairline)", color: "var(--ink)" }}
          >
            {s.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
