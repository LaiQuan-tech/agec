import type { Metadata } from "next";
import Link from "next/link";
import { ForgotForm } from "./ForgotForm";

export const metadata: Metadata = {
  title: "忘記密碼",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * 忘記密碼：輸入信箱 → Supabase 寄出重設連結 → /reset-password 設新密碼。
 *
 * 版型與 /login 同一張卡，刻意不共用元件：兩頁的內容差得夠多（這裡沒有
 * lockup 以外的品牌敘述、沒有 next 參數），抽一層共用只會多一個要理解的間接。
 */
export default function ForgotPasswordPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <div
        className="w-full max-w-sm rounded-xl border bg-white p-8 shadow-sm"
        style={{ borderColor: "var(--hairline)" }}
      >
        <div className="mb-6 text-center">
          <img
            src="/brand/agec_logo_zh.svg"
            alt="國立臺灣大學農業經濟學系"
            className="mx-auto h-auto w-[200px]"
          />
          <h1 className="mt-4 text-[20px] font-bold" style={{ color: "var(--brand-green)" }}>
            忘記密碼
          </h1>
          <p className="mt-2 text-[13px]" style={{ color: "var(--muted)" }}>
            輸入後台帳號的電子郵件，我們會寄一封重設密碼的連結給你。
          </p>
        </div>

        <ForgotForm />

        <p className="mt-6 text-center text-[12px]" style={{ color: "var(--muted)" }}>
          <Link href="/login" className="underline underline-offset-2">
            回到登入
          </Link>
        </p>
      </div>
    </main>
  );
}
