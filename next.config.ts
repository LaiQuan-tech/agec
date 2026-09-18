import type { NextConfig } from "next";

/**
 * 全站共用的安全回應標頭（上線前的安全測試抓到整站一個都沒有）。
 *
 * 只放「不會改變任何頁面行為」的幾條：
 *   - 不准被別的網站用 <iframe> 崁入（X-Frame-Options 給舊瀏覽器、
 *     frame-ancestors 給新的）。/login 與後台被崁進釣魚頁就是點擊劫持。
 *     ⚠️ 這是「誰能崁我們」，不是「我們能崁誰」—— 消息內文的 YouTube 影片
 *     （lib/sanitize.ts 只放行這一個網域）不受影響。
 *   - nosniff：attachments 桶收 doc／zip，瀏覽器不准把回應猜成別的型別執行。
 *   - Referrer-Policy：連到校外網站時只帶網域，不帶完整網址。
 *   - Permissions-Policy：整站沒有任何頁面用相機／麥克風／定位，直接關掉。
 *
 * 刻意沒有完整的 CSP（script-src 那一套）：Next 的 inline script 需要 nonce，
 * 整站的 layout 都要跟著改，不是這一輪能安全做完的事。
 */
const SECURITY_HEADERS = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'; base-uri 'self'; object-src 'none'" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  // 不回 `x-powered-by: Next.js`：少給一個對照 CVE 用的框架指紋。
  poweredByHeader: false,
  async headers() {
    return [{ source: "/(.*)", headers: SECURITY_HEADERS }];
  },
  images: {
    // Faculty photos / news covers / journal & poster art live in Supabase
    // Storage (public buckets) and are referenced by full URL from lib/data.ts
    // rows (faculty.photo_url, news.cover_url). Whitelisted so next/image can
    // optimize them once the theme components start rendering real photos.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "amwiaanlvxupzfzaruwr.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
