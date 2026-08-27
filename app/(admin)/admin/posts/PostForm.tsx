"use client";

import Link from "next/link";
import type { ActionState } from "@/lib/admin/action-result";
import { FormShell } from "@/components/admin/ui/FormShell";
import { Field } from "@/components/admin/ui/Field";
import { Input, Select, Textarea } from "@/components/admin/ui/Input";
import { Editor } from "./Editor";
import { POST_STATUSES, POST_STATUS_LABELS, type PostStatus } from "./constants";

export type PostFormValues = {
  id?: number;
  slug: string;
  title: string;
  /** Empty string stands in for a null column, so the inputs stay uncontrolled. */
  title_en: string;
  excerpt: string;
  excerpt_en: string;
  cover_url: string;
  content_html: string;
  content_json: unknown;
  content_html_en: string;
  content_json_en: unknown;
  author: string;
  author_en: string;
  /**
   * Already joined with commas — the action splits it back apart.
   *
   * No `tags_en`, and not by oversight: `tags` is a `text[]` meant to be matched
   * against for filtering, and a translated copy would stop matching the moment
   * one side was filled in and the other was not — the same trap that keeps
   * `courses.program` untranslated. Tags stay in one language for both sites.
   */
  tags: string;
  status: PostStatus;
  /** Taipei wall-clock, in the format <input type="datetime-local"> expects. */
  published_at: string;
};

export function PostForm({
  action,
  initial,
  submitLabel,
}: {
  action: (prev: ActionState, form: FormData) => Promise<ActionState>;
  initial: PostFormValues;
  submitLabel: string;
}) {
  return (
    <FormShell
      action={action}
      submitLabel={submitLabel}
      secondary={
        <Link href="/admin/posts" className="text-[13px] underline underline-offset-2" style={{ color: "var(--muted)" }}>
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

          <Field
            htmlFor="slug"
            label="網址代稱"
            error={state.fieldErrors?.slug}
            hint="文章網址的最後一段，只能用小寫英文、數字與連字號。新增時留空會自動產生，例如 post-20260814-a3f9；編輯時清空則沿用原本的網址。已經公開分享過的文章請不要再改，舊網址會失效。"
          >
            <Input
              id="slug"
              name="slug"
              defaultValue={initial.slug}
              maxLength={120}
              placeholder="留空自動產生"
              aria-invalid={Boolean(state.fieldErrors?.slug)}
            />
          </Field>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field
              htmlFor="status"
              label="狀態"
              required
              error={state.fieldErrors?.status}
              hint="草稿只有後台看得到"
            >
              <Select
                id="status"
                name="status"
                defaultValue={initial.status}
                required
                aria-invalid={Boolean(state.fieldErrors?.status)}
              >
                {POST_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {POST_STATUS_LABELS[s]}
                  </option>
                ))}
              </Select>
            </Field>

            <Field
              htmlFor="published_at"
              label="發佈時間"
              error={state.fieldErrors?.published_at}
              hint="台灣時間。選「已發佈」卻留空的話，會直接帶入儲存當下的時間；填未來的時間就是預約發佈。"
            >
              <Input
                id="published_at"
                name="published_at"
                type="datetime-local"
                defaultValue={initial.published_at}
                aria-invalid={Boolean(state.fieldErrors?.published_at)}
              />
            </Field>
          </div>

          <Field
            htmlFor="excerpt"
            label="摘要"
            error={state.fieldErrors?.excerpt}
            hint="列表與分享連結會用到的一兩句話。留空的話之後由前台自行擷取內文開頭。"
          >
            <Textarea
              id="excerpt"
              name="excerpt"
              rows={3}
              defaultValue={initial.excerpt}
              maxLength={300}
              aria-invalid={Boolean(state.fieldErrors?.excerpt)}
            />
          </Field>

          <Field
            htmlFor="excerpt_en"
            label="摘要 Excerpt (English)"
            error={state.fieldErrors?.excerpt_en}
            hint="留空的話，英文版網頁會直接顯示上面的中文摘要，所以不必一次全部翻完。"
          >
            <Textarea
              id="excerpt_en"
              name="excerpt_en"
              rows={3}
              defaultValue={initial.excerpt_en}
              maxLength={600}
              lang="en"
              aria-invalid={Boolean(state.fieldErrors?.excerpt_en)}
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
              ariaLabel="文章內文編輯區"
            />
            <p className="text-[12px]" style={{ color: "var(--muted)" }}>
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
              留空的話，英文版文章會直接顯示上面的中文內文，所以可以先翻標題和摘要，內文之後再補。
              動過又全部刪光也算留空，不會在英文版留下一篇空白文章。
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field
              htmlFor="author"
              label="作者"
              error={state.fieldErrors?.author}
              hint="顯示在文章上的名字，例如「農經系辦公室」"
            >
              <Input
                id="author"
                name="author"
                defaultValue={initial.author}
                maxLength={60}
                aria-invalid={Boolean(state.fieldErrors?.author)}
              />
            </Field>

            <Field
              htmlFor="tags"
              label="標籤"
              error={state.fieldErrors?.tags}
              hint="用逗號分隔，例如：政策, 農業經濟。兩種語言共用同一組標籤，沒有英文版。"
            >
              <Input
                id="tags"
                name="tags"
                defaultValue={initial.tags}
                aria-invalid={Boolean(state.fieldErrors?.tags)}
              />
            </Field>
          </div>

          {/* Outside the two-column grid on purpose: 標籤 occupies the other half,
              so an English twin placed inside it would land beside the tags
              rather than under the 作者 it translates. Same call as 分類 English
              on the 最新消息 form. */}
          <Field
            htmlFor="author_en"
            label="作者 Author (English)"
            error={state.fieldErrors?.author_en}
            hint="留空的話，英文版網頁會直接顯示上面的中文署名。同一個單位請固定用同一種英文寫法。"
          >
            <Input
              id="author_en"
              name="author_en"
              defaultValue={initial.author_en}
              maxLength={120}
              lang="en"
              aria-invalid={Boolean(state.fieldErrors?.author_en)}
            />
          </Field>

          <Field
            htmlFor="cover_url"
            label="封面圖片網址"
            error={state.fieldErrors?.cover_url}
            hint="選填。請以 http://、https:// 或 / 開頭。"
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
        </>
      )}
    </FormShell>
  );
}
