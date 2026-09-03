"use client";

import Link from "next/link";
import type { ActionState } from "@/lib/admin/action-result";
import { FormShell } from "@/components/admin/ui/FormShell";
import { Field } from "@/components/admin/ui/Field";
import { Input, Textarea } from "@/components/admin/ui/Input";
import { FACULTY_CATEGORIES } from "./constants";
import { ChoiceField } from "@/components/admin/ui/ChoiceField";

export type FacultyFormValues = {
  id?: number;
  name: string;
  /** Empty string stands in for a null column, so the inputs stay uncontrolled. */
  name_en: string;
  title: string;
  title_en: string;
  category: string;
  fields: string;
  fields_en: string;
  /**
   * Read-only here. `experience` has never had a Chinese input on this form,
   * but it is rendered on the 名譽教授 / 退休師資 cards and the 2026 seed filled
   * it in for 11 people — so it is shown as reference text above the English
   * box, which would otherwise be a translation field with nothing on screen to
   * translate from. Empty for everyone else, and then the whole block is hidden.
   */
  experience: string;
  experience_en: string;
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

          {/* A second two-column row mirroring the one above, so 英文姓名 sits
              under 姓名 and 英文職稱 under 職稱 at desktop width. */}
          <div className="grid gap-5 sm:grid-cols-2">
            <Field
              htmlFor="name_en"
              label="姓名 Name (English)"
              error={state.fieldErrors?.name_en}
              // Unlike every other English field on the site this one is not a
              // fallback — it is an extra line beside the Chinese name, shown in
              // both language versions. Saying "留空會顯示中文" here would be wrong.
              hint="客座教師、名譽教授、退休師資的卡片會在中文姓名下面多印一行英文姓名，中英文版都看得到；其他分類不會顯示這一行。"
            >
              <Input
                id="name_en"
                name="name_en"
                defaultValue={initial.name_en}
                maxLength={100}
                lang="en"
                aria-invalid={Boolean(state.fieldErrors?.name_en)}
              />
            </Field>

            <Field
              htmlFor="title_en"
              label="職稱 Title (English)"
              error={state.fieldErrors?.title_en}
              hint="留空的話，英文版網頁會直接顯示中文職稱，所以不必一次全部翻完。"
            >
              <Input
                id="title_en"
                name="title_en"
                defaultValue={initial.title_en}
                maxLength={100}
                lang="en"
                aria-invalid={Boolean(state.fieldErrors?.title_en)}
              />
            </Field>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field
              htmlFor="category"
              label="分類"
              required
              error={state.fieldErrors?.category}
              hint="前台的篩選按鈕依這個欄位產生。清單裡這七個各自對應 /faculty 的一個區塊；填別的值會顯示在「專任師資」那一區的卡片裡。"
            >
              {/*
                這裡留了「其他」，與消息分類不同：清單外的值在 /faculty 會落到
                §1 的標準卡（Faculty.tsx 的 `standard` 是「不屬於那四個特殊分類」
                的補集），也就是會顯示、只是不在專屬區塊。消息分類則是完全沒有
                去處，所以那邊是封閉的。
              */}
              <ChoiceField
                id="category"
                name="category"
                options={FACULTY_CATEGORIES}
                defaultValue={initial.category}
                allowOther
                required
                ariaInvalid={Boolean(state.fieldErrors?.category)}
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
            htmlFor="fields_en"
            label="研究領域 Research fields (English)"
            error={state.fieldErrors?.fields_en}
            hint="留空的話，英文版網頁會直接顯示上面的中文。多個領域請用逗號分隔。"
          >
            <Input
              id="fields_en"
              name="fields_en"
              defaultValue={initial.fields_en}
              maxLength={400}
              lang="en"
              aria-invalid={Boolean(state.fieldErrors?.fields_en)}
            />
          </Field>

          {/* Only rendered when this person actually has a 經歷 to translate.
              The Chinese side is reference text, not an input: it is filled from
              the 2026 seed and this form has never offered a way to edit it.
              Showing an empty English box with no Chinese beside it would be a
              translation field pointing at nothing. */}
          {initial.experience ? (
            <Field
              htmlFor="experience_en"
              label="經歷 Experience (English)"
              error={state.fieldErrors?.experience_en}
              hint="留空的話，英文版網頁會直接顯示上面的中文經歷。中文經歷目前無法在後台修改，需要改請告知維護人員。"
            >
              <p
                className="rounded-md border px-3 py-2 text-[13px] leading-relaxed"
                style={{
                  borderColor: "var(--hairline)",
                  background: "var(--hairline)",
                  color: "var(--ink-soft)",
                }}
              >
                <span className="font-medium">目前的中文經歷：</span>
                {initial.experience}
              </p>
              <Textarea
                id="experience_en"
                name="experience_en"
                defaultValue={initial.experience_en}
                rows={3}
                maxLength={500}
                lang="en"
                aria-invalid={Boolean(state.fieldErrors?.experience_en)}
              />
            </Field>
          ) : (
            // parse() reads every column out of the submitted form, so a field
            // that isn't on the page submits nothing and is written back as
            // null. Without this the act of opening and saving a person with no
            // 經歷 would quietly wipe an experience_en set directly in the
            // database. Carrying the current value keeps saving a no-op.
            <input type="hidden" name="experience_en" value={initial.experience_en} />
          )}

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
