import Link from "next/link";
import sanitizeHtml from "sanitize-html";
import type { NewsItem } from "@/lib/data";
import { localizePath, translate, type Lang } from "@/lib/i18n";
import { NEWS } from "@/lib/i18n/news";
import { SHARED } from "@/lib/i18n/shared";
import { SiteShell } from "./SiteShell";
import { NextRoute } from "./NextRoute";
import { formatNewsDate } from "./format";
import { RICH_TEXT_SANITIZE } from "@/lib/sanitize";

/**
 * 單則消息 (/news/[id], /en/news/[id]).
 *
 * The reference site had no such page — its list rows were all `href="#"`, so
 * the arrow at the end of each row jumped to the top of the document. This
 * exists because the client asked for the arrow to open the item.
 *
 * Shares `.post-*` from site-extensions.css with /blog rather than getting its
 * own styles: the two pages are the same shape (breadcrumb, date + category,
 * title, standfirst, cover, body, back link), and one prose stylesheet is one
 * place to keep in step with the editor's sanitiser allowlist.
 */
export function NewsPost({ lang, item }: { lang: Lang; item: NewsItem }) {
  const t = translate(NEWS, lang);
  const shared = translate(SHARED, lang);
  const listPath = localizePath("/news", lang);
  const html = item.content_html
    ? sanitizeHtml(item.content_html, RICH_TEXT_SANITIZE)
    : "";

  return (
    <SiteShell lang={lang} variant="interior">
      <article className="post-page">
        <div className="container post-head" id="content">
          <div className="breadcrumb">
            <Link href={localizePath("/", lang)}>{shared.home}</Link>
            <span>/</span>
            <Link href={listPath}>{t.breadcrumbList}</Link>
            <span>/</span>
            <span>{item.title}</span>
          </div>
          <p className="eyebrow">
            {formatNewsDate(item.published_at).full} · {item.category}
          </p>
          <h1>{item.title}</h1>
          {item.body ? <p className="post-standfirst">{item.body}</p> : null}
        </div>

        {item.cover_url ? (
          <div className="container post-cover">
            <img src={item.cover_url} alt={item.title} />
          </div>
        ) : null}

        {/* Most announcements are a single line with nothing more to read, so
            an empty body is the normal case rather than a fault — say so
            plainly instead of leaving the page ending at the title. */}
        {html ? (
          <div
            className="container post-body"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        ) : (
          <div className="container post-body">
            <p>{t.noBody}</p>
          </div>
        )}

        <div className="container post-foot">
          <Link href={listPath}>{t.backToList}</Link>
        </div>
      </article>
      <NextRoute lang={lang} />
    </SiteShell>
  );
}
