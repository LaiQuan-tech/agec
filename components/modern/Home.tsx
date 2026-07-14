import Link from "next/link";
import type { NewsItem, Program } from "@/lib/data";
import { ModernShell } from "./Shell";
import { HomeHero } from "./HomeHero";
import { StatementBand } from "./StatementBand";
import { Reveal } from "./Reveal";
import { CoverImage } from "./CoverImage";
import { formatNewsDate, SANS } from "./format";
import styles from "./modern.module.css";

const QUICK = [
  { n: "01", href: "/admissions", title: "招生資訊", sub: "大學 · 碩 · 博 · 專班", cream: true },
  { n: "02", href: "/courses", title: "課程地圖", sub: "學程與修業", cream: false },
  { n: "03", href: "/faculty", title: "師資陣容", sub: "研究領域", cream: false },
  { n: "04", href: "/journal", title: "農經期刊", sub: "出版與徵稿", cream: false },
];

const MISSION_STATS = [
  { n: "1919", label: "學術傳承起點" },
  { n: "450+", label: "碩博畢業系友" },
  { n: "Top", label: "世界一流目標" },
];

/**
 * 首頁 (/) — 風格B 現代簡潔. Rounded parallax hero → 4 quick-entry cards →
 * 最新消息 (3-col cards) → rounded parallax 引言帶 → Our Mission cream panel →
 * footer. Renders real props (newsHome/programs unused here — quick cards are
 * fixed entry points per the prototype).
 */
export function ModernHome({ newsHome }: { newsHome: NewsItem[]; programs: Program[] }) {
  const news3 = newsHome.slice(0, 3);

  return (
    <ModernShell>
      <div className="page-in">
        {/* full-bleed 全螢幕影片 hero */}
        <HomeHero />
        <div className="mx-auto max-w-[1240px]">
          {/* quick cards */}
          <div className="px-6 pb-10 pt-8 sm:pb-16 sm:pt-12 md:px-11">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {QUICK.map((q) => (
              <Link
                key={q.n}
                href={q.href}
                className={styles.card}
                style={{
                  border: q.cream ? "1px solid var(--cream-border)" : "1px solid var(--hairline)",
                  borderRadius: 18,
                  padding: 26,
                  background: q.cream ? "var(--cream)" : "#fff",
                }}
              >
                <div style={{ fontSize: 22, marginBottom: "clamp(22px, 5vw, 40px)", color: q.cream ? "var(--gold-deep)" : "var(--brand-green)", fontWeight: 900 }}>{q.n}</div>
                <div style={{ fontWeight: 700, fontSize: 16, color: "var(--ink)" }}>{q.title}</div>
                <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 4 }}>{q.sub}</div>
              </Link>
            ))}
          </div>
        </div>

        {/* 最新消息 */}
        <Reveal className="px-6 pb-12 sm:pb-[72px] md:px-11">
          <div className="mb-7 flex items-baseline justify-between">
            <h2 className="text-[24px] sm:text-[30px]" style={{ fontFamily: SANS, fontWeight: 900, margin: 0, letterSpacing: "-.01em", color: "var(--ink)" }}>最新消息</h2>
            <Link href="/news" className={styles.navlink} style={{ fontSize: 14, fontWeight: 600, color: "var(--gold-deep)" }}>
              View all →
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {news3.map((n) => {
              const d = formatNewsDate(n.published_at);
              return (
                <Link
                  key={n.id}
                  href="/news"
                  className={styles.card}
                  style={{ borderRadius: 18, overflow: "hidden", border: "1px solid var(--hairline)", display: "block", background: "#fff" }}
                >
                  <CoverImage src={n.cover_url ?? "/images/gather.png"} alt={n.title} sizes="(max-width: 1024px) 100vw, 400px" style={{ height: 170 }} />
                  <div style={{ padding: 22 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "var(--gold-deep)", letterSpacing: ".08em", marginBottom: 10 }}>
                      {n.category} · {d.md}
                    </div>
                    <div style={{ fontSize: "16.5px", fontWeight: 600, lineHeight: 1.55, color: "var(--ink)" }}>{n.title}</div>
                  </div>
                </Link>
              );
            })}
          </div>
        </Reveal>

        {/* 滿版視差引言帶 */}
        <div className="px-6 md:px-11">
          <StatementBand />
        </div>

        {/* Our Mission */}
        <Reveal className="px-6 pb-10 pt-4 sm:pb-16 sm:pt-6 md:px-11">
          <div style={{ background: "var(--cream)", borderRadius: "var(--radius-hero)", padding: "clamp(40px,6vw,72px)" }}>
            <div className="max-w-[820px]">
              <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: ".24em", color: "var(--gold-deep)", textTransform: "uppercase", marginBottom: 18 }}>
                Our Mission
              </div>
              <h3 className="text-[28px] md:text-[36px]" style={{ fontFamily: SANS, lineHeight: 1.4, fontWeight: 700, margin: "0 0 22px", letterSpacing: "-.01em", color: "var(--brand-green)" }}>
                培育世界一流的農業經濟人才，
                <br />
                提升臺灣農業經濟的學術地位。
              </h3>
              <p style={{ fontSize: 16, lineHeight: 2, color: "#5a584c", margin: 0 }}>
                本系以追求頂尖之教學與研究水準為發展目標，結合政策、市場、資源與永續等面向，回應糧食安全、農村發展與全球農業轉型的關鍵課題。
              </p>
              <div className="mt-8 sm:mt-11 flex flex-wrap gap-x-8 sm:gap-x-14 gap-y-6">
                {MISSION_STATS.map((s) => (
                  <div key={s.n}>
                    <div style={{ fontSize: "clamp(34px, 9vw, 44px)", fontWeight: 900, color: "var(--brand-gold)" }}>{s.n}</div>
                    <div style={{ fontSize: 13, color: "#8a8873", marginTop: 2 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Reveal>
        </div>
      </div>
    </ModernShell>
  );
}
