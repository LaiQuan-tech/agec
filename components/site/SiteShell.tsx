import type { ReactNode } from "react";
import { htmlLang, translate, type Lang } from "@/lib/i18n";
import { SHARED } from "@/lib/i18n/shared";
import { SiteLoader } from "./SiteLoader";
import { SiteHeader } from "./SiteHeader";
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
        <SiteHeader lang={lang} />
        {children}
        <SiteFooter lang={lang} />
      </main>
    </>
  );
}
