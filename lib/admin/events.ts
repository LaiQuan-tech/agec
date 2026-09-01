import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * 系友活動報名名單的查詢。
 *
 * 🔴 「誰報名了這一場」只有這一份定義：`status = 'confirmed'`。
 *
 * 後台列表的人數、明細頁的名單、匯出的 CSV 三個地方都要問同一個問題。快樂手
 * 那邊把這件事抽出來的理由值得照抄：三份各自 join 的話，哪天有人只在其中一份
 * 加上一個條件，畫面上的人數就會跟 CSV 對不起來 —— **而且不會有任何錯誤訊息
 * 告訴你**。現場點名時才發現的那種。
 *
 * ⚠️ 這裡只讀，不做授權。呼叫端必須先 requireAdminOrRedirect() / requireAdmin()。
 * 傳進來的 client 是後台的 session client（RLS 生效），所以就算漏了那一步，
 * 資料庫也會擋 —— 但別依賴那個，它只是最後一道。
 */

export const CONFIRMED = "confirmed";

export type EventListRow = {
  id: number;
  slug: string;
  title: string;
  startsAt: string;
  endsAt: string | null;
  location: string | null;
  capacity: number | null;
  seatsTaken: number;
  status: string;
  /** 由報名紀錄推導的有效報名筆數（不是人數）。 */
  registrationCount: number;
  /** 由報名紀錄推導的總人數（含攜伴）。 */
  headcount: number;
};

export type RegistrationRow = {
  id: string;
  code: string;
  name: string;
  email: string;
  phone: string | null;
  gradYear: number | null;
  program: string | null;
  guests: number;
  dietary: string | null;
  note: string | null;
  status: string;
  createdAt: string;
};

const EVENT_COLUMNS =
  "id, slug, title, starts_at, ends_at, location, capacity, seats_taken, status";
const REGISTRATION_COLUMNS =
  "id, code, name, email, phone, grad_year, program, guests, dietary, note, status, created_at";

type RawRegistration = {
  id: string;
  code: string;
  name: string;
  email: string;
  phone: string | null;
  grad_year: number | null;
  program: string | null;
  guests: number;
  dietary: string | null;
  note: string | null;
  status: string;
  created_at: string;
};

function toRegistration(raw: RawRegistration): RegistrationRow {
  return {
    id: raw.id,
    code: raw.code,
    name: raw.name,
    email: raw.email,
    phone: raw.phone,
    gradYear: raw.grad_year,
    program: raw.program,
    guests: raw.guests ?? 0,
    dietary: raw.dietary,
    note: raw.note,
    status: raw.status,
    createdAt: raw.created_at,
  };
}

/**
 * 活動清單 + 每一場的有效報名數與總人數。
 *
 * 刻意不對每一場各發一次查詢（N+1）：先把活動撈出來，再用 in(ids) 一次撈完
 * 報名紀錄，在記憶體 group。
 *
 * ⚠️ 這裡算出來的 headcount 與 `alumni_events.seats_taken` **應該**永遠相等
 * —— 兩者由同一支函式成對維護。列表會把兩個數字都印出來，不一致就是有人手改
 * 過資料庫，那時候要看得見。
 */
export async function loadEventList(
  supabase: SupabaseClient
): Promise<{ rows: EventListRow[]; error: string }> {
  const { data, error } = await supabase
    .from("alumni_events")
    .select(EVENT_COLUMNS)
    .order("starts_at", { ascending: false })
    .returns<
      {
        id: number;
        slug: string;
        title: string;
        starts_at: string;
        ends_at: string | null;
        location: string | null;
        capacity: number | null;
        seats_taken: number;
        status: string;
      }[]
    >();

  if (error) {
    console.error("[admin/events] 活動清單查詢失敗:", error.code, error.message);
    // 表還不存在（migration 尚未執行）也走這裡。呼叫端會把這句印在頁面上，
    // 而不是丟一個沒有人看得懂的 500。
    return { rows: [], error: describeReadError(error) };
  }

  const events = data ?? [];
  const counts = await loadCounts(
    supabase,
    events.map((e) => e.id)
  );

  return {
    rows: events.map((e) => {
      const c = counts.get(e.id) ?? { registrations: 0, headcount: 0 };
      return {
        id: e.id,
        slug: e.slug,
        title: e.title,
        startsAt: e.starts_at,
        endsAt: e.ends_at,
        location: e.location,
        capacity: e.capacity,
        seatsTaken: e.seats_taken,
        status: e.status,
        registrationCount: c.registrations,
        headcount: c.headcount,
      };
    }),
    error: "",
  };
}

