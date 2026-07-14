import type { Program } from "@/lib/data";
import { ClassicShell } from "./Shell";
import { ImageBanner } from "./Banners";
import { programIcon, SERIF } from "./format";
import styles from "./classic.module.css";

const TIMELINE = [
  { when: "9 月", what: "碩、博士班甄試簡章公告與報名" },
  { when: "11 月", what: "碩、博士班甄試筆試與口試" },
  { when: "2–3 月", what: "大學部申請入學、在職專班招生簡章公告" },
  { when: "5 月", what: "申請入學第二階段口試、正備取名單公告" },
];

/** 招生資訊 (/admissions) — 風格A. Image banner → 學制卡 → 重要時程. */
export function ClassicAdmissions({ programs }: { programs: Program[] }) {
  return (
    <ClassicShell>
      <div className="page-in">
        <ImageBanner
          src="/images/students.png"
          eyebrow="Admissions"
          title="招生資訊"
          overlay="linear-gradient(90deg,rgba(30,45,32,.72),rgba(30,45,32,.3))"
        />

        <div className="mx-auto max-w-[1180px] px-5 py-9 sm:py-14 md:px-10">
          {/* 學制卡 */}
          <div className="mb-14 grid grid-cols-1 gap-6 md:grid-cols-2">
            {programs.map((p) => (
              <article key={p.id} className={`${styles.card} flex gap-[22px]`} style={{ border: "1px solid var(--hairline)", borderRadius: 6, padding: 28 }}>
                <div
                  aria-hidden="true"
                  className="flex flex-none items-center justify-center"
                  style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--cream)", color: "var(--brand-green)", fontFamily: SERIF, fontWeight: 700, fontSize: 20 }}
                >
                  {programIcon(p.name)}
                </div>
                <div>
                  <div style={{ fontFamily: SERIF, fontSize: 21, fontWeight: 600, color: "var(--brand-green)" }}>{p.name}</div>
                  {p.name_en && (
                    <div style={{ fontSize: 12, letterSpacing: ".14em", color: "var(--gold-deep)", fontWeight: 600, textTransform: "uppercase", margin: "2px 0 10px" }}>
                      {p.name_en}
                    </div>
                  )}
                  <div style={{ fontSize: 14, color: "var(--ink-soft)", lineHeight: 1.8, marginTop: p.name_en ? 0 : 10 }}>{p.description ?? ""}</div>
                </div>
              </article>
            ))}
          </div>

          {/* 重要時程 */}
          <h2 style={{ fontFamily: SERIF, fontSize: 24, color: "var(--brand-green)", borderBottom: "3px solid var(--brand-gold)", paddingBottom: 12, margin: "0 0 28px" }}>
            重要時程
          </h2>
          <div>
            {TIMELINE.map((t) => (
              <div key={t.when} className="flex items-start gap-6" style={{ padding: "18px 0", borderBottom: "1px solid var(--hairline)" }}>
                <div className="flex-none" style={{ width: 120, fontFamily: SERIF, color: "var(--gold-deep)", fontWeight: 600 }}>{t.when}</div>
                <div style={{ fontSize: "15.5px", color: "var(--ink)" }}>{t.what}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </ClassicShell>
  );
}
