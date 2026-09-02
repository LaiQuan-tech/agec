import Link from "next/link";
import type { ReactNode } from "react";
import { logoutAction } from "@/app/(admin)/admin/logout/actions";
import { Button } from "@/components/admin/ui/Button";

/** Sidebar entries. Order matches how often the office staff will need them. */
export const ADMIN_SECTIONS = [
  { href: "/admin/news", label: "最新消息" },
  { href: "/admin/faculty", label: "系所成員" },
  { href: "/admin/courses", label: "課程資訊" },
  { href: "/admin/programs", label: "招生學制" },
  { href: "/admin/links", label: "連結卡片" },
  { href: "/admin/events", label: "系友活動" },
] as const;

export function AdminShell({
  email,
  children,
}: {
  email: string | null;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[1400px] flex-col lg:flex-row">
      <aside
        className="shrink-0 border-b bg-white lg:w-56 lg:border-b-0 lg:border-r"
        style={{ borderColor: "var(--hairline)" }}
      >
        <div className="px-5 py-4">
          {/*
            標誌 ＋ 一行標題。原本這裡是「NTU AGEC」的文字替身，標誌到位之後
            兩者並存就是同一件事說兩次，所以文字那行移除。

            ⚠️ 用只有標誌的方形版（1.09:1）而不是完整橫式 lockup（2.29:1）：
            側欄只有 184px 可用寬（w-56 減 px-5），lockup 撐滿是 80px 高 ——
            在常駐工具欄上太重，而且側欄在 lg 以下會變成橫向頂列，那個高度會
            直接吃掉手機視窗。

            ⚠️ 一定要指定高度。scripts/build-logos.py 的 trim() 會刪掉 SVG 的
            width/height 屬性（刻意的，讓 CSS 依 viewBox 比例決定尺寸），沒給
            高度它會塌掉或撐滿。

            alt 是機構名而不是「後台」：整塊是一個 <Link>，讀屏會把 alt 與旁邊
            的文字串起來唸成「國立臺灣大學農業經濟學系 網站管理後台」。
          */}
          <Link href="/admin" className="flex items-center gap-3">
            <img
              src="/brand/agec_mark.svg"
              alt="國立臺灣大學農業經濟學系"
              className="h-[34px] w-auto shrink-0"
            />
            <span
              className="text-[15px] font-bold leading-tight"
              style={{ color: "var(--brand-green)" }}
            >
              網站管理後台
            </span>
          </Link>
        </div>

        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:overflow-visible lg:pb-0">
          {ADMIN_SECTIONS.map((s) => (
            <Link
              key={s.href}
              href={s.href}
              className="whitespace-nowrap rounded-md px-3 py-2 text-[14px] hover:bg-neutral-100"
              style={{ color: "var(--ink)" }}
            >
              {s.label}
            </Link>
          ))}
        </nav>

        <div
          className="mt-auto hidden border-t px-5 py-4 lg:block"
          style={{ borderColor: "var(--hairline)" }}
        >
          {email && (
            <p className="mb-2 truncate text-[12px]" style={{ color: "var(--muted)" }}>
              {email}
            </p>
          )}
          <div className="flex flex-col gap-2">
            <Link
              href="/"
              target="_blank"
              className="text-[12px] underline underline-offset-2"
              style={{ color: "var(--muted)" }}
            >
              開啟前台網站 ↗︎
            </Link>
            <form action={logoutAction}>
              <Button type="submit" variant="ghost" size="sm">
                登出
              </Button>
            </form>
          </div>
        </div>
      </aside>

      <main className="min-w-0 flex-1 px-5 py-6 lg:px-8 lg:py-8">{children}</main>
    </div>
  );
}
