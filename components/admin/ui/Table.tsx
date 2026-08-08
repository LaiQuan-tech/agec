import type { ReactNode, ThHTMLAttributes, TdHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

/**
 * Thin wrappers, not a data-grid. Admin lists are tens of rows, so sorting and
 * pagination live in the SQL query rather than in the client.
 *
 * The outer scroll container matters: course and faculty tables have enough
 * columns to overflow a phone, and without it the whole page would scroll
 * sideways.
 */
export function Table({ children }: { children: ReactNode }) {
  return (
    <div
      className="overflow-x-auto rounded-lg border bg-white"
      style={{ borderColor: "var(--hairline)" }}
    >
      <table className="w-full min-w-[560px] border-collapse text-[14px]">{children}</table>
    </div>
  );
}

export function THead({ children }: { children: ReactNode }) {
  return (
    <thead>
      <tr style={{ borderBottom: "1px solid var(--hairline)" }}>{children}</tr>
    </thead>
  );
}

export function TBody({ children }: { children: ReactNode }) {
  return <tbody>{children}</tbody>;
}

export function TR({ children }: { children: ReactNode }) {
  return (
    <tr className="hover:bg-neutral-50" style={{ borderBottom: "1px solid var(--hairline)" }}>
      {children}
    </tr>
  );
}

export function TH({ className, children, ...rest }: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      {...rest}
      className={cn("px-3 py-2.5 text-left text-[12px] font-semibold whitespace-nowrap", className)}
      style={{ color: "var(--muted)" }}
    >
      {children}
    </th>
  );
}

export function TD({ className, children, ...rest }: TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td {...rest} className={cn("px-3 py-2.5 align-middle", className)} style={{ color: "var(--ink)" }}>
      {children}
    </td>
  );
}

export function EmptyState({ message, action }: { message: string; action?: ReactNode }) {
  return (
    <div
      className="rounded-lg border bg-white px-6 py-14 text-center"
      style={{ borderColor: "var(--hairline)" }}
    >
      <p className="text-[14px]" style={{ color: "var(--muted)" }}>
        {message}
      </p>
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}
