"use client";

import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { NAV_ITEMS } from "@/lib/nav";
import type { NewsItem, Program } from "@/lib/data";
import { Deck, type SlideDef } from "./Deck";
import { DeckHeader } from "./DeckHeader";
import { useReveal } from "@/hooks/useReveal";

/**
 * 投影片版 (首頁 / 與 /deck) — an Apple-Keynote-clean, one-slide-at-a-time 簡報:
 * hero → 願景 statement → 本系簡介 numbers → 學制 → 最新消息 → 探索更多. The deck
 * owns a fixed, minimal monochrome look (near-black text on white / off-white,
 * a couple of full-black slides, one Apple-green accent), independent of the
 * 風格A/B [data-theme]. Typography uses the platform Apple faces (SF Pro /
 * PingFang) with Noto Sans TC as the cross-platform fallback.
 *
 * Content is data-driven (programs / news from Supabase via lib/data.ts) with
 * representative fallbacks so it reads well before the DB is reachable.
 */

// ── Apple palette + type ────────────────────────────────────────────────────
const FONT =
  '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", var(--font-noto-sans-tc), "PingFang TC", "Noto Sans TC", sans-serif';
const INK = "#1d1d1f"; // near-black text (light slides)
const GRAY = "#6e6e73"; // secondary text (light)
const LIGHT = "#f5f5f7"; // text on dark slides
const GRAY_D = "#86868b"; // secondary text (dark)
const GREEN = "#34c759"; // Apple-green accent
const LINE = "#d2d2d7"; // hairline (light)
const LINE_D = "rgba(255,255,255,0.14)"; // hairline (dark)

function formatDate(iso: string): string {
  return iso.slice(0, 10).replaceAll("-", ".");
}

/** Apple-style fade-up wrapper; `delay` (ms) staggers siblings. */
function Reveal({
  children,
  delay,
  style,
}: {
  children: ReactNode;
  delay?: number;
  style?: CSSProperties;
}) {
  const ref = useReveal<HTMLDivElement>();
  return (
    <div
      ref={ref}
      className="deck-reveal"
      style={{ transitionDelay: delay ? `${delay}ms` : undefined, ...style }}
    >
      {children}
    </div>
  );
}

function Kicker({ children }: { children: ReactNode }) {
  return (
    <p
      style={{
        fontFamily: FONT,
        fontSize: "clamp(0.85rem, 1.6vw, 1.05rem)",
        fontWeight: 600,
        letterSpacing: "0.01em",
        color: GREEN,
        margin: 0,
      }}
    >
      {children}
    </p>
  );
}

function Heading({
  children,
  dark,
  style,
}: {
  children: ReactNode;
  dark?: boolean;
  style?: CSSProperties;
}) {
  return (
    <h2
      style={{
        fontFamily: FONT,
        fontWeight: 600,
        fontSize: "clamp(1.9rem, 5vw, 3.25rem)",
        letterSpacing: "-0.02em",
        lineHeight: 1.12,
        margin: "0.9rem 0 0",
        color: dark ? LIGHT : INK,
        ...style,
      }}
    >
      {children}
    </h2>
  );
}

