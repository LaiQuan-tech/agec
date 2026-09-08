/**
 * Hand-rolled form validation.
 *
 * A schema library would be justified for a large or evolving surface; here
 * there are six small tables, every message has to be in Chinese, and the rules
 * must mirror the CHECK constraints in supabase/migrations/ exactly. Writing
 * them out keeps the two in sight of each other.
 */

export type FieldErrors = Record<string, string>;

export class FormError extends Error {
  constructor(public readonly fieldErrors: FieldErrors) {
    super("VALIDATION_FAILED");
    this.name = "FormError";
  }
}

export function text(
  form: FormData,
  key: string,
  label: string,
  opts: { required?: boolean; max?: number } = {}
): { value: string | null; error?: string } {
  const raw = String(form.get(key) ?? "").trim();
  if (!raw) {
    return opts.required ? { value: null, error: `請填寫${label}` } : { value: null };
  }
  if (opts.max && raw.length > opts.max) {
    return { value: raw, error: `${label}不能超過 ${opts.max} 個字` };
  }
  return { value: raw };
}

export function number(
  form: FormData,
  key: string,
  label: string,
  opts: { required?: boolean; min?: number; max?: number } = {}
): { value: number | null; error?: string } {
  const raw = String(form.get(key) ?? "").trim();
  if (!raw) {
    return opts.required ? { value: null, error: `請填寫${label}` } : { value: null };
  }
  const n = Number(raw);
  if (!Number.isFinite(n)) return { value: null, error: `${label}必須是數字` };
  if (opts.min !== undefined && n < opts.min) return { value: n, error: `${label}不能小於 ${opts.min}` };
  if (opts.max !== undefined && n > opts.max) return { value: n, error: `${label}不能大於 ${opts.max}` };
  return { value: n };
}

/** ISO date (YYYY-MM-DD), which is what <input type="date"> submits. */
export function date(
  form: FormData,
  key: string,
  label: string,
  opts: { required?: boolean } = {}
): { value: string | null; error?: string } {
  const raw = String(form.get(key) ?? "").trim();
  if (!raw) {
    return opts.required ? { value: null, error: `請選擇${label}` } : { value: null };
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return { value: null, error: `${label}格式不正確` };
  if (Number.isNaN(Date.parse(raw))) return { value: null, error: `${label}不是有效的日期` };
  return { value: raw };
}

export function boolean(form: FormData, key: string): boolean {
  // An unchecked checkbox submits nothing at all.
  return form.get(key) != null;
}

/**
 * Restricts a value to a known set. Used wherever a TypeScript literal union
 * has to stay in step with a plain `text` column — links.section is the case
 * that bites, since the database would happily accept a fourth value and make
 * the declared type a lie.
 */
export function oneOf<T extends string>(
  form: FormData,
  key: string,
  label: string,
  allowed: readonly T[],
  opts: { required?: boolean } = {}
): { value: T | null; error?: string } {
  const raw = String(form.get(key) ?? "").trim();
  if (!raw) {
    return opts.required ? { value: null, error: `請選擇${label}` } : { value: null };
  }
  if (!(allowed as readonly string[]).includes(raw)) {
    return { value: null, error: `${label}不是有效的選項` };
  }
  return { value: raw as T };
}

export function requireId(form: FormData): number {
  const id = Number(form.get("id"));
  if (!Number.isInteger(id) || id <= 0) {
    throw new FormError({ id: "資料編號不正確" });
  }
  return id;
}

/**
 * The wall-clock string `<input type="datetime-local">` submits
 * (`YYYY-MM-DDTHH:mm`), turned into something a `timestamptz` column can store.
 *
 * The submitted value carries no offset, so writing it straight through would
 * leave Postgres to interpret it in the server's timezone — UTC in production —
 * and a post scheduled for 09:00 would go live at 17:00. The department, its
 * staff and its readers are all in Taiwan, so the offset is stated outright
 * rather than inferred from wherever the request happened to be served.
 */
const TAIPEI_UTC_OFFSET = "+08:00";

export function datetimeLocal(
  form: FormData,
  key: string,
  label: string,
  opts: { required?: boolean } = {}
): { value: string | null; error?: string } {
  const raw = String(form.get(key) ?? "").trim();
  if (!raw) {
    return opts.required ? { value: null, error: `請選擇${label}` } : { value: null };
  }
  // Seconds are optional: browsers omit them unless the input has a step that
  // asks for them.
  const parts = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})(:\d{2})?$/.exec(raw);
  if (!parts) return { value: null, error: `${label}格式不正確` };

  const value = `${parts[1]}T${parts[2]}${parts[3] ?? ":00"}${TAIPEI_UTC_OFFSET}`;
  if (Number.isNaN(Date.parse(value))) {
    return { value: null, error: `${label}不是有效的日期時間` };
  }
  return { value };
}

