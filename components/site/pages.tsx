import { notFound } from "next/navigation";
import {
  countTalks,
  getAdmissionsPostIndex,
  getAlumniEventBySlug,
  getAlumniEvents,
  getCapabilities,
  getDocuments,
  getCourses,
  getFaculty,
  getLinks,
  getNewsById,
  getNewsHome,
  getNewsIds,
  getNewsPage,
  getNewsYears,
  getPageCopy,
  getPrograms,
  getTalks,
  getTalksPage,
  TALKS_PREVIEW_SIZE,
} from "@/lib/data";
import type { Lang } from "@/lib/i18n";
import type { EventAudience } from "@/lib/alumni-events";
import { Home } from "./Home";
import { EventPage } from "./EventPage";
import { News } from "./News";
import { Talks } from "./Talks";
import { NewsPost } from "./NewsPost";
import { About } from "./About";
import { resolveAboutCopy, ABOUT_PAGE } from "@/lib/page-copy/about";
import { Faculty } from "./Faculty";
import { Admissions } from "./Admissions";
import { Courses } from "./Courses";
import { Students } from "./Students";
import { resolveStudentsCopy, STUDENTS_PAGE } from "@/lib/page-copy/students";
import { Alumni } from "./Alumni";

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
  // 演講區塊出現在「任何一種檢視的第 1 頁」，包含分類與年份。
  //
  // ⚠️ 原本的條件是「只有未篩選的第 1 頁」，於是點任何一個分類籤，演講與
  //    研討會整區就消失，要點回「全部消息」才會回來 —— 系辦回報過這件事。
  //    演講公告被 getNewsPage() 用 .neq() 排除在主列表之外，所以它不是那五個
  //    籤的其中一個；如果它又只在「全部」底下出現，讀者實際上很難走到它。
  //    它現在是一個常駐的區塊，不隨篩選消失。
  //
  // 仍然限定第 1 頁：它是一個預覽區塊，翻到第 7 頁還跟著同一批演講沒有意義。
  //
  // 活動報名區塊（一般活動）只在**未篩選的第 1 頁**：它不是消息的一種切法，
  // 而是另一張表；點了「招生」籤還跟著一排活動，讀者會以為那是招生活動。
  // 演講區塊是相反的決定（見上），因為演講真的是消息、只是被抽出主列表。
  const filtered = Boolean(category || year);
  const [newsPage, years, talks, talkCount, events] = await Promise.all([
    getNewsPage(page, lang, category, year),
    // ⚠️ 只帶 category，不帶 year。年份列要列出「這個分類底下所有有資料的
    // 年份」，把目前選的年份也套進去，列表就只會剩下那一年，等於選了之後
    // 再也換不掉。
    getNewsYears(category),
    page === 1 ? getTalks(lang, TALKS_PREVIEW_SIZE) : [],
    page === 1 ? countTalks() : 0,
    // 只取還沒結束的一般活動，近的在前，最多 6 場。⚠️ 一定要傳 audience：
    // 預設是 alumni，漏了會把系友回娘家列到最新消息上。
    // 不設上限：與 /alumni 一致。設了上限又沒有「更多」連結，第 N+1 場開放報名中的
    // 活動會從所有列表頁消失、只剩搜尋找得到。
    page === 1 && !filtered ? getAlumniEvents(lang, { audience: "general" }) : [],
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
      events={events}
      category={category}
      year={year}
      years={years}
    />
  );
}

/**
 * 單一活動 (/alumni/events/[slug] 與 /news/events/[slug]，各有 /en 版)。
 *
 * `audience` 由路由檔傳：/alumni/events/ 傳 alumni、/news/events/ 傳 general。
 * 🔴 活動的 audience 對不上就 404 —— 一場活動只有一個正確網址。少了這一條，
 *    同一場會在兩個網址各活一份，搜尋引擎當成重複內容，而且報名成功後的
 *    revalidatePath 只打其中一個，另一個會一直顯示舊名額。
 */
