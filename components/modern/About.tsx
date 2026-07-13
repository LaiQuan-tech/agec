import { ModernShell } from "./Shell";
import { Reveal } from "./Reveal";
import { CoverImage } from "./CoverImage";
import { SANS } from "./format";

/**
 * 本系簡介 (/about) — 風格B 現代簡潔. eyebrow + 900 heading → left-image /
 * right-text history row → cream rounded Mission panel. No DB source; copy is
 * static per the design brief.
 */
export function ModernAbout() {
  return (
    <ModernShell>
      <div className="page-in mx-auto max-w-[1240px] px-6 py-14 md:px-11">
        <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: ".24em", color: "var(--gold-deep)", textTransform: "uppercase", marginBottom: 12 }}>About</div>
        <h1 style={{ fontFamily: SANS, fontSize: 44, fontWeight: 900, margin: "0 0 40px", letterSpacing: "-.01em", color: "var(--ink)" }}>本系簡介</h1>

        <Reveal className="mb-14 grid grid-cols-1 items-center gap-12 md:grid-cols-2">
          <CoverImage src="/images/historic.png" alt="農業經濟學系歷史影像" sizes="(max-width: 768px) 100vw, 560px" rounded={20} style={{ height: 320 }} />
          <div>
            <h2 style={{ fontFamily: SANS, fontSize: 26, fontWeight: 700, color: "var(--brand-green)", lineHeight: 1.5, margin: "0 0 16px" }}>
              歷史悠久的農業經濟學術重鎮
            </h2>
            <p style={{ fontSize: "15.5px", lineHeight: 2, color: "var(--ink-soft)" }}>
              本系為臺灣農業經濟研究與人才培育的重要基地，長期致力於農業政策、資源與環境經濟、市場與行銷、農村發展等領域。系友遍及政界、學界、金融與產業界。
            </p>
          </div>
        </Reveal>

        <Reveal style={{ background: "var(--cream)", borderRadius: "var(--radius-hero)", padding: "clamp(36px,5vw,56px)" }}>
          <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: ".24em", color: "var(--gold-deep)", textTransform: "uppercase", marginBottom: 16 }}>Mission</div>
          <p style={{ fontSize: 26, lineHeight: 1.7, color: "var(--brand-green)", fontWeight: 500, margin: 0 }}>
            培養我國高級農業經濟人才，配合國家現代化農業建設，並以追求世界一流之教學與研究水準，提升我國農業經濟學術地位為發展目標。
          </p>
        </Reveal>
      </div>
    </ModernShell>
  );
}
