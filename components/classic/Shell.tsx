"use client";

import { useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "@/lib/nav";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { SERIF } from "./format";
import styles from "./classic.module.css";

/**
 * 風格A 經典學院派 site chrome. Every ClassicXxx page component wraps its
 * content in <ClassicShell>. Structure (design_handoff_agec/README §首頁 A +
 * the prototype masthead/footer):
 *   utility top bar (gold) → sticky white masthead (round 農 logo + serif nav
 *   with 3px gold active underline; hamburger below the md breakpoint) →
 *   {children} → dark-green footer.
 */
export function ClassicShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col" style={{ background: "var(--page-bg)", color: "var(--ink)" }}>
      {/* utility top bar */}
      <div
        className="flex items-center justify-between gap-3 px-5 md:px-10"
        style={{
          background: "var(--brand-gold)",
          color: "#4a3a00",
          fontSize: "12.5px",
          fontWeight: 500,
          paddingTop: 8,
          paddingBottom: 8,
        }}
      >
        <span className="hidden truncate sm:inline">
          國立臺灣大學 College of Bioresources and Agriculture
        </span>
        <span className="sm:hidden">國立臺灣大學 農業經濟學系</span>
        <div className="flex items-center gap-3 md:gap-5">
          <span className="hidden lg:inline">繁體中文 · EN · 简</span>
          <span className="hidden lg:inline">網站導覽</span>
          <span
            className="hidden sm:inline-block"
            style={{ border: "1px solid rgba(74,58,0,.4)", padding: "3px 10px", borderRadius: 2 }}
          >
            教職員登入
          </span>
          <ThemeToggle />
        </div>
      </div>

      {/* sticky masthead + nav */}
      <header
        className="sticky top-0 z-50"
        style={{
          background: "#fff",
          borderBottom: "3px solid var(--brand-gold)",
          boxShadow: "0 2px 14px rgba(0,0,0,.05)",
        }}
      >
        <div className="flex items-center justify-between px-5 py-4 md:px-10">
          <Link href="/" className={`flex items-center gap-3.5 ${styles.navlink}`} aria-label="回首頁">
            <Image
              src="/agec-mark.png"
              alt="臺大農經系標誌"
              width={52}
              height={48}
              priority
              className="flex-none"
              style={{ height: 48, width: "auto" }}
            />
            <span>
              <span
                className="block"
                style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 20, letterSpacing: ".04em", color: "var(--brand-green)" }}
              >
                農業經濟學系暨研究所
              </span>
              <span
                className="mt-0.5 hidden sm:block"
                style={{ fontSize: "10.5px", letterSpacing: ".26em", color: "var(--gold-deep)", fontWeight: 600, textTransform: "uppercase" }}
              >
                Dept. of Agricultural Economics · NTU
              </span>
            </span>
          </Link>

          {/* desktop nav */}
          <nav className="hidden items-center lg:flex" style={{ gap: 24 }} aria-label="主導覽">
            {NAV_ITEMS.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={styles.navlink}
                  style={{
                    fontFamily: SERIF,
                    fontSize: "15.5px",
                    fontWeight: active ? 600 : 500,
                    color: "var(--ink)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {item.label}
                  {active && (
                    <span
                      aria-hidden="true"
                      style={{
                        position: "absolute",
                        left: 0,
                        right: 0,
                        bottom: -8,
                        height: 3,
                        background: "var(--brand-gold)",
                        borderRadius: 2,
                      }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* mobile hamburger */}
          <button
            type="button"
            className="flex flex-none items-center justify-center lg:hidden"
            aria-label={menuOpen ? "關閉選單" : "開啟選單"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
            style={{ width: 44, height: 44, borderRadius: 4, color: "var(--brand-green)" }}
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              {menuOpen ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M3 6h18M3 12h18M3 18h18" />}
            </svg>
          </button>
        </div>

        {/* mobile dropdown */}
        {menuOpen && (
          <nav className="lg:hidden" aria-label="主導覽" style={{ borderTop: "1px solid var(--hairline)" }}>
            {NAV_ITEMS.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  onClick={() => setMenuOpen(false)}
                  className="block px-5 py-3.5"
                  style={{
                    fontFamily: SERIF,
                    fontSize: "16px",
                    fontWeight: active ? 600 : 500,
                    color: active ? "var(--gold-deep)" : "var(--ink)",
                    background: active ? "var(--cream)" : "transparent",
                    borderBottom: "1px solid var(--hairline)",
                    borderLeft: active ? "3px solid var(--brand-gold)" : "3px solid transparent",
                  }}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        )}
      </header>

      <main className="flex-1">{children}</main>

      {/* footer */}
      <footer style={{ background: "var(--brand-green)", color: "#c2d6c9" }}>
        <div
          className="mx-auto flex max-w-[1180px] flex-col justify-between gap-8 px-5 py-11 md:flex-row md:items-start md:px-10"
          style={{ fontSize: 13, lineHeight: 1.9 }}
        >
          <div>
            <div style={{ background: "#fff", borderRadius: 10, padding: "12px 18px", display: "inline-block", marginBottom: 18 }}>
              <Image src="/agec-logo.png" alt="國立臺灣大學 農業經濟學系" width={138} height={60} style={{ height: 60, width: "auto" }} />
            </div>
            <div style={{ fontFamily: SERIF, color: "var(--gold-bright)", fontSize: 17, fontWeight: 600, marginBottom: 8 }}>
              國立臺灣大學 農業經濟學系
            </div>
            10617 臺北市大安區羅斯福路四段一號 · 農業綜合館
            <br />
            電話 (02) 3366-2600
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
