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
  /** Empty string stands in for a null column (＝共通). */
  program: string;
  label: string;
  /** Empty string stands in for a null column, so the input stays uncontrolled. */
  label_en: string;
  url: string;
  sort_order: number;
};

export function LinkForm({
  action,
  initial,
  submitLabel,
  programs,
}: {
  action: (prev: ActionState, form: FormData) => Promise<ActionState>;
  initial: LinkFormValues;
  submitLabel: string;
  /** 學制的中文名稱，順序同 /admin/programs。用來填「學制」那個下拉。 */
  programs: string[];
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

          <Field
            htmlFor="label_en"
            label="卡片文字 Card label (English)"
            error={state.fieldErrors?.label_en}
            hint="留空的話，英文版網頁會直接顯示上面的中文，所以不必一次全部翻完。"
          >
            <Input
              id="label_en"
              name="label_en"
              defaultValue={initial.label_en}
              maxLength={200}
              lang="en"
              aria-invalid={Boolean(state.fieldErrors?.label_en)}
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
            htmlFor="program"
            label="學制（只有招生資訊會用到）"
            error={state.fieldErrors?.program}
            hint="留空＝共通，四個學制都看得到。選了學制的卡片只會在「招生資訊」頁的「全部」與該學制底下出現。想讓招生簡章分學制，就建四筆、各自標一個學制、各自填自己的網址。其他區塊（學生專區、課程資訊、系友專區）的卡片不分學制，請留空。"
          >
            <Select
              id="program"
              name="program"
              defaultValue={initial.program}
              aria-invalid={Boolean(state.fieldErrors?.program)}
            >
              <option value="">共通（不分學制）</option>
              {programs.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
              {/* 目前的值不在清單裡（學制改名或打錯字）時，仍然要選得到，
                  否則一存檔就會被清成共通。 */}
              {initial.program && !programs.includes(initial.program) && (
                <option value={initial.program}>
                  {initial.program}（已不在學制清單中）
                </option>
              )}
            </Select>
          </Field>

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
