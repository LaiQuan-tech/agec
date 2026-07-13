import type { Program } from "@/lib/data";
import { ModernShell } from "./Shell";

/**
 * Placeholder for 招生資訊 (/admissions) — 風格B現代簡潔.
 * Real build: eyebrow + heading → 5 rounded program cards → "重要時程" list.
 */
export function ModernAdmissions({ programs }: { programs: Program[] }) {
  return (
    <ModernShell>
      <div className="page-in mx-auto max-w-5xl px-6 py-16">
        <p className="eyebrow">風格 B・現代簡潔</p>
        <h1 className="heading-font mt-3 text-3xl">招生資訊</h1>
        <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>
          Placeholder — 由 modern 主題 agent 依 README 規格重建
          （components/modern/Admissions.tsx）
        </p>
        <pre
          className="surface-card mt-8 overflow-x-auto p-4 text-xs leading-relaxed"
        >
          {JSON.stringify({ programs }, null, 2)}
        </pre>
      </div>
    </ModernShell>
  );
}
