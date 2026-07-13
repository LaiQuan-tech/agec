"use client";

import { useMemo, useState } from "react";
import type { Faculty } from "@/lib/data";
import { ClassicShell } from "./Shell";
import { GreenBanner } from "./Banners";
import { CoverImage } from "./CoverImage";
import { SERIF } from "./format";
import styles from "./classic.module.css";

/**
 * 系所成員 (/faculty) — 風格A. Green banner → category chips → 4-col portrait
 * grid. Chips derive from the actual faculty categories (+ 全部) so filters map
 * to real rows. Portrait falls back to /images/portrait.png when photo_url is
 * empty (Supabase Storage host is whitelisted in next.config for real photos).
 */
export function ClassicFaculty({ faculty }: { faculty: Faculty[] }) {
  const categories = useMemo(
    () => ["全部", ...Array.from(new Set(faculty.map((f) => f.category)))],
    [faculty]
  );
  const [active, setActive] = useState("全部");
  const filtered = active === "全部" ? faculty : faculty.filter((f) => f.category === active);

  return (
    <ClassicShell>
      <div className="page-in">
        <GreenBanner eyebrow="Faculty & Staff" title="系所成員" />

        <div className="mx-auto max-w-[1180px] px-5 py-10 md:px-10">
          <div className="mb-8 flex flex-wrap gap-2.5" role="group" aria-label="成員分類篩選">
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

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {filtered.map((f) => (
              <article key={f.id} className={styles.card} style={{ border: "1px solid var(--hairline)", borderRadius: 6, overflow: "hidden" }}>
                <CoverImage
                  src={f.photo_url || "/images/portrait.png"}
                  alt={`${f.name} 照片`}
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 280px"
                  style={{ height: 210 }}
                />
                <div style={{ padding: 18 }}>
                  <div style={{ fontFamily: SERIF, fontSize: 18, fontWeight: 600, color: "var(--brand-green)" }}>{f.name}</div>
                  <div style={{ fontSize: 13, color: "var(--gold-deep)", fontWeight: 600, margin: "3px 0 10px" }}>{f.title}</div>
                  <div style={{ fontSize: "12.5px", color: "var(--muted)", lineHeight: 1.6 }}>{f.fields ?? ""}</div>
                </div>
              </article>
            ))}
          </div>
          {filtered.length === 0 && (
            <p className="py-16 text-center" style={{ color: "var(--muted)" }}>此分類目前沒有成員。</p>
          )}
        </div>
      </div>
    </ClassicShell>
  );
}
