"use client";

import { useMemo, useState } from "react";
import type { Faculty } from "@/lib/data";
import { ModernShell } from "./Shell";
import { CoverImage } from "./CoverImage";
import { SANS } from "./format";
import styles from "./modern.module.css";

/**
 * 系所成員 (/faculty) — 風格B 現代簡潔. eyebrow + 900 heading → data-derived
 * rounded category chips → 4-col rounded faculty cards (3:4 photo + name +
 * title + research fields). Categories derive from real `faculty.category`.
 */
export function ModernFaculty({ faculty }: { faculty: Faculty[] }) {
  const categories = useMemo(
    () => ["全部", ...Array.from(new Set(faculty.map((f) => f.category)))],
    [faculty]
  );
  const [active, setActive] = useState("全部");
  const shown = active === "全部" ? faculty : faculty.filter((f) => f.category === active);

  return (
    <ModernShell>
      <div className="page-in mx-auto max-w-[1240px] px-6 py-9 sm:py-14 md:px-11">
        <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: ".24em", color: "var(--gold-deep)", textTransform: "uppercase", marginBottom: 12 }}>Faculty</div>
        <h1 className="text-[30px] sm:text-[38px] md:text-[44px]" style={{ fontFamily: SANS, fontWeight: 900, margin: "0 0 28px", letterSpacing: "-.01em", color: "var(--ink)" }}>系所成員</h1>

        <div className="mb-8 flex flex-wrap gap-2">
          {categories.map((c) => {
            const on = active === c;
            return (
              <button
                key={c}
                type="button"
                onClick={() => setActive(c)}
                aria-pressed={on}
                className={styles.chip}
                style={{
                  fontSize: "13.5px",
                  fontWeight: 600,
                  padding: "8px 18px",
                  borderRadius: 20,
                  border: on ? "1px solid var(--brand-gold)" : "1px solid var(--hairline)",
                  background: on ? "var(--brand-gold)" : "transparent",
                  color: on ? "var(--gold-ink)" : "var(--muted)",
                }}
              >
                {c}
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
          {shown.map((f) => (
            <div key={f.id} className={styles.card} style={{ border: "1px solid var(--hairline)", borderRadius: 18, overflow: "hidden", background: "#fff" }}>
              <CoverImage src={f.photo_url || "/images/portrait.png"} alt={f.name} sizes="(max-width: 640px) 50vw, 280px" style={{ height: 210 }} />
              <div style={{ padding: 18 }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: "var(--brand-green)" }}>{f.name}</div>
                <div style={{ fontSize: 13, color: "var(--gold-deep)", fontWeight: 600, margin: "3px 0 10px" }}>{f.title}</div>
                {f.fields && <div style={{ fontSize: "12.5px", color: "var(--muted)", lineHeight: 1.6 }}>{f.fields}</div>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </ModernShell>
  );
}
