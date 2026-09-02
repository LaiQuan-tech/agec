"use client";

import Link from "next/link";
import type { ActionState } from "@/lib/admin/action-result";
import { FormShell } from "@/components/admin/ui/FormShell";
import { Field } from "@/components/admin/ui/Field";
import { Checkbox, Input, Select, Textarea } from "@/components/admin/ui/Input";
import { UploadField } from "@/components/admin/ui/UploadField";
import { AttachmentsField } from "@/components/admin/ui/AttachmentsField";
import type { NewsAttachment } from "@/lib/data";
/**
 * The shared Tiptap editor.
 *
 * 它原本住在部落格區（`admin/posts/Editor.tsx`），因為那裡是它的第一個使用者；
 * 部落格收掉時搬到 `components/admin/ui/`，也就是其他後台 UI 元件的所在地。
 * 它本來就沒有任何跟部落格綁定的東西 —— 參數化（htmlName / jsonName /
 * ariaLabel / lang）正是為了讓一份表單掛兩次，所以搬家只是換 import 路徑。
 *
 * It is also half of the sanitiser contract: its StarterKit config (h2–h4 only,
 * underline off) is the client-side twin of SANITIZE_OPTIONS in actions.ts, and
 * a second copy is a second chance for the two to drift apart and start eating
 * the author's formatting on save.
 *
 * Reaching across into ../posts is the cost. See the note on the shared
 * hasEditorContent() in ./constants for where both of these belong instead.
 */
import { Editor } from "@/components/admin/ui/Editor";
import { NEWS_CATEGORIES } from "./constants";

export type NewsFormValues = {
  id?: number;
  published_at: string;
  category: string;
  /** Empty string stands in for a null column, so the inputs stay uncontrolled. */
  category_en: string;
  title: string;
  title_en: string;
  /** Plain-text standfirst for the feature card — not the article body. */
  body: string;
  body_en: string;
  content_html: string;
  content_json: unknown;
  content_html_en: string;
  content_json_en: unknown;
  cover_url: string;
  is_pinned: boolean;
  /** 'draft' | 'published'. See the note on the field below. */
  status: string;
  attachments: NewsAttachment[];
  /** 演講公告 only; empty string for the null columns, like category_en above. */
  speaker: string;
  speaker_en: string;
  venue: string;
  venue_en: string;
  /** `datetime-local` shape — "YYYY-MM-DDTHH:mm" in Taipei time, or "". */
  event_at: string;
};