const Chevron = () => (
  <svg width="20" height="12" viewBox="0 0 20 12" fill="none" aria-hidden>
    <path
      d="M2 2l8 8 8-8"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const Arrow = () => (
  <span aria-hidden style={{ color: GRAY_D }}>
    →
  </span>
);

// ── Slides ──────────────────────────────────────────────────────────────────
function HeroSlide(): ReactNode {
  return (
    <div style={{ textAlign: "center", color: LIGHT, fontFamily: FONT }}>
      <Reveal>
        <h1
          style={{
            fontFamily: FONT,
            fontWeight: 600,
            fontSize: "clamp(3rem, 9vw, 7rem)",
            letterSpacing: "-0.03em",
            lineHeight: 1.05,
            margin: 0,
            textShadow: "0 1px 40px rgba(0,0,0,0.35)",
          }}
        >
          農業經濟學系
        </h1>
      </Reveal>
      <Reveal delay={120}>
        <p
          style={{
            marginTop: "1.35rem",
            fontSize: "clamp(1rem, 2.4vw, 1.6rem)",
            fontWeight: 400,
            letterSpacing: "0.01em",
            color: "rgba(255,255,255,0.86)",
          }}
        >
          國立臺灣大學 · Department of Agricultural Economics
        </p>
      </Reveal>
      <Reveal delay={260}>
        <div
          className="deck-hint"
          style={{
            marginTop: "3.5rem",
            display: "inline-flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "0.55rem",
            color: "rgba(255,255,255,0.68)",
          }}
        >
          <span style={{ fontSize: "0.75rem", letterSpacing: "0.22em" }}>
            向下瀏覽
          </span>
          <Chevron />
        </div>
      </Reveal>
    </div>
  );
}

function StatementSlide(): ReactNode {
  return (
    <div style={{ textAlign: "center" }}>
      <Reveal>
        <h2
          style={{
            fontFamily: FONT,
            fontWeight: 600,
            fontSize: "clamp(2rem, 6.2vw, 4.5rem)",
            letterSpacing: "-0.02em",
            lineHeight: 1.14,
            color: INK,
            margin: 0,
            maxWidth: "20ch",
            marginLeft: "auto",
            marginRight: "auto",
          }}
        >
          以經濟學的眼光，
          <br />
          看見農業與世界的未來。
        </h2>
      </Reveal>
      <Reveal delay={140}>
        <p
          style={{
            margin: "1.9rem auto 0",
            maxWidth: "38rem",
            fontSize: "clamp(1.05rem, 2vw, 1.35rem)",
            lineHeight: 1.7,
            color: GRAY,
          }}
        >
          從糧食安全到資源永續，以嚴謹的分析回應這個時代最關鍵的課題。
        </p>
      </Reveal>
    </div>
  );
}

function NumbersSlide(): ReactNode {
  const stats = [
    { n: "1919", label: "學術傳承起點" },
    { n: "450+", label: "碩博畢業系友" },
    { n: "頂尖", label: "教學與研究目標" },
  ];
  return (
    <div style={{ color: LIGHT }}>
      <Reveal>
        <Kicker>本系簡介</Kicker>
      </Reveal>
      <Reveal delay={80}>
        <Heading dark>百年傳承，經世濟農</Heading>
      </Reveal>
      <div
        style={{
          marginTop: "clamp(2.5rem, 5vw, 4rem)",
          display: "grid",
          gap: "clamp(1.75rem, 4vw, 3.5rem)",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
        }}
      >
        {stats.map((s, i) => (
          <Reveal key={s.label} delay={140 + i * 100}>
            <div
              style={{
                fontFamily: FONT,
                fontWeight: 600,
                fontSize: "clamp(2.6rem, 6.5vw, 4.75rem)",
                letterSpacing: "-0.03em",
                lineHeight: 1,
                color: LIGHT,
              }}
            >
              {s.n}
            </div>
            <div
              style={{
                marginTop: "0.75rem",
                fontSize: "clamp(0.9rem, 1.6vw, 1.05rem)",
                color: GRAY_D,
              }}
            >
              {s.label}
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  );
}

const FALLBACK_PROGRAMS: Pick<Program, "name" | "name_en" | "description">[] = [
  {
    name: "學士班",
    name_en: "Undergraduate",
    description: "厚植經濟學基礎，結合農業、資源與數量分析的跨域訓練。",
  },
  {
    name: "碩士班",
    name_en: "Master's",
    description: "深化理論與實證方法，投入農業政策與資源經濟研究。",
  },
  {
    name: "博士班",
    name_en: "Doctoral",
    description: "培育具國際視野的研究人才，開展前沿學術與政策貢獻。",
  },
  {
    name: "碩士在職專班",
    name_en: "Executive Master's",
    description: "為在職專業人士打造，銜接產業實務與學術新知。",
  },
];

function ProgramsSlide({ programs }: { programs: Program[] }): ReactNode {
  const list = programs.length > 0 ? programs.slice(0, 4) : FALLBACK_PROGRAMS;
  return (
    <div style={{ color: INK }}>
      <Reveal>
        <Kicker>學制</Kicker>
      </Reveal>
      <Reveal delay={80}>
        <Heading>四種求學路徑</Heading>
      </Reveal>
      <div
        style={{
          marginTop: "clamp(2rem, 4vw, 3rem)",
          display: "grid",
          gap: "1rem",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        }}
      >
        {list.map((p, i) => (
          <Reveal key={p.name} delay={120 + i * 80}>
            <div
              style={{
                height: "100%",
                background: "#fff",
                border: `1px solid ${LINE}`,
                borderRadius: "18px",
                padding: "1.75rem",
              }}
            >
              <div
                style={{
                  fontFamily: FONT,
                  fontWeight: 600,
                  fontSize: "1rem",
                  color: GRAY_D,
                }}
              >
                {String(i + 1).padStart(2, "0")}
              </div>
              <div
                style={{
                  fontFamily: FONT,
                  fontWeight: 600,
                  fontSize: "1.5rem",
                  letterSpacing: "-0.01em",
                  marginTop: "0.65rem",
                  color: INK,
                }}
              >
                {p.name}
              </div>
              {p.name_en ? (
                <div
                  style={{
                    fontSize: "0.85rem",
                    color: GRAY_D,
                    marginTop: "0.2rem",
                  }}
                >
                  {p.name_en}
                </div>
              ) : null}
              {p.description ? (
                <p
                  style={{
                    marginTop: "1rem",
                    fontSize: "0.95rem",
                    lineHeight: 1.7,
                    color: GRAY,
                  }}
                >
                  {p.description}
                </p>
              ) : null}
            </div>
          </Reveal>
        ))}
      </div>
      <Reveal delay={420}>
        <Link
          href="/admissions"
          style={{
            display: "inline-block",
            marginTop: "2rem",
            fontFamily: FONT,
            fontSize: "1rem",
            fontWeight: 500,
            color: "#0071e3",
            textDecoration: "none",
          }}
        >
          查看招生資訊 →
        </Link>
      </Reveal>
    </div>
  );
}

function NewsSlide({ news }: { news: NewsItem[] }): ReactNode {
  const rows = news.slice(0, 4);
  return (
    <div style={{ color: INK }}>
      <Reveal>
        <Kicker>最新消息</Kicker>
      </Reveal>
      <Reveal delay={80}>
        <Heading>系上動態</Heading>
      </Reveal>
      {rows.length > 0 ? (
        <div style={{ marginTop: "clamp(1.75rem, 3vw, 2.5rem)", borderTop: `1px solid ${LINE}` }}>
          {rows.map((item, i) => (
            <Reveal key={item.id} delay={120 + i * 70}>
              <Link
                href="/news"
                style={{
                  display: "flex",
                  gap: "1.5rem",
                  alignItems: "baseline",
                  flexWrap: "wrap",
                  padding: "1.25rem 0",
                  borderBottom: `1px solid ${LINE}`,
                  textDecoration: "none",
                }}
              >
                <span
                  style={{
                    minWidth: "6rem",
                    fontSize: "0.95rem",
                    color: GRAY_D,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {formatDate(item.published_at)}
                </span>
                <span style={{ fontSize: "0.8rem", fontWeight: 600, color: GREEN }}>
                  {item.category}
                </span>
                <span
                  style={{
                    flex: "1 1 55%",
                    fontSize: "clamp(1rem, 1.8vw, 1.2rem)",
                    fontWeight: 500,
                    color: INK,
                  }}
                >
                  {item.title}
                </span>
                <Arrow />
              </Link>
            </Reveal>
          ))}
        </div>
      ) : (
        <Reveal delay={120}>
          <p style={{ marginTop: "1.5rem", fontSize: "1.1rem", lineHeight: 1.8, color: GRAY }}>
            近期消息將在此處發布，敬請期待系上最新公告與活動資訊。
          </p>
        </Reveal>
      )}
      <Reveal delay={420}>
        <Link
          href="/news"
          style={{
            display: "inline-block",
            marginTop: "1.75rem",
            fontFamily: FONT,
            fontSize: "1rem",
            fontWeight: 500,
            color: "#0071e3",
            textDecoration: "none",
          }}
        >
          所有消息 →
        </Link>
      </Reveal>
    </div>
  );
}

function ClosingSlide(): ReactNode {
  const links = NAV_ITEMS.filter((item) => item.href !== "/");
  return (
    <div style={{ color: LIGHT }}>
      <Reveal>
        <Kicker>探索更多</Kicker>
      </Reveal>
      <Reveal delay={80}>
        <Heading dark>走進農經系</Heading>
      </Reveal>
      <div
        style={{
          marginTop: "clamp(2rem, 4vw, 3rem)",
          display: "grid",
          gap: "0 2.5rem",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          borderTop: `1px solid ${LINE_D}`,
        }}
      >
        {links.map((item, i) => (
          <Reveal key={item.href} delay={120 + i * 50}>
            <Link
              href={item.href}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "1.05rem 0",
                borderBottom: `1px solid ${LINE_D}`,
                fontFamily: FONT,
                fontSize: "1.15rem",
                fontWeight: 500,
                color: LIGHT,
                textDecoration: "none",
              }}
            >
              {item.label}
              <Arrow />
            </Link>
          </Reveal>
        ))}
      </div>
      <Reveal delay={460}>
        <div
          style={{
            marginTop: "clamp(2rem, 4vw, 3rem)",
            fontSize: "0.9rem",
            lineHeight: 1.9,
            color: GRAY_D,
          }}
        >
          <p style={{ margin: 0, color: LIGHT, fontWeight: 500, fontSize: "1rem" }}>
            國立臺灣大學 農業經濟學系
          </p>
          <p style={{ margin: "0.4rem 0 0" }}>
            10617 臺北市大安區羅斯福路四段一號・農業綜合館
          </p>
          <p style={{ margin: 0 }}>(02) 3366-2600</p>
        </div>
      </Reveal>
    </div>
  );
}

export function PitchDeck({
  newsHome,
  programs,
}: {
  newsHome: NewsItem[];
  programs: Program[];
}) {
  const items: SlideDef[] = [
    {
      id: "hero",
      label: "首頁",
      image: "/images/hero.png",
      overlay:
        "linear-gradient(180deg, rgba(0,0,0,0.18) 0%, rgba(0,0,0,0.52) 100%)",
      surface: "#000000",
      parallax: 0.2,
      content: <HeroSlide />,
    },
    {
      id: "vision",
      label: "願景",
      surface: "#fbfbfd",
      content: <StatementSlide />,
    },
    {
      id: "about",
      label: "本系簡介",
      surface: "#000000",
      content: <NumbersSlide />,
    },
    {
      id: "programs",
      label: "學制",
      surface: "#ffffff",
      content: <ProgramsSlide programs={programs} />,
    },
    {
      id: "news",
      label: "最新消息",
      surface: "#fbfbfd",
      content: <NewsSlide news={newsHome} />,
    },
    {
      id: "explore",
      label: "探索更多",
      surface: "#000000",
      content: <ClosingSlide />,
    },
  ];

  return (
    <>
      <DeckHeader />
      <Deck items={items} />
    </>
  );
}
