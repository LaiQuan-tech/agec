"use client";

import { useEffect } from "react";
import { htmlLang, type Lang } from "@/lib/i18n";

/**
 * 把 `<html lang>` 同步成當前頁的語言。
 *
 * app/layout.tsx 寫死 `<html lang="zh-Hant">`（前後台共用、靜態產生，在那裡讀
 * 路徑會讓全站失去 ISR —— 見 SiteShell 的說明），所以 `/en` 的每一頁 SSR 出來
 * 都是 zh-Hant。`<main lang>` 已經正確覆蓋所有看得見的內容，但 `<title>`、
 * 以及只看文件根語言的工具（螢幕閱讀器唸標題的語音、部分 SEO 檢查）看的是
 * `<html>`。
 *
 * 在 effect 裡改、不在 SSR 或 inline script 裡改：hydration 之後才動 DOM，
 * React 不會回報屬性不符，root layout 也維持靜態。切換語言的 client 端導覽會
 * 重跑這個 effect，所以 /en/about → /about 也會切回 zh-Hant。
 */
export function HtmlLang({ lang }: { lang: Lang }) {
  useEffect(() => {
    document.documentElement.lang = htmlLang(lang);
  }, [lang]);
  return null;
}
