import { localizePath, type Lang } from "@/lib/i18n";

/**
 * The categories `/news` can be filtered by, and the URL segment for each.
 *
 * ## Why a table rather than the category string itself
 *
 * `news.category` is free text — the admin form offers a `<datalist>` of
 * suggestions, not a closed `<select>`, because the office will eventually need
 * a category nobody thought of. Deriving the URL from that value would mean a
 * typo (「招生 」with a trailing space, or 「招生資訊」) silently mints a new
 * public URL. Going through this table instead makes an unregistered category
 * simply have no page: wrong, but wrong in a way that 404s rather than one that
 * ships.
 *
 * ## Why ASCII slugs rather than the Chinese
 *
 * A Chinese segment is percent-encoded the moment it leaves the address bar, so
 * 「招生」pasted into an email arrives as `%E6%8B%9B%E7%94%9F`. `/news/talks`
 * already established the ASCII form for exactly this reason.
 *
 * ## Why `/news/category/…` and not `/news/<slug>`
 *
 * `/news/<slug>` collides with `/news/[id]`: two dynamic segments at the same
 * depth. `category` is a static segment, so it wins over the `[id]` sibling the
 * same way `talks` and `page` already do.
 */
export type NewsCategory = {
  /** URL segment. */
  slug: string;
  /** The exact `news.category` value. ⚠️ Must match the column character for
   *  character — this is a query key, not a label. */
  category: string;
};

export const NEWS_CATEGORIES: NewsCategory[] = [
  { slug: "announcements", category: "最新公告" },
  { slug: "highlights", category: "活動剪影" },
  { slug: "admissions", category: "招生" },
  { slug: "careers", category: "求職徵才" },
];

/**
 * 演講公告 is deliberately not in the list above.
 *
 * Talks are excluded from `/news`'s main list and have their own section and
 * their own archive at `/news/talks`, whose rows carry the speaker, time and
 * venue that a plain announcement row has no room for. Listing them here would
 * put the same 256 items at two URLs.
 *
 * It is named here anyway so the slug stays reserved: if a future category ever
 * wanted `talks`, this is the one place that would have to be reckoned with.
 */
export const TALKS_SLUG = "talks";

export function categoryForSlug(slug: string): string | null {
  if (slug === TALKS_SLUG) return null;
  return NEWS_CATEGORIES.find((c) => c.slug === slug)?.category ?? null;
}

export function slugForCategory(category: string): string | null {
  return NEWS_CATEGORIES.find((c) => c.category === category)?.slug ?? null;
}

/**
 * The route for one page of the news list, filtered or not.
 *
 * ⚠️ The filter tabs' hrefs and the pagination's hrefs both come from here on
 * purpose. Two functions building the same URL is how a tab ends up linking to
 * a page the reader is already on — visibly active, and still a link somewhere
 * else.
 *
 * Page 1 lives at the list's own path; the rest hang off `/page/N`. Path
 * segments rather than `?page=`/`?category=`: reading searchParams would turn
 * these routes dynamic, and every public page on this site is statically
 * prerendered with ISR.
 */
export function newsPath(
  page: number,
  lang: Lang,
  slug?: string | null,
  year?: number | null
): string {
  // 分類在前、年份在後，而且順序固定。兩段可以各自出現、也可以同時出現，
  // 所以 /news、/news/category/admissions、/news/year/2024 與
  // /news/category/admissions/year/2024 是四種形狀 —— 每一種都對應一個路由檔。
  let base = "/news";
  if (slug) base += `/category/${slug}`;
  if (year) base += `/year/${year}`;
  return localizePath(page === 1 ? base : `${base}/page/${page}`, lang);
}

/**
 * 網址那一段 → 年份數字，不合格就是 null。
 *
 * 唯一把字串變成 `getNewsPage` 的 year 參數的地方。限定四位數是刻意的：
 * 「115」（民國）、「2024a」、「０２４」都會在這裡變成 null → 404，而不是
 * 傳進查詢變成一個查得到零筆的合法頁面。空頁與不存在的頁必須是兩件事，
 * 否則 /news/year/115 會回 200 並被搜尋引擎收走。
 */
export function parseNewsYear(raw: string): number | null {
  if (!/^\d{4}$/.test(raw)) return null;
  return Number(raw);
}
