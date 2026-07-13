"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "@/lib/nav";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

/**
 * Placeholder Shell for 風格B現代簡潔 — page chrome (header nav + footer)
 * that every ModernXxx page component wraps itself in. This is intentionally
 * minimal (no glass/blur header pixel fidelity yet); the modern theme agent
 * will flesh this out to match design_handoff_agec/README.md (sticky
 * translucent/glass header, pill "立即申請" CTA, etc.) but MUST keep the
 * `{children}` wrapping contract so app/*\/page.tsx and the ModernXxx
 * placeholders keep working unmodified.
 */
export function ModernShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div
      className="flex min-h-screen flex-col"
      style={{ background: "var(--page-bg)", color: "var(--ink)" }}
    >
      <header
        className="sticky top-0 z-50"
        style={{
          background: "rgba(255,255,255,0.85)",
          backdropFilter: "blur(8px)",
          borderBottom: "1px solid var(--hairline)",
        }}
      >
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-4">
          <Link
            href="/"
            className="heading-font text-lg"
            style={{ color: "var(--brand-green)" }}
          >
            國立臺灣大學 農業經濟學系
          </Link>
          <nav className="flex flex-wrap items-center gap-5 text-sm" aria-label="主導覽">
            {NAV_ITEMS.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  style={{
                    color: active ? "var(--brand-green)" : "var(--ink)",
                    fontWeight: active ? 700 : 500,
                  }}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <ThemeToggle />
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer style={{ background: "var(--brand-green)", color: "var(--gold-bright)" }}>
        <div className="mx-auto max-w-6xl px-6 py-10 text-sm">
          <p className="heading-font text-lg">國立臺灣大學 農業經濟學系</p>
          <p className="mt-2" style={{ color: "var(--cream)" }}>
            10617 臺北市大安區羅斯福路四段一號・農業綜合館・電話 (02) 3366-2600
          </p>
        </div>
      </footer>
    </div>
  );
}