/**
 * 電子信箱。空值一律視為「沒填」而不是錯誤 —— 呼叫端要不要必填自己決定。
 *
 * 正則刻意與 supabase/migrations/20260901120000_alumni_events.sql:204 的
 * `alumni_registrations_email_shape` 逐字相同（把 POSIX 的 [:space:] 換成 \s）：
 *
 *   ^[^@\s]+@[^@\s]+\.[^@\s]+$
 *
 * 不做更嚴格的 RFC 比對。信箱唯一可靠的驗證方式是寄一封信過去，而這裡的目的
 * 只是擋住「少打了 @」這種當場看得出來的錯字。
 *
 * ⚠️ faculty.email 這一欄**沒有**資料庫層的 CHECK（那張表是當初直接在 Dashboard
 *    開的），所以在師資表單上這是唯一一道把關。
 */
export function email(
  form: FormData,
  key: string,
  label: string,
  opts: { required?: boolean; max?: number } = {}
): { value: string | null; error?: string } {
  const base = text(form, key, label, opts);
  if (base.error || !base.value) return base;

  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(base.value)) {
    return { value: base.value, error: `${label}的格式看起來不對，請確認有 @ 與網域` };
  }
  return base;
}

/** Collects non-empty errors; returns undefined when everything passed. */
/**
 * 後台密碼的規則：至少 8 碼，而且英文字母與數字都要有。
 *
 * 依臺大計中的資安要求（2026-09 客戶提出）。同一組規則在三個地方生效：
 *
 *   1. Supabase 專案設定（`password_min_length: 8` 加
 *      `password_required_characters` 兩組：英文字母、數字）。那是真正的
 *      防線 —— 不論從哪一條路設密碼都擋得住，包含忘記密碼的重設頁與
 *      Supabase Dashboard。
 *   2. 這一支：後台的兩個入口（新增人員、重設密碼）。
 *   3. 重設密碼頁（前端即時提示）。
 *
 * ⚠️ 為什麼前端也要驗一次，明明資料庫已經擋了：Supabase 回的是英文的
 * "Password should contain at least one character of each..."，那句話對系辦
 * 沒有幫助。這裡先攔下來，用中文說清楚缺什麼。
 *
 * ⚠️ 只要求英數字混合，不強制大小寫或符號 —— 需求寫的是「英數字混合」。
 * 規則要與 Supabase 那邊一致，改一邊就要改另一邊，否則會出現「前端說可以、
 * 存檔卻被拒」或反過來。
 */
export const PASSWORD_MIN_LENGTH = 8;

/** 給表單提示用的一句話，與下面的檢查同一份規則。 */
export const PASSWORD_RULE_HINT =
  `至少 ${PASSWORD_MIN_LENGTH} 碼，且必須同時包含英文字母與數字（依臺大計中資安要求）`;

export function password(
  form: FormData,
  key: string,
  label: string
): { value: string; error?: string } {
  // 不 trim：前後空白是密碼的一部分，去掉會讓使用者設的密碼與他以為的不同。
  const value = String(form.get(key) ?? "");

  if (!value) return { value, error: `請填寫${label}` };
  if (value.length < PASSWORD_MIN_LENGTH) {
    return { value, error: `${label}至少要 ${PASSWORD_MIN_LENGTH} 碼` };
  }
  // 逐條說缺什麼，而不是丟一句「格式錯誤」——使用者才知道要補哪一種。
  const hasLetter = /[A-Za-z]/.test(value);
  const hasDigit = /[0-9]/.test(value);
  if (!hasLetter && !hasDigit) return { value, error: `${label}必須包含英文字母與數字` };
  if (!hasLetter) return { value, error: `${label}還需要至少一個英文字母` };
  if (!hasDigit) return { value, error: `${label}還需要至少一個數字` };

  return { value };
}

export function collect(entries: Record<string, string | undefined>): FieldErrors | undefined {
  const errors: FieldErrors = {};
  for (const [key, message] of Object.entries(entries)) {
    if (message) errors[key] = message;
  }
  return Object.keys(errors).length > 0 ? errors : undefined;
}
