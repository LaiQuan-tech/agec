"use client";

import { useEffect, useRef, useState } from "react";
import { translate, type Lang } from "@/lib/i18n";
import { SHARED } from "@/lib/i18n/shared";

/**
 * `nav.local-nav` — the sticky in-page section jumper on interior pages.
 *
 * The reference site has no scroll-spy: its anchors jump, but nothing ever
 * marks where you are. This port deliberately matched that until the client
 * asked for the current section to be highlighted, so the behaviour below is a
 * knowing departure from the original rather than an oversight. (The previous
 * comment here said "don't add one"; that recorded the fidelity decision, not a
 * technical constraint.)
 *
 * The anchors are page-level static config (each page names its own 4 sections),
 * not data, so pass them in from the page component.
 */

/**
 * The distance from the top of the viewport at which a section becomes the
 * current one.
 *
 * 145 is not tuned by eye — it is `.inner-section`'s own `scroll-margin-top`
 * in site.css, the single value that decides where an anchor jump parks a
 * section. Reusing it is what makes "click a link" and "scroll there yourself"
 * agree about which item lights up.
 *
 * Measuring the sticky stack instead would be actively wrong: `.local-nav`
 * animates in over its first 0.84s starting from `translateY(12px)`, so any
 * getBoundingClientRect() taken around mount is off by up to 12px.
 */
const ACTIVE_LINE = 145;

export function LocalNav({
  lang,
  label,
  items,
}: {
  lang: Lang;
  /** Page name shown at the left; hidden by CSS below 600px. */
  label: string;
  /** Section anchors, normally 4, in `#section-N` order. */
  items: { href: string; label: string }[];
}) {
  const t = translate(SHARED, lang);
  // zh reads "本系簡介頁內導覽"; en needs a space: "About AGEC on this page".
  const navLabel = lang === "en" ? `${label} ${t.onThisPage}` : `${label}${t.onThisPage}`;

  const scrollerRef = useRef<HTMLDivElement | null>(null);

  /**
   * The anchors whose target actually exists in the document.
   *
   * `null` until mount, meaning "show everything" — the server has no DOM to
   * check against, so the first paint has to render the list as given and let
   * the effect below narrow it. Same shape as SiteHeader's scroll state, which
   * likewise cannot know `scrollY` before hydration.
   *
   * This matters on /news: three of its five anchors are the reference site's
   * own dead links (#section-3…#section-5 name blocks the page never had), and
   * #section-2 only exists when there is at least one talk to put in it. Once
   * the rest of the bar highlights, an item that can neither be reached nor lit
   * reads as broken, so those are dropped rather than shown inert.
   */
  const [liveHrefs, setLiveHrefs] = useState<string[] | null>(null);
  const [activeHref, setActiveHref] = useState<string | null>(null);

  useEffect(() => {
    const targets = items
      .map((item) => ({
        href: item.href,
        el: document.getElementById(item.href.replace(/^#/, "")),
      }))
      .filter((entry): entry is { href: string; el: HTMLElement } =>
        Boolean(entry.el)
      );

    let rafId: number | null = null;

    const measure = () => {
      rafId = null;
      if (targets.length === 0) {
        setActiveHref(null);
        return;
      }

      // Bottom of the page first: a final section shorter than the gap between
      // ACTIVE_LINE and the viewport bottom can never reach the line, so
      // without this it would stay unreachable no matter how far you scroll.
      const atBottom =
        window.scrollY + window.innerHeight >=
        document.documentElement.scrollHeight - 2;
      if (atBottom) {
        setActiveHref(targets[targets.length - 1].href);
        return;
      }

      // The last section whose top has passed the line. Falls back to the
      // first one while still above it.
      let current = targets[0].href;
      for (const entry of targets) {
        if (entry.el.getBoundingClientRect().top <= ACTIVE_LINE + 1) {
          current = entry.href;
        } else {
          break;
        }
      }
      setActiveHref(current);
    };

    const onScroll = () => {
      // rAF guard, same shape as hooks/useParallax.ts: coalesce a burst of
      // scroll events into one measurement per frame.
      if (rafId !== null) return;
      rafId = requestAnimationFrame(measure);
    };

    // Both initial writes happen inside a frame rather than in the effect body:
    // React 19 flags a synchronous setState here as a cascading render, and
    // waiting one frame is what we want anyway — layout is settled by then, and
    // `.local-nav` is still sliding in from its entry animation before it.
    //
    // This first pass is also why a reload that restores a mid-page scroll
    // position lands on the right item instead of sitting on the first one.
    rafId = requestAnimationFrame(() => {
      setLiveHrefs(targets.map((entry) => entry.href));
      measure();
    });
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
    // `items` is a fresh array each render but its contents are page-level
    // constants, so key the effect on the hrefs rather than the array identity.
  }, [items]);

  /**
   * Keep the active item inside the horizontally scrolling strip.
   *
   * `.local-nav-inner>div` is `overflow-x:auto`, so on a narrow screen the
   * current section's link is often off-screen. Written as a manual scrollLeft
   * rather than `scrollIntoView({ block: "nearest" })`: that can still move the
   * page vertically, and this runs while the user is scrolling the page, so the
   * two would fight.
   *
   * Unlike hooks/useReveal and hooks/useParallax, reduced motion does NOT turn
   * the spy off — highlighting is information, not decoration, and someone who
   * asked for less movement still needs to know where they are. It only decides
   * whether this nudge animates.
   */
  const shown =
    liveHrefs === null
      ? items
      : items.filter((item) => liveHrefs.includes(item.href));

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller || !activeHref) return;

    // By position, not by an [href="…"] selector: the hrefs are fragments, so
    // that selector needs escaping, and the escape rules for an identifier and
    // for a quoted attribute value are not the same. The rendered order is
    // `shown`, so the index is exact.
    const index = shown.findIndex((item) => item.href === activeHref);
    const link = scroller.children[index] as HTMLAnchorElement | undefined;
    if (!link) return;

    const overLeft = link.offsetLeft - scroller.scrollLeft;
    const overRight =
      link.offsetLeft + link.offsetWidth - (scroller.scrollLeft + scroller.clientWidth);
    if (overLeft >= 0 && overRight <= 0) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    scroller.scrollTo({
      left:
        overLeft < 0
          ? link.offsetLeft - 16
          : scroller.scrollLeft + overRight + 16,
      behavior: reduced ? "auto" : "smooth",
    });
    // `shown` is derived, so it changes with liveHrefs, not on every render.
  }, [activeHref, shown]);

  return (
    <nav className="local-nav" aria-label={navLabel}>
      <div className="container local-nav-inner">
        <span className="local-nav-label">{label}</span>
        {/* Bare <div>: `.local-nav-inner>div` is the horizontal scroll
            container. An extra wrapper or a <ul> loses the overflow behaviour. */}
        <div ref={scrollerRef}>
          {shown.map((item) => {
            const active = item.href === activeHref;
            return (
              <a
                key={item.href}
                href={item.href}
                className={active ? "active" : ""}
                // "location", not "page": SiteHeader already marks the current
                // route with aria-current="page", and two different meanings of
                // "current" on one page is exactly the ambiguity this attribute
                // exists to avoid. "location" is the value for a position
                // within the page.
                aria-current={active ? "location" : undefined}
              >
                {item.label}
              </a>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
