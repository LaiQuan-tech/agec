import { createClient } from "@supabase/supabase-js";

/**
 * Anon-key client for reading public content that has row-level visibility
 * rules — currently just `posts`.
 *
 * Why this exists when lib/supabase/server.ts already reads everything: the
 * service-role client bypasses RLS, so a getPosts() that forgot
 * `.eq('status','published')` would happily serve unpublished drafts on a
 * public page. With the anon key the database enforces the rule, and the
 * missing filter becomes impossible rather than merely unlikely.
 *
 * Placeholder fallback mirrors lib/supabase/server.ts for the same reason: a
 * missing env var must not make `next build` throw and leave the domain with no
 * deployment.
 */
export function createPublicClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key",
    { auth: { persistSession: false } }
  );
}
