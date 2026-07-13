"use client";

import { useEffect, useRef } from "react";

/**
 * Scroll parallax hook — reimplements the prototypes' componentDidMount
 * scroll logic (design_handoff_agec/prototypes/風格A_經典學院派.dc.html) as an
 * idiomatic React hook.
 *
 * Usage:
 *   const heroRef = useParallax<HTMLDivElement>(0.34);
 *   <div ref={heroRef} style={{ position: "absolute", inset: 0 }}>...</div>
 *
 * Behavior:
 * - On mount, records `base = element top (viewport) + scrollY`, i.e. the
 *   element's absolute document offset at mount time.
 * - On every rAF-throttled, passive scroll event, sets the element's
 *   transform to `translate3d(0, y, 0)` where
 *   `y = (scrollY - base) * -coefficient`.
 * - Coefficients per README: hero 0.28–0.34, full-bleed quote band 0.30.
 * - No-ops entirely (never attaches a listener or sets a transform) when
 *   `prefers-reduced-motion: reduce` is set.
 * - Cleans up the scroll listener and any pending rAF on unmount.
 *
 * Callers are expected to give the ref'd element room to move without
 * exposing its edges, per the prototypes' layering convention: an outer
 * `position:absolute; top:-16%~-18%; height:132%~136%` wrapper (this is the
 * element you attach the ref to) containing a full-bleed inner background.
 */
export function useParallax<T extends HTMLElement>(coefficient: number) {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const base = el.getBoundingClientRect().top + window.scrollY;
    let rafId: number | null = null;

    const apply = () => {
      rafId = null;
      const y = (window.scrollY - base) * -coefficient;
      el.style.transform = `translate3d(0, ${y.toFixed(1)}px, 0)`;
    };

    const onScroll = () => {
      if (rafId !== null) return;
      rafId = requestAnimationFrame(apply);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    apply(); // set initial position immediately, don't wait for the first scroll

    return () => {
      window.removeEventListener("scroll", onScroll);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [coefficient]);

  return ref;
}
