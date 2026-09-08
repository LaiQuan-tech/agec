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
 * 🔴 只有 `bio_html` 非空的老師。這個條件同時決定三件事，而且**只有一個
 * 判斷點**（lib/data.ts 的 getFacultyById 直接回 null）：
 *   1. 卡片上那條連結指向站內還是站外
 *   2. generateStaticParams 產生哪些頁
 *   3. 這條路由對其他 id 的回應（404）
 * 分散成三份條件的話，遲早會出現「卡片連過去卻 404」或「有頁面但沒有入口」。
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

  // getFacultyById 保證 bio_html 非空，但型別上仍是 nullable —— 這裡的 ?? ""
  // 是型別窄化，不是防禦。
  const html = sanitizeHtml(member.bio_html ?? "", RICH_TEXT_SANITIZE);

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

          {/* 職稱在名字上面，與卡片的順序一致 —— 讀者從卡片點進來，第一眼要
              對得上他剛剛看到的東西。 */}
          <p className="post-byline">{member.title}</p>
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
            ) : null}
            <div>
              <dt>{t.legacy.fieldsLabel}</dt>
              <dd>{member.fields ?? categoryLabel(member.category, lang)}</dd>
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
              {/* 站外的個人網頁與這一頁**並存**：系辦寫了站內介紹，不代表老師
                  的實驗室網頁就該消失。卡片上只放得下一條連結，這一頁放得下兩條。 */}
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
            </div>
          </dl>
        </div>

        <div
          className="container post-body"
          dangerouslySetInnerHTML={{ __html: html }}
        />

        <div className="container post-foot">
          <Link href={listPath}>{t.backToList}</Link>
        </div>
      </article>
      <NextRoute lang={lang} />
    </SiteShell>
  );
}
