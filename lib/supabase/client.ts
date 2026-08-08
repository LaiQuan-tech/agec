import { createBrowserClient as createSSRBrowserClient } from "@supabase/ssr";

/**
 * Browser-side Supabase client. Reads and writes the same
 * `sb-<ref>-auth-token` cookie the server clients use, so a session started in
 * a Server Action is visible here and vice versa.
 *
 * Used by the admin image uploader: files go straight from the browser to
 * Storage rather than through a Server Action, because Server Action bodies are
 * capped at 1MB by default and raising that cap would widen the attack surface
 * of every action in the app.
 *
 * createBrowserClient is internally a singleton, so calling this from multiple
 * Client Components is fine.
 */
export function createClient() {
  return createSSRBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
