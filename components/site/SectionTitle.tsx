import type { ReactNode } from "react";

/**
 * `header.inner-section-title` — the two-column section header that appears
 * 27 times across the 7 interior pages, making it the highest-leverage
 * component in the port.
 *
 * site.css addresses it positionally:
 *   .inner-section-title>div:first-child   → the 序號 + English eyebrow row
 *   .inner-section-title>div:last-child>p  → the optional description
 *
 * So the output must be exactly two <div>s, and `description` must be a direct
 * <p> child of the second one. Add a wrapper or a third <div> and the
 * description falls back to `.inner-section-title p`, which is the uppercase
 * letter-spaced eyebrow style — a loud, obvious break.
 *
 * Note alumni's `#section-3` renders no section title at all, so never make this
 * mandatory in a page's markup.
 */
export function SectionTitle({
  no,
  eyebrow,
  heading,
  description,
}: {
  /** Zero-padded section number, e.g. "02". */
  no: string;
  /** Uppercase English kicker, e.g. "MISSION & VISION". */
  eyebrow: string;
  /** Chinese heading; accepts nodes so pages can insert <br />. */
  heading: ReactNode;
  /** Optional supporting paragraph. Omit it and no <p> is rendered. */
  description?: ReactNode;
}) {
  return (
    <header className="inner-section-title">
      <div>
        <span>{no}</span>
        <p>{eyebrow}</p>
      </div>
      <div>
        <h2>{heading}</h2>
        {description ? <p>{description}</p> : null}
      </div>
    </header>
  );
}
