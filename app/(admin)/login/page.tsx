import type { Metadata } from "next";
import Link from "next/link";
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

  // Deliberately not wrapped in ClassicShell/ModernShell — those are client
  // components carrying the full public chrome (nav, footer, theme toggle),
  // none of which belongs on a login screen.
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <div
        className="w-full max-w-sm rounded-xl border bg-white p-8 shadow-sm"
        style={{ borderColor: "var(--hairline)" }}
      >
        <div className="mb-6 text-center">
          <p
            className="text-[11px] font-semibold tracking-[0.18em]"
            style={{ color: "var(--gold-deep)" }}
          >
            NTU AGEC
          </p>
          <h1
            className="mt-1 text-[20px] font-bold"
            style={{ color: "var(--brand-green)" }}
          >
            農經系網站管理後台
          </h1>
          <p className="mt-2 text-[13px]" style={{ color: "var(--muted)" }}>
            請使用系辦提供的帳號登入
          </p>
        </div>

        <LoginForm next={next ?? "/admin"} notAdmin={error === "not_admin"} />

        <p className="mt-6 text-center text-[12px]" style={{ color: "var(--muted)" }}>
          <Link href="/" className="underline underline-offset-2">
            回到網站首頁
          </Link>
        </p>
      </div>
    </main>
  );
}
