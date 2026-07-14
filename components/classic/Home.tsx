import Link from "next/link";
import type { NewsItem, Program } from "@/lib/data";
import { ClassicShell } from "./Shell";
import { HomeHero } from "./HomeHero";
import { StatementBand } from "./StatementBand";
import { Reveal } from "./Reveal";
import { CoverImage } from "./CoverImage";
import { formatNewsDate, SERIF } from "./format";
import styles from "./classic.module.css";

/**
 * 首頁 (/) — 風格A 經典學院派. Hero → 最新消息 + 演講公告 → 招生資訊帶 →
 * 滿版視差引言帶 → 系所簡介 → footer. Renders real props (newsHome/programs);
 * the 演講公告 highlight card + speaker rows have no DB source and stay as the
 * prototype's static copy.
 */
export function ClassicHome({ newsHome, programs }: { newsHome: NewsItem[]; programs: Program[] }) {
  return (
    <ClassicShell>
      <div className="page-in">
        <HomeHero />

        {/* 最新消息 + 演講公告 */}
        <Reveal className="mx-auto max-w-[1180px] px-5 pb-10 pt-10 sm:pb-12 sm:pt-16 md:px-10">
          <div className="grid grid-cols-1 gap-9 sm:gap-[52px] lg:grid-cols-[1.6fr_1fr]">
            {/* 最新消息 */}
            <div className={styles.enter} style={{ animationDelay: ".05s" }}>
              <div className="mb-1 flex items-baseline justify-between" style={{ borderBottom: "3px solid var(--brand-gold)", paddingBottom: 12 }}>
                <h2 style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 24, margin: 0, color: "var(--brand-green)" }}>最新消息</h2>
                <Link href="/news" className={styles.navlink} style={{ fontSize: 13, color: "var(--gold-deep)", fontWeight: 600 }}>
                  更多消息 →
                </Link>
              </div>
              {newsHome.map((n) => {
                const d = formatNewsDate(n.published_at);
                return (
                  <Link
                    key={n.id}
                    href="/news"
                    className={`${styles.row} flex gap-[18px]`}
                    style={{ padding: "18px 0", borderBottom: "1px solid var(--hairline)" }}
                  >
                    <div className="flex-none text-center" style={{ width: 60 }}>
                      <div style={{ fontFamily: SERIF, fontSize: 26, fontWeight: 700, color: "var(--brand-green)" }}>{d.day}</div>
                      <div style={{ fontSize: 11, color: "var(--gold-deep)", letterSpacing: ".1em" }}>{d.ym}</div>
                    </div>
                    <div className="min-w-0">
                      <span
                        className="mb-1.5 inline-block"
                        style={{ background: "var(--brand-gold)", color: "var(--gold-ink)", fontSize: 11, fontWeight: 700, padding: "2px 9px", borderRadius: 2 }}
                      >
                        {n.category}
                      </span>
                      <div style={{ fontSize: "15.5px", lineHeight: 1.6, fontWeight: 500 }}>{n.title}</div>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* 演講公告 (static highlight — no DB source) */}
            <div className={styles.enter} style={{ animationDelay: ".16s" }}>
              <div className="mb-[18px]" style={{ borderBottom: "3px solid var(--brand-gold)", paddingBottom: 12 }}>
                <h2 style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 24, margin: 0, color: "var(--brand-green)" }}>演講公告</h2>
              </div>
              <div className={styles.card} style={{ background: "var(--cream)", border: "1px solid var(--cream-border)", borderRadius: 4, padding: 22 }}>
                <div style={{ fontSize: 12, letterSpacing: ".16em", color: "var(--gold-deep)", fontWeight: 700, marginBottom: 10 }}>2026.05.28 · SEMINAR</div>
                <div style={{ fontFamily: SERIF, fontSize: 19, lineHeight: 1.5, fontWeight: 600, marginBottom: 14, color: "var(--brand-green)" }}>
                  農業數據與農業政策研討會
                </div>
                <CoverImage src="/images/poster.png" alt="農業數據與農業政策研討會 演講海報" sizes="(max-width: 1024px) 100vw, 400px" rounded={3} style={{ height: 120 }} />
              </div>
              <div style={{ marginTop: 16, fontSize: 14, lineHeight: 1.9 }}>
                <div style={{ padding: "10px 0", borderBottom: "1px solid var(--hairline)" }}>6/08 Roger H. von Haefen 教授（NC State）蒞臨演講</div>
                <div style={{ padding: "10px 0" }}>5/29 傅羿寧（臺灣大學農業經濟學系）蒞臨演講</div>
              </div>
            </div>
          </div>
        </Reveal>

        {/* 招生資訊帶 */}
        <Reveal style={{ background: "var(--cream)", borderTop: "1px solid var(--cream-border)", borderBottom: "1px solid var(--cream-border)", padding: "clamp(32px, 6vw, 52px) 0" }}>
          <div className="mx-auto max-w-[1180px] px-5 md:px-10">
            <div className="mb-7 flex items-baseline gap-3.5">
              <h2 style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 24, margin: 0, color: "var(--brand-green)" }}>招生資訊</h2>
              <span style={{ fontSize: 13, color: "var(--gold-deep)" }}>Admissions</span>
            </div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {programs.slice(0, 4).map((p) => (
                <Link
                  key={p.id}
                  href="/admissions"
                  className={styles.card}
                  style={{ background: "#fff", border: "1px solid var(--cream-border)", borderRadius: 4, padding: 22 }}
                >
                  <div style={{ fontFamily: SERIF, fontSize: 19, fontWeight: 600, marginBottom: 8, color: "var(--brand-green)" }}>{p.name}</div>
                  <div style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.7 }}>{p.description ?? p.name_en ?? ""}</div>
                </Link>
              ))}
            </div>
          </div>
        </Reveal>

        {/* 滿版視差引言帶 */}
        <StatementBand />

        {/* 系所簡介 */}
        <Reveal className="mx-auto grid max-w-[1180px] grid-cols-1 items-center gap-8 sm:gap-12 px-5 py-12 sm:py-20 md:grid-cols-2 md:px-10">
          <CoverImage src="/images/students.png" alt="系所空間與師生活動" sizes="(max-width: 768px) 100vw, 560px" rounded={4} style={{ height: 320 }} />
          <div className={styles.enter} style={{ animationDelay: ".16s" }}>
            <div style={{ fontSize: 13, letterSpacing: ".24em", color: "var(--gold-deep)", fontWeight: 600, textTransform: "uppercase", marginBottom: 14 }}>
              About · 系所簡介
            </div>
            <h2 style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 30, lineHeight: 1.4, margin: "0 0 20px", color: "var(--brand-green)" }}>
              以世界一流之教學與研究，
              <br />
              提升農業經濟學術地位
            </h2>
            <p style={{ fontSize: "15.5px", lineHeight: 2, color: "var(--ink-soft)", margin: "0 0 24px" }}>
              本系設立宗旨在培養我國高級農業經濟人才，配合國家現代化農業建設。歷年培育的系友於政界、工商與金融界學以致用，對國家社會貢獻卓著。
            </p>
            <Link
              href="/about"
              className={styles.navlink}
              style={{ fontFamily: SERIF, fontSize: 15, fontWeight: 600, color: "var(--brand-green)", borderBottom: "3px solid var(--brand-gold)", paddingBottom: 3 }}
            >
              閱讀系史與願景 →
            </Link>
          </div>
        </Reveal>
      </div>
    </ClassicShell>
  );
}
