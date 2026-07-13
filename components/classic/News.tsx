import type { NewsItem } from "@/lib/data";
import { ClassicShell } from "./Shell";

/**
 * Placeholder for 最新消息 (/news) — 風格A經典學院派.
 * Real build: deep-green banner → category chips (全部/最新公告/演講公告/
 * 招生資訊/求職徵才/活動剪影) → list rows (96px date block + gold category
 * tag + title, all 10 seeded rows) → pagination.
 */
export function ClassicNews({ news }: { news: NewsItem[] }) {
  return (
    <ClassicShell>
      <div className="page-in mx-auto max-w-5xl px-6 py-16">
        <p className="eyebrow">風格 A・經典學院派</p>
        <h1 className="heading-font mt-3 text-3xl">最新消息</h1>
        <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>
          Placeholder — 由 classic 主題 agent 依 README 規格重建
          （components/classic/News.tsx）
        </p>
        <pre
          className="surface-card mt-8 overflow-x-auto p-4 text-xs leading-relaxed"
        >
          {JSON.stringify({ news }, null, 2)}
        </pre>
      </div>
    </ClassicShell>
  );
}
