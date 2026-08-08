import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

/**
 * Next 16 renamed the `middleware` file convention to `proxy`. The exported
 * function must be named `proxy` (or be the default export), and the `runtime`
 * config option is unavailable here — setting it throws.
 */
export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  // Only the admin area and the login page. The eight public routes are cached
  // ISR pages with nothing to protect, so running the proxy on them would add
  // latency for no benefit.
  //
  // Note this is not the security boundary — matchers are anchored at the start
  // of the path and Server Actions POST to their own route, so authorization
  // lives in lib/admin/auth.ts and is re-checked in every page and action.
  matcher: ["/admin/:path*", "/login"],
};
