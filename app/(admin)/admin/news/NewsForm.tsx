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
  title: string;
  cover_url: string;
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

          <Field
            htmlFor="cover_url"
            label="縮圖網址"
            error={state.fieldErrors?.cover_url}
            hint="首頁「最新消息」卡片的縮圖。留空會用預設圖片；內頁的消息列表不顯示縮圖。"
          >
            <Input
              id="cover_url"
              name="cover_url"
              type="url"
              defaultValue={initial.cover_url}
              maxLength={500}
              placeholder="https://…"
              aria-invalid={Boolean(state.fieldErrors?.cover_url)}
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
