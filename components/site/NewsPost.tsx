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
 * 純文字化，用來跟前言比對。
 *
 * 比對的對象是 `scripts/import-news.ts` 的 `summarise()` 產出的字串，所以這裡
 * 的正規化必須跟它同一套（同樣拆標籤、同樣還原那幾個實體、同樣把空白收成一個）
 * —— 少還原一種實體，兩邊就比不出相等，重複的前言又會冒出來。
 */
function plainText(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;|&#160;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#3[49];/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * 把內文裡那張「已經當成封面顯示過」的圖拿掉。
 *
 * 🔴 為什麼一定要做：`cover_url` 是匯入時用 `hoistCover()` 從內文抓第一張圖抄
 * 出來的，但**內文那張圖沒有被移除**。於是同一個檔案在這一頁出現兩次。
 * 演講公告有 92% 的內文就只是一張海報，等於整頁只有一張圖、印兩遍。
 * 實測 /news/458：海報原檔 1043×1508，封面算成 1480×2140（還被放大 1.42 倍）、
 * 內文再算一次 760×1099，整頁 4726px 高，其中 3239px 是同一張海報。
 *
 * 為什麼在渲染時做而不是改資料：`news.id` 是 identity 欄位，重跑匯入會讓現有
 * 585 則的網址全部失效且沒有對照表可以重導。渲染時處理是冪等的，系辦日後在
 * 後台換了封面或改了內文也一樣成立。
 *
 * 拿掉的是圖不是封面：`.post-cover` 是設計好的首圖位置，而封面同時餵給列表卡
 * 與 OG 圖，留著它比留內文那張有用。
 */
function dropCoverImage(html: string, coverUrl: string | null): string {
  if (!coverUrl) return html;
  const escaped = coverUrl.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  // sanitize-html 的輸出屬性一律是雙引號，所以這裡不必顧慮單引號的寫法。
  const img = new RegExp(`<img\\b[^>]*\\ssrc="${escaped}"[^>]*>`, "i");
  if (!img.test(html)) return html;
  return (
    html
      .replace(img, "")
      // 只裝著那張圖的容器現在是空的，留著會多出一段 margin
      .replace(/<(p|div|figure)>\s*(?:<br\s*\/?>\s*)*<\/\1>/gi, "")
      // 圖後面原本用來換行的 <br>，圖沒了就變成開頭的空行
      .replace(/^(?:\s|<br\s*\/?>)+/i, "")
      .trim()
  );
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
    ? dropCoverImage(
        sanitizeHtml(item.content_html, RICH_TEXT_SANITIZE),
        item.cover_url
      )
    : "";

  /*
   * 前言與內文的重複。
   *
   * `item.body` 不是人寫的摘要，是匯入時 `summarise()` 從內文取的前 N 個字。
   * 短公告的摘要就是全文，所以這一頁會把同一段話印兩次 —— 實測 /news/470、
   * /news/1029、/news/451 都是這樣。列表頁需要它（卡片上只有摘要），這一頁
   * 不需要：內文才是原件，連結、影片、格式都在裡面。
   *
   * 所以規則是「內文說過了就不再印前言」，而不是反過來。截斷的摘要結尾是
   * 「…」，比對前先拿掉。
   */
  const bodyText = plainText(html);
  const standfirst = item.body?.trim() ?? "";
  const standfirstCore = standfirst.replace(/[…]+$/, "").trim();
  const standfirstIsDuplicate =
    standfirstCore.length > 0 && bodyText.startsWith(standfirstCore);

  /*
   * 內文就只是把標題再寫一遍。
   *
   * 舊站很多公告的內文欄位就是標題本身（例：#1000「105學年度招生手冊!! 內有
   * 課程與招生內容 歡迎轉載參閱」，標題、前言、內文三處同一句話）。這種內文
   * 沒有帶任何新資訊，印出來只是讓人以為漏掉了什麼。
   *
   * 條件加上「沒有任何實質標籤」：內文若還有連結、圖、影片或表格，那段文字
   * 就算跟標題一樣也不能整塊丟掉。
   */
  const bodyIsJustTitle =
    bodyText.length > 0 &&
    bodyText === plainText(item.title) &&
    !/<(?:img|iframe|a|table|ul|ol|blockquote)\b/i.test(html);
  const bodyHtml = bodyIsJustTitle ? "" : html;

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
          {item.body && !standfirstIsDuplicate ? (
            <p className="post-standfirst">{item.body}</p>
          ) : null}

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
            plainly instead of leaving the page ending at the title.

            ⚠️ 但有附件時不要說「沒有進一步的內容」：下面就掛著可以下載的檔案，
            那句話會直接跟畫面打架。這種情況什麼都不印，讓附件自己說話。 */}
        {bodyHtml ? (
          <div
            className="container post-body"
            dangerouslySetInnerHTML={{ __html: bodyHtml }}
          />
        ) : item.attachments.length === 0 ? (
          <div className="container post-body">
            <p>{t.noBody}</p>
          </div>
        ) : null}

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
