"use client";

import Link from "next/link";
import type { ActionState } from "@/lib/admin/action-result";
import { FormShell } from "@/components/admin/ui/FormShell";
import { Field } from "@/components/admin/ui/Field";
import { Input, Select } from "@/components/admin/ui/Input";
import { ChoiceField } from "@/components/admin/ui/ChoiceField";
import { DOCUMENT_SECTIONS, documentSectionLabel } from "./constants";
import { UploadField } from "@/components/admin/ui/UploadField";

/**
 * 檔案下載卡的新增／編輯表單。
 *
 * 檔案走 UploadField：一個網址輸入框加一顆「上傳」。兩種用法都成立 ——
 * 上傳一份 PDF，或把已經放在別處（例如教務處）的網址貼進來。`nameField` 讓它
 * 順便把原始檔名寫進 hidden input，前台的副檔名徽章是從那裡推出來的。
 *
 * 「分類」與「學制」（migration 20260914100000）：
 *  - 分類是自由文字，但用 ChoiceField 讓系辦從**已經用過的分類**挑，要開新的
 *    才選「其他」自己打 —— 同一個分類打成兩種寫法（「碩博相關」「碩博相關 」）
 *    前台就會拆成兩組，這是能擋掉大部分手滑的最便宜做法。清單是資料庫裡
 *    現有的值（見 new/page.tsx），不是寫死的。
 *  - 學制照 /admin/links 的做法：下拉、留空＝不限。
 */
export type DocumentFormValues = {
  id?: number;
  section: string;
  category: string;
  category_en: string;
  program: string;
  label: string;
  /** Empty string stands in for a null column, so the input stays uncontrolled. */
  label_en: string;
  description: string;
  description_en: string;
  file_url: string;
  file_name: string;
  sort_order: number;
};

export function DocumentForm({
  action,
  initial,
  submitLabel,
  categories,
  programs,
}: {
  action: (prev: ActionState, form: FormData) => Promise<ActionState>;
  initial: DocumentFormValues;
  submitLabel: string;
  /** 資料庫裡已經用過的分類（中文原值、去重），給「分類」下拉當選項。 */
  categories: string[];
  /** 學制的中文名稱，順序同 /admin/programs。 */
  programs: string[];
}) {
  return (
    <FormShell
      action={action}
      submitLabel={submitLabel}
      secondary={
        <Link
          href="/admin/documents"
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
            htmlFor="section"
            label="放在哪一頁"
            required
            error={state.fieldErrors?.section}
            hint="「課程資訊」的卡片出現在課程資訊頁最下方的「系上表單」；「招生資訊」的出現在招生資訊頁最下方的「招生檔案」（招生簡章、書面資料格式、考古題就放這裡）。"
          >
            <Select
              id="section"
              name="section"
              defaultValue={initial.section}
              required
              aria-invalid={Boolean(state.fieldErrors?.section)}
            >
              {DOCUMENT_SECTIONS.map((sec) => (
                <option key={sec} value={sec}>
                  {documentSectionLabel(sec)}
                </option>
              ))}
            </Select>
          </Field>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field
              htmlFor="category"
              label="分類"
              error={state.fieldErrors?.category}
              hint="前台會把同一分類的檔案排成一組、組前印分類名（舊站的常用表格分成：其他、國際碩士專班、碩博相關、招生相關、課程相關）。先從用過的分類挑，要開新分類再選「其他」自己打。留空＝不分類，會排在所有分組前面。"
            >
              <ChoiceField
                id="category"
                name="category"
                options={categories}
                defaultValue={initial.category}
                allowOther
                placeholder="不分類"
                ariaInvalid={Boolean(state.fieldErrors?.category)}
              />
            </Field>

            <Field
              htmlFor="category_en"
              label="分類 Category (English)"
              error={state.fieldErrors?.category_en}
              hint="留空的話英文版顯示中文。同一個分類只要在任何一筆填過英文，其他筆也請填一樣的，否則英文頁會一組印英文、一組印中文。"
            >
              <Input
                id="category_en"
                name="category_en"
                defaultValue={initial.category_en}
                maxLength={80}
                lang="en"
                aria-invalid={Boolean(state.fieldErrors?.category_en)}
              />
            </Field>
          </div>

          <Field
            htmlFor="program"
            label="學制"
            error={state.fieldErrors?.program}
            hint="標了學制的檔案，會多出現在該學制的修業規定頁（課程資訊 → 點學制）內文底下——修業規定的 PDF 正式版本放這裡最合適。招生資訊頁則會依這個欄位分學制篩選。留空＝不限學制。"
          >
            <Select
              id="program"
              name="program"
              defaultValue={initial.program}
              aria-invalid={Boolean(state.fieldErrors?.program)}
            >
              <option value="">不限學制</option>
              {programs.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
              {/* 目前的值不在清單裡（學制改名或打錯字）時，仍然要選得到，
                  否則一存檔就會被清成不限。 */}
              {initial.program && !programs.includes(initial.program) && (
                <option value={initial.program}>
                  {initial.program}（已不在學制清單中）
                </option>
              )}
            </Select>
          </Field>

          <Field
            htmlFor="label"
            label="檔案名稱"
            required
            error={state.fieldErrors?.label}
            hint="卡片上的標題，例如「實習申請同意書」或「114 學年度碩士班招生簡章」。"
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
            label="檔案名稱 Name (English)"
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
