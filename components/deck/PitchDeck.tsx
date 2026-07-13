"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { NAV_ITEMS } from "@/lib/nav";
import type { NewsItem, Program } from "@/lib/data";
import { Deck, type SlideDef } from "./Deck";
import { DeckHeader } from "./DeckHeader";
import { useReveal } from "@/hooks/useReveal";

/**
 * 投影片版 (/deck) — a standalone, full-screen one-slide-at-a-time 簡報 of the
 * department: hero → 本系簡介 → 學制與課程 → 最新消息 → 探索更多. This is a
 * SEPARATE presentation-format entry; it deliberately does NOT touch the 風格A /
 * 風格B production site (app/page.tsx and the classic/modern components own that).
 *
 * It is built entirely from the shared design tokens, so the 右上角 A/B toggle
 * still re-skins the deck live (serif+square vs sans+rounded) without any
 * per-theme code. Content is data-driven (programs / news from Supabase via
 * lib/data.ts) with representative fallbacks so it reads well before the DB is
 * reachable locally.
 */

function formatDate(iso: string): string {
  return iso.slice(0, 10).replaceAll("-", ".");
}

/** Scroll-reveal wrapper — animates its children in when the slide arrives. */
function Reveal({
  children,
  className,
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  const ref = useReveal<HTMLDivElement>();
  return (
    <div ref={ref} className={`reveal ${className ?? ""}`} style={style}>
      {children}
    </div>
  );
}

const FALLBACK_PROGRAMS: Pick<Program, "name" | "name_en" | "description">[] = [
  {
    name: "學士班",
    name_en: "Undergraduate Program",
    description: "厚植經濟學基礎，結合農業、資源與數量分析的跨域訓練。",
  },
  {
    name: "碩士班",
    name_en: "Master's Program",
    description: "深化理論與實證方法，投入農業政策與資源經濟研究。",
  },
  {
    name: "博士班",
    name_en: "Doctoral Program",
    description: "培育具國際視野的研究人才，開展前沿學術與政策貢獻。",
  },
  {
    name: "碩士在職專班",
    name_en: "Executive Master's Program",
    description: "為在職專業人士打造，銜接產業實務與學術新知。",
  },
];

function HeroSlide(): ReactNode {
  return (
    <Reveal style={{ color: "#fff", textAlign: "center" }}>
      <p
        className="eyebrow"
        style={{ color: "var(--gold-bright)", letterSpacing: "0.3em" }}
      >
        National Taiwan University
      </p>
      <h1
        className="heading-font"
        style={{
          marginTop: "1.25rem",
          fontSize: "clamp(2.75rem, 8vw, 6rem)",
          lineHeight: 1.05,
          textShadow: "0 2px 24px rgba(0,0,0,0.35)",
        }}
      >
        農業經濟學系
      </h1>
      <p
        style={{
          marginTop: "1rem",
          fontSize: "clamp(1rem, 2.4vw, 1.5rem)",
          letterSpacing: "0.12em",
          color: "var(--cream)",
        }}
      >
        Department of Agricultural Economics
      </p>
      <p
        style={{
          margin: "1.75rem auto 0",
          maxWidth: "40rem",
          fontSize: "clamp(0.95rem, 2vw, 1.15rem)",
          lineHeight: 1.9,
          color: "rgba(255,255,255,0.9)",
        }}
      >
        以經濟學的視野，探索農業、資源與人類福祉的未來。
      </p>
      <div
        className="deck-hint"
        style={{
          marginTop: "3rem",
          display: "inline-flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "0.4rem",
          fontSize: "0.8rem",
          letterSpacing: "0.25em",
          color: "var(--gold-bright)",
        }}
      >
        向下探索
        <span aria-hidden style={{ fontSize: "1.25rem", lineHeight: 1 }}>
          ↓
        </span>
      </div>
    </Reveal>
  );
}

function AboutSlide(): ReactNode {
  const stats = [
    { k: "學士・碩士・博士", v: "完整學制" },
    { k: "農業與資源經濟", v: "核心領域" },
    { k: "產官學研", v: "廣布網絡" },
  ];
  return (
    <Reveal>
      <p className="eyebrow">About・本系簡介</p>
      <h2
        className="heading-font"
        style={{ marginTop: "0.75rem", fontSize: "clamp(1.9rem, 5vw, 3.25rem)" }}
      >
        百年傳承，經世濟農
      </h2>
      <p
        style={{
          marginTop: "1.5rem",
          maxWidth: "44rem",
          fontSize: "clamp(1rem, 2vw, 1.2rem)",
          lineHeight: 2,
          color: "var(--ink-soft)",
        }}
      >
        臺大農業經濟學系以嚴謹的經濟分析，回應農業發展、糧食安全、資源永續與農村振興等時代課題，
        培育兼具理論深度與政策視野的專業人才，連結學術研究與真實世界的公共決策。
      </p>
      <div
        style={{
          marginTop: "2.5rem",
          display: "grid",
          gap: "1rem",
          gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
        }}
      >
        {stats.map((s) => (
          <div
            key={s.k}
            style={{
              background: "var(--page-bg)",
              border: "1px solid var(--hairline)",
              borderRadius: "var(--radius-card)",
              padding: "1.5rem 1.5rem 1.25rem",
            }}
          >
            <p
              className="heading-font"
              style={{ fontSize: "1.35rem", color: "var(--brand-green)" }}
            >
              {s.k}
            </p>
            <p
              style={{
                marginTop: "0.5rem",
                fontSize: "0.85rem",
                letterSpacing: "0.15em",
                color: "var(--muted)",
              }}
            >
              {s.v}
            </p>
          </div>
        ))}
      </div>
    </Reveal>
  );
}

function ProgramsSlide({ programs }: { programs: Program[] }): ReactNode {
  const list = programs.length > 0 ? programs.slice(0, 4) : FALLBACK_PROGRAMS;
  return (
    <Reveal>
      <p className="eyebrow">Programs・學制與課程</p>
      <h2
        className="heading-font"
        style={{ marginTop: "0.75rem", fontSize: "clamp(1.9rem, 5vw, 3.25rem)" }}
      >
        四道求學路徑
      </h2>
      <div
        style={{
          marginTop: "2.25rem",
          display: "grid",
          gap: "1rem",
          gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
        }}
      >
        {list.map((p, i) => (
          <div key={p.name} className="surface-card" style={{ padding: "1.5rem" }}>
            <span
              className="heading-font"
              style={{ fontSize: "1.5rem", color: "var(--gold-deep)" }}
            >
              {String(i + 1).padStart(2, "0")}
            </span>
            <p
              className="heading-font"
              style={{ marginTop: "0.5rem", fontSize: "1.4rem" }}
            >
              {p.name}
            </p>
            {p.name_en ? (
              <p
                style={{
                  fontSize: "0.8rem",
                  letterSpacing: "0.08em",
                  color: "var(--muted)",
                }}
              >
                {p.name_en}
              </p>
            ) : null}
            {p.description ? (
              <p
                style={{
                  marginTop: "0.9rem",
                  fontSize: "0.92rem",
                  lineHeight: 1.8,
                  color: "var(--ink-soft)",
                }}
              >
                {p.description}
              </p>
            ) : null}
          </div>
        ))}
      </div>
      <Link
        href="/admissions"
        style={{
          marginTop: "2rem",
          display: "inline-block",
          fontSize: "0.9rem",
          fontWeight: 600,
          color: "var(--brand-green)",
          borderBottom: "2px solid var(--brand-gold)",
          paddingBottom: "2px",
        }}
      >
        查看招生資訊 →
      </Link>
    </Reveal>
  );
}

function NewsSlide({ news }: { news: NewsItem[] }): ReactNode {
  return (
    <Reveal>
      <p className="eyebrow">News・最新消息</p>
      <h2
        className="heading-font"
        style={{ marginTop: "0.75rem", fontSize: "clamp(1.9rem, 5vw, 3.25rem)" }}
      >
        系上動態
      </h2>
      <div style={{ marginTop: "2rem", display: "grid", gap: "0.9rem" }}>
        {news.length > 0 ? (
          news.slice(0, 4).map((item) => (
            <Link
              key={item.id}
              href="/news"
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: "1.25rem",
                flexWrap: "wrap",
                background: "var(--page-bg)",
                border: "1px solid var(--hairline)",
                borderLeft: "4px solid var(--brand-gold)",
                borderRadius: "var(--radius-card)",
                padding: "1.1rem 1.35rem",
              }}
            >
              <span
                style={{
                  fontSize: "0.82rem",
                  fontVariantNumeric: "tabular-nums",
                  color: "var(--muted)",
                }}
              >
                {formatDate(item.published_at)}
              </span>
              <span
                className="eyebrow"
                style={{ fontSize: "0.68rem", color: "var(--gold-deep)" }}
              >
                {item.category}
              </span>
              <span
                style={{
                  flex: "1 1 60%",
                  fontWeight: 600,
                  color: "var(--ink)",
                }}
              >
                {item.is_pinned ? "📌 " : ""}
                {item.title}
              </span>
            </Link>
          ))
        ) : (
          <p style={{ color: "var(--muted)", lineHeight: 1.9 }}>
            近期消息將在此處發布，敬請期待系上最新公告與活動資訊。
          </p>
        )}
      </div>
      <Link
        href="/news"
        style={{
          marginTop: "1.75rem",
          display: "inline-block",
          fontSize: "0.9rem",
          fontWeight: 600,
          color: "var(--brand-green)",
          borderBottom: "2px solid var(--brand-gold)",
          paddingBottom: "2px",
        }}
      >
        所有消息 →
      </Link>
    </Reveal>
  );
}

