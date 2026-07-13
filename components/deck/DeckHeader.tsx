"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "@/lib/nav";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { useTheme } from "@/components/theme/ThemeProvider";

/**
 * Fixed chrome for the slide deck: brand wordmark, full site nav (collapses on
 * narrow viewports — the deck's dot-nav and closing slide cover navigation
 * there) and the 風格A/B toggle. It floats translucently over the slides. The
 * only theme-specific touch is the masthead underline: 風格A經典學院派's 3px gold
 * rule vs 風格B現代簡潔's hairline — mirroring the two Shell headers so the deck
 * still reads as the same brand under either theme.
 */
export function DeckHeader() {
  const { theme } = useTheme();
  const pathname = usePathname();

  return (
    <header
      className="deck-header"
      style={{
        borderBottom:
          theme === "classic"
            ? "3px solid var(--brand-gold)"
            : "1px solid var(--hairline)",
      }}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-3">
        <Link
          href="/"
          className="heading-font text-sm sm:text-lg"
          style={{ color: "var(--brand-green)" }}
        >
          國立臺灣大學 農業經濟學系
        </Link>

        <nav
          className="hidden items-center gap-4 text-sm lg:flex"
          aria-label="主導覽"
        >
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                style={{
                  color: active ? "var(--gold-deep)" : "var(--ink)",
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
  );
}
