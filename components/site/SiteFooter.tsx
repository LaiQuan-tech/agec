import Link from "next/link";
import { footerColumns } from "./nav";
import { navHref } from "@/lib/nav";
import { localizePath, translate, type Lang } from "@/lib/i18n";
import { COMMON } from "@/lib/i18n/common";
import { MaybeLink } from "./MaybeLink";

/**
 * Site footer. `#contact` and `#sitemap` are the anchor targets the institution
 * bar's utility links jump to, so both ids have to stay put.
 *
 * The two sitemap columns are bare <div>s on purpose: site.css addresses them as
 * `.footer-links div`, so wrapping them or swapping the tag drops the whole
 * column layout.
 */
/**
 * 站外的兩個去處。
 *
 * 寫成常數而不是進 `links` 表：那張表是給系辦在後台增刪的內容區塊（招生資源、
 * 學生資源那幾張卡），而這兩條是機構層級的固定連結 —— 學校首頁與系上粉專不會
 * 因為某一季的活動而換掉。放進 links 表反而讓它們可能被誤刪。
 */
const EXTERNAL_LINKS = [
  { key: "university", url: "https://www.ntu.edu.tw/" },
  { key: "facebook", url: "https://www.facebook.com/ntuagec6070" },
] as const;

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
          {/*
            站外連結。放在 `.footer-contact` 裡而不是 `.footer-links` 裡：
            後者的 id 是 `#sitemap`，是這個網站自己的目錄，把站外的去處混進去
            會讓「網站導覽」這個詞名實不符。這裡是「怎麼找到我們」，學校首頁與
            粉專屬於同一個問題的答案。

            ⚠️ `grid-column: 1 / -1` 不是裝飾。`.footer-contact` 是
            `1.1fr .9fr` 的兩欄格線，不橫跨的話這一列只會佔左欄，右欄留一塊空白。

            ⚠️ 也不能改成 `.footer-links` 的第三個 <div>：site.css 把那兩個
            <div> 當成 `1fr 1fr` 的欄，第三個會掉到第二列（元件檔頭已記過）。

            用 MaybeLink 而不是自己寫 <a>：它對站外網址會自動補上
            target="_blank" 與 rel="noopener noreferrer"，並且只有在真的有目的地
            時才印那個 ↗︎ —— 箭頭在這個站是「會離開這一頁」的承諾。
          */}
          <p className="footer-external" aria-label={t.externalLinksLabel}>
            {EXTERNAL_LINKS.map((link) => (
              <MaybeLink
                key={link.key}
                href={link.url}
                arrow={<span> ↗︎</span>}
              >
                {t[link.key]}
              </MaybeLink>
            ))}
          </p>
        </div>
        {/* Exactly two <div>s: site.css addresses them as `.footer-links div`
            and the pair is the column grid.

            這裡原本還會在第二欄末尾補一條 /blog，那是因為 /blog 不在
            lib/nav.ts 的八條路線裡（加第九條會讓每個內頁的「NN / 08」全部
            重編號），所以它只能從頁尾與 /news 進去。/blog 整個收掉之後，
            這兩欄就單純是 lib/nav.ts 的八條路線。 */}
        <div className="footer-links" id="sitemap">
          {footerColumns(lang).map((column, i) => (
            <div key={i}>
              {column.map((item) => (
                <Link key={item.href} href={navHref(item.href, lang)}>
                  {item.label}
                </Link>
              ))}
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