export function NewsForm({
  action,
  initial,
  submitLabel,
}: {
  action: (prev: ActionState, form: FormData) => Promise<ActionState>;
  initial: NewsFormValues;
  submitLabel: string;
}) {
  return (
    <FormShell
      action={action}
      submitLabel={submitLabel}
      secondary={
        <Link href="/admin/news" className="text-[13px] underline underline-offset-2" style={{ color: "var(--muted)" }}>
          取消，回到列表
        </Link>
      }
    >
      {(state: ActionState) => (
        <>
          {initial.id != null && <input type="hidden" name="id" value={initial.id} />}

          <Field htmlFor="title" label="標題" required error={state.fieldErrors?.title}>
            <Input
              id="title"
              name="title"
              defaultValue={initial.title}
              required
              maxLength={200}
              aria-invalid={Boolean(state.fieldErrors?.title)}
            />
          </Field>

          <Field
            htmlFor="title_en"
            label="標題 Title (English)"
            error={state.fieldErrors?.title_en}
            hint="留空的話，英文版網頁會直接顯示上面的中文，所以不必一次全部翻完。"
          >
            <Input
              id="title_en"
              name="title_en"
              defaultValue={initial.title_en}
              maxLength={300}
              lang="en"
              aria-invalid={Boolean(state.fieldErrors?.title_en)}
            />
          </Field>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field
              htmlFor="published_at"
              label="發佈日期"
              required
              error={state.fieldErrors?.published_at}
              hint="前台的消息依這個日期由新到舊排序"
            >
              <Input
                id="published_at"
                name="published_at"
                type="date"
                defaultValue={initial.published_at}
                required
                aria-invalid={Boolean(state.fieldErrors?.published_at)}
              />
            </Field>

            <Field
              htmlFor="category"
              label="分類"
              required
              error={state.fieldErrors?.category}
              hint="可從清單選，也可以直接打新的分類"
            >
              <Input
                id="category"
                name="category"
                list="news-categories"
                defaultValue={initial.category}
                required
                maxLength={20}
                aria-invalid={Boolean(state.fieldErrors?.category)}
              />
              <datalist id="news-categories">
                {NEWS_CATEGORIES.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </Field>
          </div>

          {/* Outside the two-column grid on purpose: 發佈日期 occupies the other
              half, so an English twin placed inside it would land beside the
              date rather than under the 分類 it translates. */}
          <Field
            htmlFor="category_en"
            label="分類 Category (English)"
            error={state.fieldErrors?.category_en}
            hint="留空的話，英文版網頁會直接顯示中文分類。同一個中文分類請固定用同一種英文寫法。"
          >
            <Input
              id="category_en"
              name="category_en"
              defaultValue={initial.category_en}
              maxLength={40}
              lang="en"
              aria-invalid={Boolean(state.fieldErrors?.category_en)}
            />
          </Field>

          {/* A <textarea>, not an editor, and the two are not interchangeable:
              both render sites put this straight into a text node — the feature
              card in components/site/News.tsx and `.post-standfirst` in
              NewsPost.tsx — so any HTML typed here would reach the reader as
              angle brackets. The article body is the field below. */}
          <Field
            htmlFor="body"
            label="摘要"
            error={state.fieldErrors?.body}
            hint="接在標題底下的一句話。每一則消息點進去都會顯示，排最前面的那一則還會出現在列表最上方的大卡片上。純文字，不能排版；留空就不顯示。"
          >
            <Textarea
              id="body"
              name="body"
              rows={3}
              defaultValue={initial.body}
              maxLength={300}
              aria-invalid={Boolean(state.fieldErrors?.body)}
            />
          </Field>

          <Field
            htmlFor="body_en"
            label="摘要 Summary (English)"
            error={state.fieldErrors?.body_en}
            hint="留空的話，英文版網頁會直接顯示上面的中文摘要，所以不必一次全部翻完。"
          >
            <Textarea
              id="body_en"
              name="body_en"
              rows={3}
              defaultValue={initial.body_en}
              maxLength={600}
              lang="en"
              aria-invalid={Boolean(state.fieldErrors?.body_en)}
            />
          </Field>

          {/* Not a <Field>: the editing surface is a contenteditable div, which a
              <label htmlFor> cannot target. The heading is a plain span and the
              accessible name is passed to the editor as aria-label instead. */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[13px] font-medium" style={{ color: "var(--ink)" }}>
              內文
            </span>
            <Editor
              initialHtml={initial.content_html}
              initialJson={initial.content_json}
              htmlName="content_html"
              jsonName="content_json"
              ariaLabel="消息內文編輯區"
            />
            <p className="text-[12px]" style={{ color: "var(--muted)" }}>
              點進單則消息後看到的內容。留空也沒關係——只有一行的公告本來就不需要內文，該頁會改顯示「這則公告沒有進一步的內容。」，不會是一片空白。
              圖片請先上傳到別處，再用「插入圖片」貼上網址。工具列以外的格式（例如底線、顏色）儲存時會被移除。
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-[13px] font-medium" style={{ color: "var(--ink)" }}>
              內文 Content (English)
            </span>
            <Editor
              initialHtml={initial.content_html_en}
              initialJson={initial.content_json_en}
              htmlName="content_html_en"
              jsonName="content_json_en"
              ariaLabel="英文內文編輯區"
              lang="en"
            />
            <p className="text-[12px]" style={{ color: "var(--muted)" }}>
              留空的話，英文版消息會直接顯示上面的中文內文，所以可以先翻標題和摘要，內文之後再補。
              動過又全部刪光也算留空，不會在英文版留下一則空白消息。
            </p>
          </div>

          <Field
            htmlFor="cover_url"
            label="封面圖片"
            error={state.fieldErrors?.cover_url}
            hint="選填。按「上傳」從電腦選圖，或直接貼上網址。每一則消息點進去都會顯示這張圖，排最前面的那一則還會拿它當列表最上方大卡片的背景圖（留空時卡片改用預設的院景照片）。"
          >
            <UploadField
              id="cover_url"
              name="cover_url"
              bucket="posters"
              defaultValue={initial.cover_url}
              placeholder="https://…"
              invalid={Boolean(state.fieldErrors?.cover_url)}
            />
          </Field>

          <Field
            htmlFor="attachments"
            label="附件"
            error={state.fieldErrors?.attachments}
            hint="選填。簡章、報名表、要點這類要給人下載的檔案。會列在消息內文的最下方，讀者看到的是這裡的原始檔名。"
          >
            <AttachmentsField name="attachments" defaultValue={initial.attachments} />
          </Field>

          <Field
            htmlFor="is_pinned"
            label="置頂"
            hint="置頂的消息會排在最前面，並在前台顯示「置頂」標記"
          >
            <Checkbox
              id="is_pinned"
              name="is_pinned"
              defaultChecked={initial.is_pinned}
              label="固定在列表最上方"
            />
          </Field>

          <Field
            htmlFor="status"
            label="發佈狀態"
            error={state.fieldErrors?.status}
            hint="草稿只有後台看得到，前台完全查不到——列表、首頁、搜尋引擎、直接輸入網址都一樣。改成「已發佈」後最多五分鐘會出現在前台。"
          >
            <Select id="status" name="status" defaultValue={initial.status}>
              <option value="draft">草稿</option>
              <option value="published">已發佈</option>
            </Select>
          </Field>

          {/*
            演講場次資訊。永遠顯示，不依分類自動隱藏——欄位會憑空消失比多幾個
            空白欄更難用，而且分類是自由文字（datalist 只是建議），沒有可靠的
            判斷點。前台自己只在「演講公告」那一區用這三欄。
          */}
          <fieldset className="flex flex-col gap-5 rounded-md border p-4" style={{ borderColor: "var(--hairline)" }}>
            <legend className="px-1 text-[13px] font-medium" style={{ color: "var(--ink-soft)" }}>
              演講場次（只有分類為「演講公告」時前台才會顯示）
            </legend>

            <Field
              htmlFor="speaker"
              label="講者"
              error={state.fieldErrors?.speaker}
              hint="含職稱與服務單位，例如「林建甫 董事長（中信金融管理學院）」。"
            >
              <Input
                id="speaker"
                name="speaker"
                defaultValue={initial.speaker}
                maxLength={200}
                aria-invalid={Boolean(state.fieldErrors?.speaker)}
              />
            </Field>

            <Field htmlFor="speaker_en" label="講者 Speaker (English)">
              <Input id="speaker_en" name="speaker_en" defaultValue={initial.speaker_en} maxLength={300} />
            </Field>

            <Field
              htmlFor="event_at"
              label="演講時間"
              error={state.fieldErrors?.event_at}
              hint="演講實際舉行的時間，不是公告日期。台北時間。"
            >
              <Input
                id="event_at"
                name="event_at"
                type="datetime-local"
                defaultValue={initial.event_at}
                aria-invalid={Boolean(state.fieldErrors?.event_at)}
              />
            </Field>

            <Field htmlFor="venue" label="地點" error={state.fieldErrors?.venue}>
              <Input
                id="venue"
                name="venue"
                defaultValue={initial.venue}
                maxLength={200}
                placeholder="農經系一樓大講堂"
                aria-invalid={Boolean(state.fieldErrors?.venue)}
              />
            </Field>

            <Field htmlFor="venue_en" label="地點 Venue (English)">
              <Input id="venue_en" name="venue_en" defaultValue={initial.venue_en} maxLength={300} />
            </Field>
          </fieldset>
        </>
      )}
    </FormShell>
  );
}
