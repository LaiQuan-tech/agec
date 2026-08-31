import { createServerClient } from "@/lib/supabase/server";
import { pick, pickNullable, type Lang } from "@/lib/i18n";

/**
 * Typed data-access layer for the site's Supabase content tables.
 * All functions are server-only (they call createServerClient(), which uses
 * the service-role key) and are meant to be awaited from Server Components —
 * see app/*\/page.tsx for usage. Every table has RLS enabled with a public-read
 * policy. Schema changes go through supabase/migrations/ and are applied via
 * the SQL editor — the app never executes DDL.
 *
 * On query error, functions log to the server console and return an empty
 * array rather than throwing, so a transient DB hiccup degrades a section to
 * "no items" instead of crashing the whole page.
 *
 * Every getter takes a `lang`. The localized columns are resolved *here*, not
 * in the components: each row comes back with `title` / `name` / `label`
 * already holding the right language, so a component renders identically on
 * /about and /en/about and can never forget the fallback. The `_en` columns do
 * not leave this file — the exported types have no trace of them.
 */

export type NewsItem = {
  id: number;
  published_at: string;
  /** Display category in the requested language. */
  category: string;
  /**
   * The Chinese category as stored — the stable key to group or match on.
   *
   * Same reason `Program.name_zh` exists: `category` above is resolved to one
   * language, so a component comparing it against 「演講公告」 matches every row
   * on /news and none at all on /en, silently. Anything that decides *where* a
   * row is rendered must read this instead.
   */
  category_zh: string;
  title: string;
  /**
   * Plain-text standfirst, shown under the title on the feature card.
   * Deliberately not HTML: `.inner-news-feature p` is a text node.
   */
  body: string | null;
  /**
   * The article body, as sanitised HTML from the admin's editor. Null when the
   * item is a one-line announcement with nothing more to read — /news/[id]
   * still renders, just without a body block.
   */
  content_html: string | null;
  cover_url: string | null;
  is_pinned: boolean;
  /**
   * Files offered for download under the article. Empty array, never null —
   * the column is `jsonb not null default '[]'`, so render sites can map over
   * it without a guard.
   */
  attachments: NewsAttachment[];
  /**
   * 演講公告 only: who is speaking, when the talk actually happens, and where.
   *
   * `published_at` is the announcement's date and the talk is usually weeks
   * later, so `event_at` is a separate column rather than a reinterpretation
   * of that one.
   *
   * All three are null on most rows and that is expected, not a gap: 92% of the
   * talks migrated from the old site are a poster image with no machine-readable
   * text at all — the speaker and the room exist only as pixels. What could be
   * recovered came from parsing the headline, which never carries the venue.
   */
  speaker: string | null;
  venue: string | null;
  event_at: string | null;
};

/**
 * One downloadable file on a news item.
 *
 * `name` is the original filename as the old CMS served it in
 * `Content-Disposition` — Chinese included. It is what the reader sees, so it
 * is stored beside the URL rather than derived from it: the object key in
 * storage is percent-encoded and ASCII-folded, and reversing that back into a
 * readable label is not possible.
 */
export type NewsAttachment = {
  name: string;
  url: string;
  /** Bytes. Shown next to the link so a reader knows what they are clicking. */
  size: number;
  mime: string;
};

/**
 * One row per person on /faculty — which is four different card layouts, not
 * one. `category` selects the layout (專任/合聘/兼任師資 = standard card,
 * 客座教師, 名譽教授/退休師資, 行政同仁), and which fields carry a value
 * follows from that: the legacy categories have no photo and no `fields` but
 * do have `name_en` + `experience`, while the standard cards are the reverse.
 * Every optional field is genuinely absent for some category, so render sites
 * must handle null rather than assume a shape.
 */
