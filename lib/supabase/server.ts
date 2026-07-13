import { createClient } from "@supabase/supabase-js";

/**
 * Server-only Supabase client (service-role key). When the Supabase env vars
 * are absent we fall back to a syntactically-valid placeholder URL/key instead
 * of letting createClient() throw `supabaseUrl is required`. That throw is
 * synchronous and uncaught, so during `next build` (which prerenders the
 * pages) a missing env would crash the whole build and leave the domain with
 * no deployment (a bare Vercel 404). With the placeholder, the client
 * constructs fine and any query just fails at the network layer — the data
 * functions in lib/data.ts already catch that and degrade to empty results, so
 * the site still builds and renders. When the real env vars ARE set (normal
 * Vercel/production), the placeholders are never used and behavior is
 * unchanged.
 */
export function createServerClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
    process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder-service-role-key",
    { auth: { persistSession: false } }
  );
}
