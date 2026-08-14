import type { ReactNode } from "react";
import "./site.css";

/**
 * Layout for the 8 public routes. The route group's parentheses keep it out of
 * the URL — /about is still /about.
 *
 * site.css is the reference site's stylesheet copied byte for byte, including
 * the Tailwind v4.2.1 Preflight it was built with. Importing it here rather than
 * in the root layout is what keeps that second Preflight (and its `.container`,
 * its `@property --tw-*` registrations, and its --ink / --muted / --cream /
 * --green-deep values) out of app/(admin). Do not import app/globals.css into
 * this tree, and do not slice site.css apart: the public pages need its
 * Preflight, and its own unlayered `.container` rule already beats the Tailwind
 * one inside the same file.
 */
export default function SiteLayout({ children }: { children: ReactNode }) {
  return children;
}
