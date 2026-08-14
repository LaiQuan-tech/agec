import type { ReactNode } from "react";
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
  variant,
  children,
}: {
  variant: "home" | "interior";
  children: ReactNode;
}) {
  return (
    <>
      <SiteLoader />
      <main className={variant === "interior" ? "interior-page" : undefined}>
        <a className="skip-link" href="#content">
          跳至主要內容
        </a>
        <SiteHeader />
        {children}
        <SiteFooter />
      </main>
    </>
  );
}
