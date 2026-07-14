"use client";

import { useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "@/lib/nav";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { SANS } from "./format";
import styles from "./modern.module.css";

/**
 * 風格B 現代簡潔 site chrome. Every ModernXxx page component wraps its content
 * in <ModernShell>. Structure (design_handoff_agec/README §首頁 B + prototype):
 *   sticky semi-transparent glass header (backdrop-blur, rounded 農 logo +
 *   sans nav with green-bold active state + gold pill CTA; hamburger below the
 *   lg breakpoint) → {children} → dark-green footer.
 */
export function ModernShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col" style={{ background: "var(--page-bg)", color: "var(--ink)" }}>
      {/* sticky glass header */}
      <header
        className="sticky top-0 z-50"
        style={{
          background: "rgba(255,255,255,.92)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          borderBottom: "1px solid #f0ede3",
        }}
      >
        <div className="mx-auto flex max-w-[1240px] items-center justify-between px-6 py-4 md:px-11 md:py-5">
          <Link href="/" className={`flex items-center ${styles.navlink}`} aria-label="國立臺灣大學 農業經濟學系">
            <Image
              src="/agec-logo.png"
              alt="國立臺灣大學 農業經濟學系"
              width={98}
              height={42}
              priority
              className="flex-none"
              style={{ height: 42, width: "auto" }}
            />
          </Link>

          {/* desktop nav */}
          <nav className="hidden items-center lg:flex" style={{ gap: 26 }} aria-label="主導覽">
            {NAV_ITEMS.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={styles.navlink}
                  style={{
                    fontSize: "14.5px",
                    fontWeight: active ? 700 : 500,
                    color: active ? "var(--brand-green)" : "#3a3f37",
                  }}
                >
                  {item.label}
                </Link>
              );
            })}
            <Link
              href="/admissions"
              className={styles.btnY}
              style={{ background: "var(--brand-gold)", color: "var(--gold-ink)", fontWeight: 700, padding: "9px 18px", borderRadius: 22, fontSize: "13.5px" }}
            >
              立即申請
            </Link>
            <ThemeToggle />
          </nav>

          {/* mobile controls — ThemeToggle lives inside the dropdown to keep the bar uncramped */}
          <div className="flex items-center lg:hidden">
            <button
              type="button"
              className="flex flex-none items-center justify-center"
              aria-label={menuOpen ? "關閉選單" : "開啟選單"}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}
              style={{ width: 44, height: 44, borderRadius: 12, color: "var(--brand-green)" }}
            >
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                {menuOpen ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M3 6h18M3 12h18M3 18h18" />}
              </svg>
            </button>
          </div>
        </div>

        {/* mobile dropdown */}
        {menuOpen && (
          <nav className="lg:hidden" aria-label="主導覽" style={{ borderTop: "1px solid #f0ede3", background: "#fff" }}>
            {NAV_ITEMS.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  onClick={() => setMenuOpen(false)}
                  className="block px-6 py-3.5"
                  style={{
                    fontSize: "16px",
                    fontWeight: active ? 700 : 500,
                    color: active ? "var(--brand-green)" : "var(--ink)",
                    background: active ? "var(--cream)" : "transparent",
                    borderBottom: "1px solid var(--hairline)",
                  }}
                >
                  {item.label}
                </Link>
              );
            })}
            <Link
              href="/admissions"
              onClick={() => setMenuOpen(false)}
              className="block px-6 py-4"
              style={{ color: "var(--gold-deep)", fontWeight: 700 }}
            >
              立即申請 →
            </Link>
            <div className="px-6 py-4" style={{ borderTop: "1px solid var(--hairline)" }}>
              <ThemeToggle />
            </div>
          </nav>
        )}
      </header>

      <main className="flex-1">{children}</main>

      {/* footer */}
      <footer style={{ background: "var(--brand-green)", color: "#c2d6c9" }}>
        <div
          className="mx-auto flex max-w-[1240px] flex-col justify-between gap-8 px-6 py-12 md:flex-row md:items-start md:px-11"
          style={{ fontSize: "13.5px", lineHeight: 1.9 }}
        >
          <div>
            <div style={{ background: "#fff", borderRadius: 14, padding: "12px 18px", display: "inline-block", marginBottom: 18 }}>
              <Image src="/agec-logo.png" alt="國立臺灣大學 農業經濟學系" width={138} height={60} style={{ height: 60, width: "auto" }} />
            </div>
            <div style={{ fontFamily: SANS, color: "var(--gold-bright)", fontSize: 16, fontWeight: 700, marginBottom: 8 }}>
              臺大農業經濟學系
            </div>
            10617 臺北市大安區羅斯福路四段一號 · 農業綜合館
            <br />
            (02) 3366-2600
          </div>
          <nav className="flex gap-8 md:gap-11" aria-label="頁尾快速連結">
            <Link href="/news" className={styles.navlink}>最新消息</Link>
            <Link href="/admissions" className={styles.navlink}>招生資訊</Link>
            <Link href="/courses" className={styles.navlink}>課程資訊</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