export type Faculty = {
  id: number;
  name: string;
  /**
   * English name, shown *beside* the Chinese one on the legacy card layouts —
   * so unlike every other column this is not a translation that replaces its
   * Chinese twin, and it stays exposed here in both languages. Only 客座/名譽/
   * 退休 rows carry one (12 of 37).
   */
  name_en: string | null;
  title: string;
  /**
   * Layout selector, and therefore *never* translated: FACULTY_CATEGORIES in
   * app/(admin)/admin/faculty/constants.ts and the four card renderers all
   * compare it against the Chinese literals. The English label a visitor sees
   * on a filter tab comes from the dictionary, keyed by this value.
   */
  category: string;
  fields: string | null;
  /** Public mailbox. Present for all but the visiting professor (36 of 37). */
  email: string | null;
  /** Long-form career summary, 名譽教授 and 退休師資 only (11 of 37). */
  experience: string | null;
  photo_url: string | null;
  sort_order: number;
  /**
   * True for the department chair, who gets the full-width banner row at the
   * top of the faculty grid instead of a standard portrait card.
   *
   * Derived here rather than in the component because `title` is resolved to
   * one language by `pick()` a few lines below — a component-level match
   * against 「系主任」 would silently never fire on /en, where the same row
   * reads "Distinguished Professor and Chair". The raw Chinese column is the
   * only place both languages agree.
   *
   * Matching the title instead of carrying a flag column means the office only
   * has to edit two people's titles when the chair changes and the banner
   * follows on its own. 「系主任」 is unique across all 37 rows — 張宏浩 is
   * 副院長 / Vice Dean and does not match. Should a second row ever match,
   * only the first is featured; see the hoist in components/site/Faculty.tsx.
   */
  is_chair: boolean;
};

export type Course = {
  id: number;
  code: string;
  name: string;
  credit: number;
  ctype: string;
  /**
   * The Chinese program name, always — this is a text foreign key into
   * `programs.name`, and /courses both sorts and tab-filters by matching it.
   * Translating it in place would break that match silently the moment one
   * side of the pair was translated and the other was not (courses drop to the
   * bottom of the table, tabs stop selecting anything). Use `program_label`
   * to display it.
   */
  program: string;
  /** `program` resolved for display: programs.name_en when set, else Chinese. */
  program_label: string;
};

export type Program = {
  id: number;
  /** Display name in the requested language. */
  name: string;
  /** The Chinese name, i.e. the value `Course.program` matches against. */
  name_zh: string;
  /**
   * The English name as stored — *not* a translation that replaces `name`.
   *
   * Same exception as `Faculty.name_en`: the home page's `.admission-card` and
   * the /admissions `.program-grid` both print it as a small Latin kicker
   * *above* the Chinese name, so the Chinese page needs the English string and
   * the English page needs the Chinese one. Collapsing the pair into `name`
   * would silently delete that kicker from the Chinese site.
   */
  name_en: string | null;
  description: string | null;
  sort_order: number;
};

/**
 * A blog post, as the public /blog routes see it.
 *
 * Unlike the other tables this one is *filtered* as well as translated:
 * lib/supabase/server.ts hands out a service-role client, which bypasses RLS
 * entirely, so the `public read published posts` policy on the table protects
 * nothing here. The draft/scheduled filter below is the only thing standing
 * between an unpublished draft and the open internet — do not remove it on the
 * grounds that "the policy already covers it".
 */
export type Post = {
  id: number;
  slug: string;
  title: string;
  excerpt: string | null;
  cover_url: string | null;
  /** Sanitised HTML from the admin's TipTap editor. See BlogPost.tsx. */
  content_html: string;
  author: string | null;
  /**
   * Always the Chinese tags as stored. Same rule as `Course.program`: this is
   * the value any future tag filter matches on, so translating it in place
   * would break that match the moment one side was translated and the other
   * was not. The table has no `tags_en` for exactly this reason.
   */
  tags: string[];
  /** Never null on a published row — `posts_published_needs_date` enforces it. */
  published_at: string;
};

