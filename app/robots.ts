import type { MetadataRoute } from "next";
import { SITE_ORIGIN } from "@/lib/site-routes";

/**
 * /robots.txt。上線前的全站爬蟲發現這個路徑回 404：沒有它，搜尋引擎找不到
 * sitemap 的位置，後台與登入頁也沒有任何「別收錄」的宣告。
 *
 * - 後台、登入、忘記／重設密碼：不該出現在搜尋結果裡（proxy.ts 會把未登入的
 *   /admin 轉到 /login，但 /login 本身是 200，會被當成一頁正常內容收走）。
 * - /search：站內搜尋結果頁沒有 canonical，每個 ?q= 都是一頁，放著會被無限收錄。
 * - sitemap 用 SITE_ORIGIN 組絕對網址，與 app/sitemap.ts 的 loc 同一個來源，
 *   換正式網域時只要改那一處。
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/login",
          "/forgot-password",
          "/reset-password",
          "/search",
          "/en/search",
        ],
      },
    ],
    sitemap: `${SITE_ORIGIN}/sitemap.xml`,
  };
}
