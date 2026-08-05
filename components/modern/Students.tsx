import type { LinkItem } from "@/lib/data";
import { ModernShell } from "./Shell";
import { CoverImage } from "./CoverImage";
import { SANS } from "./format";
import styles from "./modern.module.css";

/**
 * 學生專區 (/students) — 風格B 現代簡潔. eyebrow + 900 heading → rounded cover
 * image + description + 2-col rounded link cards. Cards render real `links`
 * rows (section='students').
 */
export function ModernStudents({ links }: { links: LinkItem[] }) {
  return (
    <ModernShell>
      <div className="page-in mx-auto max-w-[1240px] px-6 py-9 sm:py-14 md:px-11">
        <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: ".24em", color: "var(--gold-deep)", textTransform: "uppercase", marginBottom: 12 }}>Students</div>
        <h1 className="text-[30px] sm:text-[38px] md:text-[44px]" style={{ fontFamily: SANS, fontWeight: 900, margin: "0 0 40px", letterSpacing: "-.01em", color: "var(--ink)" }}>學生專區</h1>

        <div className="grid grid-cols-1 items-start gap-8 sm:gap-12 md:grid-cols-[300px_1fr]">
          <CoverImage src="/images/students.png" alt="農經系學生活動" sizes="(max-width: 768px) 100vw, 300px" rounded={20} style={{ height: "clamp(300px, 45vw, 380px)" }} />
          <div>
            <p style={{ fontSize: 16, lineHeight: 2, color: "var(--ink-soft)", margin: "0 0 28px" }}>
              系學會由本系同學自治運作，籌辦迎新、系際交流、學術講座與各項聯誼活動，是同學參與系上事務、認識彼此的主要管道。
            </p>
            <div className="grid grid-cols-1 gap-[18px] sm:grid-cols-2">
              {links.map((s) => (
                <LinkCard key={s.id} label={s.label} url={s.url} />
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
