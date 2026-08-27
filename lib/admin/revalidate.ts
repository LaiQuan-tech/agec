import { revalidatePath } from "next/cache";
import { EN_PREFIX } from "@/lib/i18n";

/**
 * Which public routes go stale when a table changes.
 *
 * Centralised on purpose. Every public page is ISR with `revalidate = 300`, so
 * a missed call means the office staff saves an edit, reloads the site, sees
 * nothing, and saves again. The mapping is easy to get wrong per-action because
 * several tables feed more than one page — news and programs both appear on the
 * home page, and links feeds two different sections.
 *
 * Paths are listed once, language-neutral; `revalidateFor` expands each into
 * its Chinese and English route. Since the English version of a page is built
 * from the same rows (lib/data.ts resolves the `_en` columns at query time),
 * forgetting `/en` would leave the English site serving the old copy for five
 * minutes after every save — the exact failure this file exists to prevent,
 * just harder to notice because nobody on staff reads /en day to day.
 */
const AFFECTED_ROUTES = {
  news: ["/", "/news"],
  faculty: ["/faculty"],
  courses: ["/courses"],
  // /courses too, though no course row changed: getCourses() joins against
  // getPrograms() to build `program_label` (the 學制 column and the filter
  // tabs), so renaming a programme goes stale there as well.
  programs: ["/", "/admissions", "/courses"],
  // One entry per LinkItem["section"] that a page reads. Missing a route here
  // is the failure this file exists to prevent: the office saves a link, the
  // page keeps serving its ISR copy, and they save again.
  links: ["/students", "/courses", "/admissions", "/alumni"],
  posts: ["/blog"],
} as const;

export type RevalidateEntity = keyof typeof AFFECTED_ROUTES;

/** "/news" → ["/news", "/en/news"]; "/" → ["/", "/en"]. */
function bothLanguages(path: string): string[] {
  return [path, path === "/" ? EN_PREFIX : `${EN_PREFIX}${path}`];
}

/**
 * @param slugs post slugs to invalidate. Pass both the old and the new slug
 *   when a slug changes, otherwise the old URL keeps serving cached content.
 */
export function revalidateFor(entity: RevalidateEntity, ...slugs: (string | null | undefined)[]) {
  for (const path of AFFECTED_ROUTES[entity]) {
    for (const localized of bothLanguages(path)) {
      revalidatePath(localized);
    }
  }

  if (entity === "posts") {
    // A path containing a dynamic segment needs the type argument, and the two
    // language trees are separate route entries.
    revalidatePath("/blog/[slug]", "page");
    revalidatePath(`${EN_PREFIX}/blog/[slug]`, "page");
    for (const slug of slugs) {
      if (!slug) continue;
      for (const path of bothLanguages(`/blog/${slug}`)) revalidatePath(path);
    }
  }
}
