import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/ssr-server";
import { NotAdminError, NotAuthenticatedError } from "@/lib/admin/errors";

/**
 * The authorization boundary for the admin area.
 *
 * Next's own auth guide is explicit that a layout is not enough: layouts don't
 * re-render on navigation because of partial rendering, so a check placed only
 * there won't run on every route change. The same guide says render-time gating
 * is not a security boundary for Server Actions, which are reachable by anyone
 * who can POST to the route.
 *
 * So: every admin page calls requireAdminOrRedirect(), and every Server Action
 * calls requireAdmin(). React's cache() dedupes the work within a single
 * request, so the repetition costs one round-trip, not N.
 *
 * `import "server-only"` makes an accidental import from a Client Component a
 * build-time error rather than a bundle leak.
 */

type Session = {
  supabase: SupabaseClient;
  userId: string;
  email: string | null;
  isAdmin: boolean;
};

/**
 * Reads the verified session once per request. Returns null when there is no
 * valid token — callers decide whether that's a redirect or an error.
 */
const readSession = cache(async (): Promise<Session | null> => {
  const supabase = await createClient();

  // getClaims() validates the JWT signature. getSession() must never be trusted
  // in server code — it doesn't guarantee revalidation.
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub) return null;

  // Being logged in is not the same as being allowed to edit. Sign-ups are open
  // on this Supabase project, so membership of admin_users is what actually
  // grants write access (see supabase/migrations/*_admin_allowlist.sql).
  // The same predicate backs every RLS write policy, so this can't drift from
  // what the database will actually permit.
  const { data: isAdmin, error } = await supabase.rpc("is_admin");
  if (error) {
    console.error("[admin/auth] is_admin() failed:", error.message);
  }

  return {
    supabase,
    userId: String(claims.sub),
    email: typeof claims.email === "string" ? claims.email : null,
    isAdmin: isAdmin === true,
  };
});

/** For Server Components. Sends anonymous visitors to the login page. */
export async function requireAdminOrRedirect(): Promise<Session> {
  const session = await readSession();
  if (!session) redirect("/login");
  if (!session.isAdmin) redirect("/login?error=not_admin");
  return session;
}

/**
 * For Server Actions. Throws instead of redirecting so the action can return a
 * message the form is able to display — a redirect would discard whatever the
 * user had typed.
 */
export async function requireAdmin(): Promise<Session> {
  const session = await readSession();
  if (!session) throw new NotAuthenticatedError();
  if (!session.isAdmin) throw new NotAdminError();
  return session;
}

/** Non-throwing variant, for deciding whether to render a "log in" link. */
export async function getOptionalSession(): Promise<Session | null> {
  return readSession();
}
