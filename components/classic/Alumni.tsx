import type { LinkItem } from "@/lib/data";
import { ClassicShell } from "./Shell";
import { GreenBanner } from "./Banners";
import { CoverImage } from "./CoverImage";
import { SERIF } from "./format";
import styles from "./classic.module.css";

/** 系友專區 (/alumni) — 風格A. Green banner → 系友影像 + 說明 → 3×2 link cards. */
export function ClassicAlumni({ links }: { links: LinkItem[] }) {
  return (
    <ClassicShell>
      <div className="page-in">
        <GreenBanner eyebrow="Alumni" title="系友專區" />

        <div className="mx-auto max-w-[1180px] px-5 py-9 sm:py-14 md:px-10">
          <div className="mb-8 sm:mb-12 grid grid-cols-1 items-center gap-8 sm:gap-12 md:grid-cols-2">
            <CoverImage src="/images/alumni.png" alt="系友紀念影像" sizes="(max-width: 768px) 100vw, 560px" rounded={6} style={{ height: 320 }} />
            <div>
              <h2 style={{ fontFamily: SERIF, fontSize: 26, color: "var(--brand-green)", lineHeight: 1.5, margin: "0 0 16px" }}>
                系友捐贈與系友動態
              </h2>
              <p style={{ fontSize: "15.5px", lineHeight: 2, color: "var(--ink-soft)" }}>
                本專區彙整歷屆系友回饋母系的捐贈紀錄，並分享系友在學界、業界與公部門的最新動態，延續農經人相互扶持的傳統。
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-[18px] sm:grid-cols-2 lg:grid-cols-3">
            {links.map((a) => {
              const inner = (
                <div style={{ fontFamily: SERIF, fontSize: 16, fontWeight: 600, color: "var(--brand-green)" }}>{a.label}</div>
              );
              const cardStyle = { border: "1px solid var(--hairline)", borderRadius: 6, padding: 22, display: "block" as const };
              // '#' is the placeholder the seed rows use for "no link yet", so
              // it renders as a non-clickable card — which is what /admin/links
              // tells the staff to expect.
              return a.url && a.url !== "#" ? (
                <a key={a.id} href={a.url} target="_blank" rel="noopener noreferrer" className={styles.card} style={cardStyle}>
                  {inner}
                </a>
              ) : (
                <div key={a.id} className={styles.card} style={cardStyle}>
                  {inner}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </ClassicShell>
  );
}
