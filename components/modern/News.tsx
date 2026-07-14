"use client";

import { useMemo, useState } from "react";
import type { NewsItem } from "@/lib/data";
import { ModernShell } from "./Shell";
import { formatNewsDate, SANS } from "./format";
import styles from "./modern.module.css";

/**
 * 最新消息 (/news) — 風格B 現代簡潔. eyebrow + 900 heading → data-derived
 * rounded category chips → rounded hover list rows. Categories come from the
 * real `news.category` values (+ 全部) so every chip maps to actual rows.
 */
export function ModernNews({ news }: { news: NewsItem[] }) {
  const categories = useMemo(
    () => ["全部", ...Array.from(new Set(news.map((n) => n.category)))],
    [news]
  );
  const [active, setActive] = useState("全部");
  const rows = active === "全部" ? news : news.filter((n) => n.category === active);

  return (
    <ModernShell>
      <div className="page-in mx-auto max-w-[1240px] px-6 py-9 sm:py-14 md:px-11">
        <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: ".24em", color: "var(--gold-deep)", textTransform: "uppercase", marginBottom: 12 }}>News</div>
        <h1 className="text-[30px] sm:text-[38px] md:text-[44px]" style={{ fontFamily: SANS, fontWeight: 900, margin: "0 0 28px", letterSpacing: "-.01em", color: "var(--ink)" }}>最新消息</h1>

        <div className="mb-5 flex flex-wrap gap-2">
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

        <div>
          {rows.map((n) => {
            const d = formatNewsDate(n.published_at);
            return (
              <div
                key={n.id}
                className={`${styles.row} flex flex-wrap items-center gap-x-[22px] gap-y-2`}
                style={{ padding: "20px 12px", borderBottom: "1px solid var(--hairline)", borderRadius: 10 }}
              >
                <div className="flex-none" style={{ width: 96, color: "var(--muted)", fontWeight: 600, fontSize: 14 }}>{d.full}</div>
                <span
                  className="flex-none"
                  style={{ background: "var(--cream)", color: "var(--gold-deep)", fontSize: 12, fontWeight: 700, padding: "4px 12px", borderRadius: 16 }}
                >
                  {n.category}
                </span>
                <div className="min-w-0 flex-1" style={{ fontSize: 16, lineHeight: 1.5, fontWeight: 500, color: "var(--ink)" }}>{n.title}</div>
              </div>
            );
          })}
        </div>
      </div>
    </ModernShell>
  );
}
