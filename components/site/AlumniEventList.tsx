import Link from "next/link";
import {
  displayState,
  remainingSeats,
  type AlumniEvent,
} from "@/lib/alumni-events";
import { localizePath, translate, type Lang } from "@/lib/i18n";
import { ALUMNI_EVENTS } from "@/lib/i18n/alumni-events";
import { formatEventRange } from "./format";

/**
 * /alumni 上的活動列表。
 *
 * 版型參考快樂手的 `session-row.tsx`（日期方塊｜標題與地點｜名額｜CTA），
 * 那是這次唯一值得照抄的視覺件：一行就把「什麼時候、在哪裡、還有沒有位子、
 * 怎麼報名」講完，而系友回娘家的資訊結構跟工作坊場次是一樣的。
 *
 * ⚠️ 不用 `.story-grid`。那是 `repeat(3,1fr)` 的固定三格，而且
 * `.story-grid a{min-height:300px}` 假設三個子元素都在 —— Alumni.tsx 檔頭
 * 已經記過這件事：現在只有兩則的話那一列會缺一角。活動的數量是 0 到 N，
 * 固定格數在這裡一定會壞。
 */
export function AlumniEventList({
  lang,
  events,
}: {
  lang: Lang;
  events: AlumniEvent[];
}) {
  const t = translate(ALUMNI_EVENTS, lang);

  if (events.length === 0) {
    // 一句話，不是一個空框。系辦上架第一場活動之前，這一區會維持這個樣子。
    return <p className="news-empty">{t.sectionEmpty}</p>;
  }

  // 一次算好給整份清單用。⚠️ Server Component：new Date() 只在伺服器跑一次。
  const now = new Date();

  return (
    <ul className="event-list">
      {events.map((event) => {
        const state = displayState(event, now);
        const remaining = remainingSeats(event);
        const [y, m, d] = event.startsAt.slice(0, 10).split("-");

        return (
          <li key={event.id} className="event-row">
            {/* 日期方塊。用 startsAt 的字串切片而不是 Date：這一格只印年月日，
                不需要時區換算，而字串切片在伺服器與瀏覽器一定一致。 */}
            <div className="event-date">
              <span className="event-date-md">
                {m}.{d}
              </span>
              <span className="event-date-y">{y}</span>
            </div>

            <div className="event-row-main">
              <h3>
                <Link href={localizePath(`/alumni/events/${event.slug}`, lang)}>
                  {event.title}
                </Link>
              </h3>
              <p className="event-row-when">
                <time dateTime={event.startsAt}>
                  {formatEventRange(event.startsAt, event.endsAt, lang)}
                </time>
                {event.location && <> ・{event.location}</>}
              </p>
              {event.summary && <p className="event-row-summary">{event.summary}</p>}
            </div>

            <div className="event-row-seats">
              {state === "cancelled" ? (
                <span className="event-tag event-tag-off">{t.stateCancelled}</span>
              ) : state === "closed" ? (
                <span className="event-tag event-tag-off">{t.stateClosed}</span>
              ) : state === "full" ? (
                <span className="event-tag event-tag-off">{t.stateFull}</span>
              ) : event.capacity === null ? (
                <span className="event-tag">{t.seatsUnlimited}</span>
              ) : (
                <span className="event-tag">
                  {t.seatsRemaining
                    .replace("{remaining}", String(remaining ?? 0))
                    .replace("{capacity}", String(event.capacity))}
                </span>
              )}
            </div>

            {/* CTA 一律是連結，額滿或截止時也是：詳情頁上有時間、地點與聯絡
                窗口，那正是已經報名或想候補的人要看的東西。把它變成 disabled
                的按鈕等於把資訊也一起關掉。 */}
            <div className="event-row-cta">
              <Link
                className="text-action"
                href={localizePath(`/alumni/events/${event.slug}`, lang)}
                // 一頁上有好幾個「查看詳情與報名」，讀屏使用者逐一跳連結時
                // 需要知道每一個各自通往哪一場。
                aria-label={`${event.title}：${t.cardCta}`}
              >
                {t.cardCta} <span>→</span>
              </Link>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
