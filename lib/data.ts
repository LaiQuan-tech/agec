import { createServerClient } from "@/lib/supabase/server";

/**
 * Typed data-access layer for the site's Supabase content tables.
 * All functions are server-only (they call createServerClient(), which uses
 * the service-role key) and are meant to be awaited from Server Components —
 * see app/*\/page.tsx for usage. Every table already has RLS enabled with a
 * public-read policy; schema is live and must NOT be modified from the app.
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

export type Faculty = {
  id: number;
  name: string;
  title: string;
  category: string;
  fields: string | null;
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

export type LinkItem = {
  id: number;
  section: "journal" | "alumni";
  label: string;
  url: string | null;
  sort_order: number;
};

const NEWS_COLUMNS =
  "id, published_at, category, title, body, cover_url, is_pinned";

/** All news items, newest first. Used by /news (10 seeded rows). */
export async function getNews(): Promise<NewsItem[]> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("news")
    .select(NEWS_COLUMNS)
    .order("published_at", { ascending: false })
    .returns<NewsItem[]>();

  if (error) {
    console.error("[lib/data] getNews failed:", error.message);
    return [];
  }
  return data ?? [];
}

/** Top `limit` news items, newest first. Used by the home page's 最新消息 panel. */
export async function getNewsHome(limit: number): Promise<NewsItem[]> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("news")
    .select(NEWS_COLUMNS)
    .order("published_at", { ascending: false })
    .limit(limit)
    .returns<NewsItem[]>();

  if (error) {
    console.error("[lib/data] getNewsHome failed:", error.message);
    return [];
  }
  return data ?? [];
}

/** All faculty members, in display order. Used by /faculty (8 seeded rows). */
export async function getFaculty(): Promise<Faculty[]> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("faculty")
    .select("id, name, title, category, fields, photo_url, sort_order")
    .order("sort_order", { ascending: true })
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

/** Link cards for a section ('journal' | 'alumni'), in display order. */
export async function getLinks(
  section: "journal" | "alumni"
): Promise<LinkItem[]> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("links")
    .select("id, section, label, url, sort_order")
    .eq("section", section)
    .order("sort_order", { ascending: true })
    .returns<LinkItem[]>();

  if (error) {
    console.error(`[lib/data] getLinks(${section}) failed:`, error.message);
    return [];
  }
  return data ?? [];
}
