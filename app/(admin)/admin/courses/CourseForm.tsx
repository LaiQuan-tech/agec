"use client";

import Link from "next/link";
import type { ActionState } from "@/lib/admin/action-result";
import { FormShell } from "@/components/admin/ui/FormShell";
import { Field } from "@/components/admin/ui/Field";
import { Input } from "@/components/admin/ui/Input";
import { COURSE_TYPES } from "./constants";
import { ChoiceField } from "@/components/admin/ui/ChoiceField";

export type CourseFormValues = {
  id?: number;
  code: string;
  name: string;
  /** Empty string stands in for a null column, so the inputs stay uncontrolled. */
  name_en: string;
  credit: number;
  ctype: string;
  ctype_en: string;
  /**
   * Chinese only, and there is deliberately no `program_en` twin — see the
   * hint on the 學制 field below and the comment in constants.ts.
   */
  program: string;
};

export function CourseForm({
  action,
  initial,
  submitLabel,
  programs,
}: {
  action: (prev: ActionState, form: FormData) => Promise<ActionState>;
  initial: CourseFormValues;
  submitLabel: string;
  /** 「招生學制」頁面上實際存在的學制名稱（中文），依 sort_order。 */
  programs: readonly string[];
}) {
  return (
    <FormShell
      action={action}
      submitLabel={submitLabel}
      secondary={
        <Link href="/admin/courses" className="text-[13px] underline underline-offset-2" style={{ color: "var(--muted)" }}>
          取消，回到列表
        </Link>
      }
    >
      {(state: ActionState) => (
        <>
          {initial.id != null && <input type="hidden" name="id" value={initial.id} />}

          <Field htmlFor="name" label="課程名稱" required error={state.fieldErrors?.name}>
            <Input
              id="name"
              name="name"
              defaultValue={initial.name}
              required
              maxLength={200}
              aria-invalid={Boolean(state.fieldErrors?.name)}
            />
          </Field>

          <Field
            htmlFor="name_en"
            label="課程名稱 Course title (English)"
            error={state.fieldErrors?.name_en}
            hint="留空的話，英文版網頁會直接顯示上面的中文，所以不必一次全部翻完。"
          >
            <Input
              id="name_en"
              name="name_en"
              defaultValue={initial.name_en}
              maxLength={300}
              lang="en"
              aria-invalid={Boolean(state.fieldErrors?.name_en)}
            />
          </Field>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field
              htmlFor="code"
              label="課號"
              required
              error={state.fieldErrors?.code}
              hint="同一學制內的課程依課號由小到大排序"
            >
              <Input
                id="code"
                name="code"
                defaultValue={initial.code}
                required
                maxLength={30}
                aria-invalid={Boolean(state.fieldErrors?.code)}
              />
            </Field>

            <Field
              htmlFor="program"
              label="學制"
              required
              error={state.fieldErrors?.program}
              hint="前台的課程分頁依這個欄位分。選項就是「招生學制」那一頁的學制，要新增請先到那裡建立。這一欄固定填中文，英文版顯示的名稱是到那一頁的「英文名稱」去取的。"
            >
              {/*
                🔴 選項來自 `programs` 資料表，不是寫死的清單。
                這一欄與 `programs.name` 做**文字比對**（Courses.tsx 的
                programRank 與分頁籤都靠它），寫死一份就會與系辦在「招生學制」
                頁面實際維護的資料漂移 —— 而漂移的表現是「這門課排到最後面、
                而且不屬於任何一個分頁籤」，沒有任何錯誤訊息。
              */}
              <ChoiceField
                id="program"
                name="program"
                options={programs}
                defaultValue={initial.program}
                allowOther
                required
                ariaInvalid={Boolean(state.fieldErrors?.program)}
              />
            </Field>

            <Field
              htmlFor="credit"
              label="學分"
              required
              error={state.fieldErrors?.credit}
              hint="可填 0 到 20，允許 0.5 學分"
            >
              <Input
                id="credit"
                name="credit"
                type="number"
                inputMode="decimal"
                step="0.5"
                min={0}
                max={20}
                defaultValue={initial.credit}
                required
                aria-invalid={Boolean(state.fieldErrors?.credit)}
              />
            </Field>

            <Field
              htmlFor="ctype"
              label="類型"
              required
              error={state.fieldErrors?.ctype}
              hint="必修或選修。這一欄只是顯示在課表上，不影響分類或排序。"
            >
              {/* 留「其他」是因為它純顯示：填「群修」之類的值只會照樣印在課表
                  的那一格，不會讓課程從任何地方消失。 */}
              <ChoiceField
                id="ctype"
                name="ctype"
                options={COURSE_TYPES}
                defaultValue={initial.ctype}
                allowOther
                required
                ariaInvalid={Boolean(state.fieldErrors?.ctype)}
              />
            </Field>
          </div>

          {/* Outside the 2×2 grid: as a fifth cell it would flow under 學分,
              not under the 類型 it translates. 學制 has no English twin here on
              purpose — courses.program is a text foreign key into programs.name
              and the English display name is read from programs.name_en. */}
          <Field
            htmlFor="ctype_en"
            label="類型 Course type (English)"
            error={state.fieldErrors?.ctype_en}
            hint="留空的話，英文版網頁會直接顯示中文（必修／選修）。同一個中文類型請固定用同一種英文寫法。"
          >
            <Input
              id="ctype_en"
              name="ctype_en"
              defaultValue={initial.ctype_en}
              maxLength={40}
              lang="en"
              aria-invalid={Boolean(state.fieldErrors?.ctype_en)}
            />
          </Field>
        </>
      )}
    </FormShell>
  );
}
