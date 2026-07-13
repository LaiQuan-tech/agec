import type { LinkItem } from "@/lib/data";
import { ModernShell } from "./Shell";
import { CoverImage } from "./CoverImage";
import { SANS } from "./format";
import styles from "./modern.module.css";

/**
 * 農經期刊 (/journal) — 風格B 現代簡潔. eyebrow + 900 heading → rounded cover
 * image + description + 2-col rounded link cards. Cards render real `links`
 * rows (section='journal').
 */
export function ModernJournal({ links }: { links: LinkItem[] }) {
  return (
    <ModernShell>
      <div className="page-in mx-auto max-w-[1240px] px-6 py-14 md:px-11">
        <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: ".24em", color: "var(--gold-deep)", textTransform: "uppercase", marginBottom: 12 }}>Journal</div>
        <h1 style={{ fontFamily: SANS, fontSize: 44, fontWeight: 900, margin: "0 0 40px", letterSpacing: "-.01em", color: "var(--ink)" }}>農業與經濟期刊</h1>

        <div className="grid grid-cols-1 items-start gap-12 md:grid-cols-[300px_1fr]">
          <CoverImage src="/images/journal.png" alt="《農業與經濟》期刊封面" sizes="(max-width: 768px) 100vw, 300px" rounded={20} style={{ height: 380 }} />
          <div>
            <p style={{ fontSize: 16, lineHeight: 2, color: "var(--ink-soft)", margin: "0 0 28px" }}>
              《農業與經濟》為本系發行之學術期刊，長期刊載農業經濟、資源與環境、農村發展等領域之研究成果，為國內重要的農業經濟學術園地。
            </p>
            <div className="grid grid-cols-1 gap-[18px] sm:grid-cols-2">
              {links.map((j) => (
                <LinkCard key={j.id} label={j.label} url={j.url} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </ModernShell>
  );
}

function LinkCard({ label, url }: { label: string; url: string | null }) {
  const inner = (
    <>
      <div style={{ fontSize: 17, fontWeight: 700, color: "var(--brand-green)" }}>{label}</div>
      <div style={{ fontSize: 13, color: "var(--gold-deep)", marginTop: 8 }}>前往 →</div>
    </>
  );
  const style = { border: "1px solid var(--hairline)", borderRadius: 16, padding: 22, display: "block", background: "#fff" } as const;
  return url && url !== "#" ? (
    <a href={url} className={styles.card} style={style} target="_blank" rel="noopener">{inner}</a>
  ) : (
    <div className={styles.card} style={style}>{inner}</div>
  );
}
