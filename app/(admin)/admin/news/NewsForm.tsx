"use client";

import Link from "next/link";
import type { ActionState } from "@/lib/admin/action-result";
import { FormShell } from "@/components/admin/ui/FormShell";
import { Field } from "@/components/admin/ui/Field";
import { Checkbox, Input } from "@/components/admin/ui/Input";
import { NEWS_CATEGORIES } from "./constants";

export type NewsFormValues = {
  id?: number;
  published_at: string;
  category: string;
  /** Empty string stands in for a null column, so the inputs stay uncontrolled. */
  category_en: string;
  title: string;
  title_en: string;
  is_pinned: boolean;
};

export function NewsForm({
  action,
  initial,
  submitLabel,
}: {
  action: (prev: ActionState, form: FormData) => Promise<ActionState>;
  initial: NewsFormValues;
  submitLabel: string;
}) {
  return (
    <FormShell
      action={action}
      submitLabel={submitLabel}
      secondary={
        <Link href="/admin/news" className="text-[13px] underline underline-offset-2" style={{ color: "var(--muted)" }}>
          取消，回到列表
        </Link>
      }
    >
      {(state: ActionState) => (
        <>
          {initial.id != null && <input type="hidden" name="id" value={initial.id} />}

          <Field htmlFor="title" label="標題" required error={state.fieldErrors?.title}>
            <Input
              id="title"
              name="title"
              defaultValue={initial.title}
              required
              maxLength={200}
              aria-invalid={Boolean(state.fieldErrors?.title)}
            />
          </Field>

          <Field
            htmlFor="title_en"
            label="標題 Title (English)"
            error={state.fieldErrors?.title_en}
            hint="留空的話，英文版網頁會直接顯示上面的中文，所以不必一次全部翻完。"
          >
            <Input
              id="title_en"
              name="title_en"
              defaultValue={initial.title_en}
              maxLength={300}
              lang="en"
              aria-invalid={Boolean(state.fieldErrors?.title_en)}
            />
          </Field>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field
              htmlFor="published_at"
              label="發佈日期"
              required
              error={state.fieldErrors?.published_at}
              hint="前台的消息依這個日期由新到舊排序"
            >
              <Input
                id="published_at"
                name="published_at"
                type="date"
                defaultValue={initial.published_at}
                required
                aria-invalid={Boolean(state.fieldErrors?.published_at)}
              />
            </Field>

            <Field
              htmlFor="category"
              label="分類"
              required
              error={state.fieldErrors?.category}
              hint="可從清單選，也可以直接打新的分類"
            >
              <Input
                id="category"
                name="category"
                list="news-categories"
                defaultValue={initial.category}
                required
                maxLength={20}
                aria-invalid={Boolean(state.fieldErrors?.category)}
              />
              <datalist id="news-categories">
                {NEWS_CATEGORIES.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </Field>
          </div>

          {/* Outside the two-column grid on purpose: 發佈日期 occupies the other
              half, so an English twin placed inside it would land beside the
              date rather than under the 分類 it translates. */}
          <Field
            htmlFor="category_en"
            label="分類 Category (English)"
            error={state.fieldErrors?.category_en}
            hint="留空的話，英文版網頁會直接顯示中文分類。同一個中文分類請固定用同一種英文寫法。"
          >
            <Input
              id="category_en"
              name="category_en"
              defaultValue={initial.category_en}
              maxLength={40}
              lang="en"
              aria-invalid={Boolean(state.fieldErrors?.category_en)}
            />
          </Field>

          <Field
            htmlFor="is_pinned"
            label="置頂"
            hint="置頂的消息會排在最前面，並在前台顯示「置頂」標記"
          >
            <Checkbox
              id="is_pinned"
              name="is_pinned"
              defaultChecked={initial.is_pinned}
              label="固定在列表最上方"
            />
          </Field>
        </>
      )}
    </FormShell>
  );
}
