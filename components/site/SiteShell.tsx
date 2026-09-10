import type { ReactNode } from "react";
import { htmlLang, translate, type Lang } from "@/lib/i18n";
import { SHARED } from "@/lib/i18n/shared";
import { SiteLoader } from "./SiteLoader";
import { SiteHeader } from "./SiteHeader";
import { sitemapTree } from "./sitemap-tree";
import { SiteFooter } from "./SiteFooter";

/**
 * The chrome every public page sits inside. DOM order matches the reference
 * site's SSR output exactly:
 *
 *   .site-loader                     (sibling of <main>)
 *   <main [class="interior-page"]>
 *     a.skip-link
 *     .institution-bar
 *     header.site-header             ┐ SiteHeader
 *     .menu-overlay                  ┘
 *     {children}
 *     footer#contact
 *   </main>
 *
 * Yes, the header and footer live *inside* <main> — that's what the reference
 * site does, and `.institution-bar` / `footer` are positioned relative to it.
 *
 * `variant` picks the <main> class, which is the layout fork point:
 * the home page's <main> has no class, the 7 interior pages use
 * `interior-page`.
 */
export function SiteShell({
  lang,
  variant,
  children,
}: {
  lang: Lang;
  variant: "home" | "interior";
  children: ReactNode;
}) {
  const t = translate(SHARED, lang);

  /*
   * 頁首下拉選單的資料，在這裡算而不是在 SiteHeader 裡算。
   *
   * ⚠️ SiteShell 是 server component，SiteHeader 是 "use client"。
   * sitemapTree() 會 import 六個頁面字典 + NEWS_CATEGORIES + NEWS_CATEGORY_PAGES；
   * 在 client component 裡呼叫等於把那一整包搬進瀏覽器的 bundle，而 SiteHeader
   * 目前只帶三個小字典。在這一側算好、把純資料當 prop 傳過去，瀏覽器只會收到
   * 已經解析成單一語言的字串陣列。
   *
   * 順帶：它每次呼叫都會重建整棵樹，放在 server 也就不必在 client 端 useMemo。
   */
  const navTree = sitemapTree(lang);

  return (
    <>
      <SiteLoader lang={lang} />
      {/* `lang` sits on <main>, not <html>.
          app/layout.tsx is shared by the public site and the admin, and it is
          statically rendered — reading the pathname there to vary the <html>
          attribute would make every page dynamic and lose ISR. A `lang` on an
          ancestor element is the spec-sanctioned override and covers the whole
          visible page, because the header, content and footer all live inside
          this <main>. */}
      <main
        lang={htmlLang(lang)}
        className={variant === "interior" ? "interior-page" : undefined}
      >
        <a className="skip-link" href="#content">
          {t.skipToContent}
        </a>
        <SiteHeader lang={lang} navTree={navTree} />
        {children}
        <SiteFooter lang={lang} />
      </main>
    </>
  );
}
