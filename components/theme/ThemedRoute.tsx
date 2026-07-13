"use client";

import type { ReactNode } from "react";
import { useTheme } from "./ThemeProvider";

/**
 * Route-level theme switch: mounts exactly one of `classic` / `modern`,
 * based on the current ThemeProvider context. Only the active theme's tree
 * is mounted (not both, then hidden), so scroll/IntersectionObserver
 * listeners belonging to the inactive theme's components never run.
 *
 * Usage (see any app/*\/page.tsx):
 *   <ThemedRoute
 *     classic={<ClassicHome newsHome={newsHome} programs={programs} />}
 *     modern={<ModernHome newsHome={newsHome} programs={programs} />}
 *   />
 */
export function ThemedRoute({
  classic,
  modern,
}: {
  classic: ReactNode;
  modern: ReactNode;
}) {
  const { theme } = useTheme();
  return theme === "classic" ? <>{classic}</> : <>{modern}</>;
}
