import type { LinkItem } from "@/lib/data";
import { ClassicShell } from "./Shell";
import { GreenBanner } from "./Banners";
import { CoverImage } from "./CoverImage";
import { SERIF } from "./format";
import styles from "./classic.module.css";

/** 農經期刊 (/journal) — 風格A. Green banner → cover + intro + 2×2 link cards. */
export function ClassicJournal({ links }: { links: LinkItem[] }) {
  return (
    <ClassicShell>
      <div className="page-in">
        <GreenBanner eyebrow="Journal" title="農業與經濟期刊" />

        <div className="mx-auto grid max-w-[1180px] grid-cols-1 items-start gap-12 px-5 py-14 md:grid-cols-[300px_1fr] md:px-10">
          <CoverImage src="/images/journal.png" alt="《農業與經濟》期刊封面" sizes="(max-width: 768px) 100vw, 300px" rounded={6} style={{ height: 380 }} />

          <div>
            <p style={{ fontSize: 16, lineHeight: 2, color: "var(--ink-soft)", margin: "0 0 28px" }}>
              《農業與經濟》為本系發行之學術期刊，長期刊載農業經濟、資源與環境、農村發展等領域之研究成果，為國內重要的農業經濟學術園地。
            </p>
            <div className="grid grid-cols-1 gap-[18px] sm:grid-cols-2">
              {links.map((j) => {
                const inner = (
                  <>
                    <div style={{ fontFamily: SERIF, fontSize: 17, fontWeight: 600, color: "var(--brand-green)" }}>{j.label}</div>
                    <div style={{ fontSize: 13, color: "var(--gold-deep)", marginTop: 8 }}>前往 →</div>
                  </>
                );
                const cardStyle = { border: "1px solid var(--hairline)", borderRadius: 6, padding: 22, display: "block" as const };
                return j.url ? (
                  <a key={j.id} href={j.url} target="_blank" rel="noopener noreferrer" className={styles.card} style={cardStyle}>
                    {inner}
                  </a>
                ) : (
                  <div key={j.id} className={styles.card} style={cardStyle}>
                    {inner}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </ClassicShell>
  );
}
