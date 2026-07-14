import type { LinkItem } from "@/lib/data";
import { ModernShell } from "./Shell";
import { Reveal } from "./Reveal";
import { CoverImage } from "./CoverImage";
import { SANS } from "./format";
import styles from "./modern.module.css";

/**
 * 系友專區 (/alumni) — 風格B 現代簡潔. eyebrow + 900 heading (李總統登輝系友專區)
 * → left-image / right-text intro → 3-col rounded link cards. Cards render real
 * `links` rows (section='alumni').
 */
export function ModernAlumni({ links }: { links: LinkItem[] }) {
  return (
    <ModernShell>
      <div className="page-in mx-auto max-w-[1240px] px-6 py-9 sm:py-14 md:px-11">
        <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: ".24em", color: "var(--gold-deep)", textTransform: "uppercase", marginBottom: 12 }}>Alumni</div>
        <h1 className="text-[26px] sm:text-[36px] md:text-[44px]" style={{ fontFamily: SANS, fontWeight: 900, margin: "0 0 40px", letterSpacing: "-.01em", color: "var(--ink)" }}>李總統登輝系友專區</h1>

        <div className="mb-8 sm:mb-12 grid grid-cols-1 items-center gap-8 sm:gap-12 md:grid-cols-2">
          <CoverImage src="/images/alumni.png" alt="系友紀念影像" sizes="(max-width: 768px) 100vw, 560px" rounded={20} style={{ height: 320 }} />
          <div>
            <h2 style={{ fontFamily: SANS, fontSize: 26, fontWeight: 700, color: "var(--brand-green)", lineHeight: 1.5, margin: "0 0 16px" }}>求學紀事與捐贈書目</h2>
            <p style={{ fontSize: "15.5px", lineHeight: 2, color: "var(--ink-soft)" }}>
              本專區紀念傑出系友於本系之求學歷程，並典藏其捐贈之中、英、日文書目與期刊，供師生研究參考。
            </p>
          </div>
        </div>

        <Reveal className="grid grid-cols-1 gap-[18px] sm:grid-cols-2 lg:grid-cols-3">
          {links.map((a) => {
            const style = { border: "1px solid var(--hairline)", borderRadius: 16, padding: 22, display: "block", background: "#fff" } as const;
            const label = <div style={{ fontSize: 16, fontWeight: 700, color: "var(--brand-green)" }}>{a.label}</div>;
            return a.url && a.url !== "#" ? (
              <a key={a.id} href={a.url} className={styles.card} style={style} target="_blank" rel="noopener">{label}</a>
            ) : (
              <div key={a.id} className={styles.card} style={style}>{label}</div>
            );
          })}
        </Reveal>
      </div>
    </ModernShell>
  );
}
