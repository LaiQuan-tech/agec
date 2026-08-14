/**
 * `nav.local-nav` — the sticky in-page section jumper on interior pages.
 *
 * Pure CSS sticky + plain anchors: the reference site has no scroll-spy, so
 * nothing here highlights the current section. Don't add one — that would be a
 * visible departure from the original.
 *
 * The anchors are page-level static config (each page names its own 4 sections),
 * not data, so pass them in from the page component.
 */
export function LocalNav({
  label,
  items,
}: {
  /** Page name shown at the left; hidden by CSS below 600px. */
  label: string;
  /** Section anchors, normally 4, in `#section-N` order. */
  items: { href: string; label: string }[];
}) {
  return (
    <nav className="local-nav" aria-label={`${label}頁內導覽`}>
      <div className="container local-nav-inner">
        <span className="local-nav-label">{label}</span>
        {/* Bare <div>: `.local-nav-inner>div` is the horizontal scroll
            container. An extra wrapper or a <ul> loses the overflow behaviour. */}
        <div>
          {items.map((item) => (
            <a key={item.href} href={item.href}>
              {item.label}
            </a>
          ))}
        </div>
      </div>
    </nav>
  );
}
