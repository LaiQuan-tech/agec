import type { LinkItem } from "@/lib/data";
import { ClassicShell } from "./Shell";
import { GreenBanner } from "./Banners";
import { CoverImage } from "./CoverImage";
import { SERIF } from "./format";
import styles from "./classic.module.css";

/** 學生專區 (/students) — 風格A. Green banner → cover + intro + 2×2 link cards. */
export function ClassicStudents({ links }: { links: LinkItem[] }) {
  return (
    <ClassicShell>
      <div className="page-in">
        <GreenBanner eyebrow="Students" title="學生專區" />

        <div className="mx-auto grid max-w-[1180px] grid-cols-1 items-start gap-8 sm:gap-12 px-5 py-10 sm:py-14 md:grid-cols-[300px_1fr] md:px-10">
          <CoverImage src="/images/students.png" alt="農經系學生活動" sizes="(max-width: 768px) 100vw, 300px" rounded={6} style={{ height: "clamp(300px, 45vw, 380px)" }} />

          <div>
            <p style={{ fontSize: 16, lineHeight: 2, color: "var(--ink-soft)", margin: "0 0 28px" }}>
              系學會由本系同學自治運作，籌辦迎新、系際交流、學術講座與各項聯誼活動，是同學參與系上事務、認識彼此的主要管道。
            </p>
            <div className="grid grid-cols-1 gap-[18px] sm:grid-cols-2">
              {links.map((s) => {
                const inner = (
                  <>
                    <div style={{ fontFamily: SERIF, fontSize: 17, fontWeight: 600, color: "var(--brand-green)" }}>{s.label}</div>
                    <div style={{ fontSize: 13, color: "var(--gold-deep)", marginTop: 8 }}>前往 →</div>
                  </>
                );
                const cardStyle = { border: "1px solid var(--hairline)", borderRadius: 6, padding: 22, display: "block" as const };
                return s.url && s.url !== "#" ? (
                  <a key={s.id} href={s.url} target="_blank" rel="noopener noreferrer" className={styles.card} style={cardStyle}>
                    {inner}
                  </a>
                ) : (
                  <div key={s.id} className={styles.card} style={cardStyle}>
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
