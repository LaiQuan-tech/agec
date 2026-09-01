import { notFound } from "next/navigation";
import {
  getCourses,
  getFaculty,
  getLinks,
  getNewsById,
  getNewsHome,
  getNewsIds,
  getAlumniEventBySlug,
  getAlumniEvents,
  getNewsPage,
  getNewsYears,
  getTalks,
  getTalksPage,
  countTalks,
  TALKS_PREVIEW_SIZE,
  getPostBySlug,
  getPosts,
  getPrograms,
} from "@/lib/data";
import type { Lang } from "@/lib/i18n";
import { Home } from "./Home";
import { AlumniEventPage } from "./AlumniEventPage";
import { News } from "./News";
import { Talks } from "./Talks";
import { NewsPost } from "./NewsPost";
import { About } from "./About";
import { Faculty } from "./Faculty";
import { Admissions } from "./Admissions";
import { Courses } from "./Courses";
import { Students } from "./Students";
import { Alumni } from "./Alumni";
import { Blog } from "./Blog";
import { BlogPost } from "./BlogPost";

/**
 * One renderer per public route, parameterised by language.
 *
 * The eight routes exist twice — Chinese at `/about`, English at `/en/about` —
 * and the two versions differ only in the `lang` they pass down. Putting the
 * data fetching here rather than in each `page.tsx` means the pair cannot
 * drift: a query added for one language is automatically in the other, and the
 * page files stay a one-line declaration of "this route, this language".
 *
 * These are Server Components; `lang` is a plain prop, never context, because
 * the tree crosses into client components (SiteHeader, FilterTabs) that would
 * otherwise need a provider for a value that never changes within a render.
 */

export async function HomeRoute({ lang }: { lang: Lang }) {
  // 5, not 4: the 最新消息 band is one `.feature-story` plus a 4-row
  // `.news-list`, and both come off the same query.
  const [newsHome, programs] = await Promise.all([
    getNewsHome(5, lang),
    getPrograms(lang),
  ]);

  return <Home lang={lang} newsHome={newsHome} programs={programs} />;
}

export async function NewsRoute({
  lang,
  page = 1,
  category,
  year,
}: {
  lang: Lang;
  /** 1-based. Page 1 is /news; the rest are /news/page/N. */
  page?: number;
  /**
   * A `news.category` value to filter to, from
   * `categoryForSlug()` — never a raw URL segment.
   */
  category?: string;
  /** 西元年，來自 `parseNewsYear()` —— 不是網址上那一段原字串。 */
  year?: number;
}) {
  // Separate queries, not one list filtered in the component: the talks block
  // shows recent talks regardless of which page of announcements you are on,
  // and the main list's page count has to be computed from the announcements
  // alone. The count is its own head-only request rather than a length — the
  // block is a preview, so the number it advertises is not the number it holds.
  // The talks block only appears on the unfiltered first page, so a filtered
  // request skips both of its queries rather than fetching what it will not
  // render.
  const filtered = Boolean(category || year);
  const [newsPage, years, talks, talkCount] = await Promise.all([
    getNewsPage(page, lang, category, year),
    // ⚠️ 只帶 category，不帶 year。年份列要列出「這個分類底下所有有資料的
    // 年份」，把目前選的年份也套進去，列表就只會剩下那一年，等於選了之後
    // 再也換不掉。
    getNewsYears(category),
    filtered ? [] : getTalks(lang, TALKS_PREVIEW_SIZE),
    filtered ? 0 : countTalks(),
  ]);

  // A page number past the end is a 404 rather than an empty list — otherwise
  // /news/page/99 is a real URL serving a blank column.
  //
  // Page 1 is exempt: a category with nothing in it still has a page 1, and it
  // says so. 404ing there would mean a tab the office can see in the admin
  // leads nowhere the day before they publish into it.
  if (page > 1 && page > newsPage.totalPages) notFound();

  /*
   * 沒有這一年的消息就是 404，不是空清單。
   *
   * 年份路由是 `dynamicParams = true`（跨年時新的一年必須立刻能用，不能等到
   * 下一次 build），代價是任何四位數都會被路由接住。少了這道守門，
   * /news/year/1999 會回 200 加一頁空白，被搜尋引擎收走之後就是無限多個
   * 內容相同的空頁。
   *
   * 分類是相反的處理（空分類仍然回 200 並顯示空狀態）：分類是後台看得到、
   * 系辦明天就會發文進去的固定四項；年份則是資料推導出來的，沒有資料的年份
   * 在概念上就不存在。
   *
   * 用的是上面已經查好的 `years`，不另外發查詢；而且它已經套過 category，
   * 所以「求職徵才 2015」這種分類有、該年沒有的組合也會正確 404。
   */
  if (year !== undefined && !years.some((y) => y.year === year)) notFound();

  return (
    <News
      lang={lang}
      newsPage={newsPage}
      talks={talks}
      talkCount={talkCount}
      category={category}
      year={year}
      years={years}
    />
  );
}

