"use client";

import Link from "next/link";
import type { ActionState } from "@/lib/admin/action-result";
import { FormShell } from "@/components/admin/ui/FormShell";
import { Field } from "@/components/admin/ui/Field";
import { Input } from "@/components/admin/ui/Input";

export type CapabilityFormValues = {
  id?: number;
  label: string;
  /** Empty string stands in for a null column, so the input stays uncontrolled. */
  label_en: string;
  sort_order: number;
};

export function CapabilityForm({
  action,
  initial,
  submitLabel,
}: {
  action: (prev: ActionState, form: FormData) => Promise<ActionState>;
  initial: CapabilityFormValues;
  submitLabel: string;
}) {
  return (
    <FormShell
      action={action}
      submitLabel={submitLabel}
      secondary={
        <Link
          href="/admin/capabilities"
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
            label="標籤文字"
            required
            error={state.fieldErrors?.label}
            hint="顯示在膠囊裡的中文，例如「資料科學」。建議 6 個字以內。"
          >
            <Input
              id="label"
              name="label"
              defaultValue={initial.label}
              required
              maxLength={30}
              aria-invalid={Boolean(state.fieldErrors?.label)}
            />
          </Field>

          <Field
            htmlFor="label_en"
            label="標籤文字 Label (English)"
            error={state.fieldErrors?.label_en}
            hint="留空的話，英文版網頁會直接顯示上面的中文，所以不必一次全部翻完。"
          >
            <Input
              id="label_en"
              name="label_en"
              defaultValue={initial.label_en}
              maxLength={60}
              lang="en"
              aria-invalid={Boolean(state.fieldErrors?.label_en)}
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
