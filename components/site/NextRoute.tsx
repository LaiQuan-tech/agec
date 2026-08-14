import Link from "next/link";

/**
 * `section.next-route` — the "keep exploring" strip that sits between the last
 * `.inner-section` and the footer. Identical on all 7 interior pages; the home
 * page doesn't have it.
 */
export function NextRoute() {
  return (
    <section className="next-route">
      <div className="container">
        <p>KEEP EXPLORING · 繼續探索</p>
        <Link href="/">
          回到首頁 <span>→</span>
        </Link>
      </div>
    </section>
  );
}
