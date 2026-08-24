import Link from "next/link";
import { localizePath, translate, type Lang } from "@/lib/i18n";
import { SHARED } from "@/lib/i18n/shared";

/**
 * `section.next-route` — the "keep exploring" strip that sits between the last
 * `.inner-section` and the footer. Identical on all 7 interior pages; the home
 * page doesn't have it.
 */
export function NextRoute({ lang }: { lang: Lang }) {
  const t = translate(SHARED, lang);

  return (
    <section className="next-route">
      <div className="container">
        <p>{t.nextRouteKicker}</p>
        <Link href={localizePath("/", lang)}>
          {t.backToHome} <span>&rarr;</span>
        </Link>
      </div>
    </section>
  );
}