/**
 * `section` groups link cards by the page whose `.resource-row` renders them.
 * The column is plain text with no CHECK constraint, so this union is the only
 * thing keeping the four live values in step with the four pages that query
 * them — widen it here before seeding a fifth.
 *
 * 'journal' rows remain in the table from the original seed but no route reads
 * them any more: 農經期刊 was replaced by 學生專區 in the 2026 IA revision.
 * They stay listed in /admin/links so the office can clear them out.
 */
export type LinkItem = {
  id: number;
  section: "students" | "alumni" | "courses" | "admissions" | "journal";
  label: string;
  url: string | null;
  sort_order: number;
};

/* ------------------------------------------------------------------ *
 * Raw row shapes. These mirror the tables (both language columns) and *
 * exist only so the mapping functions below are type-checked.         *
 * ------------------------------------------------------------------ */

/** `category_zh` is derived by toNews() from `category`, not a column. */
type NewsRow = Omit<NewsItem, "category_zh" | "speaker" | "venue"> & {
  title_en: string | null;
  body_en: string | null;
  category_en: string | null;
  content_html_en: string | null;
  // Both halves of the pair, because toNews() resolves them the same way it
  // resolves `title` — see the note on `speaker_en` below.
  speaker: string | null;
  speaker_en: string | null;
  venue: string | null;
  venue_en: string | null;
};

/** `is_chair` is computed by toFaculty(), not selected — the table has no such column. */
type FacultyRow = Omit<Faculty, "is_chair"> & {
  title_en: string | null;
  fields_en: string | null;
  experience_en: string | null;
};

type CourseRow = Omit<Course, "program_label"> & {
  name_en: string | null;
  ctype_en: string | null;
};

type ProgramRow = {
  id: number;
  name: string;
  name_en: string | null;
  description: string | null;
  description_en: string | null;
  sort_order: number;
};

type LinkRow = LinkItem & { label_en: string | null };
type PostRow = Omit<Post, "content_html"> & {
  content_html: string;
  title_en: string | null;
  excerpt_en: string | null;
  author_en: string | null;
  content_html_en: string | null;
};


/**
 * The `news.category` value that routes a row to the talks block on /news
 * instead of the main list. Chinese: `category` is never translated (it is the
 * grouping key), see NewsItem.category_zh.
 */
export const TALKS_CATEGORY = "演講公告";

const NEWS_COLUMNS =
  "id, published_at, category, title, body, content_html, cover_url, is_pinned, attachments, speaker, venue, event_at, title_en, body_en, category_en, content_html_en, speaker_en, venue_en";

/**
 * Every news getter filters on this, and every one of them has to do it itself.
 *
 * `createServerClient()` authenticates as the service role, which bypasses RLS
 * entirely — a policy on the table would protect nothing here. These five words
 * are the only thing between an unpublished draft and the open internet, the
 * same way the `status`/`published_at` pair is for posts. Removing one from any
 * getter leaks silently: no error, no warning, just a draft on the public site
 * (or, from getNewsIds, a draft pre-rendered into a static page at build time).
 */
const PUBLISHED = "published";

const FACULTY_COLUMNS =
  "id, name, name_en, title, category, fields, email, experience, photo_url, sort_order, title_en, fields_en, experience_en";

const COURSE_COLUMNS = "id, code, name, credit, ctype, program, name_en, ctype_en";

const PROGRAM_COLUMNS =
  "id, name, name_en, description, description_en, sort_order";

const LINK_COLUMNS = "id, section, label, url, sort_order, label_en";
const POST_COLUMNS =
  "id, slug, title, excerpt, cover_url, content_html, author, tags, published_at, title_en, excerpt_en, author_en, content_html_en";


