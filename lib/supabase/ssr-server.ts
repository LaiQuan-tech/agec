import { createServerClient as createSSRClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Cookie-bound Supabase client for the admin area. Queries run as the logged-in
 * user, so RLS applies — a missing authorization check surfaces as a Postgres
 * error instead of silently succeeding.
 *
 * Deliberately NOT named `server.ts`: lib/supabase/server.ts is the
 * service-role client that bypasses RLS entirely. Two files with the same name
 * would make an accidental wrong import trivially easy, and that mistake is a
 * silent privilege escalation rather than a visible failure.
 *
 * Admin code must import this file. Admin code must never import
 * lib/supabase/server.ts.
 */
export async function createClient() {
  // Next 16 removed synchronous access to request APIs — cookies() is a promise.
  const cookieStore = await cookies();

  return createSSRClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Components cannot write cookies. proxy.ts already refreshes
            // the session on every /admin and /login request, so ignoring this
            // is safe.
          }
        },
      },
    }
  );
}
