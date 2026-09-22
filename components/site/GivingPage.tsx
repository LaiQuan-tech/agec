import { Fragment } from "react";
import Link from "next/link";
import { localizePath, translate, type Lang } from "@/lib/i18n";
import { ALUMNI } from "@/lib/i18n/alumni";
import { GIVING } from "@/lib/i18n/giving";
import { SHARED } from "@/lib/i18n/shared";
import type { GivingCopy } from "@/lib/page-copy/giving";
import { SiteShell } from "./SiteShell";
import { NextRoute } from "./NextRoute";
import { CopyButton } from "./CopyButton";

/**
 * 匯款帳號資訊 (/alumni/giving 與 /en/alumni/giving)。
 *
 * /alumni#section-3「支持農經」的內頁：系上自己的匯款帳號，給不想經過臺大
 * 捐款平台、要直接匯款的系友。值全部來自 page_copy（page=`giving`，後台
 * /admin/giving），這裡只負責排版與複製鈕。
 *
 * 沿用 /news/[id] 與活動頁的 `.post-*` 版型（麵包屑、eyebrow、標題、前言、
 * 760px 閱讀寬、返回），帳號列表用活動頁的 `<dl class="event-details">`
 * （兩欄、金線、600px 以下單欄）—— 這是「拿來查」不是「拿來讀」的資訊，
 * 與活動的時間地點同一種東西。
 *
 * ## 兩種狀態
 *
 *   `copy.ready`（帳號有填）→ 印每一個非空的欄位，每列一顆複製鈕，底下一顆
 *     「複製全部」把非空欄位拼成多行文字；說明與聯絡窗口印在最後。
 *   還沒填 → 整個 body 只有一句「整理中，請聯絡系辦」。這一頁仍然是 200：
 *     網址已經在 sitemap 上，404 會讓爬蟲把它丟掉；而 /alumni 那顆按鈕在這個
 *     狀態下本來就不出現（pages.tsx 的 AlumniRoute），一般讀者不會走到這裡。
 *
 * 語言中立的三格（銀行代碼、帳號、SWIFT）原樣印，不經任何格式化：帳號的
 * 分隔符號（`-`、空白）是系辦填什麼就印什麼、複製什麼 —— 網銀對這些字元的
 * 容忍度各家不同，程式不該替系辦決定。
 */
export function GivingPage({ lang, copy }: { lang: Lang; copy: GivingCopy }) {
  const t = translate(GIVING, lang);
  const shared = translate(SHARED, lang);
  const alumniPath = localizePath("/alumni", lang);

  // 只有這六格有複製鈕、也只有這六格進「複製全部」。說明與聯絡窗口是給人讀
  // 的補充，不是要貼進網銀的欄位。順序＝lib/page-copy/giving.ts 的格位順序。
  const rows = (
    [
      { key: "bank", label: t.fields.bank, value: copy.bank },
      { key: "bankCode", label: t.fields.bankCode, value: copy.bankCode },
      { key: "branch", label: t.fields.branch, value: copy.branch },
      { key: "account", label: t.fields.account, value: copy.account },
      { key: "accountName", label: t.fields.accountName, value: copy.accountName },
      { key: "swift", label: t.fields.swift, value: copy.swift },
    ] as const
  ).filter((row) => row.value !== "");
  const allText = rows.map((row) => `${row.label}${t.colon}${row.value}`).join("\n");

  return (
    <SiteShell lang={lang} variant="interior">
      <article className="post-page">
        <div className="container post-head" id="content">
          <div className="breadcrumb">
            <Link href={localizePath("/", lang)}>{shared.home}</Link>
            <span>/</span>
            <Link href={alumniPath}>{ALUMNI.title[lang]}</Link>
            <span>/</span>
            <span>{t.title}</span>
          </div>
          <p className="eyebrow">{t.kicker}</p>
          <h1>{t.title}</h1>
          {copy.ready ? <p className="post-standfirst">{t.lead}</p> : null}
        </div>

        <div className="container post-body">
          {copy.ready ? (
            <>
              <dl className="event-details giving-details" aria-label={t.title}>
                {rows.map((row) => (
                  <Fragment key={row.key}>
                    <dt>{row.label}</dt>
                    {/* 每一欄不各放一顆複製鈕：客戶看過第一版說「只留複製全部
                        匯款資訊就好，其他拿掉」——六顆一樣的小鈕反而讓人不知道
                        該按哪個。值仍然是純文字，要單獨複製可以自己選取。 */}
                    <dd>
                      <span className="giving-value">{row.value}</span>
                    </dd>
                  </Fragment>
                ))}
              </dl>

              <p className="giving-actions">
                <CopyButton
                  className="copy-button-all"
                  value={allText}
                  label={t.copyAll}
                  copiedLabel={t.copied}
                />
              </p>

              {/* 後台是 textarea，換行用 pre-line 保留 —— 與活動內文同一個做法
                  （EventPage.tsx 的 .event-body-text）。 */}
              {copy.note ? <p className="giving-note">{copy.note}</p> : null}

              {copy.contact ? (
                <p className="giving-contact">
                  <strong>{t.fields.contact}</strong>
                  {t.colon}
                  {copy.contact}
                </p>
              ) : null}
            </>
          ) : (
            <p className="giving-pending" role="status">
              {t.pending}
            </p>
          )}
        </div>

        <div className="container post-foot">
          <Link href={`${alumniPath}#section-3`}>{t.back}</Link>
        </div>
      </article>
      <NextRoute lang={lang} />
    </SiteShell>
  );
}
