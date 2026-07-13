import { ModernShell } from "./Shell";

/**
 * Placeholder for 本系簡介 (/about) — 風格B現代簡潔.
 * No DB data — this page's copy is static per the design brief. Real build:
 * eyebrow + 900-weight heading → left-image/right-text → cream rounded
 * Mission panel.
 */
export function ModernAbout() {
  return (
    <ModernShell>
      <div className="page-in mx-auto max-w-5xl px-6 py-16">
        <p className="eyebrow">風格 B・現代簡潔</p>
        <h1 className="heading-font mt-3 text-3xl">本系簡介</h1>
        <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>
          Placeholder — 由 modern 主題 agent 依 README 規格重建
          （components/modern/About.tsx）。此頁不吃 Supabase 資料，內容為系辦提供的靜態文案。
        </p>
      </div>
    </ModernShell>
  );
}
