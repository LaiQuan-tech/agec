import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

const CONTROL =
  "w-full rounded-md border bg-white px-3 py-2 text-[14px] " +
  "focus:outline-2 focus:outline-offset-0 disabled:bg-neutral-100 " +
  "aria-[invalid=true]:border-red-500";

const CONTROL_STYLE: React.CSSProperties = {
  borderColor: "var(--hairline)",
  color: "var(--ink)",
};

export function Input({ className, style, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...rest}
      className={cn(CONTROL, className)}
      style={{ ...CONTROL_STYLE, ...style }}
    />
  );
}

export function Textarea({
  className,
  style,
  rows = 4,
  ...rest
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...rest}
      rows={rows}
      className={cn(CONTROL, "resize-y", className)}
      style={{ ...CONTROL_STYLE, ...style }}
    />
  );
}

export function Select({
  className,
  style,
  children,
  ...rest
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...rest}
      className={cn(CONTROL, "pr-8", className)}
      style={{ ...CONTROL_STYLE, ...style }}
    >
      {children}
    </select>
  );
}

export function Checkbox({
  label,
  className,
  id,
  ...rest
}: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label
      htmlFor={id}
      className={cn("inline-flex items-center gap-2 text-[14px] cursor-pointer", className)}
      style={{ color: "var(--ink)" }}
    >
      <input
        {...rest}
        id={id}
        type="checkbox"
        className="size-4 rounded border-neutral-400"
        style={{ accentColor: "var(--brand-green)" }}
      />
      {label}
    </label>
  );
}
