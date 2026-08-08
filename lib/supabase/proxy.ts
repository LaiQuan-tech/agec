import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Refreshes the Supabase auth token and gates the admin area.
 *
 * This is an optimistic check only. Next's own docs are explicit that a proxy
 * must not be the only line of defense: Server Functions are POSTs to whatever
 * route renders them, so a matcher change can silently remove coverage. Every
 * admin page calls requireUserOrRedirect() and every Server Action calls
 * requireUser() — see lib/admin/auth.ts. This function exists to refresh the
 * token and to save a round-trip for the common "not logged in" case.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
          // Cache-Control / Expires / Pragma. Without these a CDN could cache a
          // response carrying one user's session and hand it to someone else.
          if (headers) {
            Object.entries(headers).forEach(([key, value]) =>
              supabaseResponse.headers.set(key, value)
            );
          }
        },
      },
    }
  );

  // Supabase's docs forbid putting any code between createServerClient and this
  // call. getClaims() (not getSession()) verifies the JWT signature against the
  // project's published keys; getSession() is not guaranteed to revalidate.
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;

  const { pathname } = request.nextUrl;

  if (!claims && pathname.startsWith("/admin")) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (claims && pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/admin";
    url.search = "";
    return NextResponse.redirect(url);
  }

  // Must be returned as-is. Swapping in a fresh NextResponse without copying
  // the cookies over would expire the session early.
  return supabaseResponse;
}
