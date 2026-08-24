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
  category: string;
  title: string;
  body: string | null;
  cover_url: string | null;
  is_pinned: boolean;
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

type NewsRow = NewsItem & {
  title_en: string | null;
  body_en: string | null;
  category_en: string | null;
};

type FacultyRow = Faculty & {
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

const NEWS_COLUMNS =
  "id, published_at, category, title, body, cover_url, is_pinned, title_en, body_en, category_en";

const FACULTY_COLUMNS =
  "id, name, name_en, title, category, fields, email, experience, photo_url, sort_order, title_en, fields_en, experience_en";

const COURSE_COLUMNS = "id, code, name, credit, ctype, program, name_en, ctype_en";

const PROGRAM_COLUMNS =
  "id, name, name_en, description, description_en, sort_order";

const LINK_COLUMNS = "id, section, label, url, sort_order, label_en";

function toNews(row: NewsRow, lang: Lang): NewsItem {
  return {
    id: row.id,
    published_at: row.published_at,
    category: pick(row.category, row.category_en, lang),
    title: pick(row.title, row.title_en, lang),
    body: pickNullable(row.body, row.body_en, lang),
    cover_url: row.cover_url,
    is_pinned: row.is_pinned,
  };
}

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

/** All news items: pinned first, then newest. Used by /news. */
export async function getNews(lang: Lang): Promise<NewsItem[]> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("news")
    .select(NEWS_COLUMNS)
    .order("is_pinned", { ascending: false })
    .order("published_at", { ascending: false })
    .returns<NewsRow[]>();

  if (error) {
    console.error("[lib/data] getNews failed:", error.message);
    return [];
  }
  return (data ?? []).map((row) => toNews(row, lang));
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
