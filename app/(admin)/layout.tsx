/**
 * Wrapper shared by /login and /admin.
 *
 * The public site's tokens (--ink / --muted / --hairline / --radius-card …)
 * are declared on :root in app/globals.css and would otherwise style the admin
 * with the same warm editorial palette. The `data-admin` attribute re-pins them
 * to the admin's neutral greys (see the [data-admin] block in app/globals.css);
 * brand colours are shared and inherited unchanged.
 */
export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div data-admin className="min-h-screen" style={{ background: "#f6f7f8" }}>
      {children}
    </div>
  );
}
