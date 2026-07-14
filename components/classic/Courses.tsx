"use client";

import { useMemo, useState } from "react";
import type { Course } from "@/lib/data";
import { ClassicShell } from "./Shell";
import { GreenBanner } from "./Banners";
import { SERIF } from "./format";
import styles from "./classic.module.css";

// Shared column template — narrower fixed columns on mobile so the table never
// forces horizontal page scroll; full prototype widths from the sm breakpoint.
const COLS = "grid grid-cols-[64px_1fr_40px_52px] sm:grid-cols-[110px_1fr_90px_110px]";

/**
 * 課程資訊 (/courses) — 風格A. Green banner → program tabs → course table
 * (cream header). Tabs derive from the actual course programs (+ 全部).
 */
export function ClassicCourses({ courses }: { courses: Course[] }) {
  const tabs = useMemo(
    () => ["全部", ...Array.from(new Set(courses.map((c) => c.program)))],
    [courses]
  );
  const [active, setActive] = useState("全部");
  const filtered = active === "全部" ? courses : courses.filter((c) => c.program === active);

  return (
    <ClassicShell>
      <div className="page-in">
        <GreenBanner eyebrow="Courses" title="課程資訊" />

        <div className="mx-auto max-w-[1180px] px-5 py-8 sm:py-10 md:px-10">
          <div className="mb-7 flex flex-wrap gap-2.5" role="group" aria-label="學制篩選">
            {tabs.map((t) => {
              const on = t === active;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setActive(t)}
                  aria-pressed={on}
                  className={styles.chip}
                  style={{
                    fontSize: "13.5px",
                    fontWeight: 600,
                    padding: "8px 18px",
                    borderRadius: 20,
                    border: `1px solid ${on ? "transparent" : "#eadfbf"}`,
                    background: on ? "var(--brand-gold)" : "transparent",
                    color: on ? "var(--gold-ink)" : "var(--muted)",
                  }}
                >
                  {t}
                </button>
              );
            })}
          </div>

          <div style={{ border: "1px solid var(--hairline)", borderRadius: 6, overflow: "hidden" }}>
            {/* header */}
            <div
              className={`${COLS} px-4 py-3.5 text-[13px] sm:px-5 sm:text-[14px]`}
              style={{ background: "var(--cream)", fontFamily: SERIF, fontWeight: 600, color: "var(--brand-green)" }}
            >
              <span>課號</span>
              <span>課程名稱</span>
              <span>學分</span>
              <span>類別</span>
            </div>
            {/* rows */}
            {filtered.map((c) => (
              <div
                key={c.id}
                className={`${styles.row} ${COLS} items-center px-4 py-[15px] text-[13px] sm:px-5 sm:text-[14.5px]`}
                style={{ borderTop: "1px solid var(--hairline)" }}
              >
                <span style={{ color: "var(--gold-deep)", fontWeight: 600 }}>{c.code}</span>
                <span style={{ fontWeight: 500 }}>{c.name}</span>
                <span>{c.credit}</span>
                <span style={{ color: "var(--muted)" }}>{c.ctype}</span>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="px-5 py-12 text-center" style={{ borderTop: "1px solid var(--hairline)", color: "var(--muted)" }}>
                此學制目前沒有課程。
              </div>
            )}
          </div>

          <div style={{ marginTop: 22, fontSize: 14, color: "var(--muted)" }}>
            ＊完整課程與修業規定請參閱 <span style={{ color: "var(--gold-deep)", fontWeight: 600 }}>臺大課程地圖</span>。
          </div>
        </div>
      </div>
    </ClassicShell>
  );
}