/** 單一系友活動 (/alumni/events/[slug], /en/alumni/events/[slug]). */
export async function AlumniEventRoute({
  lang,
  slug,
}: {
  lang: Lang;
  slug: string;
}) {
  const event = await getAlumniEventBySlug(slug, lang);
  // 草稿與不存在的 slug 都走這裡：getAlumniEventBySlug 只回 published 與
  // cancelled，所以草稿在前台就是 404，不需要在這裡再判一次狀態。
  if (!event) notFound();
  return <AlumniEventPage lang={lang} event={event} />;
}

/** 演講公告封存 (/news/talks, /news/talks/page/N). */
export async function TalksRoute({
  lang,
  page = 1,
}: {
  lang: Lang;
  page?: number;
}) {
  const talksPage = await getTalksPage(page, lang);
  if (page > talksPage.totalPages) notFound();

  return <Talks lang={lang} talksPage={talksPage} />;
}

export async function NewsItemRoute({
  lang,
  id,
}: {
  lang: Lang;
  id: string;
}) {
  // The segment is whatever was in the URL, so reject anything that is not a
  // plain positive integer before it reaches the database.
  const numeric = /^\d+$/.test(id) ? Number(id) : NaN;
  if (!Number.isSafeInteger(numeric)) notFound();

  const item = await getNewsById(numeric, lang);
  if (!item) notFound();

  return <NewsPost lang={lang} item={item} />;
}

/** Re-exported so the route files can build their static params. */
export { getNewsIds };

/**
 * Fully static: every block on this page is editorial copy, no DB reads.
 * Both languages come from lib/i18n/about.ts.
 */
export function AboutRoute({ lang }: { lang: Lang }) {
  return <About lang={lang} />;
}

export async function FacultyRoute({ lang }: { lang: Lang }) {
  // One query for all 37 people; the component splits them by `category` into
  // the four card layouts — see components/site/Faculty.tsx.
  const faculty = await getFaculty(lang);

  return <Faculty lang={lang} faculty={faculty} />;
}

/**
 * `.program-grid` reads getPrograms(); the 重要時程 and 核心能力 blocks are
 * static copy (no table exists for either).
 */
export async function AdmissionsRoute({ lang }: { lang: Lang }) {
  const [programs, links] = await Promise.all([
    getPrograms(lang),
    getLinks("admissions", lang),
  ]);

  return <Admissions lang={lang} programs={programs} links={links} />;
}

export async function CoursesRoute({ lang }: { lang: Lang }) {
  // getPrograms supplies both the `.filter-tabs` labels and the display order
  // the course table is re-sorted into — see components/site/Courses.tsx.
  const [courses, programs, links] = await Promise.all([
    getCourses(lang),
    getPrograms(lang),
    getLinks("courses", lang),
  ]);

  return (
    <Courses lang={lang} courses={courses} programs={programs} links={links} />
  );
}

export async function StudentsRoute({ lang }: { lang: Lang }) {
  const links = await getLinks("students", lang);

  return <Students lang={lang} links={links} />;
}

/**
 * No `getLinks("alumni")` read: the reference page's only list-shaped block is
 * `.story-grid`, whose cards need an eyebrow and an action label that the
 * `links` table has no columns for (see the note in components/site/Alumni.tsx).
 */
export async function AlumniRoute({ lang }: { lang: Lang }) {
  // 只取還沒結束的活動，近的在前。歷屆活動不列在這一區：這是「要不要來」的
  // 區塊，不是封存。真的需要封存頁時再另開路由，不要把它塞進同一份清單。
  const events = await getAlumniEvents(lang);
  return <Alumni lang={lang} events={events} />;
}

export async function BlogRoute({ lang }: { lang: Lang }) {
  const posts = await getPosts(lang);

  return <Blog lang={lang} posts={posts} />;
}

/**
 * One post, or a 404.
 *
 * `getPostBySlug` returns null for a draft and for a post whose `published_at`
 * is still in the future as well as for an unknown slug — all three must look
 * identical from outside, otherwise the 404-vs-200 difference tells anyone who
 * guesses a slug that an unpublished post exists under it.
 */
export async function BlogPostRoute({
  lang,
  slug,
}: {
  lang: Lang;
  slug: string;
}) {
  const post = await getPostBySlug(slug, lang);
  if (!post) notFound();

  return <BlogPost lang={lang} post={post} />;
}
