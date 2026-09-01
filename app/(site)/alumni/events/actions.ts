"use server";

import { revalidatePath } from "next/cache";
import { EN_PREFIX } from "@/lib/i18n";
import { createServerClient } from "@/lib/supabase/server";
import { MAX_GUESTS, PROGRAM_OPTIONS, toGregorianYear } from "@/lib/alumni-events";

/**
 * 前台報名的 Server Action。
 *
 * ## 這是一個公開的寫入端點
 *
 * 站上其他所有寫入都在 /admin 後面，這一支不是 —— 任何人都可以 POST。所以
 * 它的每一道檢查都必須當成安全邊界看，不能靠「表單上只有這些欄位」。
 *
 * 三層防線，由外而內：
 *   1. 這裡：格式、長度、列舉值、honeypot
 *   2. `register_for_alumni_event()`：活動狀態、截止時間、名額（含 for update
 *      的併發鎖）—— 這一層才是真正的判準
 *   3. CHECK / 唯一索引：就算前兩層都寫錯，資料庫也不允許超賣或同信箱重複
 *
 * ## 為什麼用 service_role
 *
 * 前台整站都是 service_role（見 lib/supabase/server.ts），報名紀錄那張表則
 * 刻意零 policy。key 只存在於伺服器端，Server Action 也只在伺服器端執行。
 *
 * ## 已知缺口
 *
 * 沒有節流。目前擋得住的是隨手濫填（honeypot ＋ 同信箱唯一索引），擋不住
 * 有心人。migration 檔尾記了最小的補法。
 */

export type RegistrationState = {
  ok: boolean;
  /** i18n 字典的 key，不是給人看的字串 —— 這支不知道當下是中文還是英文頁。 */
  messageKey?: string;
  /** 成功時的報名代碼。 */
  code?: string;
  fieldErrors?: Record<string, string>;
};

export const idleRegistration: RegistrationState = { ok: false };

/**
 * ⚠️ 欄位錯誤的訊息也是 key，理由同上：這支 action 由中英兩個頁面共用，
 * 在這裡把訊息寫死成中文，英文頁就會冒出中文錯誤。
 */
const FIELD_ERROR_KEYS = {
  nameRequired: "errName",
  emailRequired: "errEmail",
  emailFormat: "errEmailFormat",
  gradYear: "errGradYear",
  guests: "errGuests",
  tooLong: "errTooLong",
} as const;

/** 與資料庫的 CHECK 同一份合約：這裡先擋，資料庫兜底。 */
const EMAIL_SHAPE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

function trimmed(form: FormData, key: string): string {
  return String(form.get(key) ?? "").trim();
}

