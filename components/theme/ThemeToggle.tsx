"use client";

import { useTheme } from "./ThemeProvider";

/**
 * Small pill switch for choosing the active site theme. Meant to be dropped
 * into each theme's own Shell/header component (components/classic/Shell.tsx,
 * components/modern/Shell.tsx already do this) — it works standalone
 * anywhere inside <ThemeProvider> since it only depends on useTheme().
 */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div
      role="group"
      aria-label="切換網站風格"
      className="inline-flex items-center gap-1 rounded-full p-1 text-xs font-semibold"
      style={{
        border: "1px solid var(--hairline)",
        background: "var(--page-bg)",
      }}
    >
      <button
        type="button"
        onClick={() => setTheme("classic")}
        aria-pressed={theme === "classic"}
        className="cursor-pointer rounded-full px-3 py-1.5 transition-colors"
        style={{
          background: theme === "classic" ? "var(--brand-gold)" : "transparent",
          color: theme === "classic" ? "var(--gold-ink)" : "var(--ink)",
        }}
      >
        經典 A
      </button>
      <button
        type="button"
        onClick={() => setTheme("modern")}
        aria-pressed={theme === "modern"}
        className="cursor-pointer rounded-full px-3 py-1.5 transition-colors"
        style={{
          background: theme === "modern" ? "var(--brand-gold)" : "transparent",
          color: theme === "modern" ? "var(--gold-ink)" : "var(--ink)",
        }}
      >
        現代 B
      </button>
    </div>
  );
}
