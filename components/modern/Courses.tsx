"use client";

import { useMemo, useState } from "react";
import type { Course } from "@/lib/data";
import { ModernShell } from "./Shell";
import { SANS } from "./format";
import styles from "./modern.module.css";

const GRID = "grid-cols-[100px_1fr_70px_90px] md:grid-cols-[120px_1fr_90px_110px]";

/**
 * 課程資訊 (/courses) — 風格B 現代簡潔. eyebrow + 900 heading → data-derived
 * rounded program tabs → rounded course table with cream header. Tabs derive
 * from real `courses.program` values so each maps to actual rows.
 */
export function ModernCourses({ courses }: { courses: Course[] }) {
  const programs = useMemo(
    () => Array.from(new Set(courses.map((c) => c.program))),
    [courses]
  );
  const [active, setActive] = useState(programs[0] ?? "");
  const rows = courses.filter((c) => c.program === active);

  return (
    <ModernShell>
      <div className="page-in mx-auto max-w-[1240px] px-6 py-14 md:px-11">
        <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: ".24em", color: "var(--gold-deep)", textTransform: "uppercase", marginBottom: 12 }}>Courses</div>
        <h1 style={{ fontFamily: SANS, fontSize: 44, fontWeight: 900, margin: "0 0 28px", letterSpacing: "-.01em", color: "var(--ink)" }}>課程資訊</h1>

        <div className="mb-7 flex flex-wrap gap-2">
          {programs.map((p) => {
            const on = active === p;
            return (
              <button
                key={p}
                type="button"
                onClick={() => setActive(p)}
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
                {p}
              </button>
            );
          })}
        </div>

        <div className="overflow-x-auto" style={{ border: "1px solid var(--hairline)", borderRadius: 18 }}>
          <div style={{ minWidth: 520 }}>
            <div className={`grid ${GRID}`} style={{ background: "var(--cream)", fontWeight: 700, color: "var(--brand-green)", fontSize: 14, padding: "16px 22px" }}>
              <span>課號</span>
              <span>課程名稱</span>
              <span>學分</span>
              <span>類別</span>
            </div>
            {rows.map((c) => (
              <div key={c.id} className={`${styles.row} grid ${GRID} items-center`} style={{ padding: "16px 22px", borderTop: "1px solid var(--hairline)", fontSize: "14.5px" }}>
                <span style={{ color: "var(--gold-deep)", fontWeight: 600 }}>{c.code}</span>
                <span style={{ fontWeight: 500, color: "var(--ink)" }}>{c.name}</span>
                <span style={{ color: "var(--ink)" }}>{c.credit}</span>
                <span style={{ color: "var(--muted)" }}>{c.ctype}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-5" style={{ fontSize: 14, color: "var(--muted)" }}>
          ＊完整課程與修業規定請參閱 <span style={{ color: "var(--gold-deep)", fontWeight: 600 }}>臺大課程地圖</span>。
        </div>
      </div>
    </ModernShell>
  );
}