export async function EventRoute({
  lang,
  slug,
  audience,
}: {
  lang: Lang;
  slug: string;
  audience: EventAudience;
}) {
  const event = await getAlumniEventBySlug(slug, lang);
  // 草稿與不存在的 slug 都走這裡：getAlumniEventBySlug 只回 published 與
  // cancelled，所以草稿在前台就是 404，不需要在這裡再判一次狀態。
  if (!event || event.audience !== audience) notFound();
  return <EventPage lang={lang} event={event} />;
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

export async function AboutRoute({ lang }: { lang: Lang }) {
  // 整頁的文字走 page_copy（後台 /admin/about），與學生專區同一套：表還沒建、
  // 還沒有 about 的列、或缺 key 時 resolver 退回 lib/i18n/about.ts 的字典，所以
  // 這裡不必判斷。頁面家具（標題、頁內導覽、eyebrow、圖片）仍直接讀字典。
  const copyRows = await getPageCopy(ABOUT_PAGE);
  return <About lang={lang} copy={resolveAboutCopy(copyRows, lang)} />;
}

export async function FacultyRoute({ lang }: { lang: Lang }) {
  // One query for all 37 people; the component splits them by `category` into
  // the four card layouts — see components/site/Faculty.tsx.
  const faculty = await getFaculty(lang);

  return <Faculty lang={lang} faculty={faculty} />;
}

/**
 * `.program-grid` reads getPrograms()，`.capability-cloud` 讀 getCapabilities()。
 * 只剩重要時程還是硬編的 static copy（沒有對應的資料表）。
 */
export async function AdmissionsRoute({ lang }: { lang: Lang }) {
  const [programs, links, capabilities, documents, posts] = await Promise.all([
    getPrograms(lang),
    getLinks("admissions", lang),
    getCapabilities(lang),
    // 招生檔案（書面資料格式、考古題…）。共通的印成下載卡，表是空的時候 §4
    // 不印那一區；標了學制的只用來判斷考古題卡要列哪些學制。
    getDocuments("admissions", lang),
    // 招生公告索引：三張入口卡的簡章／書面資料連結要落在各學制最新一則
    // 相關公告上。
    getAdmissionsPostIndex(),
  ]);

  return (
    <Admissions
      lang={lang}
      programs={programs}
      links={links}
      capabilities={capabilities}
      documents={documents}
      posts={posts}
    />
  );
}

export async function CoursesRoute({ lang }: { lang: Lang }) {
  // getPrograms supplies both the `.filter-tabs` labels and the display order
  // the course table is re-sorted into — see components/site/Courses.tsx.
  // getDocuments 是 §2 的系上表單；表還沒建時它回空陣列，那一區就不印。
  //
  // ⚠️ 不再讀 getLinks("courses")。那四條（選課相關表格、學位考試申請、
  //    離校程序表格、研究計畫申請）已經搬到 /students §4 —— 它們是臺大教務處
  //    的表格，對學生比對課程更有意義。§3 現在是硬編的臺大官方系統入口。
  const [courses, programs, courseDocuments] = await Promise.all([
    getCourses(lang),
    getPrograms(lang),
    getDocuments("courses", lang),
  ]);

  return (
    <Courses
      lang={lang}
      courses={courses}
      programs={programs}
      courseDocuments={courseDocuments}
    />
  );
}

export async function StudentsRoute({ lang }: { lang: Lang }) {
  // §4 的八張連結卡全部是 links.section='students'（四條教務處表格原本掛在
  // 'courses'，migration 20260914110000 搬過來了 —— /courses 早就不讀那個
  // section）。§1–§3 的文字走 page_copy（後台 /admin/students），表還沒建或
  // 缺 key 時 resolver 退回字典，所以這裡不必判斷。
  const [studentLinks, copyRows] = await Promise.all([
    getLinks("students", lang),
    getPageCopy(STUDENTS_PAGE),
  ]);

  return (
    <Students
      lang={lang}
      studentLinks={studentLinks}
      copy={resolveStudentsCopy(copyRows, lang)}
    />
  );
}

/**
 * No `getLinks("alumni")` read: the reference page's only list-shaped block is
 * `.story-grid`, whose cards need an eyebrow and an action label that the
 * `links` table has no columns for (see the note in components/site/Alumni.tsx).
 */
export async function AlumniRoute({ lang }: { lang: Lang }) {
  // 只取還沒結束的**系友**活動，近的在前（一般活動住在 /news）。歷屆活動不列
  // 在這一區：這是「要不要來」的區塊，不是封存。真的需要封存頁時再另開路由，
  // 不要把它塞進同一份清單。
  const events = await getAlumniEvents(lang, { audience: "alumni" });
  return <Alumni lang={lang} events={events} />;
}
