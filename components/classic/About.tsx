import { ClassicShell } from "./Shell";

/**
 * Placeholder for 本系簡介 (/about) — 風格A經典學院派.
 * No DB data — this page's copy is static per the design brief. Real build:
 * 300px banner → left-text/right-image "歷史悠久的農業經濟學術重鎮" → cream
 * Mission quote card → 3-stat row (1919 / 450+ / 5).
 */
export function ClassicAbout() {
  return (
    <ClassicShell>
      <div className="page-in mx-auto max-w-5xl px-6 py-16">
        <p className="eyebrow">風格 A・經典學院派</p>
        <h1 className="heading-font mt-3 text-3xl">本系簡介</h1>
        <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>
          Placeholder — 由 classic 主題 agent 依 README 規格重建
          （components/classic/About.tsx）。此頁不吃 Supabase 資料，內容為系辦提供的靜態文案。
        </p>
      </div>
    </ClassicShell>
  );
}
