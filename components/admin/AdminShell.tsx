import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { logoutAction } from "@/app/(admin)/admin/logout/actions";
import { Button } from "@/components/admin/ui/Button";
import type { AdminRole } from "@/lib/admin/auth";
import { AdminNav } from "./AdminNav";

/**
 * 側欄的內容在 components/admin/AdminNav.tsx（照前台選單分組，清單來自
 * lib/admin/site-map.ts）。這裡只負責殼：標誌、側欄容器、登出區與 <main>。
 *
 * ⚠️ `isManager` 只是顯示過濾（「系統」那一組要不要印）。Next 的 layout 在前端
 * 導覽時不會重新渲染，而 Server Action 是對頁面路由的 POST —— 知道網址就打得到。
 * 真正擋住的是那兩個頁面各自的 `requireManagerOrRedirect()`、每個 action 的
 * `requireManager()`，以及資料庫的 `is_manager()` policy。
 */
export function AdminShell({
  email,
  role,
  children,
}: {
  email: string | null;
  /** 後台層級。null 幾乎不會發生（layout 已經擋掉），保守起見當成操作人員。 */
  role: AdminRole | null;
  children: ReactNode;
}) {
  const isManager = role === "admin";
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[1400px] flex-col lg:flex-row">
      <aside
        className="shrink-0 border-b bg-white lg:flex lg:w-60 lg:flex-col lg:border-b-0 lg:border-r"
        style={{ borderColor: "var(--hairline)" }}
      >
        <div className="px-5 py-4">
          {/*
            標誌 ＋ 一行標題。原本這裡是「NTU AGEC」的文字替身，標誌到位之後
            兩者並存就是同一件事說兩次，所以文字那行移除。

            ⚠️ 用只有標誌的方形版（1.09:1）而不是完整橫式 lockup（2.29:1）：
            側欄只有 200px 可用寬（w-60 減 px-5），lockup 撐滿是 80px 高 ——
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

        {/* useSearchParams() 在 client 元件裡需要 Suspense 邊界；後台整個
            layout 是 force-dynamic，這裡的 fallback 實務上不會出現。 */}
        <Suspense fallback={null}>
          <AdminNav isManager={isManager} />
        </Suspense>

        <div
          className="mt-auto hidden border-t px-5 py-4 lg:block"
          style={{ borderColor: "var(--hairline)" }}
        >
          {email && (
            <p className="mb-2 truncate text-[12px]" style={{ color: "var(--muted)" }}>
              {email}
              {/* 印出層級：操作人員看不到「人員管理」時，至少知道那是層級造成的，
                  而不是以為後台壞了。 */}
              <span className="ml-1">（{isManager ? "管理員" : "操作人員"}）</span>
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
