"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "@/lib/nav";

// Apple-authentic on Apple devices (SF Pro / PingFang), clean Noto Sans elsewhere.
const FONT =
  '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", var(--font-noto-sans-tc), "PingFang TC", "Noto Sans TC", sans-serif';

/**
 * Minimal Apple-style nav bar for the 投影片版 deck: translucent saturated-blur
 * bar (.deck-header) with a compact wordmark and slim site nav. Intentionally
 * chrome-light — no theme toggle — to keep the presentation clean; the inner
 * 風格A/B pages keep their own Shell + toggle. Nav collapses under 900px (the
 * deck's dot-nav + closing slide cover navigation there).
 */
export function DeckHeader() {
  const pathname = usePathname();

  return (
    <header className="deck-header">
      <div
        style={{
          maxWidth: "72rem",
          margin: "0 auto",
          height: "48px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 1.5rem",
        }}
      >
        <Link
          href="/"
          style={{
            fontFamily: FONT,
            fontSize: "0.95rem",
            fontWeight: 600,
            letterSpacing: "-0.01em",
            color: "#1d1d1f",
            textDecoration: "none",
          }}
        >
          臺大農業經濟學系
        </Link>

        <nav className="deck-header-nav" aria-label="主導覽">
          {NAV_ITEMS.filter((item) => item.href !== "/").map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                style={{
                  fontFamily: FONT,
                  fontSize: "0.82rem",
                  fontWeight: active ? 600 : 400,
                  color: active ? "#1d1d1f" : "#6e6e73",
                  textDecoration: "none",
                }}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
