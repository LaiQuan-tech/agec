import Link from "next/link";
import type { SearchHit } from "@/lib/search";
import { localizePath, translate, type Lang } from "@/lib/i18n";
import { SEARCH } from "@/lib/i18n/search";
import { SHARED } from "@/lib/i18n/shared";
import { SiteShell } from "./SiteShell";
import { NextRoute } from "./NextRoute";

/**
 * 全站搜尋 (/search, /en/search).
 *
 * ## ⚠️ 全站唯一讀 searchParams 的公開頁面
 *
 * 其餘每一條公開路由都是靜態 ISR，篩選一律走路徑片段（見
 * lib/news-categories.ts 的說明）—— 因為那些頁面的內容是有限且可預先產生的。
 * 搜尋不是：查詢字串是無限的，預先產生沒有意義，而且搜尋結果**本來就不該被
 * 快取**（消息一發佈就該搜得到）。
 *
 * 所以這一頁是動態的，而且是刻意的例外，不是漏掉的重構。
 *
 * ## 為什麼是表單送出而不是前端即時搜尋
 *
 * `<form method="get">` 送到自己這一頁，伺服器渲染結果。好處是**沒有
 * JavaScript 也能用** —— 這是公部門網站該有的。前端即時搜尋要嘛得把整份索引
 * 送到瀏覽器，要嘛得多一個 API 路由，兩者都比這個複雜，而且都在沒有 JS 時
 * 完全不能用。
 *
 * 代價是每次查詢要重新載入一次頁面。以這個站的資料量（最大的表 585 列）
 * 那是幾十毫秒的事。
 *
 * ## robots
 *
 * 路由檔設了 noindex：搜尋結果頁被索引會產生無限多個內容重複的網址，而且
 * 那些網址對讀者沒有價值 —— 他們要的是被搜到的那一則消息本身。
 */
export function SearchPage({
  lang,
  query,
  hits,
  failed,
}: {
  lang: Lang;
  query: string;
  hits: SearchHit[];
  failed: boolean;
}) {
  const t = translate(SEARCH, lang);
  const shared = translate(SHARED, lang);
  const has = query.trim().length > 0;

  return (
    <SiteShell lang={lang} variant="interior">
      <article className="post-page">
        <div className="container post-head" id="content">
          <div className="breadcrumb">
            <Link href={localizePath("/", lang)}>{shared.home}</Link>
            <span>/</span>
            <span>{t.title}</span>
          </div>
          <h1>{t.title}</h1>

          {/*
            `action` 指向自己這一頁，method 預設就是 get —— 所以送出之後網址會
            變成 /search?q=…，可以分享也可以按上一頁。不需要任何 JavaScript。
          */}
          <form className="search-form" action={localizePath("/search", lang)}>
            <label className="sr-only" htmlFor="q">
              {t.inputLabel}
            </label>
            <input
              id="q"
              name="q"
              type="search"
              defaultValue={query}
              placeholder={t.placeholder}
              /* autoFocus 是刻意的：使用者是按了 header 的搜尋圖示才到這一頁的，
                 他唯一想做的事就是打字。⚠️ 只在還沒有查詢字串時聚焦 —— 已經有
                 結果時把焦點搶到輸入框，會讓讀屏使用者聽不到結果那一段。 */
              autoFocus={!has}
              enterKeyHint="search"
              autoComplete="off"
            />
            <button type="submit" className="button gold">
              {t.submit}
            </button>
          </form>

          <p className="search-status" role="status">
            {failed
              ? t.failed
              : !has
                ? t.idle
                : hits.length === 0
                  ? t.empty.replace("{q}", query)
                  : t.count.replace("{n}", String(hits.length)).replace("{q}", query)}
          </p>
        </div>

        <div className="container post-body">
          {hits.length > 0 && (
            <ul className="search-results">
              {hits.map((hit) => (
                <li key={hit.key}>
                  <Link href={hit.href}>
                    <span className="search-kind">{hit.kind}</span>
                    <h2>{hit.title}</h2>
                    {hit.detail && <p>{hit.detail}</p>}
                  </Link>
                </li>
              ))}
            </ul>
          )}

          {/* 範圍說明永遠顯示。使用者搜不到「本系簡介」裡的一句話時，需要知道
              那是範圍問題而不是站上沒有這件事。 */}
          <p className="search-scope">{t.scopeNote}</p>
        </div>

        <div className="container post-foot">
          <Link href={localizePath("/", lang)}>{t.backHome}</Link>
        </div>
      </article>
      <NextRoute lang={lang} />
    </SiteShell>
  );
}
