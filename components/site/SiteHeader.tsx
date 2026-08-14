"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { DESKTOP_NAV, MENU_ITEMS } from "./nav";

/**
 * Institution bar + masthead + full-screen menu overlay, i.e. everything above
 * the page content. One client component because the menu-open and
 * header-scrolled states both live here (site.js lines 2–18).
 */
export function SiteHeader() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // site.js toggles `.scrolled` past 28px and calls the handler once up front so
  // a reload that restores mid-page scroll doesn't start in the tall state. The
  // first paint is always unscrolled (SSR can't know scrollY) — same as ref.
  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 28);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  // The overlay locks background scrolling by writing body's inline style, so
  // the cleanup has to restore it: leaving it as "hidden" across a route change
  // freezes the whole site.
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  // The reference site closed the overlay from a click handler bound to every
  // <a> inside it; `closeOnNavigate` below is that same handler. It has to be
  // explicit because a <Link> navigation doesn't reload the document, so the
  // overlay would otherwise stay open over the new page.
  const closeOnNavigate = () => setMenuOpen(false);

  return (
    <>
      <div className="institution-bar">
        <div className="container institution-inner">
          <span>國立臺灣大學</span>
          <span className="institution-en">
            College of Bioresources and Agriculture
          </span>
          <div className="utility-links">
            <a href="#contact">聯絡我們</a>
            <a href="#sitemap">網站導覽</a>
            <a
              href="https://www.ntu.edu.tw/english/"
              target="_blank"
              rel="noreferrer"
            >
              EN
            </a>
          </div>
        </div>
      </div>

      <header className={`site-header${scrolled ? " scrolled" : ""}`}>
        <div className="container nav-shell">
          <Link
            className="brand"
            href="/"
            aria-label="國立臺灣大學農業經濟學系首頁"
          >
            {/* <img>, not inline SVG: agec_logo_motion.svg ships its own
                <style> + @keyframes. */}
            <img
              src="/brand/agec_logo_motion.svg"
              alt="國立臺灣大學農業經濟學系"
            />
          </Link>

          <nav className="desktop-nav" aria-label="主要導覽">
            {DESKTOP_NAV.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={active ? "active" : ""}
                  aria-current={active ? "page" : undefined}
                >
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <button
            className="menu-button"
            type="button"
            aria-label="開啟全站選單"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(true)}
          >
            <span />
            <span />
          </button>
        </div>
      </header>

      <div
        className={`menu-overlay${menuOpen ? " open" : ""}`}
        aria-hidden={!menuOpen}
      >
        <div className="menu-top container">
          <Link href="/" onClick={closeOnNavigate}>
            <img
              src="/brand/header_agec_logo.svg"
              alt="國立臺灣大學農業經濟學系"
            />
          </Link>
          {/* `.menu-top button span:last-child` rotates the second bar into the
              X. Keep exactly two spans, and keep this the only <button> in
              .menu-top — the reference CSS/JS both address it positionally. */}
          <button
            type="button"
            aria-label="關閉全站選單"
            onClick={() => setMenuOpen(false)}
          >
            <span />
            <span />
          </button>
        </div>

        <nav className="menu-content container" aria-label="全站選單">
          <p className="eyebrow light">EXPLORE AGEC · 8 MAIN PATHS</p>
          <div className="menu-grid">
            {MENU_ITEMS.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={active ? "active" : ""}
                  aria-current={active ? "page" : undefined}
                  tabIndex={menuOpen ? undefined : -1}
                  onClick={closeOnNavigate}
                >
                  <small>{item.no}</small>
                  <strong>{item.label}</strong>
                  <i>↗</i>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </>
  );
}
