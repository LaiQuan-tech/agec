"use client";

import Link from "next/link";
import type { ActionState } from "@/lib/admin/action-result";
import { FormShell } from "@/components/admin/ui/FormShell";
import { Field } from "@/components/admin/ui/Field";
import { Input, Select, Textarea } from "@/components/admin/ui/Input";
import { EVENT_STATUSES, EVENT_STATUS_LABEL } from "./constants";

export type EventFormValues = {
  id?: number;
  /** 編輯時帶著原本的 slug，改了才知道舊網址也要重新驗證。 */
  previousSlug?: string;
  slug: string;
  title: string;
  title_en: string;
  summary: string;
  summary_en: string;
  body: string;
  body_en: string;
  /** datetime-local 的字串，已經換算成台北時間。 */
  starts_at: string;
  ends_at: string;
  location: string;
  location_en: string;
  address: string;
  /** 空字串 = 不限名額。 */
  capacity: string;
  registration_closes_at: string;
  cover_url: string;
  contact: string;
  status: string;
  /** 目前的已佔用人數，唯讀。新增時是 0。 */
  seatsTaken?: number;
};

/**
 * 系友活動的新增／編輯表單。
 *
 * ⚠️ 沒有「已報名人數」這個欄位可以改。它由報名與取消兩支函式成對維護，
 * 表單上只以唯讀的一句話呈現 —— 讓它可編輯等於開一條「數字與名單對不起來」
 * 的路，而那個不一致沒有任何地方會報錯。
 *
 * 英文欄位一律可以留空：前台的 pick() 會在英文是空的時候退回中文，所以系辦
 * 不必一次翻完（與其他五個後台表單相同的處理）。
 */