function ClosingSlide(): ReactNode {
  return (
    <Reveal style={{ color: "#fff" }}>
      <p className="eyebrow" style={{ color: "var(--gold-bright)" }}>
        Explore・探索更多
      </p>
      <h2
        className="heading-font"
        style={{ marginTop: "0.75rem", fontSize: "clamp(1.9rem, 5vw, 3.25rem)" }}
      >
        走進農經系
      </h2>
      <div
        style={{
          marginTop: "2.25rem",
          display: "grid",
          gap: "0.75rem",
          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
        }}
      >
        {NAV_ITEMS.filter((item) => item.href !== "/").map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="heading-font"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "0.5rem",
              fontSize: "1.05rem",
              color: "#fff",
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.18)",
              borderRadius: "var(--radius-card)",
              padding: "1rem 1.15rem",
            }}
          >
            {item.label}
            <span aria-hidden style={{ color: "var(--gold-bright)" }}>
              →
            </span>
          </Link>
        ))}
      </div>
      <div
        style={{
          marginTop: "2.5rem",
          paddingTop: "1.5rem",
          borderTop: "1px solid rgba(255,255,255,0.18)",
          fontSize: "0.9rem",
          lineHeight: 1.9,
          color: "var(--cream)",
        }}
      >
        <p className="heading-font" style={{ fontSize: "1.1rem", color: "#fff" }}>
          國立臺灣大學 農業經濟學系
        </p>
        <p style={{ marginTop: "0.5rem" }}>
          10617 臺北市大安區羅斯福路四段一號・農業綜合館
        </p>
        <p>電話 (02) 3366-2600</p>
      </div>
    </Reveal>
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
        "linear-gradient(180deg, rgba(23,63,42,0.55) 0%, rgba(23,63,42,0.78) 100%)",
      parallax: 0.22,
      content: <HeroSlide />,
    },
    {
      id: "about",
      label: "本系簡介",
      surface: "var(--cream)",
      content: <AboutSlide />,
    },
    {
      id: "programs",
      label: "學制課程",
      surface: "var(--page-bg)",
      content: <ProgramsSlide programs={programs} />,
    },
    {
      id: "news",
      label: "最新消息",
      surface: "var(--cream)",
      content: <NewsSlide news={newsHome} />,
    },
    {
      id: "explore",
      label: "探索更多",
      surface: "var(--green-deep)",
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
