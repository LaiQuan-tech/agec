import Link from "next/link";
import {
  displayState,
  eventParentPath,
  registrationDeadline,
  remainingSeats,
  type AlumniEvent,
} from "@/lib/alumni-events";
import { localizePath, translate, type Lang } from "@/lib/i18n";
import { ALUMNI } from "@/lib/i18n/alumni";
import { ALUMNI_EVENTS, eventCopy } from "@/lib/i18n/alumni-events";
import { NEWS, NEWS_TITLE } from "@/lib/i18n/news";
import { SHARED } from "@/lib/i18n/shared";
import { SiteShell } from "./SiteShell";
import { NextRoute } from "./NextRoute";
import { EventRegistrationForm } from "./EventRegistrationForm";
import { formatEventRange, formatEventTime } from "./format";

/**
 * 單一活動頁 (/alumni/events/[slug] 與 /news/events/[slug])。
 *
 * 一個元件供兩種對象：版面、活動資訊、報名表單、狀態訊息完全相同，只有三樣
 * 東西跟著 `event.audience` 走 —— 麵包屑第二層（系友專區／最新消息）、
 * eyebrow、頁尾的返回連結。這三樣由 `eventParentPath()` 與 `eventCopy()`
 * 決定，不是由路由檔傳進來：路由檔已經在 audience 對不上時 404 了
 * （components/site/pages.tsx 的 `EventRoute`），所以進到這裡的活動一定住在
 * 正確的網址底下。
 *
 * 沿用 /news/[id] 的 `.post-*` 版型而不是自己另做一套：形狀完全相同
 * （麵包屑、日期、標題、前言、封面、內文、返回），而且那一套已經有 760px 的
 * 閱讀寬度與圖片不放大的規則。只有報名表單與活動資訊是新的樣式。
 *
 * ⚠️ `revalidate` 在路由檔設成 60 秒而不是全站的 300：這一頁上印著剩餘名額，
 * 五分鐘的快取在一場快額滿的活動上就是五分鐘的錯誤數字。報名成功時 action
 * 還會直接 revalidatePath 這兩個網址，所以正常情況下是即時的；60 秒是那條
 * 路徑失效時的兜底。
 *
 * ⚠️ 「還能不能報名」的最終判準不在這裡，在 register_for_alumni_event()。
 * 這一頁算出來的 displayState 只決定畫面上顯示什麼 —— 靜態頁的名額必然可能
 * 落後，兩邊各判一次才是真正的問題（見 lib/alumni-events.ts 檔頭）。
 */
export function EventPage({
  lang,
  event,
}: {
  lang: Lang;
  event: AlumniEvent;
}) {
  const t = translate(ALUMNI_EVENTS, lang);
  const copy = eventCopy(event.audience, lang);
  const shared = translate(SHARED, lang);
  const parentPath = localizePath(eventParentPath(event.audience), lang);
  // 麵包屑第二層與 eyebrow：系友活動印「系友專區」、一般活動印「最新消息」——
  // 與那兩頁自己的頁名同一個來源（ALUMNI.title / NEWS_TITLE），不另外抄一份。
  const parentLabel =
    event.audience === "general"
      ? translate(NEWS, lang).breadcrumbList
      : t.breadcrumbAlumni;
  const eyebrow =
    event.audience === "general" ? NEWS_TITLE[lang] : translate(ALUMNI, lang).title;

  // 一次算好，整頁共用。⚠️ 這是 Server Component，所以 new Date() 只會在
  // 伺服器上跑一次，不會在 hydration 時被重算成瀏覽器的時間。
  const now = new Date();
  const state = displayState(event, now);
  const remaining = remainingSeats(event);

  return (
    <SiteShell lang={lang} variant="interior">
      <article className="post-page">
        <div className="container post-head" id="content">
          <div className="breadcrumb">
            <Link href={localizePath("/", lang)}>{shared.home}</Link>
            <span>/</span>
            <Link href={parentPath}>{parentLabel}</Link>
            <span>/</span>
            <span>{event.title}</span>
          </div>
          <p className="eyebrow">{eyebrow}</p>
          <h1>{event.title}</h1>
          {event.summary ? <p className="post-standfirst">{event.summary}</p> : null}

          <dl className="event-details" aria-label={t.formHeading}>
            <dt>{t.detailWhen}</dt>
            <dd>
              <time dateTime={event.startsAt}>
                {formatEventRange(event.startsAt, event.endsAt, lang)}
              </time>
            </dd>

            {event.location && (
              <>
                <dt>{t.detailWhere}</dt>
                <dd>
                  {event.location}
                  {/* 地址是給導航用的補充，與地點名稱同一格但另起一行 —— 拆成
                      第二個 dt/dd 會讓「地點」在名單裡出現兩次。 */}
                  {event.address && (
                    <>
                      <br />
                      <span className="event-address">{event.address}</span>
                    </>
                  )}
                </dd>
              </>
            )}

            <dt>{t.detailSeats}</dt>
            <dd>
              {event.capacity === null
                ? t.seatsUnlimited
                : t.seatsRemaining
                    .replace("{remaining}", String(remaining ?? 0))
                    .replace("{capacity}", String(event.capacity))}
            </dd>

            <dt>{t.detailDeadline}</dt>
            <dd>
              <time dateTime={registrationDeadline(event)}>
                {formatEventTime(registrationDeadline(event), lang)}
              </time>
            </dd>

            {event.contact && (
              <>
                <dt>{t.detailContact}</dt>
                <dd>{event.contact}</dd>
              </>
            )}
          </dl>
        </div>

        {event.coverUrl ? (
          <div className="container post-cover">
            <img src={event.coverUrl} alt={event.title} />
          </div>
        ) : null}

        {/* 內文是純文字多段（資料庫那一欄不存 HTML），所以用 white-space
            保留換行，而不是 dangerouslySetInnerHTML —— 沒有編輯器就沒有理由
            開一個注入點。 */}
        {event.body ? (
          <div className="container post-body">
            <p className="event-body-text">{event.body}</p>
          </div>
        ) : null}

        <div className="container post-body">
          {state === "open" ? (
            <section className="event-register">
              <h2>{t.formHeading}</h2>
              <p>{t.formIntro}</p>
              <EventRegistrationForm
                lang={lang}
                slug={event.slug}
                audience={event.audience}
                contact={event.contact}
              />
            </section>
          ) : (
            /* 額滿、截止、取消都走這裡。刻意仍然印出活動的全部資訊而不是把頁面
               收掉：已經報名的人會回來看時間地點，把頁面變成一句「已結束」對
               他們毫無用處。 */
            <p className="event-closed" role="status">
              <strong>
                {state === "cancelled"
                  ? t.stateCancelled
                  : state === "full"
                    ? t.stateFull
                    : t.stateClosed}
              </strong>
              {state === "cancelled" && <> {copy.stateCancelledNote}</>}
              {state === "full" && <> {t.stateFullNote}</>}
            </p>
          )}
        </div>

        <div className="container post-foot">
          <Link href={parentPath}>{copy.backToParent}</Link>
        </div>
      </article>
      <NextRoute lang={lang} />
    </SiteShell>
  );
}
