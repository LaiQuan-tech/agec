import type { Course } from "@/lib/data";
import { ClassicShell } from "./Shell";

/**
 * Placeholder for 課程資訊 (/courses) — 風格A經典學院派.
 * Real build: program tabs → course table (課號/課程名稱/學分/類別, cream
 * header row).
 */
export function ClassicCourses({ courses }: { courses: Course[] }) {
  return (
    <ClassicShell>
      <div className="page-in mx-auto max-w-5xl px-6 py-16">
        <p className="eyebrow">風格 A・經典學院派</p>
        <h1 className="heading-font mt-3 text-3xl">課程資訊</h1>
        <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>
          Placeholder — 由 classic 主題 agent 依 README 規格重建
          （components/classic/Courses.tsx）
        </p>
        <pre
          className="surface-card mt-8 overflow-x-auto p-4 text-xs leading-relaxed"
        >
          {JSON.stringify({ courses }, null, 2)}
        </pre>
      </div>
    </ClassicShell>
  );
}
