"use client";

import { useActionState, useId } from "react";
import { useFormStatus } from "react-dom";
import {
  idleRegistration,
  registerForEvent,
  type RegistrationState,
} from "@/app/(site)/alumni/events/actions";
import { MAX_GUESTS, PROGRAM_OPTIONS } from "@/lib/alumni-events";
import { translate, type Lang } from "@/lib/i18n";
import { ALUMNI_EVENTS } from "@/lib/i18n/alumni-events";

/**
 * 系友活動的線上報名表單。
 *
 * 站上唯一一個 Client Component 的公開表單 —— 其餘每一頁都是純靜態。用
 * `useActionState` 而不是導到另一個頁面，理由是失敗時要保住使用者已經打的
 * 字：送出後導頁的話，「名額剛好滿了」會連同他填的十個欄位一起消失。
 *
 * ⚠️ 送出成功後整個表單被結果畫面取代，而不是清空後留在原地。留著會讓人
 * 以為要再送一次，而第二次一定會撞上「同信箱已報名」的唯一索引。
 *
 * ⚠️ 這支拿到的是 messageKey 而不是訊息本身。action 由中英兩個頁面共用，
 * 沒有辦法知道當下是哪一種語言，所以翻譯在這裡做。
 */

type Copy = ReturnType<typeof translate<typeof ALUMNI_EVENTS>>;

function SubmitButton({ copy }: { copy: Copy }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="button gold" disabled={pending}>
      {pending ? copy.submitting : copy.submit}
    </button>
  );
}

/** 欄位錯誤的 key → 該語言的句子。未知的 key 不顯示，不印出 key 本身。 */
function fieldError(copy: Copy, state: RegistrationState, name: string): string | null {
  const key = state.fieldErrors?.[name];
  if (!key) return null;
  const message = (copy as unknown as Record<string, unknown>)[key];
  return typeof message === "string" ? message : null;
}

