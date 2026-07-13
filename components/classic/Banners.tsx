import Image from "next/image";
import { SERIF } from "./format";

/**
 * Solid dark-green page banner (News / Faculty / Courses / Journal / Alumni).
 * README §Screens — green banner with gold eyebrow + serif 40px title.
 */
export function GreenBanner({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div style={{ background: "var(--brand-green)" }} className="px-5 py-14 md:px-10">
      <div className="mx-auto max-w-[1180px]">
        <div style={{ fontSize: 13, letterSpacing: ".3em", color: "var(--gold-bright)", textTransform: "uppercase", fontWeight: 600 }}>
          {eyebrow}
        </div>
        <h1 className="text-[30px] md:text-[40px]" style={{ fontFamily: SERIF, color: "#fff", margin: "10px 0 0" }}>
          {title}
        </h1>
      </div>
    </div>
  );
}

/**
 * 300px full-bleed image banner (About / Admissions). README §Screens —
 * campus/students image + green scrim + gold eyebrow + serif 44px title.
 */
export function ImageBanner({
  src,
  eyebrow,
  title,
  overlay,
}: {
  src: string;
  eyebrow: string;
  title: string;
  overlay: string;
}) {
  return (
    <div style={{ position: "relative", height: 300, overflow: "hidden", background: "#cfc9b4" }}>
      <Image src={src} alt="" fill priority sizes="100vw" style={{ objectFit: "cover" }} />
      <div style={{ position: "absolute", inset: 0, background: overlay }} />
      <div className="absolute inset-0 flex flex-col justify-center px-5 md:px-10">
        <div className="mx-auto w-full max-w-[1180px]">
          <div style={{ fontSize: 13, letterSpacing: ".3em", color: "var(--gold-bright)", textTransform: "uppercase", fontWeight: 600 }}>
            {eyebrow}
          </div>
          <h1 className="text-[32px] md:text-[44px]" style={{ fontFamily: SERIF, color: "#fff", margin: "10px 0 0" }}>
            {title}
          </h1>
        </div>
      </div>
    </div>
  );
}
