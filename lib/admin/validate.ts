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

/** Collects non-empty errors; returns undefined when everything passed. */
export function collect(entries: Record<string, string | undefined>): FieldErrors | undefined {
  const errors: FieldErrors = {};
  for (const [key, message] of Object.entries(entries)) {
    if (message) errors[key] = message;
  }
  return Object.keys(errors).length > 0 ? errors : undefined;
}
