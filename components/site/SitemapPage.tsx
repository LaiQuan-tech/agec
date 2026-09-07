import Link from "next/link";
import { localizePath, translate, type Lang } from "@/lib/i18n";
import { SITEMAP } from "@/lib/i18n/sitemap";
import { SHARED } from "@/lib/i18n/shared";
import { SiteShell } from "./SiteShell";
import { NextRoute } from "./NextRoute";
import { sitemapTree } from "./sitemap-tree";

/**
 * 網站導覽 (/sitemap, /en/sitemap).
 *
 * 一頁攤開整個系網：八條路線，每一條底下是那一頁真正存在的區塊。參考臺大官網
 * 的 https://www.ntu.edu.tw/sitemap.html —— 編號的大區塊、底下編號的細項、
 * 全部是連結。
 *
 * ## 為什麼是一頁，而不是原本的頁尾錨點
 *
 * 機構列的「網站導覽」以前是 `href="#sitemap"`，跳到頁尾那兩欄。那兩欄只有
 * 七條路線的名字 —— 它是頁尾連結，不是網站導覽：讀者按下「網站導覽」想知道的是
 * 「這個站有什麼」，而不是被送到他剛剛捲過的那一頁的最底下。
 *
 * ## 為什麼是 `<ol>` 而不是 `<ul>`
 *
 * 每一項都印著編號（01、01-1…），而編號就是它在清單裡的位置。用 `<ul>` 再自己
 * 印一串數字，讀屏會念出「清單 六個項目」卻不會告訴使用者現在是第幾個 ——
 * 那個資訊只存在於視覺。`<ol>` 讓兩邊說同一件事。
 *
 * ## 為什麼不列出每一則消息
 *
 * 網站導覽是「這個站的結構」，不是「這個站的內容」。585 列消息屬於
 * /sitemap.xml（app/sitemap.ts，給爬蟲）與 /search（給人）。這一頁列到分類頁
 * 為止 —— 再往下就是資料，不是架構。
 */
export function SitemapPage({ lang }: { lang: Lang }) {
  const t = translate(SITEMAP, lang);
  const shared = translate(SHARED, lang);
  const groups = sitemapTree(lang);
  const here = localizePath("/sitemap", lang);

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
          {/* 沿用 /news/[id] 的標題下方段落樣式 —— 同一個角色，同一個外觀。 */}
          <p className="post-standfirst">{t.lead}</p>
        </div>

        {/* 不是 `.post-body`：那個類別是 760px 的閱讀寬度（給一篇文章用的），
            而這是一份目錄，要的是容器全寬的兩欄。它同時也會把 Preflight 拿掉的
            list-style 加回來，讓下面兩層 <ol> 都長出 1. 2. 3.。 */}
        <div className="container sitemap-body">
          <ol className="sitemap-groups">
            {groups.map((group) => (
              <li key={group.label} className="sitemap-group">
                <h2>
                  {group.no && (
                    <span className="sitemap-no" aria-hidden="true">
                      {group.no}
                    </span>
                  )}
                  {/* 「其他」沒有自己的頁面，所以標題是純文字。八條路線的標題
                      都是連結，這裡給一個代打的目的地會讓那個約定失效。 */}
                  {group.href ? (
                    <Link href={group.href}>{group.label}</Link>
                  ) : (
                    <span>{group.label}</span>
                  )}
                </h2>

                {group.children.length > 0 && (
                  <ol className="sitemap-children">
                    {group.children.map((child) => (
                      <li key={child.href}>
                        {child.no && (
                          <span className="sitemap-sub-no" aria-hidden="true">
                            {child.no}
                          </span>
                        )}
                        <Link
                          href={child.href}
                          // 這一頁自己就在清單裡（其他 → 網站導覽）。標出來，
                          // 讀屏使用者才不會以為那是另一個沒去過的地方。
                          aria-current={child.href === here ? "page" : undefined}
                        >
                          {child.label}
                        </Link>
                      </li>
                    ))}
                  </ol>
                )}
              </li>
            ))}
          </ol>
        </div>
      </article>
      <NextRoute lang={lang} />
    </SiteShell>
  );
}
