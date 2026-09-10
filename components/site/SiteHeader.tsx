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
import { SEARCH } from "@/lib/i18n/search";
import type { SitemapGroup } from "./sitemap-tree";

/**
 * Institution bar + masthead + full-screen menu overlay, i.e. everything above
 * the page content. One client component because the menu-open and
 * header-scrolled states both live here (site.js lines 2–18).
 */
export function SiteHeader({
  lang,
  navTree,
}: {
  lang: Lang;
  /**
   * 每條路線底下有哪些區塊，由 SiteShell（server）算好傳進來 —— 見那裡的說明。
   * 桌機導覽用它展開下拉選單；行動版的全螢幕選單不吃這份資料。
   */
  navTree: SitemapGroup[];
}) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const t = translate(COMMON, lang);
  const shared = translate(SHARED, lang);
  const searchCopy = translate(SEARCH, lang);

  // `pathname` keeps the /en prefix on English pages while every nav href is
  // language-neutral, so both have to be reduced to the same form before they
  // are compared. Without this, `pathname === item.href` never matches under
  // /en and the whole header silently loses its active state.
  const { path } = splitLang(pathname);

  /*
   * 路線 → 它的細項。
   *
   * ⚠️ 用 href 查表，不要用索引對齊 sitemapTree()。那棵樹有九組（首頁 + 七條
   * 路線 + 「其他」），desktopNav() 只有七項；今天 slice(1, 8) 會對，但樹的
   * 組成一改就會靜默錯位成「滑到招生資訊、跑出課程資訊的細項」。
   */
  const childrenByHref = new Map(navTree.map((group) => [group.href, group.children]));

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
            {/* 聯絡我們仍然是同頁錨點 —— 頁尾在每一頁都在，所以不需要
                /en 前綴。網站導覽以前也是（跳到頁尾那兩欄），現在是一整頁：
                按下「網站導覽」的人想知道的是這個站有什麼，不是被送到他剛剛
                捲過的那一頁的最底下。見 components/site/SitemapPage.tsx。 */}
            <a href="#contact">{t.contact}</a>
            <Link href={localizePath("/sitemap", lang)}>{t.sitemap}</Link>
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
            {/* <img>, not inline SVG: these ship their own <style> +
                @keyframes.

                One lockup per language, not one lockup with a swapped caption.
                The identity has an approved horizontal mark for each — the
                Chinese one carries AGEC over 國立臺灣大學農業經濟學系, the
                English one three lines of English beside the mark — and they
                are different widths, so this is a different asset rather than
                different text. Both are built from the client's master by
                scripts/build-logos.py; the Chinese one has had the small
                "Department of Agricultural Economics, NTU" strapline removed at
                the client's request. */}
            <img
              src={`/brand/agec_logo_${lang}_motion.svg`}
              alt={t.departmentFull}
            />
          </Link>

          <nav className="desktop-nav" aria-label={t.mainNav}>
            {desktopNav(lang).map((item) => {
              const active = path === item.href;
              const href = navHref(item.href, lang);
              const children = childrenByHref.get(href) ?? [];

              return (
                /*
                  多包一層 .nav-item，下拉面板才有錨點。
                  ⚠️ 面板是 <a> 的兄弟，不是它的子元素 —— 面板裡是連結，放進
                  <a> 就變成巢狀 anchor（不合法，而且瀏覽器會把它拆開重排）。
                  ⚠️ site.css 對這一區的規則（.desktop-nav a、a:after、
                  a.active span、.desktop-nav span）全是後代選擇器，穿過這層
                  wrapper 仍然命中；唯一變的是 <a> 不再是 .desktop-nav 的
                  flex item，所以 wrapper 自己要是 flex（見 site-extensions.css）。
                */
                <div className="nav-item" key={item.href}>
                  <Link
                    href={href}
                    className={active ? "active" : ""}
                    aria-current={active ? "page" : undefined}
                  >
                    <span>{item.label}</span>
                  </Link>

                  {children.length > 0 && (
                    /*
                      ⚠️ 這裡不設 aria-current。這個站的兩個值各有歸屬：路由用
                      "page"（上面那個 Link），頁內位置用 "location"
                      （LocalNav）。在這裡再加第三種用法只會製造歧義。
                    */
                    <div className="nav-dropdown">
                      <ul>
                        {children.map((child) => (
                          <li key={child.href}>
                            <Link href={child.href}>{child.label}</Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          {/*
            全站搜尋。

            ⚠️ 是一個 <Link> 到 /search，不是一個會展開輸入框的按鈕。
            展開式搜尋要多一組狀態、要處理點外面關閉與 Esc、還要在 site.css
            凍結的前提下另外寫一套定位 —— 而它換來的只是省一次頁面載入。
            連結沒有 JavaScript 也能用，而且 /search 的輸入框會自動聚焦，
            實際操作是「點圖示 → 直接打字」，跟展開式一樣快。

            ⚠️ 放在 .desktop-nav 之後、.menu-button 之前，所以它在**兩種尺寸下
            都在**：.desktop-nav 在窄螢幕是 display:none，而 .menu-button 只在
            窄螢幕出現。這一顆兩邊都不隱藏，搜尋在手機上才不會只能從選單進去。

            圖示是內嵌 SVG 而不是字型圖示或圖片：這個站沒有引入任何圖示庫，
            而一個放大鏡是兩個圖形，內嵌比多一個網路請求划算。
            aria-hidden + 另外給 aria-label：圖示本身對讀屏沒有意義。
          */}
          <Link
            className="search-link"
            href={localizePath("/search", lang)}
            aria-label={searchCopy.openLabel}
            title={searchCopy.openLabel}
          >
            <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
              <circle cx="9" cy="9" r="6" />
              <line x1="13.5" y1="13.5" x2="18" y2="18" />
            </svg>
          </Link>

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
            {/* Reversed, and no motion: the overlay is already animating
                itself open, and a logo that redraws every time the menu is
                opened would be the loudest thing on a page whose job is to get
                out of the way.

                The reversed file exists because this sits on --green-deep. The
                original lockup's type is near-black, which is why the ported
                CSS put a paper-coloured plate behind it — that plate is
                overridden in site-extensions.css, and the type is white here
                instead. The gold peak is kept: it reads fine on the dark green
                and it is the half of the mark anyone recognises. */}
            <img
              src={`/brand/agec_logo_${lang}_reversed.svg`}
              alt={t.departmentFull}
            />
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

          {/*
            機構列的兩條工具連結，在這裡再出現一次。

            🔴 不是重複：site.css 在 860px 以下把 `.utility-links a:first-child`
            與 `:nth-child(2)` 藏起來（那一列只留語言切換），而 `.menu-button`
            正好從同一個斷點開始出現 —— 所以這個覆蓋層就是它們在窄螢幕上的
            唯一入口。

            「網站導覽」尤其不能漏。「聯絡我們」只是跳到頁尾，捲下去也找得到；
            網站導覽是一整頁，沒有這一條的話手機使用者根本到不了。

            放在 `.menu-grid` 之後而不是變成第九張卡：那格線的每一張卡都印著
            「NN」，多一張就等於宣稱站上有九條路線（頁尾少一條 /blog 也是同一個
            理由，見 SiteFooter.tsx）。
          */}
          <p className="menu-utility">
            <a href="#contact" onClick={closeOnNavigate} tabIndex={menuOpen ? undefined : -1}>
              {t.contact}
            </a>
            <Link
              href={localizePath("/sitemap", lang)}
              onClick={closeOnNavigate}
              tabIndex={menuOpen ? undefined : -1}
            >
              {t.sitemap}
            </Link>
          </p>
        </nav>
      </div>
    </>
  );
}
