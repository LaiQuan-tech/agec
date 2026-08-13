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
  credit: number;
  ctype: string;
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
              hint="前台的課程分頁就是依這個欄位分的，名稱請與現有課程一致"
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
        </>
      )}
    </FormShell>
  );
}
