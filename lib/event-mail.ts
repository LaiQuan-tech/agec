import type { Lang } from "@/lib/i18n";
import { escapeHtml } from "@/lib/email";

/**
 * 活動報名確認信的內容（純函式，好測）。
 *
 * 一封信兩種語言擇一：報名者在哪個語言的頁面送出，就收哪種語言（表單帶
 * hidden `lang`）。內容只放報名者當場看到的東西——活動名稱、時間、地點、
 * 報名代碼、攜伴人數、聯絡窗口、活動頁網址——不放內文，內文在活動頁。
 *
 * 純文字版是主體（所有信件客戶端都讀得到），html 版只是同一份內容加段落，
 * 沒有版型、沒有圖片、沒有追蹤。使用者填的字（姓名）在 html 裡一律跳脫。
 */

export type RegistrationMailInput = {
  lang: Lang;
  name: string;
  code: string;
  guests: number;
  /** 已依語言解析好的活動名稱與地點。 */
  eventTitle: string;
  /** 已格式化的時間字串（formatEventRange 的輸出）。 */
  when: string;
  location: string | null;
  address: string | null;
  contact: string | null;
  eventUrl: string;
};

export type RegistrationMail = { subject: string; text: string; html: string };

const T = {
  zh: {
    subject: (title: string) => `報名成功：${title}`,
    greet: (name: string) => `${name} 您好，`,
    done: (title: string) => `您已完成「${title}」的報名。`,
    code: "報名代碼",
    when: "時間",
    where: "地點",
    party: "人數",
    partySelf: "本人",
    partyGuests: (n: number) => `本人＋攜伴 ${n} 人`,
    page: "活動頁面",
    contact: "如需修改或取消，請聯絡",
    quote: "並提供報名代碼。",
    auto: "此信由系統自動寄出，請勿直接回覆。",
    sender: "國立臺灣大學農業經濟學系",
    colon: "：",
  },
  en: {
    subject: (title: string) => `You are registered: ${title}`,
    greet: (name: string) => `Dear ${name},`,
    done: (title: string) => `Your registration for "${title}" is confirmed.`,
    code: "Registration code",
    when: "When",
    where: "Where",
    party: "Party",
    partySelf: "Just you",
    partyGuests: (n: number) => `You + ${n} guest${n === 1 ? "" : "s"}`,
    page: "Event page",
    contact: "To change or cancel, contact",
    quote: "and quote your registration code.",
    auto: "This is an automated message; please do not reply directly.",
    sender: "Department of Agricultural Economics, National Taiwan University",
    colon: ": ",
  },
} as const;

export function registrationMail(input: RegistrationMailInput): RegistrationMail {
  const t = T[input.lang];
  const where = input.location
    ? input.address
      ? `${input.location}（${input.address}）`
      : input.location
    : null;
  const party = input.guests > 0 ? t.partyGuests(input.guests) : t.partySelf;

  const lines: string[] = [
    t.greet(input.name),
    "",
    t.done(input.eventTitle),
    "",
    `${t.code}${t.colon}${input.code}`,
    `${t.when}${t.colon}${input.when}`,
    ...(where ? [`${t.where}${t.colon}${where}`] : []),
    `${t.party}${t.colon}${party}`,
    `${t.page}${t.colon}${input.eventUrl}`,
    "",
    ...(input.contact ? [`${t.contact}${t.colon}${input.contact}${input.lang === "en" ? " " : "，"}${t.quote}`] : []),
    t.auto,
    t.sender,
  ];
  const text = lines.join("\n");

  const html = [
    `<p>${escapeHtml(t.greet(input.name))}</p>`,
    `<p>${escapeHtml(t.done(input.eventTitle))}</p>`,
    `<p><strong>${escapeHtml(t.code + t.colon)}${escapeHtml(input.code)}</strong><br>`,
    `${escapeHtml(t.when + t.colon)}${escapeHtml(input.when)}<br>`,
    ...(where ? [`${escapeHtml(t.where + t.colon)}${escapeHtml(where)}<br>`] : []),
    `${escapeHtml(t.party + t.colon)}${escapeHtml(party)}<br>`,
    `${escapeHtml(t.page + t.colon)}<a href="${escapeHtml(input.eventUrl)}">${escapeHtml(input.eventUrl)}</a></p>`,
    ...(input.contact
      ? [`<p>${escapeHtml(t.contact + t.colon)}${escapeHtml(input.contact)}${input.lang === "en" ? " " : "，"}${escapeHtml(t.quote)}</p>`]
      : []),
    `<p style="color:#6f6c5c;font-size:13px">${escapeHtml(t.auto)}<br>${escapeHtml(t.sender)}</p>`,
  ].join("\n");

  return { subject: t.subject(input.eventTitle), text, html };
}
