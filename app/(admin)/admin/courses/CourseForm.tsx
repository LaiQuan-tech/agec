"use client";

import Link from "next/link";
import type { ActionState } from "@/lib/admin/action-result";
import { FormShell } from "@/components/admin/ui/FormShell";
import { Field } from "@/components/admin/ui/Field";
import { Input } from "@/components/admin/ui/Input";
import { COURSE_PROGRAMS, COURSE_TYPES } from "./constants";

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
}: {
  action: (prev: ActionState, form: FormData) => Promise<ActionState>;
  initial: CourseFormValues;
  submitLabel: string;
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
              hint="前台的課程分頁就是依這個欄位分的，名稱請與現有課程一致。這一欄固定填中文，英文版頁面顯示的學制名稱是到「招生學制」那一頁的「英文名稱」去取的。"
            >
              <Input
                id="program"
                name="program"
                list="course-programs"
                defaultValue={initial.program}
                required
                maxLength={30}
                aria-invalid={Boolean(state.fieldErrors?.program)}
              />
              <datalist id="course-programs">
                {COURSE_PROGRAMS.map((p) => (
                  <option key={p} value={p} />
                ))}
              </datalist>
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
              hint="可從清單選，也可以直接打新的類型"
            >
              <Input
                id="ctype"
                name="ctype"
                list="course-types"
                defaultValue={initial.ctype}
                required
                maxLength={20}
                aria-invalid={Boolean(state.fieldErrors?.ctype)}
              />
              <datalist id="course-types">
                {COURSE_TYPES.map((t) => (
                  <option key={t} value={t} />
                ))}
              </datalist>
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
