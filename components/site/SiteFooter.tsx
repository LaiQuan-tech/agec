import Link from "next/link";
import { footerColumns } from "./nav";
import { navHref } from "@/lib/nav";
import { localizePath, translate, type Lang } from "@/lib/i18n";
import { COMMON } from "@/lib/i18n/common";
import { BLOG_TITLE } from "@/lib/i18n/blog";

/**
 * Site footer. `#contact` and `#sitemap` are the anchor targets the institution
 * bar's utility links jump to, so both ids have to stay put.
 *
 * The two sitemap columns are bare <div>s on purpose: site.css addresses them as
 * `.footer-links div`, so wrapping them or swapping the tag drops the whole
 * column layout.
 */
export function SiteFooter({ lang }: { lang: Lang }) {
  const t = translate(COMMON, lang);

  return (
    <footer id="contact">
      <div className="container footer-top">
        <img
          className="footer-brand-mark"
          src="/brand/footer_agec_logo_circle_white.svg"
          alt={t.departmentFull}
        />
        <div className="footer-contact">
          {/* The two address lines swap order between languages — see
              COMMON.addressLine1. The <br> stays a <br>: `.footer-contact p`
              is one text block, and splitting it into two <p>s would add the
              paragraph gap between the street and the floor. */}
          <p>
            {t.addressLine1}
            <br />
            {t.addressLine2}
          </p>
          {/* Phone and email are the same in both languages and are their own
              link text, so they carry no dictionary entry: a `tel:`/`mailto:`
              whose accessible name is the number or address it dials already
              states its own purpose. */}
          <p>
            <a href="tel:+886233662600">+886 2 3366 2600</a>
            <br />
            <a href="mailto:agec@ntu.edu.tw">agec@ntu.edu.tw</a>
          </p>
        </div>
        {/* Exactly two <div>s: site.css addresses them as `.footer-links div`
            and the pair is the column grid. /blog is appended inside the second
            one rather than becoming a third column — and it is appended here
            rather than added to lib/nav.ts, because that list also drives the
            "NN / 08" route number on every interior hero. */}
        <div className="footer-links" id="sitemap">
          {footerColumns(lang).map((column, i, all) => (
            <div key={i}>
              {column.map((item) => (
                <Link key={item.href} href={navHref(item.href, lang)}>
                  {item.label}
                </Link>
              ))}
              {i === all.length - 1 ? (
                <Link href={localizePath("/blog", lang)}>
                  {BLOG_TITLE[lang]}
                </Link>
              ) : null}
            </div>
          ))}
        </div>
      </div>
      <div className="container footer-bottom">
        <span>{t.copyright}</span>
        <span>{t.tagline}</span>
      </div>
    </footer>
  );
}
