"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { desktopNav, menuItems } from "./nav";
import { navHref } from "@/lib/nav";
import {
  htmlLang,
  localizePath,
  splitLang,
  translate,
  type Lang,
} from "@/lib/i18n";
import { COMMON } from "@/lib/i18n/common";
import { SHARED } from "@/lib/i18n/shared";

/**
 * Institution bar + masthead + full-screen menu overlay, i.e. everything above
 * the page content. One client component because the menu-open and
 * header-scrolled states both live here (site.js lines 2–18).
 */
export function SiteHeader({ lang }: { lang: Lang }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const t = translate(COMMON, lang);
  const shared = translate(SHARED, lang);

  // `pathname` keeps the /en prefix on English pages while every nav href is
  // language-neutral, so both have to be reduced to the same form before they
  // are compared. Without this, `pathname === item.href` never matches under
  // /en and the whole header silently loses its active state.
  const { path } = splitLang(pathname);

  // The language toggle points at *this* page in the other language, so the
  // visitor keeps their place instead of being dumped on a home page. The
  // target language comes from the `lang` prop rather than from `splitLang`,
  // so the button can never disagree with the page that actually rendered.
  const otherLang: Lang = lang === "zh" ? "en" : "zh";
  const otherHref = localizePath(path, otherLang);

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
          <span>{t.university}</span>
          <span className="institution-en">{t.college}</span>
          <div className="utility-links">
            {/* Same-page anchors, not routes: the footer they target is
                rendered on every page, so these need no /en prefix. */}
            <a href="#contact">{t.contact}</a>
            <a href="#sitemap">{t.sitemap}</a>
            {/* The language toggle. It used to be an outbound link to
                www.ntu.edu.tw/english/ — a placeholder from the design comp
                that never switched anything — and is now the real thing.

                Three constraints, all load-bearing:
                  - it stays the third and last <a> of `.utility-links`, with
                    no class. site.css hides the other two positionally
                    (`a:first-child, a:nth-child(2)`), so this is the only
                    control left in the bar below 600px; adding, reordering or
                    wrapping anything here unhides them.
                  - `lang` marks the label itself, which is written in the
                    language being offered ("EN" on the Chinese site, "中" on
                    the English one) — without it a screen reader announces
                    "中" with an English voice and vice versa.
                  - `hrefLang` describes the destination, which is the same
                    page in `otherLang`.
                `prefetch={false}` because this link is above the fold on every
                page: left on, Next would pull the counterpart page's RSC
                payload for every visitor to serve the few who switch. */}
            <Link
              href={otherHref}
              hrefLang={htmlLang(otherLang)}
              lang={htmlLang(otherLang)}
              aria-label={shared.switchLanguage}
              prefetch={false}
            >
              {shared.languageLabel}
            </Link>
          </div>
        </div>
      </div>

      <header className={`site-header${scrolled ? " scrolled" : ""}`}>
        <div className="container nav-shell">
          <Link
            className="brand"
            href={localizePath("/", lang)}
            aria-label={t.brandHome}
          >
            {/* <img>, not inline SVG: agec_logo_motion.svg ships its own
                <style> + @keyframes. */}
            <img src="/brand/agec_logo_motion.svg" alt={t.departmentFull} />
          </Link>

          <nav className="desktop-nav" aria-label={t.mainNav}>
            {desktopNav(lang).map((item) => {
              const active = path === item.href;
              return (
                <Link
                  key={item.href}
                  href={navHref(item.href, lang)}
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
            aria-label={t.openMenu}
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
          <Link href={localizePath("/", lang)} onClick={closeOnNavigate}>
            <img src="/brand/header_agec_logo.svg" alt={t.departmentFull} />
          </Link>
          {/* `.menu-top button span:last-child` rotates the second bar into the
              X. Keep exactly two spans, and keep this the only <button> in
              .menu-top — the reference CSS/JS both address it positionally. */}
          <button
            type="button"
            aria-label={t.closeMenu}
            onClick={() => setMenuOpen(false)}
          >
            <span />
            <span />
          </button>
        </div>

        <nav className="menu-content container" aria-label={t.siteMenu}>
          <p className="eyebrow light">{t.menuEyebrow}</p>
          <div className="menu-grid">
            {menuItems(lang).map((item) => {
              const active = path === item.href;
              return (
                <Link
                  key={item.href}
                  href={navHref(item.href, lang)}
                  className={active ? "active" : ""}
                  aria-current={active ? "page" : undefined}
                  tabIndex={menuOpen ? undefined : -1}
                  onClick={closeOnNavigate}
                >
                  <small>{item.no}</small>
                  <strong>{item.label}</strong>
                  <i>↗︎</i>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </>
  );
}
