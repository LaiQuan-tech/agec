import type { LinkItem } from "@/lib/data";
import { ModernShell } from "./Shell";

/**
 * Placeholder for 系友專區 (/alumni) — 風格B現代簡潔.
 * Real build: banner → left-image/right-text intro → 3×2 rounded link cards.
 */
export function ModernAlumni({ links }: { links: LinkItem[] }) {
  return (
    <ModernShell>
      <div className="page-in mx-auto max-w-5xl px-6 py-16">
        <p className="eyebrow">風格 B・現代簡潔</p>
        <h1 className="heading-font mt-3 text-3xl">系友專區</h1>
        <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>
          Placeholder — 由 modern 主題 agent 依 README 規格重建
          （components/modern/Alumni.tsx）
        </p>
        <pre
          className="surface-card mt-8 overflow-x-auto p-4 text-xs leading-relaxed"
        >
          {JSON.stringify({ links }, null, 2)}
        </pre>
      </div>
    </ModernShell>
  );
}
