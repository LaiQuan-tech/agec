import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "danger" | "ghost";
type Size = "sm" | "md";

const BASE =
  "inline-flex items-center justify-center gap-1.5 font-medium rounded-md " +
  "transition-colors disabled:opacity-50 disabled:cursor-not-allowed " +
  "focus-visible:outline-2 focus-visible:outline-offset-2";

const SIZES: Record<Size, string> = {
  sm: "text-[13px] px-2.5 py-1.5",
  md: "text-[14px] px-4 py-2",
};

const VARIANTS: Record<Variant, string> = {
  primary: "text-[var(--gold-ink)] hover:brightness-95",
  secondary: "bg-white border hover:bg-neutral-50",
  danger: "text-white bg-red-600 hover:bg-red-700",
  ghost: "hover:bg-neutral-100",
};

// Brand tokens live in CSS variables, which Tailwind arbitrary values can't
// always reach cleanly, so the branded surfaces are set inline.
const VARIANT_STYLES: Record<Variant, React.CSSProperties> = {
  primary: { background: "var(--brand-gold)" },
  secondary: { borderColor: "var(--hairline)", color: "var(--ink)" },
  danger: {},
  ghost: { color: "var(--ink-soft)" },
};

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
};

export function Button({
  variant = "secondary",
  size = "md",
  className,
  style,
  ...rest
}: Props) {
  return (
    <button
      {...rest}
      className={cn(BASE, SIZES[size], VARIANTS[variant], className)}
      style={{ ...VARIANT_STYLES[variant], ...style }}
    />
  );
}