export function EventForm({
  action,
  initial,
  submitLabel,
}: {
  action: (prev: ActionState, form: FormData) => Promise<ActionState>;
  initial: EventFormValues;
  submitLabel: string;
}) {
  return (
    <FormShell
      action={action}
      submitLabel={submitLabel}
      secondary={
        <Link
          href="/admin/events"
          className="text-[13px] underline underline-offset-2"
          style={{ color: "var(--muted)" }}
        >
          取消，回到列表
        </Link>
      }
    >
      {(state: ActionState) => (
        <>
          {initial.id != null && <input type="hidden" name="id" value={initial.id} />}
          {initial.previousSlug != null && (
            <input type="hidden" name="previous_slug" value={initial.previousSlug} />
          )}

          <Field htmlFor="title" label="活動名稱" required error={state.fieldErrors?.title}>
            <Input
              id="title"
              name="title"
              defaultValue={initial.title}
              required
              maxLength={120}
              aria-invalid={Boolean(state.fieldErrors?.title)}
            />
          </Field>

          <Field
            htmlFor="title_en"
            label="活動名稱 Event title (English)"
            error={state.fieldErrors?.title_en}
            hint="留空的話，英文版網頁會直接顯示上面的中文。"
          >
            <Input id="title_en" name="title_en" defaultValue={initial.title_en} maxLength={200} />
          </Field>

          <Field
            htmlFor="slug"
            label="網址代稱"
            required
            error={state.fieldErrors?.slug}
            hint={
              <>
                活動頁的網址會是 <code>/alumni/events/{initial.slug || "你填的代稱"}</code>。
                只能用小寫英文、數字與連字號，例如 <code>homecoming-2026</code>。
                ⚠️ 上架之後就不要再改：系友分享出去的連結會失效。
              </>
            }
          >
            <Input
              id="slug"
              name="slug"
              defaultValue={initial.slug}
              required
              maxLength={80}
              pattern="[a-z0-9]+(-[a-z0-9]+)*"
              aria-invalid={Boolean(state.fieldErrors?.slug)}
            />
          </Field>

          <Field
            htmlFor="status"
            label="狀態"
            required
            error={state.fieldErrors?.status}
            hint="「已取消」的活動前台仍然看得到，但不能報名 —— 已經報名的人要知道活動取消了。"
          >
            <Select id="status" name="status" defaultValue={initial.status} required>
              {EVENT_STATUSES.map((value) => (
                <option key={value} value={value}>
                  {EVENT_STATUS_LABEL[value]}
                </option>
              ))}
            </Select>
          </Field>

          <Field
            htmlFor="starts_at"
            label="開始時間"
            required
            error={state.fieldErrors?.starts_at}
            hint="台北時間。"
          >
            <Input
              id="starts_at"
              name="starts_at"
              type="datetime-local"
              defaultValue={initial.starts_at}
              required
              aria-invalid={Boolean(state.fieldErrors?.starts_at)}
            />
          </Field>

          <Field
            htmlFor="ends_at"
            label="結束時間"
            error={state.fieldErrors?.ends_at}
            hint="可以留空。留空時前台只顯示開始時間。"
          >
            <Input
              id="ends_at"
              name="ends_at"
              type="datetime-local"
              defaultValue={initial.ends_at}
              aria-invalid={Boolean(state.fieldErrors?.ends_at)}
            />
          </Field>

          <Field
            htmlFor="registration_closes_at"
            label="報名截止時間"
            error={state.fieldErrors?.registration_closes_at}
            hint="留空的話，報名會開放到活動開始的那一刻為止。"
          >
            <Input
              id="registration_closes_at"
              name="registration_closes_at"
              type="datetime-local"
              defaultValue={initial.registration_closes_at}
            />
          </Field>

          <Field
            htmlFor="capacity"
            label="名額上限"
            error={state.fieldErrors?.capacity}
            hint={
              <>
                留空 = 不限名額。填 0 = 開放報名但沒有位子（兩者不同）。
                {initial.seatsTaken != null && initial.seatsTaken > 0 && (
                  <>
                    {" "}
                    <strong>目前已佔用 {initial.seatsTaken} 位</strong>（含攜伴），
                    上限不能低於這個數字。要放掉位子請到報名名單取消該筆報名。
                  </>
                )}
              </>
            }
          >
            <Input
              id="capacity"
              name="capacity"
              type="number"
              min={0}
              max={100000}
              defaultValue={initial.capacity}
              aria-invalid={Boolean(state.fieldErrors?.capacity)}
            />
          </Field>

          <Field
            htmlFor="location"
            label="地點"
            error={state.fieldErrors?.location}
            hint="例如「農業綜合館 一樓 農經二教室」。"
          >
            <Input id="location" name="location" defaultValue={initial.location} maxLength={120} />
          </Field>

          <Field
            htmlFor="location_en"
            label="地點 Location (English)"
            error={state.fieldErrors?.location_en}
          >
            <Input
              id="location_en"
              name="location_en"
              defaultValue={initial.location_en}
              maxLength={200}
            />
          </Field>

          <Field
            htmlFor="address"
            label="地址"
            error={state.fieldErrors?.address}
            hint="給導航用的完整地址，會顯示在地點下方。"
          >
            <Input id="address" name="address" defaultValue={initial.address} maxLength={200} />
          </Field>

          <Field
            htmlFor="summary"
            label="一句話摘要"
            error={state.fieldErrors?.summary}
            hint="列表卡片與分享連結的預覽文字會用它。"
          >
            <Input id="summary" name="summary" defaultValue={initial.summary} maxLength={200} />
          </Field>

          <Field
            htmlFor="summary_en"
            label="一句話摘要 Summary (English)"
            error={state.fieldErrors?.summary_en}
          >
            <Input
              id="summary_en"
              name="summary_en"
              defaultValue={initial.summary_en}
              maxLength={300}
            />
          </Field>

          <Field
            htmlFor="body"
            label="活動說明"
            error={state.fieldErrors?.body}
            hint="純文字，換行會保留。⚠️ 這一欄不吃 HTML — 貼進來的標籤會原樣顯示成文字。"
          >
            <Textarea id="body" name="body" rows={8} defaultValue={initial.body} maxLength={5000} />
          </Field>

          <Field
            htmlFor="body_en"
            label="活動說明 Details (English)"
            error={state.fieldErrors?.body_en}
          >
            <Textarea
              id="body_en"
              name="body_en"
              rows={6}
              defaultValue={initial.body_en}
              maxLength={8000}
            />
          </Field>

          <Field
            htmlFor="contact"
            label="聯絡窗口"
            error={state.fieldErrors?.contact}
            hint="會印在報名成功畫面上。⚠️ 目前系統不會寄確認信，這是報名者唯一的後續管道，請務必填。"
          >
            <Input
              id="contact"
              name="contact"
              defaultValue={initial.contact}
              maxLength={200}
              placeholder="系辦 (02)3366-2653　agecntu@ntu.edu.tw"
            />
          </Field>

          <Field
            htmlFor="cover_url"
            label="封面圖網址"
            error={state.fieldErrors?.cover_url}
            hint="選填。可以先到「最新消息」上傳圖片後複製網址過來。"
          >
            <Input id="cover_url" name="cover_url" defaultValue={initial.cover_url} maxLength={500} />
          </Field>
        </>
      )}
    </FormShell>
  );
}
