import { translate, type Lang, type Msg } from "@/lib/i18n";
import type { EventAudience } from "@/lib/alumni-events";

/**
 * 活動（系友活動＋一般活動）與報名的介面文案。
 *
 * 與 lib/i18n/alumni.ts 分開：那一份是 /alumni 四個區塊的靜態文案（參考設計
 * 稿的 A 級內容），這一份是一個有狀態的功能 —— 表單標籤、錯誤訊息、報名成功
 * 畫面。兩者的變動頻率與變動原因都不一樣。
 *
 * 兩種對象共用這一份：活動頁、表單標籤、狀態、錯誤訊息一個字都不必分。
 * 只有提到「系友」的那幾句依對象分兩版，放在檔尾的 `EVENT_AUDIENCE_COPY`，
 * 元件用 `eventCopy(audience, lang)` 取 —— 一般活動的報名者不是系友，
 * 「已報名的系友請洽…」對他們是錯的。
 *
 * ⚠️ 錯誤訊息與 supabase/migrations/20260901120000_alumni_events.sql 裡
 * `raise exception` 的那幾個代號是同一份合約的兩半。SQL 丟 'EVENT_FULL'，
 * 這裡有一句給人看的 `full`。改一邊就要改另一邊，否則報名者會看到
 * 「報名失敗（代碼 P0001）」。
 */
export const ALUMNI_EVENTS = {
  /* --- /alumni 的活動區塊 ------------------------------------------------ */
  sectionEyebrow: { zh: "ALUMNI EVENTS", en: "ALUMNI EVENTS" },
  sectionHeading: { zh: "系友回娘家", en: "Alumni Homecoming" },
  sectionDescription: {
    zh: "系上定期舉辦系友回娘家與相關聚會，歡迎歷屆系友報名參加。",
    en: "The department holds homecoming gatherings and alumni events through the year. All graduates are welcome.",
  },
  /** 目前沒有任何開放中的活動時。 */
  sectionEmpty: {
    zh: "目前沒有開放報名的活動。新的活動上線時會公布在這裡。",
    en: "There are no events open for registration right now. New events will appear here.",
  },
  cardCta: { zh: "查看詳情與報名", en: "Details and registration" },
  navLabel: { zh: "系友活動", en: "Alumni events" },

  /* --- 活動頁 ------------------------------------------------------------ */
  breadcrumbAlumni: { zh: "系友專區", en: "Alumni" },
  detailWhen: { zh: "時間", en: "When" },
  detailWhere: { zh: "地點", en: "Where" },
  detailSeats: { zh: "名額", en: "Capacity" },
  detailDeadline: { zh: "報名截止", en: "Registration closes" },
  detailContact: { zh: "聯絡窗口", en: "Contact" },
  seatsUnlimited: { zh: "不限名額", en: "No limit" },
  /** {remaining} / {capacity} 會被代換。 */
  seatsRemaining: {
    zh: "尚餘 {remaining} 位（共 {capacity} 位）",
    en: "{remaining} of {capacity} places left",
  },
  /* 「← 返回系友專區」／「← 返回最新消息」與「已報名的系友請洽…」依對象分版，
     在檔尾的 EVENT_AUDIENCE_COPY。 */

  /* --- 狀態 -------------------------------------------------------------- */
  stateFull: { zh: "報名已額滿", en: "Fully booked" },
  stateClosed: { zh: "報名已截止", en: "Registration has closed" },
  stateCancelled: { zh: "本活動已取消", en: "This event has been cancelled" },
  stateFullNote: {
    zh: "若有名額釋出會在本頁更新，也可以直接聯絡系辦詢問。",
    en: "Any places that open up will be shown here. You may also contact the office.",
  },

  /* --- 表單 -------------------------------------------------------------- */
  formHeading: { zh: "線上報名", en: "Register" },
  formIntro: {
    zh: "請填寫以下資料。送出後畫面會顯示您的報名代碼，請截圖或抄下備查。",
    en: "Fill in the form below. Your registration code appears on screen after you submit — please keep a copy.",
  },
  fieldName: { zh: "姓名", en: "Name" },
  fieldEmail: { zh: "電子信箱", en: "Email" },
  fieldPhone: { zh: "聯絡電話", en: "Phone" },
  fieldGradYear: { zh: "畢業年", en: "Graduation year" },
  /** 說明為什麼兩種紀年都收。 */
  fieldGradYearHint: {
    zh: "民國或西元皆可，例如 85 或 1996",
    en: "e.g. 1996",
  },
  fieldProgram: { zh: "學制", en: "Programme" },
  fieldGuests: { zh: "攜伴人數", en: "Guests" },
  fieldGuestsHint: {
    zh: "不含本人。名額會依總人數計算。",
    en: "Not counting yourself. Places are counted by total headcount.",
  },
  fieldDietary: { zh: "飲食需求", en: "Dietary needs" },
  fieldDietaryHint: { zh: "例如素食、不吃牛", en: "e.g. vegetarian" },
  fieldNote: { zh: "備註", en: "Anything else" },
  optional: { zh: "選填", en: "optional" },
  submit: { zh: "送出報名", en: "Submit registration" },
  submitting: { zh: "送出中…", en: "Submitting…" },

  /* --- 個資告知 ---------------------------------------------------------- */
  privacyNotice: {
    zh: "您填寫的資料僅供本次活動的報到、聯繫與餐點準備使用，不會提供給第三方。如需查詢或刪除您的報名資料，請聯絡下方窗口。",
    en: "The details you provide are used only to run this event — check-in, contacting you, and catering. They are not shared with third parties. To review or delete your registration, contact the office below.",
  },

  /* --- 送出結果 ---------------------------------------------------------- */
  successHeading: { zh: "報名成功", en: "You are registered" },
  successCodeLabel: { zh: "報名代碼", en: "Registration code" },
  /** 兩句擇一，看 action 回的 emailed；後面永遠接 successNote。 */
  successMailSent: {
    zh: "確認信已寄到您填的信箱；沒收到請檢查垃圾郵件。",
    en: "A confirmation email is on its way to the address you gave; check your spam folder if it does not arrive.",
  },
  successMailFailed: {
    zh: "確認信沒有寄成，請截圖或抄下這組代碼。",
    en: "We could not send a confirmation email, so please screenshot or write down this code.",
  },
  successNote: {
    zh: "如需修改或取消，請聯絡下方窗口並提供報名代碼。",
    en: "To change or cancel, contact the office below and quote your registration code.",
  },

  /* --- 錯誤（與 SQL 的 raise exception 代號一一對應）--------------------- */
  errorRequired: { zh: "請修正下列欄位", en: "Please check the fields below" },
  errorFull: {
    zh: "很抱歉，名額在您填寫的這段時間內剛好被補滿了，這一筆沒有登記成功。",
    en: "Sorry — the last places were taken while you were filling in the form, so this registration was not recorded.",
  },
  errorClosed: {
    zh: "報名已經截止，這一筆沒有登記成功。",
    en: "Registration has closed, so this was not recorded.",
  },
  errorNotOpen: {
    zh: "這場活動目前沒有開放報名。",
    en: "This event is not open for registration.",
  },
  errorNotFound: {
    zh: "找不到這場活動，請重新整理頁面。",
    en: "This event could not be found. Please reload the page.",
  },
  errorDuplicate: {
    zh: "這個信箱已經報名過這場活動了。如需修改，請聯絡下方窗口。",
    en: "This email address is already registered for this event. Contact the office to make changes.",
  },
  /* 欄位層級的錯誤。key 由 app/(site)/alumni/events/actions.ts 的
     FIELD_ERROR_KEYS 產生 —— 那支 action 由中英兩頁共用，所以它只能回 key，
     不能回字串。 */
  errName: { zh: "請填寫姓名", en: "Please enter your name" },
  errEmail: { zh: "請填寫電子信箱", en: "Please enter your email" },
  errEmailFormat: {
    zh: "電子信箱格式看起來不正確",
    en: "That does not look like a valid email address",
  },
  errGradYear: {
    zh: "畢業年請填民國（如 85）或西元（如 1996）",
    en: "Please enter a four-digit year",
  },
  errGuests: { zh: "攜伴人數請填 0 到 5", en: "Guests must be between 0 and 5" },
  errTooLong: { zh: "這一欄太長了", en: "This is too long" },

  errorUnknown: {
    zh: "報名沒有送出成功，請稍後再試一次；若持續發生請聯絡系辦。",
    en: "The registration could not be submitted. Please try again, or contact the office.",
  },
} as const;

