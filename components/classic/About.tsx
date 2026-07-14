import { ClassicShell } from "./Shell";
import { ImageBanner } from "./Banners";
import { CoverImage } from "./CoverImage";
import { SERIF } from "./format";
import styles from "./classic.module.css";

const EYEBROW = {
  fontSize: 13,
  letterSpacing: ".24em",
  color: "var(--gold-deep)",
  fontWeight: 600,
  textTransform: "uppercase",
  marginBottom: 14,
} as const;

const STATS = [
  { n: "1919", label: "學術傳承起點" },
  { n: "450+", label: "碩博畢業系友" },
  { n: "5", label: "大學至國際專班學制" },
];

/** 本系簡介 (/about) — 風格A. Image banner → 系史 → Mission 卡 → 三格統計. */
export function ClassicAbout() {
  return (
    <ClassicShell>
      <div className="page-in">
        <ImageBanner
          src="/images/campus.png"
          eyebrow="About Us"
          title="本系簡介"
          overlay="linear-gradient(180deg,rgba(30,45,32,.2),rgba(30,45,32,.6))"
        />

        <div className="mx-auto max-w-[1180px] px-5 py-10 sm:py-16 md:px-10">
          {/* 系史 */}
          <div className={`${styles.enter} mb-9 sm:mb-16 grid grid-cols-1 items-center gap-9 sm:gap-[52px] md:grid-cols-2`} style={{ animationDelay: ".05s" }}>
            <div>
              <div style={EYEBROW}>History · 系史</div>
              <h2 style={{ fontFamily: SERIF, fontSize: 28, color: "var(--brand-green)", lineHeight: 1.5, margin: "0 0 18px" }}>
                歷史悠久的農業經濟學術重鎮
              </h2>
              <p style={{ fontSize: "15.5px", lineHeight: 2, color: "var(--ink-soft)" }}>
                本系為臺灣農業經濟研究與人才培育的重要基地，長期致力於農業政策、資源與環境經濟、市場與行銷、農村發展等領域。至今培育碩士畢業生逾四百餘人、博士畢業生數十人，系友遍及政界、學界、金融與產業界。
              </p>
            </div>
            <CoverImage src="/images/historic.png" alt="系史歷史照片" sizes="(max-width: 768px) 100vw, 560px" rounded={4} style={{ height: 300 }} />
          </div>

          {/* Mission */}
          <div
            className={styles.enter}
            style={{ background: "var(--cream)", border: "1px solid var(--cream-border)", borderRadius: 6, padding: "clamp(28px, 6vw, 44px)", marginBottom: "clamp(32px, 6vw, 48px)", animationDelay: ".1s" }}
          >
            <div style={EYEBROW}>Mission · 教學與研究目標</div>
            <p className="text-[20px] md:text-[24px]" style={{ fontFamily: SERIF, lineHeight: 1.7, color: "var(--brand-green)", fontWeight: 500, margin: 0 }}>
              「培養我國高級農業經濟人才，配合國家現代化農業建設，並以追求世界一流之教學與研究水準，提升我國農業經濟學術地位為發展目標。」
            </p>
          </div>

          {/* 統計 */}
          <div className={`${styles.enter} grid grid-cols-1 gap-6 sm:grid-cols-3`} style={{ animationDelay: ".16s" }}>
            {STATS.map((s) => (
              <div key={s.n} className="text-center" style={{ padding: 28, border: "1px solid var(--hairline)", borderRadius: 6 }}>
                <div style={{ fontFamily: SERIF, fontSize: 44, fontWeight: 700, color: "var(--brand-gold)" }}>{s.n}</div>
                <div style={{ fontSize: 14, color: "var(--muted)", marginTop: 6 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </ClassicShell>
  );
}