export function EventRegistrationForm({
  lang,
  slug,
  contact,
}: {
  lang: Lang;
  slug: string;
  /** 承辦窗口，印在成功畫面上——目前沒有確認信，這是唯一的後續管道。 */
  contact: string | null;
}) {
  const copy = translate(ALUMNI_EVENTS, lang);
  const [state, formAction] = useActionState(registerForEvent, idleRegistration);
  // useId 而不是寫死字串：同一頁若日後放兩個表單，label 的 for 會指到第一個。
  const uid = useId();
  const id = (name: string) => `${uid}-${name}`;

  if (state.ok) {
    return (
      <div className="event-success" role="status">
        <h3>{copy.successHeading}</h3>
        <p className="event-code">
          <span>{copy.successCodeLabel}</span>
          <strong>{state.code}</strong>
        </p>
        <p>{copy.successNote}</p>
        {contact && (
          <p className="event-success-contact">
            {copy.detailContact}：{contact}
          </p>
        )}
      </div>
    );
  }

  const topMessage = state.messageKey
    ? ((copy as unknown as Record<string, unknown>)[state.messageKey] as string | undefined)
    : undefined;

  return (
    <form action={formAction} className="event-form">
      <input type="hidden" name="slug" value={slug} />

      {/*
        Honeypot。人看不到、tab 不到、螢幕閱讀器不會唸到，所以填了的幾乎一定
        是機器人。用 `left:-9999px` 而不是 `display:none`：部分機器人會跳過
        display:none 的欄位，但照樣填會被移到畫面外的。
        ⚠️ 不能加 `required`，否則真人永遠送不出去。
      */}
      <div className="event-form-trap" aria-hidden="true">
        <label htmlFor={id("website")}>Website</label>
        <input
          id={id("website")}
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      {topMessage && (
        /* role="alert" 讓螢幕閱讀器在送出後立刻唸出來——這一段是動態插入的，
           沒有它就只是畫面上多了一行字，讀屏使用者不會知道。 */
        <p className="event-form-error" role="alert">
          {topMessage}
        </p>
      )}

      <div className="event-form-grid">
        <Field
          id={id("name")}
          name="name"
          label={copy.fieldName}
          required
          autoComplete="name"
          error={fieldError(copy, state, "name")}
        />
        <Field
          id={id("email")}
          name="email"
          type="email"
          label={copy.fieldEmail}
          required
          autoComplete="email"
          error={fieldError(copy, state, "email")}
        />
        <Field
          id={id("phone")}
          name="phone"
          type="tel"
          label={copy.fieldPhone}
          optionalLabel={copy.optional}
          autoComplete="tel"
          error={fieldError(copy, state, "phone")}
        />
        <Field
          id={id("grad_year")}
          name="grad_year"
          /* type="text" + inputMode 而不是 type="number"：民國年與西元年都要
             收，而 number 欄位的上下鍵與滾輪在這種「兩種紀年」的欄位上只會
             讓人誤觸。 */
          inputMode="numeric"
          label={copy.fieldGradYear}
          optionalLabel={copy.optional}
          hint={copy.fieldGradYearHint}
          error={fieldError(copy, state, "grad_year")}
        />

        <div className="event-field">
          <label htmlFor={id("program")}>
            {copy.fieldProgram}
            <em>（{copy.optional}）</em>
          </label>
          <select id={id("program")} name="program" defaultValue="">
            <option value="">—</option>
            {PROGRAM_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div className="event-field">
          <label htmlFor={id("guests")}>{copy.fieldGuests}</label>
          {/* 攜伴是 select 不是自由輸入：上限 5 是資料庫的 CHECK，用選單就
              不可能送出超過的值，也省掉一種錯誤訊息。 */}
          <select id={id("guests")} name="guests" defaultValue="0">
            {Array.from({ length: MAX_GUESTS + 1 }, (_, n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
          <p className="event-field-hint">{copy.fieldGuestsHint}</p>
          {fieldError(copy, state, "guests") && (
            <p className="event-field-error">{fieldError(copy, state, "guests")}</p>
          )}
        </div>

        <Field
          id={id("dietary")}
          name="dietary"
          label={copy.fieldDietary}
          optionalLabel={copy.optional}
          hint={copy.fieldDietaryHint}
          error={fieldError(copy, state, "dietary")}
        />
      </div>

      <div className="event-field event-field-wide">
        <label htmlFor={id("note")}>
          {copy.fieldNote}
          <em>（{copy.optional}）</em>
        </label>
        <textarea id={id("note")} name="note" rows={3} />
        {fieldError(copy, state, "note") && (
          <p className="event-field-error">{fieldError(copy, state, "note")}</p>
        )}
      </div>

      {/* 個資告知放在送出鍵前面，不是頁尾的小字：這是報名者按下去之前應該
          讀到的東西。 */}
      <p className="event-form-privacy">{copy.privacyNotice}</p>

      <SubmitButton copy={copy} />
    </form>
  );
}

function Field({
  id,
  name,
  label,
  type = "text",
  inputMode,
  required,
  optionalLabel,
  autoComplete,
  hint,
  error,
}: {
  id: string;
  name: string;
  label: string;
  type?: string;
  inputMode?: "numeric";
  required?: boolean;
  optionalLabel?: string;
  autoComplete?: string;
  hint?: string;
  error?: string | null;
}) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  return (
    <div className="event-field">
      <label htmlFor={id}>
        {label}
        {optionalLabel && <em>（{optionalLabel}）</em>}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        inputMode={inputMode}
        required={required}
        autoComplete={autoComplete}
        // 描述與錯誤都綁上去，讀屏才會在唸完欄位名之後接著唸它們。
        aria-describedby={[hintId, errorId].filter(Boolean).join(" ") || undefined}
        aria-invalid={error ? true : undefined}
      />
      {hint && (
        <p className="event-field-hint" id={hintId}>
          {hint}
        </p>
      )}
      {error && (
        <p className="event-field-error" id={errorId}>
          {error}
        </p>
      )}
    </div>
  );
}
