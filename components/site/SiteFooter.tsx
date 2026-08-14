import Link from "next/link";
import { FOOTER_COLUMNS } from "./nav";

/**
 * Site footer. `#contact` and `#sitemap` are the anchor targets the institution
 * bar's utility links jump to, so both ids have to stay put.
 *
 * The two sitemap columns are bare <div>s on purpose: site.css addresses them as
 * `.footer-links div`, so wrapping them or swapping the tag drops the whole
 * column layout.
 */
export function SiteFooter() {
  return (
    <footer id="contact">
      <div className="container footer-top">
        <img
          className="footer-brand-mark"
          src="/brand/footer_agec_logo_circle_white.svg"
          alt="國立臺灣大學農業經濟學系"
        />
        <div className="footer-contact">
          <p>
            10617 臺北市大安區羅斯福路四段一號
            <br />
            農業綜合館一、二樓
          </p>
          <p>
            <a href="tel:+886233662600">+886 2 3366 2600</a>
            <br />
            <a href="mailto:agec@ntu.edu.tw">agec@ntu.edu.tw</a>
          </p>
        </div>
        <div className="footer-links" id="sitemap">
          {FOOTER_COLUMNS.map((column, i) => (
            <div key={i}>
              {column.map((item) => (
                <Link key={item.href} href={item.href}>
                  {item.label}
                </Link>
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="container footer-bottom">
        <span>© 2026 Department of Agricultural Economics, NTU</span>
        <span>Knowledge rooted in land. Vision connected to the world.</span>
      </div>
    </footer>
  );
}
