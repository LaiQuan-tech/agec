import type { NewsItem, Program } from "@/lib/data";
import { ModernShell } from "./Shell";

/**
 * Placeholder for 首頁 (/) — 風格B現代簡潔.
 * Real build should follow design_handoff_agec/README.md §Screens/首頁 "B":
 * glass sticky header → 580px rounded parallax hero (useParallax 0.28–0.34
 * + Ken Burns via .kb-bg, border-radius: var(--radius-hero)) → 4 quick-entry
 * cards → 最新消息 (3-col cards) → 460px rounded parallax quote band
 * (useParallax 0.30) → "Our Mission" cream rounded panel → footer. Use
 * useReveal() + the `.reveal` class on each scroll-in section.
 */
export function ModernHome({
  newsHome,
  programs,
}: {
  newsHome: NewsItem[];
  programs: Program[];
}) {
  return (
    <ModernShell>
      <div className="page-in mx-auto max-w-5xl px-6 py-16">
        <p className="eyebrow">風格 B・現代簡潔</p>
        <h1 className="heading-font mt-3 text-3xl">首頁</h1>
        <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>
          Placeholder — 由 modern 主題 agent 依 README 規格重建
          （components/modern/Home.tsx）
        </p>
        <pre
          className="surface-card mt-8 overflow-x-auto p-4 text-xs leading-relaxed"
        >
          {JSON.stringify({ newsHome, programs }, null, 2)}
        </pre>
      </div>
    </ModernShell>
  );
}