function toNews(row: NewsRow, lang: Lang): NewsItem {
  return {
    id: row.id,
    published_at: row.published_at,
    category: pick(row.category, row.category_en, lang),
    category_zh: row.category,
    title: pick(row.title, row.title_en, lang),
    body: pickNullable(row.body, row.body_en, lang),
    content_html: pickNullable(row.content_html, row.content_html_en, lang),
    cover_url: row.cover_url,
    is_pinned: row.is_pinned,
    // `not null default '[]'` in Postgres, but a row written before that
    // default existed would still arrive as null through PostgREST.
    attachments: row.attachments ?? [],
    // pick(), not the `namePair()` treatment `Faculty.name_en` gets: the talk
    // card has one slot for the speaker, so this is a translation — English if
    // there is one, Chinese otherwise. Faculty's parallel display exists only
    // because those layouts have two slots.
    speaker: pickNullable(row.speaker, row.speaker_en, lang),
    venue: pickNullable(row.venue, row.venue_en, lang),
    event_at: row.event_at,
  };
}

/** Substring of the Chinese `title` that identifies the chair. See Faculty.is_chair. */
const CHAIR_MARKER = "系主任";

function toFaculty(row: FacultyRow, lang: Lang): Faculty {
  return {
    id: row.id,
    name: row.name,
    name_en: row.name_en,
    title: pick(row.title, row.title_en, lang),
    category: row.category,
    fields: pickNullable(row.fields, row.fields_en, lang),
    email: row.email,
    experience: pickNullable(row.experience, row.experience_en, lang),
    photo_url: row.photo_url,
    sort_order: row.sort_order,
    // `row.title`, not the resolved `title` above: the English title says
    // "Chair", not 「系主任」.
    is_chair: row.title.includes(CHAIR_MARKER),
  };
}

function toProgram(row: ProgramRow, lang: Lang): Program {
  return {
    id: row.id,
    name: pick(row.name, row.name_en, lang),
    name_zh: row.name,
    name_en: row.name_en,
    description: pickNullable(row.description, row.description_en, lang),
    sort_order: row.sort_order,
  };
}

function toLink(row: LinkRow, lang: Lang): LinkItem {
  return {
    id: row.id,
    section: row.section,
    label: pick(row.label, row.label_en, lang),
    url: row.url,
    sort_order: row.sort_order,
  };
}

/** Top `limit` news items: pinned first, then newest. Home page 最新消息 panel. */
export async function getNewsHome(
  limit: number,
  lang: Lang
): Promise<NewsItem[]> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("news")
    .select(NEWS_COLUMNS)
    .eq("status", PUBLISHED)
    .order("is_pinned", { ascending: false })
    .order("published_at", { ascending: false })
    .limit(limit)
    .returns<NewsRow[]>();

  if (error) {
    console.error("[lib/data] getNewsHome failed:", error.message);
    return [];
  }
  return (data ?? []).map((row) => toNews(row, lang));
}

/** All faculty members, in display order. Used by /faculty (37 rows). */
export async function getFaculty(lang: Lang): Promise<Faculty[]> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("faculty")
    .select(FACULTY_COLUMNS)
    .order("sort_order", { ascending: true })
    // Tiebreaker: sort_order is not unique, and without this two members sharing
    // one value can swap places between requests — and between the public page
    // and the admin list, which orders the same way.
    .order("id", { ascending: true })
    .returns<FacultyRow[]>();

  if (error) {
    console.error("[lib/data] getFaculty failed:", error.message);
    return [];
  }
  return (data ?? []).map((row) => toFaculty(row, lang));
}

/**
 * All courses, grouped by program then sorted by course code. Used by /courses.
 *
 * `program_label` needs `programs.name_en`, which lives in another table, so
 * this issues a second query rather than a join: PostgREST can only embed
 * across a declared foreign key, and `courses.program` is loose text. Both
 * tables are small (44 and 4 rows) and the page is ISR, so the extra round
 * trip costs nothing. Unknown program strings fall back to themselves.
 */
