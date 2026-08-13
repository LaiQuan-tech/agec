import type { Metadata } from "next";
import { Noto_Serif_TC, Noto_Sans_TC } from "next/font/google";
import "./globals.css";

// Heading font — see --font-heading in app/globals.css.
const notoSerifTC = Noto_Serif_TC({
  variable: "--font-noto-serif-tc",
  weight: ["400", "500", "600", "700", "900"],
  subsets: ["latin"],
  display: "swap",
});

// Body copy font for the public site, and the admin's only font.
const notoSansTC = Noto_Sans_TC({
  variable: "--font-noto-sans-tc",
  weight: ["300", "400", "500", "700", "900"],
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    template: "%s | 國立臺灣大學 農業經濟學系",
    default: "國立臺灣大學 農業經濟學系",
  },
  description:
    "國立臺灣大學農業經濟學系（Dept. of Agricultural Economics, NTU）官方網站：最新消息、本系簡介、系所成員、招生資訊、課程資訊、學生專區與系友專區。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-Hant"
      className={`${notoSerifTC.variable} ${notoSansTC.variable}`}
    >
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
