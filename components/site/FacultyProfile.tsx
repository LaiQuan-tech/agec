import Link from "next/link";
import sanitizeHtml from "sanitize-html";
import type { Faculty } from "@/lib/data";
import { localizePath, translate, type Lang } from "@/lib/i18n";
import {
  FACULTY,
  categoryLabel,
  fill,
  namePair,
} from "@/lib/i18n/faculty";
import { SHARED } from "@/lib/i18n/shared";
import { RICH_TEXT_SANITIZE } from "@/lib/sanitize";
import { SiteShell } from "./SiteShell";
import { NextRoute } from "./NextRoute";

/**
 * 老師的站內個人頁 (/faculty/[id], /en/faculty/[id]).
 *
 * ## 為什麼有這一頁
 *
 * `homepage_url`（20260908160000）解的是「連出去」：老師有自己的實驗室網頁就
 * 連過去。但很多老師沒有，或那一頁早就不再更新 —— 系辦希望能自己在後台寫、
 * 自己維護。所以再加一組內文欄位（20260908170000），有寫就長出這一頁。
 *
 * ## 誰有這一頁
 *
 * 🔴 行政同仁以外**每一位**（2026-09-15 客戶要求：每位教授保留個人網頁的空間，
 * 點進去看得到相關資訊）。判斷只在一個地方（lib/data.ts 的 getFacultyById），
 * 卡片的連結、generateStaticParams、sitemap 與這條路由的 404 都跟著它。
 * 有沒有寫介紹只決定頁上有沒有內文：沒有的頁印基本資料（照片或姓氏首字、
 * 職稱、領域、分機、信箱、個人網站、名譽／退休的重要經歷）。
 *
 * ## 版型
 *
 * 沿用 `.post-*`（與 /news/[id]、/alumni/events/[slug] 相同），不另外做一套：
 * 三頁的形狀一樣（麵包屑、標題、內文），而且共用一份 prose 樣式才跟得上
 * sanitiser 的允許清單 —— 見 lib/sanitize.ts 檔頭那條「三件事一起動」。
 *
 * ## 為什麼渲染時再過濾一次
 *
 * 存檔時已經過濾過了，這裡再一次是刻意的：Server Action 不是唯一能寫進這張
 * 表的路徑（SQL editor、帶 service-role key 的腳本），而這裡是 HTML 送進瀏覽器
 * 前的最後一關。同 NewsPost。
 */
export function FacultyProfile({
  lang,
  member,
}: {
  lang: Lang;
  member: Faculty;
}) {
  const t = translate(FACULTY, lang);
  const shared = translate(SHARED, lang);
  const names = namePair(member, lang);
  const listPath = localizePath("/faculty", lang);

  // 沒寫介紹的老師 bio_html 是 null：不印 .post-body，不印「尚未填寫」。
  const html = member.bio_html ? sanitizeHtml(member.bio_html, RICH_TEXT_SANITIZE) : null;
  // 類別 · 職稱：讀者從列表的某一區點進來，頁首要對得上那一區的名字。
  // 名譽教授／退休師資的職稱本身就是類別名，不印成「名譽教授 · 名譽教授」。
  const category = categoryLabel(member.category, lang);
  const byline = member.title.includes(category) ? member.title : `${category} · ${member.title}`;

  return (
    <SiteShell lang={lang} variant="interior">
      <article className="post-page">
        <div className="container post-head" id="content">
          <div className="breadcrumb">
            <Link href={localizePath("/", lang)}>{shared.home}</Link>
            <span>/</span>
            <Link href={listPath}>{t.title}</Link>
            <span>/</span>
            <span>{names.heading}</span>
          </div>

          {/* 類別與職稱在名字上面，與卡片的順序一致 —— 讀者從卡片點進來，
              第一眼要對得上他剛剛看到的東西。 */}
          <p className="post-byline">{byline}</p>
          <h1>{names.heading}</h1>
          {names.kicker ? (
            <p className="post-standfirst">{names.kicker}</p>
          ) : null}

          {/* 照片、領域、分機、email、站外個人網頁。
              每一項都是「有值才印」，沒有一項是必填的。 */}
          <dl className="profile-facts">
            {member.photo_url ? (
              /* 與卡片同一批照片，來源是 Storage 的公開網址；next/image 需要
                 先把網域設成 remote pattern，而這裡只是一張 120px 的頭像。 */
              // eslint-disable-next-line @next/next/no-img-element
              <img
                className="profile-portrait"
                src={member.photo_url}
                alt={fill(t.cardPortraitAlt, {
                  name: names.heading,
                  title: member.title,
                })}
              />
            ) : (
              /* 沒照片（名譽／退休 11 位都沒有）：與卡片同款的綠底姓氏首字，
                 而不是空一塊。首字維持中文，理由同 FacultyCard。 */
              <span className="profile-portrait profile-portrait-initial" aria-hidden="true">
                {member.name.slice(0, 1)}
              </span>
            )}
            <div>
              {/* 領域沒填就整組不印：類別已經在 byline 上，不再拿它當領域的替身。 */}
              {member.fields ? (
                <>
                  <dt>{t.legacy.fieldsLabel}</dt>
                  <dd>{member.fields}</dd>
                </>
              ) : null}
              {member.extension ? (
                <>
                  <dt>{t.extensionLabel}</dt>
                  <dd>{member.extension}</dd>
                </>
              ) : null}
              {member.email ? (
                <>
                  <dt>Email</dt>
                  <dd>
                    <a href={`mailto:${member.email}`}>{member.email}</a>
                  </dd>
                </>
              ) : null}
              {/* 站外的個人網站與這一頁**並存**：系辦寫了站內介紹，不代表老師
                  的實驗室網頁就該消失。 */}
              {member.homepage_url ? (
                <>
                  <dt>{t.homepageLabel}</dt>
                  <dd>
                    <a
                      href={member.homepage_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {member.homepage_url} ↗︎
                    </a>
                  </dd>
                </>
              ) : null}
              {/* 名譽／退休的重要經歷：卡片列表上就有，這一頁不該比列表少。 */}
              {member.experience ? (
                <>
                  <dt>{t.legacy.experienceLabel}</dt>
                  <dd className="profile-experience">{member.experience}</dd>
                </>
              ) : null}
            </div>
          </dl>
        </div>

        {html ? (
          <div
            className="container post-body"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        ) : null}

        <div className="container post-foot">
          <Link href={listPath}>{t.backToList}</Link>
        </div>
      </article>
      <NextRoute lang={lang} />
    </SiteShell>
  );
}
