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
  // 系友活動：列表在 /alumni，詳情頁在下面用動態路徑一併處理。
  events: ["/alumni"],
} as const;

export type RevalidateEntity = keyof typeof AFFECTED_ROUTES;

/** "/news" → ["/news", "/en/news"]; "/" → ["/", "/en"]. */
function bothLanguages(path: string): string[] {
  return [path, path === "/" ? EN_PREFIX : `${EN_PREFIX}${path}`];
}

/**
 * @param slugs the changed row's public identifier — a post slug, or a news
 *   id. Pass both the old and the new value when a post's slug changes,
 *   otherwise the old URL keeps serving cached content.
 */
export function revalidateFor(entity: RevalidateEntity, ...slugs: (string | null | undefined)[]) {
  for (const path of AFFECTED_ROUTES[entity]) {
    for (const localized of bothLanguages(path)) {
      revalidatePath(localized);
    }
  }

  if (entity === "news") {
    // Editing one item changes the list's ordering and can move items across
    // page boundaries, so every paginated page goes with it — and the item's
    // own page in both languages.
    //
    // ⚠️ 分類頁與年份頁也在這裡。它們是同一批資料的另外幾種切法，漏掉的話
    // 系辦改完一則消息、切到「招生」分類看，會看到五分鐘前的舊內容 ——
    // 而且只有在那幾個頁面才會發生，最不容易被發現的那種。
    for (const pattern of [
      "/news/page/[page]",
      "/news/[id]",
      "/news/category/[slug]",
      "/news/category/[slug]/page/[page]",
      "/news/year/[year]",
      "/news/year/[year]/page/[page]",
      "/news/category/[slug]/year/[year]",
      "/news/category/[slug]/year/[year]/page/[page]",
      "/news/talks",
      "/news/talks/page/[page]",
    ]) {
      revalidatePath(pattern, "page");
      revalidatePath(`${EN_PREFIX}${pattern}`, "page");
    }
    for (const id of slugs) {
      if (!id) continue;
      for (const path of bothLanguages(`/news/${id}`)) revalidatePath(path);
    }
  }

  if (entity === "events") {
    // 活動詳情頁。slugs 帶舊值與新值兩個 —— 改了 slug 而只重新驗證新的，
    // 舊網址會繼續供應快取內容。
    revalidatePath("/alumni/events/[slug]", "page");
    revalidatePath(`${EN_PREFIX}/alumni/events/[slug]`, "page");
    for (const slug of slugs) {
      if (!slug) continue;
      for (const path of bothLanguages(`/alumni/events/${slug}`)) revalidatePath(path);
    }
  }

}
