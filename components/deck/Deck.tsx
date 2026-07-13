"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useParallax } from "@/hooks/useParallax";

/**
 * One slide of a <Deck>. `content` is the slide's foreground; `image` adds a
 * full-bleed parallax + Ken Burns background (with an optional `overlay`
 * gradient painted on top), while `surface` sets a solid background color for
 * text slides. `parallax` overrides the background parallax coefficient
 * (default 0.2, in the README's 0.28–0.34-ish hero range but gentler because
 * each slide is a full viewport). `label` is what the dot-nav shows.
 */
export type SlideDef = {
  id: string;
  label: string;
  content: ReactNode;
  image?: string;
  overlay?: string;
  surface?: string;
  parallax?: number;
};

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/** Full-bleed parallax + Ken Burns image layer for a photo slide. */
function SlideBackground({
  image,
  overlay,
  coefficient,
}: {
  image: string;
  overlay?: string;
  coefficient: number;
}) {
  const ref = useParallax<HTMLDivElement>(coefficient);
  return (
    <div className="deck-bg-clip" aria-hidden>
      <div ref={ref} className="deck-bg-move">
        <div
          className="deck-bg-img kb-bg"
          style={{ backgroundImage: `url(${image})` }}
        />
      </div>
      {overlay ? (
        <div className="deck-bg-overlay" style={{ background: overlay }} />
      ) : null}
    </div>
  );
}

/**
 * 簡報式全螢幕逐頁捲動容器。Renders each slide as a full-viewport, snap-aligned
 * section and layers on presentation chrome: a right-edge dot navigation, a top
 * progress bar, and keyboard control (↓/PageDn/Space → next, ↑/PageUp → prev,
 * Home/End → first/last). The active slide is tracked with an
 * IntersectionObserver. Nothing here is theme-specific — every color, radius and
 * font comes from the design tokens in app/globals.css, so the same deck renders
 * as 風格A經典學院派 or 風格B現代簡潔 purely from the active [data-theme].
 */
export function Deck({ items }: { items: SlideDef[] }) {
  const slideEls = useRef<(HTMLElement | null)[]>([]);
  const [active, setActive] = useState(0);
  const activeRef = useRef(0);

  const setActiveIndex = useCallback((idx: number) => {
    activeRef.current = idx;
    setActive(idx);
  }, []);

  // While the deck is mounted, put the document in snap mode.
  useEffect(() => {
    const html = document.documentElement;
    html.classList.add("deck-active");
    return () => html.classList.remove("deck-active");
  }, []);

  // Track which slide is centered in the viewport.
  useEffect(() => {
    const els = slideEls.current.filter(Boolean) as HTMLElement[];
    if (els.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            const idx = els.indexOf(entry.target as HTMLElement);
            if (idx >= 0) setActiveIndex(idx);
          }
        }
      },
      { threshold: [0.5] }
    );

    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [items.length, setActiveIndex]);

  const goTo = useCallback(
    (idx: number) => {
      const clamped = Math.max(0, Math.min(items.length - 1, idx));
      slideEls.current[clamped]?.scrollIntoView({
        behavior: prefersReducedMotion() ? "auto" : "smooth",
        block: "start",
      });
    },
    [items.length]
  );

  // Keyboard control — deck feel: one full slide per key press.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (target && /^(input|textarea|select|button|a)$/i.test(target.tagName)) {
        return;
      }

      let handled = true;
      switch (event.key) {
        case "ArrowDown":
        case "PageDown":
        case " ":
          goTo(activeRef.current + 1);
          break;
        case "ArrowUp":
        case "PageUp":
          goTo(activeRef.current - 1);
          break;
        case "Home":
          goTo(0);
          break;
        case "End":
          goTo(items.length - 1);
          break;
        default:
          handled = false;
      }
      if (handled) event.preventDefault();
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goTo, items.length]);

  return (
    <div className="deck-root">
      <div className="deck-progress" aria-hidden>
        <div
          className="deck-progress-fill"
          style={{ width: `${((active + 1) / items.length) * 100}%` }}
        />
      </div>

      {items.map((slide, index) => (
        <section
          key={slide.id}
          id={slide.id}
          ref={(el) => {
            slideEls.current[index] = el;
          }}
          className="deck-slide"
          aria-roledescription="slide"
          aria-label={`${index + 1} / ${items.length}・${slide.label}`}
          style={slide.surface ? { background: slide.surface } : undefined}
        >
          {slide.image ? (
            <SlideBackground
              image={slide.image}
              overlay={slide.overlay}
              coefficient={slide.parallax ?? 0.2}
            />
          ) : null}
          <div className="deck-slide-inner">{slide.content}</div>
        </section>
      ))}

      <nav className="deck-nav" aria-label="投影片導覽">
        {items.map((slide, index) => (
          <button
            key={slide.id}
            type="button"
            className="deck-dot"
            data-active={index === active}
            aria-current={index === active ? "true" : undefined}
            aria-label={slide.label}
            onClick={() => goTo(index)}
          >
            <span className="deck-dot-label">{slide.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
