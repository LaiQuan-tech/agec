"use client";

import Link from "next/link";
import type { ActionState } from "@/lib/admin/action-result";
import { FormShell } from "@/components/admin/ui/FormShell";
import { Field } from "@/components/admin/ui/Field";
import { Input, Textarea } from "@/components/admin/ui/Input";

export type ProgramFormValues = {
  id?: number;
  name: string;
  /** Empty string stands in for a null column, so the inputs stay uncontrolled. */
  name_en: string;
  description: string;
  sort_order: number;
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
            <Field
              htmlFor="name_en"
              label="英文名稱"
              error={state.fieldErrors?.name_en}
              hint="留空就不會顯示英文那一行"
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
        </>
      )}
    </FormShell>
  );
}
