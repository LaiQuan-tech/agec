import type { LinkItem } from "@/lib/data";
import { ClassicShell } from "./Shell";

/**
 * Placeholder for 農經期刊 (/journal) — 風格A經典學院派.
 * Real build: left journal cover (3:4) + right description 《農業與經濟》 +
 * 2×2 link cards (最新消息/出版與徵稿簡則/編輯委員會/文稿規格說明).
 */
export function ClassicJournal({ links }: { links: LinkItem[] }) {
  return (
    <ClassicShell>
      <div className="page-in mx-auto max-w-5xl px-6 py-16">
        <p className="eyebrow">風格 A・經典學院派</p>
        <h1 className="heading-font mt-3 text-3xl">農經期刊</h1>
        <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>
          Placeholder — 由 classic 主題 agent 依 README 規格重建
          （components/classic/Journal.tsx）
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
