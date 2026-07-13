import type { Program } from "@/lib/data";
import { ModernShell } from "./Shell";
import { Reveal } from "./Reveal";
import { programIcon, SANS } from "./format";

const TIMELINE = [
  { when: "9 月", what: "碩、博士班甄試簡章公告與報名" },
  { when: "11 月", what: "碩、博士班甄試筆試與口試" },
  { when: "2–3 月", what: "大學部申請入學、在職專班招生簡章公告" },
  { when: "5 月", what: "申請入學第二階段口試、正備取名單公告" },
];

/**
 * 招生資訊 (/admissions) — 風格B 現代簡潔. eyebrow + 900 heading → 2-col
 * rounded program cards (round-square icon derived from program name) →
 * 重要時程 list. Program cards render real `programs` rows.
 */
export function ModernAdmissions({ programs }: { programs: Program[] }) {
  return (
    <ModernShell>
      <div className="page-in mx-auto max-w-[1240px] px-6 py-14 md:px-11">
        <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: ".24em", color: "var(--gold-deep)", textTransform: "uppercase", marginBottom: 12 }}>Admissions</div>
        <h1 style={{ fontFamily: SANS, fontSize: 44, fontWeight: 900, margin: "0 0 40px", letterSpacing: "-.01em", color: "var(--ink)" }}>招生資訊</h1>

        <div className="mb-14 grid grid-cols-1 gap-6 md:grid-cols-2">
          {programs.map((p) => (
            <div key={p.id} style={{ border: "1px solid var(--hairline)", borderRadius: 20, padding: 28, display: "flex", gap: 22, background: "#fff" }}>
              <div
                aria-hidden="true"
                className="flex flex-none items-center justify-center"
                style={{ width: 56, height: 56, borderRadius: 16, background: "var(--cream)", color: "var(--brand-green)", fontWeight: 700, fontSize: 20 }}
              >
                {programIcon(p.name)}
              </div>
              <div>
                <div style={{ fontSize: 21, fontWeight: 700, color: "var(--brand-green)" }}>{p.name}</div>
                {p.name_en && (
                  <div style={{ fontSize: 12, letterSpacing: ".14em", color: "var(--gold-deep)", fontWeight: 600, textTransform: "uppercase", margin: "2px 0 10px" }}>{p.name_en}</div>
                )}
                {p.description && <div style={{ fontSize: 14, color: "var(--ink-soft)", lineHeight: 1.8 }}>{p.description}</div>}
              </div>
            </div>
          ))}
        </div>

        <h2 style={{ fontFamily: SANS, fontSize: 24, fontWeight: 900, margin: "0 0 24px", color: "var(--ink)" }}>重要時程</h2>
        <Reveal>
          {TIMELINE.map((t) => (
            <div key={t.when} className="flex flex-col gap-1 sm:flex-row sm:gap-6" style={{ padding: "18px 0", borderBottom: "1px solid var(--hairline)" }}>
              <div className="flex-none" style={{ width: 120, color: "var(--gold-deep)", fontWeight: 700 }}>{t.when}</div>
              <div style={{ fontSize: "15.5px", color: "var(--ink)" }}>{t.what}</div>
            </div>
          ))}
        </Reveal>
      </div>
    </ModernShell>
  );
}
