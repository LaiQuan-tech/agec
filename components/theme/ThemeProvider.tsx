"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useSyncExternalStore,
  type ReactNode,
} from "react";

export type Theme = "classic" | "modern";

const STORAGE_KEY = "agec-theme";
const DEFAULT_THEME: Theme = "classic";
// Fired whenever setTheme() runs, so every ThemeProvider instance (and any
// other tab, via the native "storage" event) re-reads localStorage.
const THEME_CHANGE_EVENT = "agec-theme-change";

type ThemeContextValue = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function isTheme(value: string | null): value is Theme {
  return value === "classic" || value === "modern";
}

function readStoredTheme(): Theme {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return isTheme(stored) ? stored : DEFAULT_THEME;
  } catch {
    // localStorage unavailable (private browsing, etc.) — fall back to default.
    return DEFAULT_THEME;
  }
}

function getServerSnapshot(): Theme {
  return DEFAULT_THEME;
}

function subscribe(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(THEME_CHANGE_EVENT, onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(THEME_CHANGE_EVENT, onStoreChange);
  };
}

/**
 * Site-wide theme context: `theme` is 'classic' (風格A經典學院派) or 'modern'
 * (風格B現代簡潔). Defaults to 'classic', persists the user's choice to
 * localStorage, and reflects the active theme as `data-theme` on
 * `<html>` so app/globals.css's `[data-theme="modern"]` token overrides
 * apply. Wrap the app with this in app/layout.tsx; consume it via
 * useTheme().
 *
 * Theme state is read via useSyncExternalStore (React's built-in tool for
 * syncing with an external store like localStorage): it uses
 * getServerSnapshot() ('classic') for the server render and the first
 * client render (so hydration always matches), then re-reads localStorage
 * right after. Returning 'modern' users may briefly see the classic theme
 * flash on full page load before it swaps — a known, accepted tradeoff for
 * this foundational pass (see final report).
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useSyncExternalStore(
    subscribe,
    readStoredTheme,
    getServerSnapshot
  );

  // Reflect the active theme on <html data-theme="…"> on mount and on every change.
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const setTheme = useCallback((next: Theme) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore write failures (private browsing, storage quota, etc.)
    }
    window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
  }, []);

  // Deep-link support: a `?theme=classic|modern` query param (used by the pitch
  // deck's 實機預覽 links) selects and persists that theme on load.
  useEffect(() => {
    try {
      const param = new URLSearchParams(window.location.search).get("theme");
      if (isTheme(param)) setTheme(param);
    } catch {
      // ignore (no window.location, malformed query, etc.)
    }
  }, [setTheme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme() must be used within a <ThemeProvider>");
  }
  return ctx;
}
