"use client";

import type { CSSProperties, ReactNode } from "react";
import { useReveal } from "@/hooks/useReveal";

/**
 * Client wrapper applying the shared scroll-reveal primitive (hooks/useReveal
 * + the `.reveal`/`.reveal.in` CSS in app/globals.css) to its children, so
 * Server Components (e.g. ModernHome) can opt sections into fade-up-on-scroll
 * without themselves becoming client components.
 */
export function Reveal({
  children,
  className,
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  const ref = useReveal<HTMLDivElement>();
  return (
    <div ref={ref} className={`reveal${className ? ` ${className}` : ""}`} style={style}>
      {children}
    </div>
  );
}
