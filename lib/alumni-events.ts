import type { Lang } from "@/lib/i18n";

/**
 * 系友活動的共用型別與狀態推導。
 *
 * 🔴 這裡算出來的是**畫面要顯示什麼**，不是**能不能報名**。
 *
 * 能不能報名只有一個判準：`register_for_alumni_event()`。前台是靜態 ISR，
 * 頁面上的剩餘名額最舊可能是五分鐘前的，所以「看起來還有位子」與「真的還有
 * 位子」本來就不會永遠一致 —— 這是靜態站的固有性質，不是 bug。可以修的是
 * 另一件事：**不要讓兩邊各自做決定**。快樂手就是前台算
 * `capacity - seats_taken`、下單算 `capacity - seats_taken - 未付款佔位`，
 * 兩個公式都「對」，湊在一起就變成「頁面說剩 4 位、結帳說滿了」。
 *
 * 所以這個檔案只回答「畫面上寫什麼」，送出之後由函式回答「行不行」，而且
 * 函式擋下來時的訊息會明講是名額在填寫期間被補滿了。
 */

export type AlumniEventStatus = "draft" | "published" | "cancelled";

export type AlumniEvent = {
  id: number;
  slug: string;
  title: string;
  summary: string | null;
  body: string | null;
  startsAt: string;
  endsAt: string | null;
  location: string | null;
  address: string | null;
  /** null = 不限名額。⚠️ 與 0 不同：0 是開放但沒有位子。 */
  capacity: number | null;
  seatsTaken: number;
  registrationClosesAt: string | null;
  coverUrl: string | null;
  contact: string | null;
  status: AlumniEventStatus;
};

/**
 * 報名截止時間。
 *
 * ⚠️ 必須與 `register_for_alumni_event()` 裡的判斷逐字相符：沒有設
 * `registration_closes_at` 時，預設截止在活動開始的那一刻。少了這個預設，
 * 去年的活動會永遠開著讓人報名。
 */
export function registrationDeadline(event: AlumniEvent): string {
  return event.registrationClosesAt ?? event.startsAt;
}

/** 剩餘名額；不限名額時回 null。 */
export function remainingSeats(event: AlumniEvent): number | null {
  if (event.capacity === null) return null;
  return Math.max(0, event.capacity - event.seatsTaken);
}

/**
 * 畫面狀態。`now` 由呼叫端傳入而不是在這裡呼叫 `Date.now()`：
 * 這支會在 server component 算一次、在 client component 再算一次，
 * 兩邊拿到不同的「現在」會讓 React 抱怨 hydration 不一致。
 */
export type EventDisplayState =
  | "open"
  | "full"
  | "closed"
  | "cancelled"
  | "unavailable";

export function displayState(event: AlumniEvent, now: Date): EventDisplayState {
  if (event.status === "cancelled") return "cancelled";
  if (event.status !== "published") return "unavailable";
  if (now.getTime() >= Date.parse(registrationDeadline(event))) return "closed";
  const remaining = remainingSeats(event);
  if (remaining !== null && remaining <= 0) return "full";
  return "open";
}

/** 活動本身是否已經結束（用來把它排到「歷屆活動」）。 */
export function hasEnded(event: AlumniEvent, now: Date): boolean {
  return now.getTime() >= Date.parse(event.endsAt ?? event.startsAt);
}

/**
 * 民國年 → 西元年。
 *
 * 系友填畢業年時多半寫民國（「85 級」），但資料庫只存一種。兩位數與三位數
 * 一律當民國；四位數當西元。1912 是民國元年。
 *
 * ⚠️ 邊界是刻意的：`85` 只可能是民國，`1985` 只可能是西元，中間沒有會誤判
 * 的區間 —— 民國的三位數上限（目前 115）遠小於任何四位數西元年。
 */
export function toGregorianYear(raw: number): number {
  return raw < 1000 ? raw + 1911 : raw;
}

/** 西元年 → 「85 級（1996）」這種兩種紀年並陳的標籤。 */
export function gradYearLabel(gregorian: number, lang: Lang): string {
  const minguo = gregorian - 1911;
  if (lang === "en" || minguo <= 0) return String(gregorian);
  return `${minguo} 級（${gregorian}）`;
}

/** 攜伴人數的上限。⚠️ 與 migration 的 guests <= 5 是同一份合約的兩半。 */
export const MAX_GUESTS = 5;

/** 學制選項。自由文字欄位，但前台只給這幾個，免得同一種學制出現五種寫法。 */
export const PROGRAM_OPTIONS = [
  "學士班",
  "碩士班",
  "博士班",
  "碩士在職專班",
  "其他",
] as const;

/* ---------------------------------------------------------------------------
 * 報名 Server Action 的回傳形狀
 *
 * 🔴 為什麼放在這裡而不是 action 檔裡：
 * `"use server"` 寫在檔案頂端時，Next 會把**該檔的每一個 export 都當成
 * Server Function**（見 node_modules/next/dist/docs/01-app/01-getting-started/
 * 07-mutating-data.md：「at the top of a separate file to mark all exports of
 * that file」）。所以在 action 檔裡 `export const idleRegistration = {...}`
 * 會讓一個純物件被當成可呼叫的伺服器函式 —— 表單一送出就是 500，而且
 * `next build` 不會擋。
 *
 * 這個 repo 本來就有正確的做法：後台的 `idleState` 放在
 * lib/admin/action-result.ts，六個 action 檔只 export async 函式。
 * ------------------------------------------------------------------------ */
export type RegistrationState = {
  ok: boolean;
  /** i18n 字典的 key，不是給人看的字串 —— action 不知道當下是中文還是英文頁。 */
  messageKey?: string;
  /** 成功時的報名代碼。 */
  code?: string;
  fieldErrors?: Record<string, string>;
};

export const idleRegistration: RegistrationState = { ok: false };
