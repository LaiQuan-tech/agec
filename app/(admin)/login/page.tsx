import type { Metadata } from "next";
import Link from "next/link";
import { getOptionalSession } from "@/lib/admin/auth";
import { Button } from "@/components/admin/ui/Button";
import { logoutAction } from "../admin/logout/actions";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = {
  title: "教職員登入",
  // Keep the admin out of search results entirely.
  robots: { index: false, follow: false },
};

// Never cache a page whose whole job is to reflect session state.
export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  // Next 16: searchParams is a promise.
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;

  // 有 session 的人也會走到這一頁：被「移除管理權限」的操作人員、自己在前台
  // 註冊的帳號、用重設密碼拿到 session 的非管理員，都被 requireAdminOrRedirect
  // 送來 /login?error=not_admin（lib/supabase/proxy.ts 對帶 ?error= 的登入頁
  // 不再彈回 /admin，否則是無限轉址）。登出鈕只在後台側欄，這些人永遠渲染
  // 不到 —— 所以這裡補一顆，他才能清掉這個 session、換別的帳號登入。
  // logoutAction 刻意沒有 requireAdmin() guard，就是為了這個情境。
  const session = await getOptionalSession();

  // Deliberately not wrapped in ClassicShell — it is a client component
  // carrying the full public chrome (nav, footer), none of which belongs on a
  // login screen.
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <div
        className="w-full max-w-sm rounded-xl border bg-white p-8 shadow-sm"
        style={{ borderColor: "var(--hairline)" }}
      >
        <div className="mb-6 text-center">
          {/*
            這裡用**完整**的橫式 lockup，與側欄的方形標記不同。登入頁是後台的
            大門：整頁只有一張卡、沒有其他 chrome，正是完整識別該出現的地方。
            卡片內容寬 320px（max-w-sm 減 p-8），200px 的 logo 置中留有餘裕。

            ⚠️ 標題從「農經系網站管理後台」改成「網站管理後台」：lockup 上已經
            印著「國立臺灣大學 農業經濟學系」，底下再寫一次「農經系」是同一張卡
            上重複兩次。

            ⚠️ 尺寸給寬度不給高度（與側欄相反）：這裡是置中的橫式圖，寬度才是
            版面要控制的那一邊。SVG 沒有 width/height 屬性，由 viewBox 決定比例。
          */}
          <img
            src="/brand/agec_logo_zh.svg"
            alt="國立臺灣大學農業經濟學系"
            className="mx-auto h-auto w-[200px]"
          />
          <h1
            className="mt-4 text-[20px] font-bold"
            style={{ color: "var(--brand-green)" }}
          >
            網站管理後台
          </h1>
          <p className="mt-2 text-[13px]" style={{ color: "var(--muted)" }}>
            請使用系辦提供的帳號登入
          </p>
        </div>

        <LoginForm next={next ?? "/admin"} notAdmin={error === "not_admin"} />

        {session && (
          <form
            action={logoutAction}
            className="mt-4 flex items-center justify-between gap-3 rounded-md border px-3 py-2 text-[12px]"
            style={{ borderColor: "var(--hairline)", color: "var(--muted)" }}
          >
            <span className="min-w-0 truncate">
              目前登入：{session.email ?? "（無信箱）"}
            </span>
            <Button type="submit" variant="ghost" size="sm" className="shrink-0">
              登出
            </Button>
          </form>
        )}

        <p className="mt-6 flex justify-center gap-3 text-center text-[12px]" style={{ color: "var(--muted)" }}>
          <Link href="/forgot-password" className="underline underline-offset-2">
            忘記密碼
          </Link>
          <span aria-hidden="true">·</span>
          <Link href="/" className="underline underline-offset-2">
            回到網站首頁
          </Link>
        </p>
      </div>
    </main>
  );
}