export async function getCourses(lang: Lang): Promise<Course[]> {
  const supabase = createServerClient();
  const [{ data, error }, programs] = await Promise.all([
    supabase
      .from("courses")
      .select(COURSE_COLUMNS)
      .order("program", { ascending: true })
      .order("code", { ascending: true })
      .returns<CourseRow[]>(),
    getPrograms(lang),
  ]);

  if (error) {
    console.error("[lib/data] getCourses failed:", error.message);
    return [];
  }

  const label = new Map(programs.map((p) => [p.name_zh, p.name]));
  return (data ?? []).map((row) => ({
    id: row.id,
    code: row.code,
    name: pick(row.name, row.name_en, lang),
    credit: row.credit,
    ctype: pick(row.ctype, row.ctype_en, lang),
    program: row.program,
    program_label: label.get(row.program) ?? row.program,
  }));
}

/** All degree programs, in display order. Used by / and /admissions. */
export async function getPrograms(lang: Lang): Promise<Program[]> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("programs")
    .select(PROGRAM_COLUMNS)
    .order("sort_order", { ascending: true })
    .returns<ProgramRow[]>();

  if (error) {
    console.error("[lib/data] getPrograms failed:", error.message);
    return [];
  }
  return (data ?? []).map((row) => toProgram(row, lang));
}

/** Link cards for a section ('students' | 'alumni'), in display order. */
export async function getLinks(
  section: LinkItem["section"],
  lang: Lang
): Promise<LinkItem[]> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("links")
    .select(LINK_COLUMNS)
    .eq("section", section)
    .order("sort_order", { ascending: true })
    .order("id", { ascending: true })
    .returns<LinkRow[]>();

  if (error) {
    console.error(`[lib/data] getLinks(${section}) failed:`, error.message);
    return [];
  }
  return (data ?? []).map((row) => toLink(row, lang));
}

function toPost(row: PostRow, lang: Lang): Post {
  return {
    id: row.id,
    slug: row.slug,
    title: pick(row.title, row.title_en, lang),
    excerpt: pickNullable(row.excerpt, row.excerpt_en, lang),
    cover_url: row.cover_url,
    // `pick` rather than `pickNullable`: the Chinese column is NOT NULL with a
    // '' default, so a post whose body was never written falls back to an empty
    // string and BlogPost renders nothing instead of crashing on null.
    content_html: pick(row.content_html, row.content_html_en, lang),
    author: pickNullable(row.author, row.author_en, lang),
    tags: row.tags,
    published_at: row.published_at,
  };
}

/**
 * ⚠️ All three getters below repeat the same two filters —
 * `status = 'published'` and `published_at <= now()` — deliberately, rather
 * than sharing a helper. supabase-js builders are not easily wrapped without
 * casting away their types, and a cast here would be worse than the repetition:
 * these two lines are the entire access control for /blog, so they should be
 * visible at each call site rather than hidden behind a function whose types
 * no longer check. Change one, change all three.
 */

/** Published posts, newest first. Used by /blog. */
export async function getPosts(lang: Lang): Promise<Post[]> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("posts")
    .select(POST_COLUMNS)
    .eq("status", "published")
    // Scheduled posts: a future `published_at` is how the admin queues one up,
    // so "published" alone is not enough.
    .lte("published_at", new Date().toISOString())
    .order("published_at", { ascending: false })
    .returns<PostRow[]>();

  if (error) {
    console.error("[lib/data] getPosts failed:", error.message);
    return [];
  }
  return (data ?? []).map((row) => toPost(row, lang));
}

/** One published post, or null when the slug is unknown, a draft, or scheduled. */
export async function getPostBySlug(
  slug: string,
  lang: Lang
): Promise<Post | null> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("posts")
    .select(POST_COLUMNS)
    .eq("slug", slug)
    .eq("status", "published")
    .lte("published_at", new Date().toISOString())
    .maybeSingle<PostRow>();

  if (error) {
    console.error(`[lib/data] getPostBySlug(${slug}) failed:`, error.message);
    return null;
  }
  return data ? toPost(data, lang) : null;
}

