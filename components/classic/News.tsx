"use client";

import { useMemo, useState } from "react";
import type { NewsItem } from "@/lib/data";
import { ClassicShell } from "./Shell";
import { GreenBanner } from "./Banners";
import { formatNewsDate, SERIF } from "./format";
import styles from "./classic.module.css";

/**
 * 最新消息 (/news) — 風格A. Green banner → category chips → date/category/title
 * list → (decorative) pagination. Chips are derived from the actual news
 * categories (+ 全部) so every filter maps to real rows — the prototype's
 * hardcoded chip labels don't match the seeded DB categories.
 */
export function ClassicNews({ news }: { news: NewsItem[] }) {
  const categories = useMemo(
    () => ["全部", ...Array.from(new Set(news.map((n) => n.category)))],
    [news]
  );
  const [active, setActive] = useState("全部");
  const filtered = active === "全部" ? news : news.filter((n) => n.category === active);

  return (
    <ClassicShell>
      <div className="page-in">
        <GreenBanner eyebrow="News & Announcements" title="最新消息" />

        <div className="mx-auto max-w-[1180px] px-5 py-8 sm:py-10 md:px-10">
          {/* category chips */}
          <div className="mb-3 flex flex-wrap gap-2.5" role="group" aria-label="消息分類篩選">
            {categories.map((c) => {
              const on = c === active;
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
                    border: `1px solid ${on ? "transparent" : "#eadfbf"}`,
                    background: on ? "var(--brand-gold)" : "transparent",
                    color: on ? "var(--gold-ink)" : "var(--muted)",
                  }}
                >
                  {c}
                </button>
              );
            })}
          </div>

          {/* list */}
          {filtered.map((n) => {
            const d = formatNewsDate(n.published_at);
            return (
              <div
                key={n.id}
                className={`${styles.row} flex flex-wrap items-center gap-x-4 gap-y-2 sm:flex-nowrap sm:gap-x-[22px]`}
                style={{ padding: "20px 8px", borderBottom: "1px solid var(--hairline)" }}
              >
                <div className="flex-none" style={{ width: 96, fontFamily: SERIF, color: "var(--brand-green)", fontWeight: 600, fontSize: 15 }}>
                  {d.full}
                </div>
                <span
                  className="inline-block flex-none"
                  style={{ background: "var(--brand-gold)", color: "var(--gold-ink)", fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 2 }}
                >
                  {n.category}
                </span>
                <div className="min-w-0 flex-1 basis-full sm:basis-auto" style={{ fontSize: 16, lineHeight: 1.5, fontWeight: 500 }}>
                  {n.title}
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <p className="py-16 text-center" style={{ color: "var(--muted)" }}>此分類目前沒有消息。</p>
          )}

          {/* pagination (decorative — seeded data fits one page) */}
          <div className="mt-9 flex justify-center gap-2" aria-hidden="true">
            {["1", "2", "3", "›"].map((p, i) => (
              <span
                key={p}
                className="flex items-center justify-center"
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 3,
                  fontWeight: i === 0 ? 700 : 400,
                  background: i === 0 ? "var(--brand-gold)" : "transparent",
                  color: i === 0 ? "var(--gold-ink)" : "var(--ink)",
                  border: i === 0 ? "none" : "1px solid #eadfbf",
                }}
              >
                {p}
              </span>
            ))}
          </div>
        </div>
      </div>
    </ClassicShell>
  );
}
