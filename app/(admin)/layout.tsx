/**
 * Wrapper shared by /login and /admin.
 *
 * The root layout mounts ThemeProvider, which writes `data-theme` onto <html>
 * and swaps --ink / --muted / --hairline / --radius-card. That's correct for the
 * public site but would make the admin change appearance depending on which
 * theme a visitor last picked. The `data-admin` attribute re-pins those tokens
 * (see the [data-admin] block in app/globals.css); brand colours are shared
 * across both themes and are inherited unchanged.
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
