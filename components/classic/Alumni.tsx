import type { LinkItem } from "@/lib/data";
import { ClassicShell } from "./Shell";

/**
 * Placeholder for 系友專區 (/alumni) — 風格A經典學院派.
 * Real build: 「李總統登輝系友專區」banner → left-image/right-text 「求學紀事與
 * 捐贈書目」→ 3×2 link cards (求學紀事/中文書目/英文書目/日文書目/捐贈期刊/
 * 系友回娘家).
 */
export function ClassicAlumni({ links }: { links: LinkItem[] }) {
  return (
    <ClassicShell>
      <div className="page-in mx-auto max-w-5xl px-6 py-16">
        <p className="eyebrow">風格 A・經典學院派</p>
        <h1 className="heading-font mt-3 text-3xl">系友專區</h1>
        <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>
          Placeholder — 由 classic 主題 agent 依 README 規格重建
          （components/classic/Alumni.tsx）
        </p>
        <pre
          className="surface-card mt-8 overflow-x-auto p-4 text-xs leading-relaxed"
        >
          {JSON.stringify({ links }, null, 2)}
        </pre>
      </div>
    </ClassicShell>
  );
}
