"use client";

import Link from "next/link";
import type { ActionState } from "@/lib/admin/action-result";
import { FormShell } from "@/components/admin/ui/FormShell";
import { Field } from "@/components/admin/ui/Field";
import { Input } from "@/components/admin/ui/Input";
import { UploadField } from "@/components/admin/ui/UploadField";

/**
 * 系上表單的新增／編輯表單。
 *
 * 檔案走 UploadField：一個網址輸入框加一顆「上傳」。兩種用法都成立 ——
 * 上傳一份 PDF，或把已經放在別處（例如教務處）的網址貼進來。`nameField` 讓它
 * 順便把原始檔名寫進 hidden input，前台的副檔名徽章是從那裡推出來的。
 */
export type CourseFormValues = {
  id?: number;
  label: string;
  /** Empty string stands in for a null column, so the input stays uncontrolled. */
  label_en: string;
  description: string;
  description_en: string;
  file_url: string;
  file_name: string;
  sort_order: number;
};

export function CourseFormForm({
  action,
  initial,
  submitLabel,
}: {
  action: (prev: ActionState, form: FormData) => Promise<ActionState>;
  initial: CourseFormValues;
  submitLabel: string;
}) {
  return (
    <FormShell
      action={action}
      submitLabel={submitLabel}
      secondary={
        <Link
          href="/admin/forms"
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

          <Field
            htmlFor="label"
            label="表單名稱"
            required
            error={state.fieldErrors?.label}
            hint="卡片上的標題，例如「實習申請同意書」。"
          >
            <Input
              id="label"
              name="label"
              defaultValue={initial.label}
              required
              maxLength={60}
              aria-invalid={Boolean(state.fieldErrors?.label)}
            />
          </Field>

          <Field
            htmlFor="label_en"
            label="表單名稱 Name (English)"
            error={state.fieldErrors?.label_en}
            hint="留空的話，英文版網頁會直接顯示上面的中文，所以不必一次全部翻完。"
          >
            <Input
              id="label_en"
              name="label_en"
              defaultValue={initial.label_en}
              maxLength={120}
              lang="en"
              aria-invalid={Boolean(state.fieldErrors?.label_en)}
            />
          </Field>

          <Field
            htmlFor="file_url"
            label="檔案"
            error={state.fieldErrors?.file_url}
            hint="按「上傳」選擇檔案，或直接貼上網址。可用 PDF、Word、Excel、PowerPoint、ODF、RTF、壓縮檔與純文字，單檔最大 50MB。留空的話卡片仍會出現，但還不能點——適合先把表單名稱列上去、檔案晚一點再補。"
          >
            <UploadField
              id="file_url"
              name="file_url"
              bucket="attachments"
              defaultValue={initial.file_url}
              placeholder="https://…"
              invalid={Boolean(state.fieldErrors?.file_url)}
              // 圖片以外的格式，跟公告附件同一組（見 api/upload/route.ts）。
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.odt,.ods,.rtf,.zip,.7z,.rar,.txt"
              // 原始檔名跟著存下來：Storage 的 key 是 uuid，這是唯一留住
              // 「這份檔案叫什麼」的地方，前台的副檔名徽章也從它推導。
              nameField="file_name"
              defaultFileName={initial.file_name}
              // 附件是 PDF/DOCX，縮圖一定載不起來。
              preview={false}
            />
          </Field>

          <Field
            htmlFor="description"
            label="說明"
            error={state.fieldErrors?.description}
            hint="卡片標題下面那一行小字，一句話就好。留空的話卡片只顯示標題。"
          >
            <Input
              id="description"
              name="description"
              defaultValue={initial.description}
              maxLength={120}
              aria-invalid={Boolean(state.fieldErrors?.description)}
            />
          </Field>

          <Field
            htmlFor="description_en"
            label="說明 Description (English)"
            error={state.fieldErrors?.description_en}
            hint="同樣可以留空，英文版會顯示中文。"
          >
            <Input
              id="description_en"
              name="description_en"
              defaultValue={initial.description_en}
              maxLength={240}
              lang="en"
              aria-invalid={Boolean(state.fieldErrors?.description_en)}
            />
          </Field>

          <Field
            htmlFor="sort_order"
            label="顯示順序"
            error={state.fieldErrors?.sort_order}
            hint="數字小的排前面，留空視同 0"
          >
            <Input
              id="sort_order"
              name="sort_order"
              type="number"
              min={0}
              max={9999}
              step={1}
              defaultValue={initial.sort_order}
              aria-invalid={Boolean(state.fieldErrors?.sort_order)}
            />
          </Field>
        </>
      )}
    </FormShell>
  );
}