/**
 * ⚠️ 這支**不 throw**：報名數查失敗不該讓系辦連活動清單都看不到。
 * 失敗時回空 Map（那兩欄顯示 0）並在 server log 留錯誤，主清單照樣渲染。
 * 這是刻意讓錯誤只影響兩欄而不是整頁。
 */
async function loadCounts(
  supabase: SupabaseClient,
  eventIds: number[]
): Promise<Map<number, { registrations: number; headcount: number }>> {
  const out = new Map<number, { registrations: number; headcount: number }>();
  if (eventIds.length === 0) return out;

  const { data, error } = await supabase
    .from("alumni_event_registrations")
    .select("event_id, guests")
    .in("event_id", eventIds)
    .eq("status", CONFIRMED)
    .returns<{ event_id: number; guests: number }[]>();

  if (error) {
    console.error("[admin/events] 報名數計算失敗:", error.code, error.message);
    return out;
  }

  for (const row of data ?? []) {
    const current = out.get(row.event_id) ?? { registrations: 0, headcount: 0 };
    current.registrations += 1;
    current.headcount += 1 + (row.guests ?? 0);
    out.set(row.event_id, current);
  }
  return out;
}

/**
 * 一場活動的完整報名名單。
 *
 * 已取消的也回傳（`includeCancelled`），因為系辦需要看得到「這個人取消了」
 * 而不是讓那一筆憑空消失 —— 現場有人拿著報名代碼來問時，找不到紀錄與找到
 * 一筆已取消是完全不同的兩件事。
 *
 * 排序用報名時間，先報名的在前：這就是承諾給系友的順序。
 */
export async function loadRegistrations(
  supabase: SupabaseClient,
  eventId: number
): Promise<{ rows: RegistrationRow[]; error: string }> {
  const { data, error } = await supabase
    .from("alumni_event_registrations")
    .select(REGISTRATION_COLUMNS)
    .eq("event_id", eventId)
    .order("created_at", { ascending: true })
    .returns<RawRegistration[]>();

  if (error) {
    console.error("[admin/events] 報名名單查詢失敗:", error.code, error.message);
    return { rows: [], error: describeReadError(error) };
  }
  return { rows: (data ?? []).map(toRegistration), error: "" };
}

/** 有效報名的總人數（含攜伴）。與 loadCounts 的算法必須一致。 */
export function headcountOf(rows: readonly RegistrationRow[]): number {
  return rows
    .filter((r) => r.status === CONFIRMED)
    .reduce((sum, r) => sum + 1 + r.guests, 0);
}

/**
 * 讀取失敗時給系辦看的一句話。
 *
 * `42P01` = relation does not exist，也就是 migration 還沒跑。這在這個專案
 * 是真的會發生的狀態（沒有 CLI，migration 是人工貼進 Dashboard 執行的），
 * 所以值得單獨講清楚 —— 否則系辦看到的是一個沒有下一步的錯誤。
 */
function describeReadError(error: { code?: string; message?: string }): string {
  if (error.code === "42P01" || (error.message ?? "").includes("does not exist")) {
    return "資料表還不存在。請先在 Supabase Dashboard 執行 supabase/migrations/20260901120000_alumni_events.sql，再回到這一頁。";
  }
  return "讀取失敗，請重新整理。若持續發生請回報。";
}
