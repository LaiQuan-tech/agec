"use client";

import Link from "next/link";
import type { ActionState } from "@/lib/admin/action-result";
import { FormShell } from "@/components/admin/ui/FormShell";
import { Field } from "@/components/admin/ui/Field";
import { Input } from "@/components/admin/ui/Input";
import { FACULTY_CATEGORIES } from "./constants";

export type FacultyFormValues = {
  id?: number;
  name: string;
  title: string;
  category: string;
  fields: string;
  photo_url: string;
  sort_order: number;
};

export function FacultyForm({
  action,
  initial,
  submitLabel,
}: {
  action: (prev: ActionState, form: FormData) => Promise<ActionState>;
  initial: FacultyFormValues;
  submitLabel: string;
}) {
  return (
    <FormShell
      action={action}
      submitLabel={submitLabel}
      secondary={
        <Link
          href="/admin/faculty"
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

          <div className="grid gap-5 sm:grid-cols-2">
            <Field htmlFor="name" label="姓名" required error={state.fieldErrors?.name}>
              <Input
                id="name"
                name="name"
                defaultValue={initial.name}
                required
                maxLength={50}
                aria-invalid={Boolean(state.fieldErrors?.name)}
              />
            </Field>

            <Field
              htmlFor="title"
              label="職稱"
              required
              error={state.fieldErrors?.title}
              hint="例如：教授、副教授、助理教授"
            >
              <Input
                id="title"
                name="title"
                defaultValue={initial.title}
                required
                maxLength={50}
                aria-invalid={Boolean(state.fieldErrors?.title)}
              />
            </Field>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field
              htmlFor="category"
              label="分類"
              required
              error={state.fieldErrors?.category}
              hint="可從清單選，也可以直接打新的分類；前台的篩選按鈕依這個欄位產生"
            >
              <Input
                id="category"
                name="category"
                list="faculty-categories"
                defaultValue={initial.category}
                required
                maxLength={20}
                aria-invalid={Boolean(state.fieldErrors?.category)}
              />
              <datalist id="faculty-categories">
                {FACULTY_CATEGORIES.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
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
          </div>

          <Field
            htmlFor="fields"
            label="研究領域"
            error={state.fieldErrors?.fields}
            hint="顯示在姓名與職稱下方，多個領域請用頓號分隔"
          >
            <Input
              id="fields"
              name="fields"
              defaultValue={initial.fields}
              maxLength={200}
              aria-invalid={Boolean(state.fieldErrors?.fields)}
            />
          </Field>

          <Field
            htmlFor="photo_url"
            label="照片網址"
            error={state.fieldErrors?.photo_url}
            hint="完整網址，可貼 Supabase Storage 的公開連結或外部網址；留空會顯示預設人像"
          >
            <Input
              id="photo_url"
              name="photo_url"
              defaultValue={initial.photo_url}
              maxLength={500}
              aria-invalid={Boolean(state.fieldErrors?.photo_url)}
            />
          </Field>
        </>
      )}
    </FormShell>
  );
}
