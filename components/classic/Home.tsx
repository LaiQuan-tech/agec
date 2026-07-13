import type { NewsItem, Program } from "@/lib/data";
import { ClassicShell } from "./Shell";

/**
 * Placeholder for 首頁 (/) — 風格A經典學院派.
 * Real build should follow design_handoff_agec/README.md §Screens/首頁 "A":
 * utility top bar → sticky masthead → 660px parallax hero (useParallax 0.28–0.34
 * + Ken Burns via .kb-bg) → 最新消息 + 演講公告 → 招生資訊帶 → 480px parallax
 * quote band (useParallax 0.30) → 系所簡介 → footer. Use useReveal() + the
 * `.reveal` class on each scroll-in section.
 */
export function ClassicHome({
  newsHome,
  programs,
}: {
  newsHome: NewsItem[];
  programs: Program[];
}) {
  return (
    <ClassicShell>
      <div className="page-in mx-auto max-w-5xl px-6 py-16">
        <p className="eyebrow">風格 A・經典學院派</p>
        <h1 className="heading-font mt-3 text-3xl">首頁</h1>
        <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>
          Placeholder — 由 classic 主題 agent 依 README 規格重建
          （components/classic/Home.tsx）
        </p>
        <pre
          className="surface-card mt-8 overflow-x-auto p-4 text-xs leading-relaxed"
        >
          {JSON.stringify({ newsHome, programs }, null, 2)}
        </pre>
      </div>
    </ClassicShell>
  );
}
