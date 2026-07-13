"use client";

import { useEffect, useRef } from "react";

/**
 * Scroll-reveal hook — pairs with the `.reveal` / `.reveal.in` CSS in
 * app/globals.css (ported from the prototypes' `[data-reveal]` / `.in`
 * rule, design_handoff_agec/README.md §3 捲動淡入).
 *
 * Usage:
 *   const ref = useReveal<HTMLDivElement>();
 *   <div ref={ref} className="reveal">...</div>
 *
 * Behavior:
 * - Observes the ref'd element with an IntersectionObserver (threshold
 *   0.12). When it first intersects, adds the "in" class and unobserves
 *   (fires once — the element stays visible after that).
 * - If `prefers-reduced-motion: reduce` is set (or IntersectionObserver is
 *   unavailable), skips the observer entirely and adds "in" immediately on
 *   mount, so content stays visible without the enter animation.
 */
export function useReveal<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReducedMotion || !("IntersectionObserver" in window)) {
      el.classList.add("in");
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );

    observer.observe(el);

    return () => observer.disconnect();
  }, []);

  return ref;
}