/** Every published slug, for generateStaticParams. Language-independent. */
export async function getPostSlugs(): Promise<string[]> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("posts")
    .select("slug")
    .eq("status", "published")
    .lte("published_at", new Date().toISOString())
    .returns<{ slug: string }[]>();

  if (error) {
    console.error("[lib/data] getPostSlugs failed:", error.message);
    return [];
  }
  return (data ?? []).map((row) => row.slug);
}

/**
 * Items per page on /news.
 *
 * Eight, not ten: page 1 spends one of them on the `.inner-news-feature` card,
 * so a larger number leaves the list column running well past the feature
 * image. Talks live in their own block on that page (see News.tsx) and are not
 * counted here — `getNewsPage` pages the same rows the list actually shows.
 */
export const NEWS_PAGE_SIZE = 8;

export type NewsPage = {
  items: NewsItem[];
  page: number;
  totalPages: number;
};

/**
 * One page of news, excluding 演講公告.
 *
 * The talks filter lives here rather than in the component because it decides
 * the page count as well as the contents: filtering after slicing would give
 * pages of uneven length and a total that does not match what is rendered.
 * `category`, not the translated column — see NewsItem.category_zh.
 */
export async function getNewsPage(
  page: number,
  lang: Lang
): Promise<NewsPage> {
  const supabase = createServerClient();
  const from = (page - 1) * NEWS_PAGE_SIZE;

  const { data, error, count } = await supabase
    .from("news")
    .select(NEWS_COLUMNS, { count: "exact" })
    .eq("status", PUBLISHED)
    .neq("category", TALKS_CATEGORY)
    .order("is_pinned", { ascending: false })
    .order("published_at", { ascending: false })
    .range(from, from + NEWS_PAGE_SIZE - 1)
    .returns<NewsRow[]>();

  if (error) {
    console.error("[lib/data] getNewsPage failed:", error.message);
    return { items: [], page: 1, totalPages: 1 };
  }

  return {
    items: (data ?? []).map((row) => toNews(row, lang)),
    page,
    // At least 1: an empty table still has a page 1 to render the empty state on.
    totalPages: Math.max(1, Math.ceil((count ?? 0) / NEWS_PAGE_SIZE)),
  };
}

/** 演講公告 rows, for the talks block on /news. */
export async function getTalks(lang: Lang): Promise<NewsItem[]> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("news")
    .select(NEWS_COLUMNS)
    .eq("status", PUBLISHED)
    .eq("category", TALKS_CATEGORY)
    .order("published_at", { ascending: false })
    .returns<NewsRow[]>();

  if (error) {
    console.error("[lib/data] getTalks failed:", error.message);
    return [];
  }
  return (data ?? []).map((row) => toNews(row, lang));
}

/**
 * One published news item by id, or null. Used by /news/[id].
 *
 * A draft and a deleted row are indistinguishable from here, and deliberately
 * so — /news/[id] turns null into a 404, which is the only answer that does not
 * tell an outsider that a draft with that id exists.
 */
export async function getNewsById(
  id: number,
  lang: Lang
): Promise<NewsItem | null> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("news")
    .select(NEWS_COLUMNS)
    .eq("status", PUBLISHED)
    .eq("id", id)
    .maybeSingle<NewsRow>();

  if (error) {
    console.error(`[lib/data] getNewsById(${id}) failed:`, error.message);
    return null;
  }
  return data ? toNews(data, lang) : null;
}

/**
 * Every *published* news id, for generateStaticParams and the sitemap.
 *
 * This used to read "no status column on this table, so every row is public".
 * There is one now, and the filter below is not optional: without it a draft
 * gets pre-rendered into a static page at build time and listed in the sitemap,
 * which is a leak that survives even after someone notices and fixes the page
 * itself.
 */
export async function getNewsIds(): Promise<number[]> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("news")
    .select("id")
    .eq("status", PUBLISHED)
    .returns<{ id: number }[]>();

  if (error) {
    console.error("[lib/data] getNewsIds failed:", error.message);
    return [];
  }
  return (data ?? []).map((row) => row.id);
}
