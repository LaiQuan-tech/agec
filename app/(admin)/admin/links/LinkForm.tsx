"use client";

import Link from "next/link";
import type { ActionState } from "@/lib/admin/action-result";
import { FormShell } from "@/components/admin/ui/FormShell";
import { Field } from "@/components/admin/ui/Field";
import { Input, Select } from "@/components/admin/ui/Input";
import { LINK_SECTIONS, sectionLabel } from "./constants";

export type LinkFormValues = {
  id?: number;
  /** Empty when editing a row whose section is retired and has no option. */
  section: string;
  label: string;
  url: string;
  sort_order: number;
};

export function LinkForm({
  action,
  initial,
  submitLabel,
}: {
  action: (prev: ActionState, form: FormData) => Promise<ActionState>;
  initial: LinkFormValues;
  submitLabel: string;
}) {
  return (
    <FormShell
      action={action}
      submitLabel={submitLabel}
      secondary={
        <Link href="/admin/links" className="text-[13px] underline underline-offset-2" style={{ color: "var(--muted)" }}>
          取消，回到列表
        </Link>
      }
    >
      {(state: ActionState) => (
        <>
          {initial.id != null && <input type="hidden" name="id" value={initial.id} />}

          <Field htmlFor="label" label="卡片文字" required error={state.fieldErrors?.label}>
            <Input
              id="label"
              name="label"
              defaultValue={initial.label}
              required
              maxLength={100}
              aria-invalid={Boolean(state.fieldErrors?.label)}
            />
          </Field>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field
              htmlFor="section"
              label="區塊"
              required
              error={state.fieldErrors?.section}
              hint="決定這張卡片出現在「學生專區」還是「系友專區」頁面"
            >
              <Select
                id="section"
                name="section"
                defaultValue={initial.section}
                required
                aria-invalid={Boolean(state.fieldErrors?.section)}
              >
                {/* Only reachable on a retired row; it can't be chosen. */}
                <option value="" disabled>
                  請選擇區塊
                </option>
                {LINK_SECTIONS.map((s) => (
                  <option key={s} value={s}>
                    {sectionLabel(s)}
                  </option>
                ))}
              </Select>
            </Field>

            <Field
              htmlFor="sort_order"
              label="排序"
              error={state.fieldErrors?.sort_order}
              hint="數字小的排在前面，留空視為 0"
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
            htmlFor="url"
            label="連結網址"
            error={state.fieldErrors?.url}
            hint="留空的卡片仍然看得到，但點下去不會前往任何頁面，所以請盡量填上網址"
          >
            <Input
              id="url"
              name="url"
              defaultValue={initial.url}
              maxLength={500}
              placeholder="https://…"
              aria-invalid={Boolean(state.fieldErrors?.url)}
            />
          </Field>
        </>
      )}
    </FormShell>
  );
}
