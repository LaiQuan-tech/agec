import Link from "next/link";
import sanitizeHtml from "sanitize-html";
import type { NewsItem } from "@/lib/data";
import { localizePath, translate, type Lang } from "@/lib/i18n";
import { NEWS } from "@/lib/i18n/news";
import { SHARED } from "@/lib/i18n/shared";
import { SiteShell } from "./SiteShell";
import { NextRoute } from "./NextRoute";
import { formatEventTime, formatNewsDate } from "./format";
import { RICH_TEXT_SANITIZE } from "@/lib/sanitize";

/** Human-readable file size for the download list. */
function formatBytes(bytes: number): string {
  if (bytes <= 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

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

  // Any one of the three may be filled on its own — most migrated talks have a
  // speaker and a time but no venue, because the venue was only ever printed on
  // the poster image. The block appears if there is anything at all to put in
  // it, and each row is dropped individually.
  const hasEventDetails = Boolean(item.speaker || item.event_at || item.venue);

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

          {hasEventDetails && (
            <dl className="event-details" aria-label={t.eventLabel}>
              {item.speaker && (
                <>
                  <dt>{t.eventSpeaker}</dt>
                  <dd>{item.speaker}</dd>
                </>
              )}
              {item.event_at && (
                <>
                  <dt>{t.eventTime}</dt>
                  {/* <time> so the machine-readable instant survives even
                      though the visible text is a Taipei wall clock. */}
                  <dd>
                    <time dateTime={item.event_at}>{formatEventTime(item.event_at, lang)}</time>
                  </dd>
                </>
              )}
              {item.venue && (
                <>
                  <dt>{t.eventVenue}</dt>
                  <dd>{item.venue}</dd>
                </>
              )}
            </dl>
          )}
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

        {item.attachments.length > 0 && (
          <div className="container post-attachments">
            <h2>{t.attachmentsHeading}</h2>
            <ul>
              {item.attachments.map((file) => {
                const size = formatBytes(file.size);
                return (
                  <li key={file.url}>
                    {/* Not next/link: these are files on the storage host, not
                        routes, and prefetching a 50MB PDF on hover would be a
                        remarkable way to spend someone's data. */}
                    <a
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={t.attachmentHint
                        .replace("{name}", file.name)
                        .replace("{size}", size)}
                    >
                      <span>{file.name}</span>
                      {size && <em>{size}</em>}
                    </a>
                  </li>
                );
              })}
            </ul>
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
