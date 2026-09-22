"use client";

import Link from "next/link";
import type { ActionState } from "@/lib/admin/action-result";
import { FormShell } from "@/components/admin/ui/FormShell";
import { Field } from "@/components/admin/ui/Field";
import { Input, Textarea } from "@/components/admin/ui/Input";
import { GIVING_COPY_FIELDS, type CopyField } from "@/lib/page-copy/giving";
import { GIVING_COPY_GROUPS } from "./constants";

/**
 * 匯款帳號資訊：一張表單、一組 fieldset、8 個格位。與 about/AboutCopyForm.tsx
 * 同一套，多的只有 `optional`：標了的格位不加 `required`、標籤不印星號，
 * 提示改成「可留空」。
 *
 * 每個格位是「中文＋英文」一對，並排成兩欄；語言中立的格位（銀行代碼、帳號、
 * SWIFT，`kind: "neutral"`）只有一個輸入框。欄位名是 `<name>.zh` / `<name>.en`，
 * 與 actions.ts 的 parse 對齊；`initial` 的 key 也是同一組字串（page.tsx 用 DB
 * 值填、缺的用空字串）。
 */
export type GivingCopyValues = Record<string, { zh: string; en: string }>;

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
  // 只有非 optional 的中文欄（含語言中立的那個唯一輸入框）是必填。
  const required = lang === "zh" && !field.optional;
  if (field.kind === "textarea") {
    return (
      <Textarea
        id={id}
        name={id}
        defaultValue={value}
        rows={3}
        maxLength={lang === "zh" ? field.max : field.max * 2}
        required={required}
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
      required={required}
      lang={lang === "en" ? "en" : undefined}
      aria-invalid={invalid}
      // 帳號與代碼不要被瀏覽器自動校正／補完。
      autoComplete={field.kind === "neutral" ? "off" : undefined}
    />
  );
}

export function GivingCopyForm({
  action,
  initial,
}: {
  action: (prev: ActionState, form: FormData) => Promise<ActionState>;
  initial: GivingCopyValues;
}) {
  return (
    <FormShell
      action={action}
      submitLabel="儲存全部"
      secondary={
        <Link
          href="/alumni/giving"
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
          {GIVING_COPY_GROUPS.map((group) => (
            <fieldset
              key={group.key}
              className="flex flex-col gap-5 rounded-lg border bg-white p-5"
              style={{ borderColor: "var(--hairline)" }}
            >
              <legend className="px-1 text-[15px] font-bold" style={{ color: "var(--brand-green)" }}>
                {group.title}
                <Link
                  href={`/alumni/giving${group.anchor}`}
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

              {GIVING_COPY_FIELDS.filter((f) => f.group === group.key).map((field) => {
                const value = initial[field.name] ?? { zh: "", en: "" };
                if (!field.bilingual) {
                  // 語言中立：一個輸入框，中英文站印同一個字。
                  const id = `${field.name}.zh`;
                  return (
                    <div key={field.name} className="grid gap-4 sm:grid-cols-2">
                      <Field
                        htmlFor={id}
                        label={field.label}
                        required={!field.optional}
                        error={state.fieldErrors?.[id]}
                        hint={
                          field.optional
                            ? "可留空，留空前台不印這一列。不分語言，中文版與英文版印同一個字。"
                            : "不分語言，中文版與英文版印同一個字。"
                        }
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
                    <Field
                      htmlFor={zhId}
                      label={field.label}
                      required={!field.optional}
                      error={state.fieldErrors?.[zhId]}
                      hint={field.optional ? "可留空，留空前台不印這一列。" : undefined}
                    >
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
