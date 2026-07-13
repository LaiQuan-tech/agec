import type { NewsItem } from "@/lib/data";
import { ModernShell } from "./Shell";

/**
 * Placeholder for 最新消息 (/news) — 風格B現代簡潔.
 * Real build: eyebrow + 900-weight heading → rounded category chips →
 * rounded hover list rows, all 10 seeded rows.
 */
export function ModernNews({ news }: { news: NewsItem[] }) {
  return (
    <ModernShell>
      <div className="page-in mx-auto max-w-5xl px-6 py-16">
        <p className="eyebrow">風格 B・現代簡潔</p>
        <h1 className="heading-font mt-3 text-3xl">最新消息</h1>
        <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>
          Placeholder — 由 modern 主題 agent 依 README 規格重建
          （components/modern/News.tsx）
        </p>
        <pre
          className="surface-card mt-8 overflow-x-auto p-4 text-xs leading-relaxed"
        >
          {JSON.stringify({ news }, null, 2)}
        </pre>
      </div>
    </ModernShell>
  );
}
