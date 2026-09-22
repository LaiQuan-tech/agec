import { revalidatePath } from "next/cache";
import { EN_PREFIX } from "@/lib/i18n";
import { PROGRAM_SLUG_LIST } from "@/lib/program-slugs";

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
  // /admissions 也在：§4 三張入口卡的簡章／書面資料連結落在各學制**最新一則**
  // 相關公告（lib/admissions-kinds.ts），系辦發了新簡章、卡片就該指到新的。
  news: ["/", "/news", "/admissions"],
  faculty: ["/faculty"],
  courses: ["/courses"],
  // /courses too, though no course row changed: getCourses() joins against
  // getPrograms() to build `program_label` (the 學制 column and the filter
  // tabs), so renaming a programme goes stale there as well.
  programs: ["/", "/admissions", "/courses"],
  // One entry per LinkItem["section"] that a page reads. Missing a route here
  // is the failure this file exists to prevent: the office saves a link, the
  // page keeps serving its ISR copy, and they save again.
  links: ["/students", "/admissions"],
  // 活動：系友活動列在 /alumni、一般活動列在 /news 的活動報名區。一次存檔不
  // 知道它改前改後各是哪一種對象（對象可以改），兩頁一起重新驗證；詳情頁在
  // 下面用動態路徑一併處理。
  events: ["/alumni", "/news"],
  // 核心能力膠囊只出現在 /admissions §3。
  capabilities: ["/admissions"],
  // 檔案下載卡。documents.section 決定每一筆落在哪一頁，但一次存檔只知道
  // 改了哪一列、不知道它是否換過區塊（例如從 courses 改成 admissions ——
  // 那會同時讓兩頁失效），所以兩頁一起重新驗證。
  documents: ["/courses", "/admissions"],
  // 頁面文案格位（page_copy）。學生專區、本系簡介、匯款帳號各存自己的 page，
  // 但一次存檔全部一起重新驗證（多驗證幾頁的代價是幾次讀取；下一頁接上時在
  // 這裡加）。/alumni 也在：§3 那顆「匯款帳號資訊」按鈕看 giving 的帳號有沒有
  // 填（components/site/pages.tsx 的 AlumniRoute），系辦第一次填好帳號、按鈕
  // 要立刻出現，而不是等 300 秒。
  page_copy: ["/students", "/about", "/alumni/giving"],
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
  // /sitemap.xml 列的是消息、活動、師資與學制的全部網址，這裡的每一種實體都
  // 會改變它的內容，所以不分實體一律重新驗證。app/sitemap.ts 另有 300 秒 ISR
  // 兜底；這一行讓系辦一存檔、爬蟲就拿得到新網址。
  revalidatePath("/sitemap.xml");

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

  if (entity === "faculty") {
    // 老師的站內個人頁。改了介紹之後那一頁必須跟著更新，而不是等 300 秒
    // ——「存了看不到」正是這個檔存在的理由。
    revalidatePath("/faculty/[id]", "page");
    revalidatePath(`${EN_PREFIX}/faculty/[id]`, "page");
    for (const id of slugs) {
      if (!id) continue;
      for (const path of bothLanguages(`/faculty/${id}`)) revalidatePath(path);
    }
  }

  if (entity === "programs") {
    // 學制的修業規定頁。系辦改完規定必須立刻看得到，而不是等 300 秒。
    //
    // ⚠️ 代稱不會變（lib/program-slugs.ts 是程式碼裡的對照表，不是可編輯的
    //    欄位），所以這裡不必像 events 那樣同時帶舊值與新值。
    revalidatePath("/courses/[program]", "page");
    revalidatePath(`${EN_PREFIX}/courses/[program]`, "page");
    for (const slug of slugs) {
      if (!slug) continue;
      for (const path of bothLanguages(`/courses/${slug}`)) revalidatePath(path);
    }
  }

  if (entity === "documents") {
    // 標了學制的檔案會出現在該學制的修業規定頁（/courses/[program]）底下。
    // 一次存檔不知道它改前改後各標了哪個學制，四頁一起重新驗證最省事 ——
    // 這幾頁本來就是 ISR，多驗證三頁的代價是幾次讀取。
    revalidatePath("/courses/[program]", "page");
    revalidatePath(`${EN_PREFIX}/courses/[program]`, "page");
    for (const slug of PROGRAM_SLUG_LIST) {
      for (const path of bothLanguages(`/courses/${slug}`)) revalidatePath(path);
    }
  }

  if (entity === "news" || entity === "documents" || entity === "links" || entity === "programs") {
    // 各學制的招生頁（/admissions/[program]）讀四張表：招生消息、標了學制的
    // 檔案與連結、學制本身（名稱、簡介、官方簡章網址）。一次存檔不知道它改
    // 前改後各標了哪個學制，四頁一起重新驗證。
    revalidatePath("/admissions/[program]", "page");
    revalidatePath(`${EN_PREFIX}/admissions/[program]`, "page");
    for (const slug of PROGRAM_SLUG_LIST) {
      for (const path of bothLanguages(`/admissions/${slug}`)) revalidatePath(path);
    }
  }

  if (entity === "events") {
    // 活動詳情頁。slugs 帶舊值與新值兩個 —— 改了 slug 而只重新驗證新的，
    // 舊網址會繼續供應快取內容。
    //
    // 兩個前綴都打：一場活動只住在其中一個底下（依 audience），但存檔時
    // 不知道對象有沒有被改過 —— 從系友活動改成一般活動，舊的
    // /alumni/events/<slug> 必須變成 404，而不是繼續供應快取的那一頁。
    for (const base of ["/alumni/events", "/news/events"]) {
      revalidatePath(`${base}/[slug]`, "page");
      revalidatePath(`${EN_PREFIX}${base}/[slug]`, "page");
      for (const slug of slugs) {
        if (!slug) continue;
        for (const path of bothLanguages(`${base}/${slug}`)) revalidatePath(path);
      }
    }
  }

}
