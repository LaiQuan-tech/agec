import { notFound } from "next/navigation";
import {
  getCourses,
  getFaculty,
  getLinks,
  getNews,
  getNewsHome,
  getPostBySlug,
  getPosts,
  getPrograms,
} from "@/lib/data";
import type { Lang } from "@/lib/i18n";
import { Home } from "./Home";
import { News } from "./News";
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

export async function NewsRoute({ lang }: { lang: Lang }) {
  const news = await getNews(lang);

  return <News lang={lang} news={news} />;
}

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
export function AlumniRoute({ lang }: { lang: Lang }) {
  return <Alumni lang={lang} />;
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
