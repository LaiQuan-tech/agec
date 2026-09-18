/**
 * 寄信：Resend HTTP API，不裝 SDK（一個 POST 而已）。
 *
 * 整站唯一的寄信出口。2026-09-19 接上，寄件網域是萊乾資訊的 laiquan.co
 * （系上沒有能驗證 DNS 的網域；agec.ntu.edu.tw 要請計中加紀錄），所以預設
 * 寄件人是 `noreply@laiquan.co`——這個網域在 Resend 已驗證。哪天系上的網域
 * 驗證好了，只要在 Vercel 改 `MAIL_FROM`，程式不用動。
 *
 * ## 永遠不 throw
 *
 * 呼叫端全部是「主要動作已完成、順手通知」的情境（報名已寫進資料庫、才寄
 * 確認信）。信寄不出去不能讓報名變成失敗，所以這裡吞掉所有錯誤、回
 * `{ sent: false, reason }`，由呼叫端決定要不要告訴使用者「確認信沒寄成，
 * 請保留代碼」。
 *
 * ## 沒有金鑰＝沒接
 *
 * `RESEND_API_KEY` 沒設（本機開發、或 Vercel 還沒填）時直接回 sent:false，
 * 不會丟例外、也不會假裝寄出。Supabase Auth 的信（忘記密碼）不走這裡，
 * 它走 Supabase 自己的 SMTP 設定（同一把 Resend 金鑰，見 supabase/README.md）。
 */

const RESEND_ENDPOINT = "https://api.resend.com/emails";

/** 寄件人。Vercel 的 `MAIL_FROM` 可覆蓋；預設值必須是已驗證的網域。 */
export const MAIL_FROM =
  process.env.MAIL_FROM?.trim() || "國立臺灣大學農業經濟學系 <noreply@laiquan.co>";

export type MailInput = {
  to: string;
  subject: string;
  /** 純文字版：所有信件客戶端都讀得到，也是 html 的備援。 */
  text: string;
  html?: string;
  /** 例如活動的聯絡窗口信箱，讓「回覆」直接到系辦。 */
  replyTo?: string;
};

export type MailResult = { sent: true; id: string } | { sent: false; reason: string };

export async function sendMail(input: MailInput): Promise<MailResult> {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) {
    console.warn("[email] RESEND_API_KEY 未設定，略過寄信:", input.subject);
    return { sent: false, reason: "RESEND_API_KEY 未設定" };
  }

  try {
    const res = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: MAIL_FROM,
        to: [input.to],
        subject: input.subject,
        text: input.text,
        ...(input.html ? { html: input.html } : {}),
        ...(input.replyTo ? { reply_to: input.replyTo } : {}),
      }),
      // 報名的 action 在等這個：十秒還沒回就放棄，不讓使用者盯著轉圈。
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      const body = (await res.text()).slice(0, 300);
      console.error("[email] Resend 回", res.status, body);
      return { sent: false, reason: `Resend ${res.status}` };
    }
    const data = (await res.json()) as { id?: string };
    return { sent: true, id: data.id ?? "" };
  } catch (cause) {
    const reason = cause instanceof Error ? cause.message : String(cause);
    console.error("[email] 寄信失敗:", reason);
    return { sent: false, reason };
  }
}

/** 從自由文字的聯絡窗口（「系辦 (02)3366-2653 agecntu@ntu.edu.tw」）挑出第一個信箱。 */
export function firstEmailIn(text: string | null | undefined): string | undefined {
  const m = /[^\s@<>()]+@[^\s@<>()]+\.[^\s@<>()]+/.exec(text ?? "");
  return m?.[0];
}

/** 給 html 用；純文字欄位一律經過它，使用者填的名字不能變成標籤。 */
export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
