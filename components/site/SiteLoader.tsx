"use client";

import { useEffect, useState } from "react";

/**
 * Opening curtain, ported from site.js lines 20–28.
 *
 * Faithful details that matter:
 *  - it waits on `window.load` (all images), not DOMContentLoaded — so the 6s
 *    timeout is the *usual* exit path on image-heavy routes, not a fallback.
 *    Shortening it would make the curtain leave visibly earlier than the
 *    reference site.
 *  - `.is-complete` runs the CSS fade, and the node only leaves the DOM 450ms
 *    later. The original called `.remove()`; here it unmounts via state, since
 *    ripping a node out from under React invalidates its DOM bookkeeping.
 *  - Next.js client navigations never fire `load` again, so this renders once
 *    per full page load only — which is also the reference site's behaviour.
 */
export function SiteLoader() {
  const [complete, setComplete] = useState(false);
  const [mounted, setMounted] = useState(true);

  useEffect(() => {
    let removeTimer: number | undefined;
    let dismissed = false;

    const dismiss = () => {
      if (dismissed) return;
      dismissed = true;
      setComplete(true);
      removeTimer = window.setTimeout(() => setMounted(false), 450);
    };

    if (document.readyState === "complete") {
      window.requestAnimationFrame(dismiss);
    } else {
      window.addEventListener("load", dismiss, { once: true });
    }
    const hardTimeout = window.setTimeout(dismiss, 6000);

    return () => {
      window.removeEventListener("load", dismiss);
      window.clearTimeout(hardTimeout);
      if (removeTimer !== undefined) window.clearTimeout(removeTimer);
    };
  }, []);

  if (!mounted) return null;

  return (
    <div
      className={`site-loader${complete ? " is-complete" : ""}`}
      role="status"
      aria-live="polite"
    >
      {/* Kept as <img>: agec_loader.svg carries its own <style> + @keyframes,
          which stay scoped to the SVG document this way. Inlining the markup
          would leak those animation names into the page's global namespace. */}
      <img src="/brand/agec_loader.svg" alt="" width={120} height={120} />
      <span className="sr-only">頁面載入中</span>
    </div>
  );
}
