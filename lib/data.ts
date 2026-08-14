import { createServerClient } from "@/lib/supabase/server";

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
  /** English name. Only 客座/名譽/退休 rows carry one (12 of 37). */
  name_en: string | null;
  title: string;
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
  program: string;
};

export type Program = {
  id: number;
  name: string;
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

const NEWS_COLUMNS =
  "id, published_at, category, title, body, cover_url, is_pinned";

/** All news items: pinned first, then newest. Used by /news. */
export async function getNews(): Promise<NewsItem[]> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("news")
    .select(NEWS_COLUMNS)
    .order("is_pinned", { ascending: false })
    .order("published_at", { ascending: false })
    .returns<NewsItem[]>();

  if (error) {
    console.error("[lib/data] getNews failed:", error.message);
    return [];
  }
  return data ?? [];
}

/** Top `limit` news items: pinned first, then newest. Home page 最新消息 panel. */
export async function getNewsHome(limit: number): Promise<NewsItem[]> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("news")
    .select(NEWS_COLUMNS)
    .order("is_pinned", { ascending: false })
    .order("published_at", { ascending: false })
    .limit(limit)
    .returns<NewsItem[]>();

  if (error) {
    console.error("[lib/data] getNewsHome failed:", error.message);
    return [];
  }
  return data ?? [];
}

/** All faculty members, in display order. Used by /faculty (37 rows). */
export async function getFaculty(): Promise<Faculty[]> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("faculty")
    .select(
      "id, name, name_en, title, category, fields, email, experience, photo_url, sort_order"
    )
    .order("sort_order", { ascending: true })
    // Tiebreaker: sort_order is not unique, and without this two members sharing
    // one value can swap places between requests — and between the public page
    // and the admin list, which orders the same way.
    .order("id", { ascending: true })
    .returns<Faculty[]>();

  if (error) {
    console.error("[lib/data] getFaculty failed:", error.message);
    return [];
  }
  return data ?? [];
}

/** All courses, grouped by program then sorted by course code. Used by /courses. */
export async function getCourses(): Promise<Course[]> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("courses")
    .select("id, code, name, credit, ctype, program")
    .order("program", { ascending: true })
    .order("code", { ascending: true })
    .returns<Course[]>();

  if (error) {
    console.error("[lib/data] getCourses failed:", error.message);
    return [];
  }
  return data ?? [];
}

/** All degree programs, in display order. Used by / and /admissions. */
export async function getPrograms(): Promise<Program[]> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("programs")
    .select("id, name, name_en, description, sort_order")
    .order("sort_order", { ascending: true })
    .returns<Program[]>();

  if (error) {
    console.error("[lib/data] getPrograms failed:", error.message);
    return [];
  }
  return data ?? [];
}

/** Link cards for a section ('students' | 'alumni'), in display order. */
export async function getLinks(
  section: LinkItem["section"]
): Promise<LinkItem[]> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("links")
    .select("id, section, label, url, sort_order")
    .eq("section", section)
    .order("sort_order", { ascending: true })
    .order("id", { ascending: true })
    .returns<LinkItem[]>();

  if (error) {
    console.error(`[lib/data] getLinks(${section}) failed:`, error.message);
    return [];
  }
  return data ?? [];
}
