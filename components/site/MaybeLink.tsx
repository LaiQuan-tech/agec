import type { ReactNode } from "react";
import Link from "next/link";

/**
 * An `<a>` that is only a link when there is somewhere to go.
 *
 * The ported reference site renders every card, row and button as an anchor and
 * fills the ones it has no destination for with `href="#"`. That is not a
 * placeholder a visitor can see through: the element is focusable, a screen
 * reader announces it as a link, the cursor turns into a pointer, and clicking
 * it scrolls the page back to the top. The client reported exactly that on
 * /news, and the same pattern sits on /courses, /admissions, /students and
 * /alumni — 34 elements across the site at the last count.
 *
 * With no `href`, an `<a>` is still an `<a>`: every layout rule in site.css
 * that hangs off `.resource-row a`, `.course-table>a`, `.document-grid a` and
 * `.story-grid a` — borders, min-heights, grid columns — keeps applying. What
 * goes away is the part that was lying. Per the HTML spec an anchor without
 * `href` is a "placeholder link": not focusable, not announced as a link.
 *
 * The trailing `↗` goes with it. An arrow is a promise of navigation, so it is
 * rendered only when the promise can be kept — pass it as `arrow` rather than
 * writing it into `children`.
 *
 * Both halves reverse themselves the moment the office fills a URL in
 * /admin/links: the row becomes a real link and the arrow comes back.
 */
export function MaybeLink({
  href,
  className,
  role,
  children,
  arrow,
}: {
  /** `null`, `undefined`, `""` and `"#"` all count as "no destination". */
  href: string | null | undefined;
  className?: string;
  role?: string;
  children: ReactNode;
  /** Rendered after the children, only when `href` leads somewhere. */
  arrow?: ReactNode;
}) {
  // "#" is treated as empty on purpose: several `links` rows literally store it,
  // and a stored "#" is exactly as dead as a missing value.
  const target = href && href !== "#" ? href : null;

  if (!target) {
    return (
      <a className={className} role={role}>
        {children}
      </a>
    );
  }

  // Anything off-site keeps a plain <a>: next/link is for in-app routes, and
  // handing it an external URL costs a prefetch attempt for no benefit.
  const external = /^https?:\/\//.test(target) || target.startsWith("mailto:");
  if (external) {
    return (
      <a
        className={className}
        role={role}
        href={target}
        target="_blank"
        rel="noopener noreferrer"
      >
        {children}
        {arrow}
      </a>
    );
  }

  return (
    <Link className={className} role={role} href={target}>
      {children}
      {arrow}
    </Link>
  );
}
