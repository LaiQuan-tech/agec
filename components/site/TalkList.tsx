import Link from "next/link";
import type { NewsItem } from "@/lib/data";
import { localizePath, type Lang } from "@/lib/i18n";
import { formatEventTime, formatNewsDate } from "./format";

/**
 * `.inner-news-list` rows for 演講公告 — the block on /news and the archive at
 * /news/talks render the identical row, so it lives here rather than in both.
 *
 * ⚠️ `.inner-news-list>a` is a four-column grid (105px 86px 1fr auto), and at
 * ≤1180px it becomes three with the category column set to `display:none`.
 * Each row must therefore keep exactly four direct children. The talk details
 * go *inside* the title's column, not beside it: a fifth child pushes the arrow
 * out of its track and misaligns every row on the page.
 *
 * `.inner-news-list h3` is a descendant selector, so wrapping the heading in
 * `.talk-line` does not cost it its styling.
 */
export function TalkList({ lang, talks }: { lang: Lang; talks: NewsItem[] }) {
  return (
    <div className="inner-news-list">
      {talks.map((item) => (
        <Link href={localizePath(`/news/${item.id}`, lang)} key={item.id}>
          {/* The announcement's date, which is what the list is sorted by. The
              talk's own date sits with the other talk details below, where it
              cannot be mistaken for the row's position in the list. */}
          <time dateTime={item.published_at.slice(0, 10)}>
            {formatNewsDate(item.published_at).full}
          </time>
          <span>{item.category}</span>
          <div className="talk-line">
            <h3>{item.title}</h3>
            {(item.event_at || item.speaker || item.venue) && (
              <p className="talk-meta">
                {item.event_at && (
                  <time dateTime={item.event_at}>{formatEventTime(item.event_at, lang)}</time>
                )}
                {item.speaker && <span>{item.speaker}</span>}
                {item.venue && <span>{item.venue}</span>}
              </p>
            )}
          </div>
          <i>↗︎</i>
        </Link>
      ))}
    </div>
  );
}
