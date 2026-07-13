"use client";

import type { CSSProperties, ReactNode } from "react";
import { useReveal } from "@/hooks/useReveal";

/**
 * Client wrapper that applies the shared scroll-reveal primitive
 * (hooks/useReveal + the `.reveal`/`.reveal.in` CSS in app/globals.css) to its
 * children. Lets Server Components (e.g. ClassicHome) opt individual sections
 * into the fade-up-on-scroll behavior without themselves becoming client
 * components — the children pass straight through.
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
