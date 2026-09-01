/**
 * 活動狀態。⚠️ 與 migration 的
 * `check (status in ('draft','published','cancelled'))` 是同一份合約的兩半。
 */
export const EVENT_STATUSES = ["draft", "published", "cancelled"] as const;
export type EventStatus = (typeof EVENT_STATUSES)[number];

export const EVENT_STATUS_LABEL: Record<EventStatus, string> = {
  draft: "草稿（前台看不到）",
  published: "已上架（開放報名）",
  cancelled: "已取消（前台仍顯示，但不能報名）",
};

/** 列表用的短標籤。 */
export const EVENT_STATUS_SHORT: Record<EventStatus, string> = {
  draft: "草稿",
  published: "已上架",
  cancelled: "已取消",
};

export function toEventStatus(value: string | null | undefined): EventStatus {
  return (EVENT_STATUSES as readonly string[]).includes(value ?? "")
    ? (value as EventStatus)
    : "draft";
}

/**
 * `<input type="datetime-local">` 要的字串（YYYY-MM-DDTHH:mm），從資料庫的
 * timestamptz 轉過來。
 *
 * ⚠️ 一定要指定 Asia/Taipei。timestamptz 從 PostgREST 回來是 UTC，直接 slice
 * 會讓後台的欄位顯示成早八小時 —— 系辦打開活動、什麼都沒改就按儲存，時間就
 * 往前跑了八小時，而且完全沒有跡象。lib/admin/validate.ts 的 datetimeLocal()
 * 寫回去時同樣是硬寫 +08:00，兩邊必須成對。
 */
export function toDatetimeLocal(iso: string | null): string {
  if (!iso) return "";
  const at = new Date(iso);
  if (Number.isNaN(at.getTime())) return "";
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(at);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}
