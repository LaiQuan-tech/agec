import { revalidatePath } from "next/cache";

/**
 * Which public routes go stale when a table changes.
 *
 * Centralised on purpose. Every public page is ISR with `revalidate = 300`, so
 * a missed call means the office staff saves an edit, reloads the site, sees
 * nothing, and saves again. The mapping is easy to get wrong per-action because
 * several tables feed more than one page — news and programs both appear on the
 * home page, and links feeds two different sections.
 */
const AFFECTED_ROUTES = {
  news: ["/", "/news"],
  faculty: ["/faculty"],
  courses: ["/courses"],
  programs: ["/", "/admissions"],
  // One entry per LinkItem["section"] that a page reads. Missing a route here
  // is the failure this file exists to prevent: the office saves a link, the
  // page keeps serving its ISR copy, and they save again.
  links: ["/students", "/courses", "/admissions", "/alumni"],
  posts: ["/blog"],
} as const;

export type RevalidateEntity = keyof typeof AFFECTED_ROUTES;

/**
 * @param slugs post slugs to invalidate. Pass both the old and the new slug
 *   when a slug changes, otherwise the old URL keeps serving cached content.
 */
export function revalidateFor(entity: RevalidateEntity, ...slugs: (string | null | undefined)[]) {
  for (const path of AFFECTED_ROUTES[entity]) {
    revalidatePath(path);
  }

  if (entity === "posts") {
    // A path containing a dynamic segment needs the type argument.
    revalidatePath("/blog/[slug]", "page");
    for (const slug of slugs) {
      if (slug) revalidatePath(`/blog/${slug}`);
    }
  }
}
