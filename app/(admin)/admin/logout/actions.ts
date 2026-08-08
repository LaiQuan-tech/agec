"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/ssr-server";

/**
 * Invoked from a <form action={...}> rather than a link: a GET route would be
 * prefetched by <Link> and log the user out just for hovering the button.
 *
 * Intentionally has no requireAdmin() guard, unlike every other action here.
 * Signing out is a no-op when there's no session, and gating it on admin
 * membership would strand a signed-in non-admin with no way to sign out.
 */
export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();

  // Outside any try/catch — redirect() works by throwing.
  redirect("/login");
}
