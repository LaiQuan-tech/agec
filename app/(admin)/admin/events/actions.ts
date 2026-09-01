"use server";

import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth";
import {
  toChineseError,
  toAuthErrorState,
  type ActionState,
} from "@/lib/admin/action-result";
import { revalidateFor } from "@/lib/admin/revalidate";
import {
  collect,
  datetimeLocal,
  number,
  oneOf,
  requireId,
  text,
} from "@/lib/admin/validate";
import { EVENT_STATUSES, type EventStatus } from "./constants";

type EventInput = {
  slug: string;
  title: string;
  title_en: string | null;
  summary: string | null;
  summary_en: string | null;
  body: string | null;
  body_en: string | null;
  starts_at: string;
  ends_at: string | null;
  location: string | null;
  location_en: string | null;
  address: string | null;
  capacity: number | null;
  registration_closes_at: string | null;
  cover_url: string | null;
  contact: string | null;
  status: EventStatus;
};

/**
 * ⚠️ `seats_taken` 不在這裡。
 *
 * 它由 register_for_alumni_event() 與 cancel_alumni_registration() 成對維護。
 * 讓後台表單能改它，等於開一條「名額數字與報名名單對不起來」的路 —— 而且
 * 那個不一致沒有任何地方會報錯，只會在現場點名時變成多出來或少掉的人。
 *
 * 要調整名額請改 `capacity`；要放掉某個位子請到報名名單頁取消那一筆。
 */
function parse(form: FormData): {
  values?: EventInput;
  fieldErrors?: Record<string, string>;
} {
  const slug = text(form, "slug", "網址代稱", { required: true, max: 80 });
  const title = text(form, "title", "活動名稱", { required: true, max: 120 });
  const titleEn = text(form, "title_en", "英文活動名稱", { max: 200 });
  const summary = text(form, "summary", "一句話摘要", { max: 200 });
  const summaryEn = text(form, "summary_en", "英文摘要", { max: 300 });
  const body = text(form, "body", "活動說明", { max: 5000 });
  const bodyEn = text(form, "body_en", "英文活動說明", { max: 8000 });
  const startsAt = datetimeLocal(form, "starts_at", "開始時間", { required: true });
  const endsAt = datetimeLocal(form, "ends_at", "結束時間");
  const location = text(form, "location", "地點", { max: 120 });
  const locationEn = text(form, "location_en", "英文地點", { max: 200 });
  const address = text(form, "address", "地址", { max: 200 });
  const capacity = number(form, "capacity", "名額上限", { min: 0, max: 100000 });
  const closesAt = datetimeLocal(form, "registration_closes_at", "報名截止時間");
  const coverUrl = text(form, "cover_url", "封面圖網址", { max: 500 });
  const contact = text(form, "contact", "聯絡窗口", { max: 200 });
  const status = oneOf(form, "status", "狀態", EVENT_STATUSES, { required: true });

  // slug 的格式與 migration 的 CHECK 是同一份合約。這裡先擋是為了給一句
  // 看得懂的話，而不是讓系辦收到 "violates check constraint"。
  const slugFormat =
    slug.value && !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug.value)
      ? "網址代稱只能用小寫英文、數字與連字號，例如 homecoming-2026"
      : undefined;

  // 這兩條 CHECK 在資料庫也有，同樣是為了訊息品質才在這裡先擋一次。
  const timeOrder =
    startsAt.value && endsAt.value && Date.parse(endsAt.value) <= Date.parse(startsAt.value)
      ? "結束時間必須晚於開始時間"
      : undefined;

  const fieldErrors = collect({
    slug: slug.error ?? slugFormat,
    title: title.error,
    title_en: titleEn.error,
    summary: summary.error,
    summary_en: summaryEn.error,
    body: body.error,
    body_en: bodyEn.error,
    starts_at: startsAt.error,
    ends_at: endsAt.error ?? timeOrder,
    location: location.error,
    location_en: locationEn.error,
    address: address.error,
    capacity: capacity.error,
    registration_closes_at: closesAt.error,
    cover_url: coverUrl.error,
    contact: contact.error,
    status: status.error,
  });
  if (fieldErrors) return { fieldErrors };

  return {
    values: {
      slug: slug.value!,
      title: title.value!,
      title_en: titleEn.value,
      summary: summary.value,
      summary_en: summaryEn.value,
      body: body.value,
      body_en: bodyEn.value,
      starts_at: startsAt.value!,
      ends_at: endsAt.value,
      location: location.value,
      location_en: locationEn.value,
      address: address.value,
      // 空白 = 不限名額（null），不是 0。0 是「開放報名但沒有位子」。
      capacity: capacity.value,
      registration_closes_at: closesAt.value,
      cover_url: coverUrl.value,
      contact: contact.value,
      status: status.value!,
    },
  };
}

export async function createEvent(
  _prev: ActionState,
  form: FormData
): Promise<ActionState> {
  let newId: number;

  try {
    const { supabase } = await requireAdmin();
    const { values, fieldErrors } = parse(form);
    if (fieldErrors) return { ok: false, message: "請修正下列欄位", fieldErrors };

    const { data, error } = await supabase
      .from("alumni_events")
      .insert(values!)
      .select("id")
      .single();
    if (error) return { ok: false, message: describeWriteError(error) };

    revalidateFor("events", values!.slug);
    newId = data.id as number;
  } catch (error) {
    const authState = toAuthErrorState(error);
    if (authState) return authState;
    throw error;
  }

  // try 之外：redirect() 是靠 throw 運作的，包在 catch 裡會把成功變成錯誤。
  redirect(`/admin/events/${newId}?created=1`);
}