export async function registerForEvent(
  _prev: RegistrationState,
  form: FormData
): Promise<RegistrationState> {
  const slug = trimmed(form, "slug");
  if (!slug) return { ok: false, messageKey: "errorNotFound" };

  /*
   * Honeypot。
   *
   * 欄位在畫面外、aria-hidden、tabindex=-1、autocomplete="off"，人不會看到也
   * 不會 tab 到，填了的幾乎一定是照著 HTML 硬填的機器人。
   *
   * ⚠️ 這裡回錯誤而不是假裝成功。假裝成功可以讓機器人不再重試，但萬一某個
   * 密碼管理員真的幫真人填了這一格，那個人會以為自己報名了、其實沒有 ——
   * 而且永遠不會知道。寧可誤報一次讓他重試或打電話，也不要靜默掉一筆報名。
   */
  if (trimmed(form, "website")) {
    return { ok: false, messageKey: "errorUnknown" };
  }

  const name = trimmed(form, "name");
  const email = trimmed(form, "email").toLowerCase();
  const phone = trimmed(form, "phone");
  const program = trimmed(form, "program");
  const dietary = trimmed(form, "dietary");
  const note = trimmed(form, "note");
  const gradYearRaw = trimmed(form, "grad_year");
  const guestsRaw = trimmed(form, "guests");

  const fieldErrors: Record<string, string> = {};

  if (!name) fieldErrors.name = FIELD_ERROR_KEYS.nameRequired;
  else if (name.length > 60) fieldErrors.name = FIELD_ERROR_KEYS.tooLong;

  if (!email) fieldErrors.email = FIELD_ERROR_KEYS.emailRequired;
  else if (!EMAIL_SHAPE.test(email) || email.length > 254)
    fieldErrors.email = FIELD_ERROR_KEYS.emailFormat;

  if (phone.length > 40) fieldErrors.phone = FIELD_ERROR_KEYS.tooLong;
  if (dietary.length > 200) fieldErrors.dietary = FIELD_ERROR_KEYS.tooLong;
  if (note.length > 500) fieldErrors.note = FIELD_ERROR_KEYS.tooLong;

  /*
   * 畢業年。系友多半填民國（「85 級」），資料庫只存西元，所以在這裡換算 ——
   * 換算只做一次、在最外層，內層看到的永遠是西元。
   *
   * 下界 1930 不是隨便訂的：本系 1919 年設科，最早的系友不會早於 1930 年代
   * 畢業。上界是明年，因為應屆畢業生在畢業前就會來報名。
   */
  let gradYear: number | null = null;
  if (gradYearRaw) {
    const parsed = Number(gradYearRaw);
    if (!Number.isInteger(parsed) || parsed <= 0) {
      fieldErrors.grad_year = FIELD_ERROR_KEYS.gradYear;
    } else {
      const gregorian = toGregorianYear(parsed);
      const nextYear = new Date().getFullYear() + 1;
      if (gregorian < 1930 || gregorian > nextYear) {
        fieldErrors.grad_year = FIELD_ERROR_KEYS.gradYear;
      } else {
        gradYear = gregorian;
      }
    }
  }

  let guests = 0;
  if (guestsRaw) {
    const parsed = Number(guestsRaw);
    if (!Number.isInteger(parsed) || parsed < 0 || parsed > MAX_GUESTS) {
      fieldErrors.guests = FIELD_ERROR_KEYS.guests;
    } else {
      guests = parsed;
    }
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, messageKey: "errorRequired", fieldErrors };
  }

  const supabase = createServerClient();
  const { data, error } = await supabase.rpc("register_for_alumni_event", {
    p_slug: slug,
    p_name: name,
    p_email: email,
    p_phone: phone || null,
    p_grad_year: gradYear,
    // 列舉外的值一律存 null，不存原字串：這一欄後台會拿來分組，放進一個沒人
    // 預期的值等於在報表上開一個看不見的洞。
    p_program: (PROGRAM_OPTIONS as readonly string[]).includes(program)
      ? program
      : null,
    p_guests: guests,
    p_dietary: dietary || null,
    p_note: note || null,
  });

  if (error) {
    // 這幾個代號由 register_for_alumni_event() 的 raise exception 丟出，
    // supabase-js 把它放在 message 裡。⚠️ 與 lib/i18n/alumni-events.ts 的
    // error* 文案是同一份合約的兩半。
    const message = error.message ?? "";
    console.error("[alumni/events] 報名失敗:", error.code, message);

    if (message.includes("EVENT_FULL")) return { ok: false, messageKey: "errorFull" };
    if (message.includes("REGISTRATION_CLOSED"))
      return { ok: false, messageKey: "errorClosed" };
    if (message.includes("EVENT_NOT_OPEN"))
      return { ok: false, messageKey: "errorNotOpen" };
    if (message.includes("EVENT_NOT_FOUND"))
      return { ok: false, messageKey: "errorNotFound" };
    // 23505 = 唯一索引，也就是同一場活動同一個信箱已經有一筆有效報名。
    if (error.code === "23505") return { ok: false, messageKey: "errorDuplicate" };

    return { ok: false, messageKey: "errorUnknown" };
  }

  /*
   * 名額變了，讓兩種語言的活動頁與 /alumni 重新產生。
   *
   * 不用 lib/admin/revalidate.ts 的 revalidateFor()：那一支是後台用的，
   * 而這裡是公開路徑 —— 讓公開端點能觸發整站的重新驗證，等於給任何人一個
   * 讓伺服器重算所有頁面的按鈕。這裡只動這場活動自己的兩個網址與 /alumni。
   */
  for (const path of [
    `/alumni/events/${slug}`,
    `${EN_PREFIX}/alumni/events/${slug}`,
    "/alumni",
    `${EN_PREFIX}/alumni`,
  ]) {
    revalidatePath(path);
  }

  // rpc 回的是 returns table，所以是一個一列的陣列。
  const row = Array.isArray(data) ? data[0] : data;
  return { ok: true, code: row?.code ?? undefined };
}
