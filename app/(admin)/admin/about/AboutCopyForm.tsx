"use client";

import Link from "next/link";
import type { ActionState } from "@/lib/admin/action-result";
import { FormShell } from "@/components/admin/ui/FormShell";
import { Field } from "@/components/admin/ui/Field";
import { Input, Textarea } from "@/components/admin/ui/Input";
import { ABOUT_COPY_FIELDS, type CopyField } from "@/lib/page-copy/about";
import { ABOUT_COPY_GROUPS } from "./constants";

/**
 * 本系簡介的文案：一張表單、五組 fieldset（頁首 + 四個區塊）、42 個格位。
 * 與 students/StudentsCopyForm.tsx 同一套。
 *
 * 每個格位是「中文＋英文」一對，並排成兩欄；語言中立的格位（年份、徽章字，
 * `kind: "neutral"`）只有一個輸入框。欄位名是 `<name>.zh` / `<name>.en`，與
 * actions.ts 的 parse 對齊；`initial` 的 key 也是同一組字串（page.tsx 用 DB 值
 * 填、缺的用字典補）。
 *
 * 沒有「新增」「刪除」按鈕：格數是版面寫死的（見 lib/page-copy/about.ts）。
 */
export type AboutCopyValues = Record<string, { zh: string; en: string }>;

function Control({
  field,
  lang,
  value,
  invalid,
}: {
  field: CopyField;
  lang: "zh" | "en";
  value: string;
  invalid: boolean;
}) {
  const id = `${field.name}.${lang}`;
  if (field.kind === "textarea") {
    return (
      <Textarea
        id={id}
        name={id}
        defaultValue={value}
        rows={2}
        maxLength={lang === "zh" ? field.max : field.max * 2}
        required={lang === "zh"}
        lang={lang === "en" ? "en" : undefined}
        aria-invalid={invalid}
      />
    );
  }
  return (
    <Input
      id={id}
      name={id}
      type="text"
      defaultValue={value}
      maxLength={lang === "zh" ? field.max : field.max * 2}
      required={lang === "zh"}
      lang={lang === "en" ? "en" : undefined}
      aria-invalid={invalid}
    />
  );
}

export function AboutCopyForm({
  action,
  initial,
}: {
  action: (prev: ActionState, form: FormData) => Promise<ActionState>;
  initial: AboutCopyValues;
}) {
  return (
    <FormShell
      action={action}
      submitLabel="儲存全部"
      secondary={
        <Link
          href="/about"
          target="_blank"
          className="text-[13px] underline underline-offset-2"
          style={{ color: "var(--muted)" }}
        >
          在前台查看 ↗︎
        </Link>
      }
    >
      {(state: ActionState) => (
        <>
          {ABOUT_COPY_GROUPS.map((group) => (
            <fieldset
              key={group.key}
              className="flex flex-col gap-5 rounded-lg border bg-white p-5"
              style={{ borderColor: "var(--hairline)" }}
            >
              <legend className="px-1 text-[15px] font-bold" style={{ color: "var(--brand-green)" }}>
                {group.title}
                <Link
                  href={`/about${group.anchor}`}
                  target="_blank"
                  className="ml-2 text-[12px] font-normal underline underline-offset-2"
                  style={{ color: "var(--muted)" }}
                >
                  前台 ↗︎
                </Link>
              </legend>
              <p className="-mt-2 text-[13px]" style={{ color: "var(--muted)" }}>
                {group.description}
              </p>

              {ABOUT_COPY_FIELDS.filter((f) => f.group === group.key).map((field) => {
                const value = initial[field.name] ?? { zh: "", en: "" };
                if (!field.bilingual) {
                  // 語言中立：一個輸入框，中英文站印同一個字。
                  const id = `${field.name}.zh`;
                  return (
                    <div key={field.name} className="grid gap-4 sm:grid-cols-2">
                      <Field
                        htmlFor={id}
                        label={field.label}
                        required
                        error={state.fieldErrors?.[id]}
                        hint="不分語言，中文版與英文版印同一個字。"
                      >
                        <Control field={field} lang="zh" value={value.zh} invalid={Boolean(state.fieldErrors?.[id])} />
                      </Field>
                    </div>
                  );
                }
                const zhId = `${field.name}.zh`;
                const enId = `${field.name}.en`;
                return (
                  <div key={field.name} className="grid gap-4 sm:grid-cols-2">
                    <Field htmlFor={zhId} label={field.label} required error={state.fieldErrors?.[zhId]}>
                      <Control field={field} lang="zh" value={value.zh} invalid={Boolean(state.fieldErrors?.[zhId])} />
                    </Field>
                    <Field
                      htmlFor={enId}
                      label={`${field.label} (English)`}
                      error={state.fieldErrors?.[enId]}
                      hint="留空的話英文版顯示中文。"
                    >
                      <Control field={field} lang="en" value={value.en} invalid={Boolean(state.fieldErrors?.[enId])} />
                    </Field>
                  </div>
                );
              })}
            </fieldset>
          ))}
        </>
      )}
    </FormShell>
  );
}
