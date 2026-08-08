import type { ReactNode } from "react";

type Props = {
  /** Must match the id of the control inside, so the label actually targets it. */
  htmlFor: string;
  label: string;
  required?: boolean;
  /** Shown under the control in red; also drives aria-describedby on the caller side. */
  error?: string;
  /** Shown under the control in grey when there's no error. */
  hint?: ReactNode;
  children: ReactNode;
};

/**
 * The single wrapper every admin form control goes through, so label placement,
 * the required marker, and error styling can't drift between forms.
 */
export function Field({ htmlFor, label, required, error, hint, children }: Props) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={htmlFor}
        className="text-[13px] font-medium"
        style={{ color: "var(--ink)" }}
      >
        {label}
        {required && (
          <span className="ml-1 text-red-600" aria-hidden="true">
            *
          </span>
        )}
      </label>

      {children}

      {error ? (
        <p id={`${htmlFor}-error`} className="text-[12px] text-red-600">
          {error}
        </p>
      ) : hint ? (
        <p id={`${htmlFor}-hint`} className="text-[12px]" style={{ color: "var(--muted)" }}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}