export async function updateEvent(
  _prev: ActionState,
  form: FormData
): Promise<ActionState> {
  try {
    const { supabase } = await requireAdmin();
    const id = requireId(form);
    const { values, fieldErrors } = parse(form);
    if (fieldErrors) return { ok: false, message: "請修正下列欄位", fieldErrors };

    // 改 slug 時，舊網址也要重新驗證，否則它會繼續供應快取內容。
    const previousSlug = String(form.get("previous_slug") ?? "").trim() || null;

    const { error } = await supabase.from("alumni_events").update(values!).eq("id", id);
    if (error) return { ok: false, message: describeWriteError(error) };

    revalidateFor("events", values!.slug, previousSlug);
    return { ok: true, message: "已儲存，前台已同步更新" };
  } catch (error) {
    const authState = toAuthErrorState(error);
    if (authState) return authState;
    throw error;
  }
}

/**
 * ⚠️ 刪除會連同報名紀錄一起消失（外鍵是 on delete cascade）。
 *
 * 活動要取消時應該把狀態改成「已取消」而不是刪掉：報名者要看得到活動取消了，
 * 系辦也需要留著名單才知道要通知誰。這一顆按鈕是給「建錯了、還沒有人報名」
 * 的情況用的，所以下面有人報名時直接擋下來。
 */
export async function deleteEvent(form: FormData): Promise<void> {
  try {
    const { supabase } = await requireAdmin();
    const id = requireId(form);

    const { count, error: countError } = await supabase
      .from("alumni_event_registrations")
      .select("id", { count: "exact", head: true })
      .eq("event_id", id)
      .eq("status", "confirmed");

    if (countError) {
      console.error("[admin/events] 刪除前的報名數檢查失敗:", countError.message);
      return;
    }
    if ((count ?? 0) > 0) {
      // 刪除是從對話框觸發的，沒有地方顯示回傳訊息，所以失敗的表現就是
      // 「它沒有消失」。理由留在 server log。
      console.error(
        `[admin/events] 拒絕刪除活動 ${id}：還有 ${count} 筆有效報名。請改成「已取消」。`
      );
      return;
    }

    const { error } = await supabase.from("alumni_events").delete().eq("id", id);
    if (error) {
      console.error("[admin/events] 刪除失敗:", toChineseError(error));
      return;
    }
    revalidateFor("events", String(form.get("slug") ?? "") || null);
  } catch (error) {
    if (toAuthErrorState(error)) return;
    throw error;
  }

  redirect("/admin/events");
}

/**
 * 取消一筆報名，並把位子還回去。
 *
 * 走 RPC 而不是直接 update：位子的增與減必須是同一個交易，分開做就會出現
 * 「取消了但名額沒還」而且沒有任何跡象。那支函式是 SECURITY DEFINER 並且
 * 自己檢查 is_admin()，所以授權在資料庫裡，不只在這裡。
 */
export async function cancelRegistration(form: FormData): Promise<void> {
  try {
    const { supabase } = await requireAdmin();
    const id = String(form.get("registration_id") ?? "").trim();
    const eventId = Number(form.get("event_id"));
    if (!id || !Number.isInteger(eventId)) {
      console.error("[admin/events] 取消報名的參數不正確");
      return;
    }

    const { error } = await supabase.rpc("cancel_alumni_registration", { p_id: id });
    if (error) {
      console.error("[admin/events] 取消報名失敗:", error.code, error.message);
      return;
    }

    revalidateFor("events", String(form.get("slug") ?? "") || null);
  } catch (error) {
    if (toAuthErrorState(error)) return;
    throw error;
  }
}

/**
 * 這張表自己的 constraint 名稱 → 給系辦看的一句話。
 *
 * toChineseError() 有一份共用的對照表，但它只認得 posts 的那幾條。與其把
 * 活動的 constraint 混進那一份（那支是給六張既有表用的），不如在這裡先攔，
 * 攔不到再交給它。
 */
function describeWriteError(error: { code?: string; message?: string; details?: string | null }): string {
  const message = error.message ?? "";
  if (message.includes("alumni_events_slug_key") || error.code === "23505") {
    return "這個網址代稱已經有另一場活動在用了，請換一個";
  }
  if (message.includes("alumni_events_slug_format")) {
    return "網址代稱只能用小寫英文、數字與連字號，例如 homecoming-2026";
  }
  if (message.includes("alumni_events_time_valid")) {
    return "結束時間必須晚於開始時間";
  }
  if (message.includes("alumni_events_not_oversold")) {
    // 把名額改到比已報名人數還低時會撞到這一條。這是真的要擋的：改小名額
    // 不應該讓已經報名的人憑空被擠出去。
    return "名額上限不能低於目前的已報名人數。請先到報名名單取消部分報名，或把名額調高。";
  }
  return toChineseError(error);
}
