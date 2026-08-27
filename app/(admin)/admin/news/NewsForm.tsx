"use client";

import Link from "next/link";
import type { ActionState } from "@/lib/admin/action-result";
import { FormShell } from "@/components/admin/ui/FormShell";
import { Field } from "@/components/admin/ui/Field";
import { Checkbox, Input, Textarea } from "@/components/admin/ui/Input";
/**
 * The blog's editor, used as-is rather than copied.
 *
 * Editor.tsx holds no blog-specific anything: it was parameterised (htmlName /
 * jsonName / ariaLabel / lang) precisely so one form could mount it twice, and
 * mounting it in a second form costs nothing more. Copying it would fork ~270
 * lines whose trickiest part — writeField()'s prototype-setter write, which is
 * the only reason FormShell's unsaved-changes guard notices someone typing in
 * the editor — would then have to be fixed twice.
 *
 * It is also half of the sanitiser contract: its StarterKit config (h2–h4 only,
 * underline off) is the client-side twin of SANITIZE_OPTIONS in actions.ts, and
 * a second copy is a second chance for the two to drift apart and start eating
 * the author's formatting on save.
 *
 * Reaching across into ../posts is the cost. See the note on the shared
 * hasEditorContent() in ./constants for where both of these belong instead.
 */
import { Editor } from "../posts/Editor";
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
            label="封面圖片網址"
            error={state.fieldErrors?.cover_url}
            hint="選填，請以 http://、https:// 或 / 開頭。每一則消息點進去都會顯示這張圖，排最前面的那一則還會拿它當列表最上方大卡片的背景圖（留空時卡片改用預設的院景照片）。"
          >
            <Input
              id="cover_url"
              name="cover_url"
              defaultValue={initial.cover_url}
              maxLength={500}
              placeholder="https://…"
              aria-invalid={Boolean(state.fieldErrors?.cover_url)}
            />
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
        </>
      )}
    </FormShell>
  );
}
