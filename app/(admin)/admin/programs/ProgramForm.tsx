"use client";

import Link from "next/link";
import type { ActionState } from "@/lib/admin/action-result";
import { FormShell } from "@/components/admin/ui/FormShell";
import { Editor } from "@/components/admin/ui/Editor";
import { Field } from "@/components/admin/ui/Field";
import { Input, Textarea } from "@/components/admin/ui/Input";

export type ProgramFormValues = {
  id?: number;
  name: string;
  /** Empty string stands in for a null column, so the inputs stay uncontrolled. */
  name_en: string;
  description: string;
  description_en: string;
  admission_url: string;
  sort_order: number;
  /** 修業規定內文。空字串＝沒有那一頁。 */
  requirements_html: string;
  requirements_html_en: string;
  requirements_json: unknown;
  requirements_json_en: unknown;
};

export function ProgramForm({
  action,
  initial,
  submitLabel,
}: {
  action: (prev: ActionState, form: FormData) => Promise<ActionState>;
  initial: ProgramFormValues;
  submitLabel: string;
}) {
  return (
    <FormShell
      action={action}
      submitLabel={submitLabel}
      secondary={
        <Link
          href="/admin/programs"
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
            htmlFor="name"
            label="學制名稱"
            required
            error={state.fieldErrors?.name}
            hint="前台卡片上的圖示是依名稱判斷的（含「碩」、「博」、「在職」、「國際」等字樣）"
          >
            <Input
              id="name"
              name="name"
              defaultValue={initial.name}
              required
              maxLength={50}
              aria-invalid={Boolean(state.fieldErrors?.name)}
            />
          </Field>

          <div className="grid gap-5 sm:grid-cols-2">
            {/* Sits in the grid immediately under 學制名稱, which is where the
                English twin belongs — no separate row needed. */}
            <Field
              htmlFor="name_en"
              label="學制名稱 Program name (English)"
              error={state.fieldErrors?.name_en}
              hint="留空的話，英文版網頁會直接顯示中文。課程頁英文版的學制分頁名稱也是取這一欄，所以填了這裡，那邊就一起變英文。"
            >
              <Input
                id="name_en"
                name="name_en"
                defaultValue={initial.name_en}
                maxLength={120}
                aria-invalid={Boolean(state.fieldErrors?.name_en)}
              />
            </Field>

            <Field
              htmlFor="sort_order"
              label="顯示順序"
              error={state.fieldErrors?.sort_order}
              hint="數字小的排前面，留空視為 0"
            >
              <Input
                id="sort_order"
                name="sort_order"
                type="number"
                min={0}
                max={999}
                step={1}
                defaultValue={initial.sort_order}
                aria-invalid={Boolean(state.fieldErrors?.sort_order)}
              />
            </Field>
          </div>

          <Field
            htmlFor="description"
            label="簡介"
            error={state.fieldErrors?.description}
            hint="顯示在學制名稱下方的一段說明，建議兩三句話"
          >
            <Textarea
              id="description"
              name="description"
              defaultValue={initial.description}
              rows={4}
              maxLength={500}
              aria-invalid={Boolean(state.fieldErrors?.description)}
            />
          </Field>

          <Field
            htmlFor="description_en"
            label="簡介 Description (English)"
            error={state.fieldErrors?.description_en}
            hint="留空的話，英文版網頁會直接顯示上面的中文，所以不必一次全部翻完。"
          >
            <Textarea
              id="description_en"
              name="description_en"
              defaultValue={initial.description_en}
              rows={4}
              maxLength={1000}
              lang="en"
              aria-invalid={Boolean(state.fieldErrors?.description_en)}
            />
          </Field>

          <Field
            htmlFor="admission_url"
            label="招生資訊連結"
            error={state.fieldErrors?.admission_url}
            hint="「招生資訊」頁上這張學制卡的「查看招生資訊」要連到哪裡，例如教務處這個學制的招生頁。留空的話會連到站內的招生消息清單（四個學制都一樣），跟現在的行為相同。"
          >
            <Input
              id="admission_url"
              name="admission_url"
              type="url"
              inputMode="url"
              placeholder="https://…"
              defaultValue={initial.admission_url}
              maxLength={500}
              aria-invalid={Boolean(state.fieldErrors?.admission_url)}
            />
          </Field>

          {/* 不是 <Field>：編輯區是 contenteditable 的 div，<label htmlFor>
              指不到它。標題用純文字，無障礙名稱以 aria-label 傳給編輯器 ——
              與 /admin/news、/admin/faculty 的內文欄同一個處理。 */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[13px] font-medium" style={{ color: "var(--ink)" }}>
              修業規定
            </span>
            <Editor
              initialHtml={initial.requirements_html}
              initialJson={initial.requirements_json}
              htmlName="requirements_html"
              jsonName="requirements_json"
              ariaLabel="修業規定內容編輯區"
            />
            <p className="text-[12px]" style={{ color: "var(--muted)" }}>
              寫了內容之後，「課程資訊」頁的修業規定那一區就會出現這個學制的卡片，點進去是
              /courses/學制代稱 這一頁。留空就沒有那一頁，卡片也不會出現。
              表格可以直接用工具列插入；工具列以外的格式（例如底線、顏色）儲存時會被移除。
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-[13px] font-medium" style={{ color: "var(--ink)" }}>
              修業規定 Degree requirements (English)
            </span>
            <Editor
              initialHtml={initial.requirements_html_en}
              initialJson={initial.requirements_json_en}
              htmlName="requirements_html_en"
              jsonName="requirements_json_en"
              ariaLabel="修業規定英文內容編輯區"
              lang="en"
            />
            <p className="text-[12px]" style={{ color: "var(--muted)" }}>
              留空的話，英文版會顯示上面的中文原文，並在標題下方加一行英文說明告訴讀者這是系上公告的官方版本。
              修業規定是規範性文字，翻錯一個學分數或科目代碼比不翻更麻煩，所以留空是可以接受的做法。動過又全部刪光也算留空。
            </p>
          </div>
        </>
      )}
    </FormShell>
  );
}
