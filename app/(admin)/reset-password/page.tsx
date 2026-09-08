import type { Metadata } from "next";
import Link from "next/link";
import { ResetForm } from "./ResetForm";

export const metadata: Metadata = {
  title: "設定新密碼",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/** 重設密碼信裡那個連結的落點。token 的處理在 ResetForm（見它的檔頭）。 */
export default function ResetPasswordPage() {
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
            設定新密碼
          </h1>
        </div>

        <ResetForm />

        <p className="mt-6 text-center text-[12px]" style={{ color: "var(--muted)" }}>
          <Link href="/login" className="underline underline-offset-2">
            回到登入
          </Link>
        </p>
      </div>
    </main>
  );
}
