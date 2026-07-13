import type { Faculty } from "@/lib/data";
import { ClassicShell } from "./Shell";

/**
 * Placeholder for 系所成員 (/faculty) — 風格A經典學院派.
 * Real build: category chips (專任/合聘/兼任/名譽/系所同仁) → 4-column faculty
 * card grid (3:4 photo + serif/700 name + gold title + research fields).
 */
export function ClassicFaculty({ faculty }: { faculty: Faculty[] }) {
  return (
    <ClassicShell>
      <div className="page-in mx-auto max-w-5xl px-6 py-16">
        <p className="eyebrow">風格 A・經典學院派</p>
        <h1 className="heading-font mt-3 text-3xl">系所成員</h1>
        <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>
          Placeholder — 由 classic 主題 agent 依 README 規格重建
          （components/classic/Faculty.tsx）
        </p>
        <pre
          className="surface-card mt-8 overflow-x-auto p-4 text-xs leading-relaxed"
        >
          {JSON.stringify({ faculty }, null, 2)}
        </pre>
      </div>
    </ClassicShell>
  );
}
