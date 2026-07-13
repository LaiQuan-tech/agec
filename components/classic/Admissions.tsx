import type { Program } from "@/lib/data";
import { ClassicShell } from "./Shell";

/**
 * Placeholder for 招生資訊 (/admissions) — 風格A經典學院派.
 * Real build: banner → 5 program cards (circular icon + Chinese/English name
 * + description) → "重要時程" list (9月/11月/2–3月/5月).
 */
export function ClassicAdmissions({ programs }: { programs: Program[] }) {
  return (
    <ClassicShell>
      <div className="page-in mx-auto max-w-5xl px-6 py-16">
        <p className="eyebrow">風格 A・經典學院派</p>
        <h1 className="heading-font mt-3 text-3xl">招生資訊</h1>
        <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>
          Placeholder — 由 classic 主題 agent 依 README 規格重建
          （components/classic/Admissions.tsx）
        </p>
        <pre
          className="surface-card mt-8 overflow-x-auto p-4 text-xs leading-relaxed"
        >
          {JSON.stringify({ programs }, null, 2)}
        </pre>
      </div>
    </ClassicShell>
  );
}
