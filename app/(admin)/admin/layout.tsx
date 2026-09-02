import type { Metadata } from "next";
import { requireAdminOrRedirect } from "@/lib/admin/auth";
import { AdminShell } from "@/components/admin/AdminShell";

export const metadata: Metadata = {
  title: { template: "%s | 農經系管理後台", default: "農經系管理後台" },
  robots: { index: false, follow: false },
};

// The admin must never be served from the ISR cache.
export const dynamic = "force-dynamic";

/**
 * The check here renders the shell for a known user — it is NOT the security
 * boundary. Layouts don't re-render on client-side navigation, so each page
 * calls requireAdminOrRedirect() again (React cache() makes the repeat free)
 * and each Server Action calls requireAdmin().
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { email, role } = await requireAdminOrRedirect();
  return (
    <AdminShell email={email} role={role}>
      {children}
    </AdminShell>
  );
}