/**
 * 依對象不同的那幾句。
 *
 * 系友活動的報名者是系友、一般活動的報名者是「參加者」；活動頁的返回連結
 * 也各自回到自己住的那一頁。其餘文案（表單標籤、個資告知、成功畫面、錯誤）
 * 本來就沒提到系友，兩種對象共用上面那一份。
 *
 * ⚠️ 兩個分支的 key 必須一樣多、一樣名 —— `eventCopy()` 的回傳型別是兩者的
 * 交集，少一個 key 就會在元件裡變成 undefined。
 */
export const EVENT_AUDIENCE_COPY = {
  alumni: {
    /** 活動頁底部的返回連結。 */
    backToParent: { zh: "← 返回系友專區", en: "← Back to Alumni" },
    /** 活動取消時，狀態句後面接的那一句。 */
    stateCancelledNote: {
      zh: "已報名的系友請洽下方聯絡窗口。",
      en: "If you had registered, please contact the department office below.",
    },
  },
  general: {
    backToParent: { zh: "← 返回最新消息", en: "← Back to news" },
    stateCancelledNote: {
      zh: "已報名的參加者請洽下方聯絡窗口。",
      en: "If you had registered, please contact the office below.",
    },
  },
} satisfies Record<EventAudience, Record<string, Msg>>;

export type EventAudienceCopy = {
  [K in keyof (typeof EVENT_AUDIENCE_COPY)["alumni"]]: string;
};

export function eventCopy(audience: EventAudience, lang: Lang): EventAudienceCopy {
  return translate(EVENT_AUDIENCE_COPY[audience], lang);
}
