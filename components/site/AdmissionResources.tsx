"use client";

import { useState } from "react";
import type { SiteDocument } from "@/lib/data";
import { translate, type Lang } from "@/lib/i18n";
import { ADMISSIONS } from "@/lib/i18n/admissions";
import { FilterTabs, type FilterTab } from "./FilterTabs";
import { MaybeLink } from "./MaybeLink";
import { SiteDocuments } from "./SiteDocuments";

/**
 * `#section-4` 的 `.resource-row` ＋（有需要時才出現的）學制篩選籤。
 *
 * ## 這一區在解什麼
 *
 * 四張卡（招生簡章、書面資料格式、考古題專區、聯絡系辦）原本各只有一個網址、
 * 四個學制共用，讀者點下去分不出哪一段是給自己的。解法不是在程式裡拆，而是
 * 讓系辦替每一筆連結標上學制（`links.program`）：招生簡章想拆成四筆就建四筆、
 * 各自指向各自的網址；「聯絡系辦」這種不分學制的就留空。
 *
 *   program = null   共通，每一個學制底下都看得到
 *   program = 碩士班  只在「全部」與「碩士班」底下出現
 *
 * ## 一筆都沒標的時候，整排籤不會出現
 *
 * 🔴 這是刻意的。四張卡都沒有學制時，五個籤點下去會看到一模一樣的四張卡 ——
 * 一排按了沒有任何反應的控制項，正是 /courses 那組籤被客戶回報的問題
 * （見 components/site/CourseTable.tsx）。所以要等真的有東西可以分，籤才出現；
 * 在那之前 §4 就跟今天一模一樣。
 *
 * ## 認不得的學制不會消失
 *
 * `links.program` 是純文字、沒有 FK（見 migration 20260908140000）。系辦打錯
 * 字或改了學制名稱時，那一筆會對不到任何一個籤 —— 它仍然會在「全部」底下
 * 出現，所以錯字看得見。靜靜不見才是最難發現的壞法。
 *
 * ## 招生檔案也跟著同一排籤
 *
 * 系辦上傳的檔案（documents，section='admissions'）原本是獨立印在這排籤上面
 * 的一區，籤只管底下那排連結。客戶要的是「招生簡章、書面資料、考古題點下去
 * 分學制」，而那些東西最終會是檔案而不是外站連結（舊站上有 97 個下載檔），
 * 所以 `documents.program` 與 `links.program` 用同一排籤、同一套規則篩：
 * null = 共通、每個學制都看得到。兩邊只要有任何一筆標了學制，籤就出現。
 */
const ALL = "全部";

export function AdmissionResources({
  lang,
  resources,
  documents,
  documentsHeading,
  documentsDescription,
  programs,
}: {
  lang: Lang;
  /** getLinks('admissions')，或字典裡的備援 —— label 已經解析成當前語言。 */
  resources: { key: string; label: string; url: string | null; program: string | null }[];
  /** getDocuments('admissions')。空陣列時那一區（含小標）不印。 */
  documents: SiteDocument[];
  documentsHeading: string;
  documentsDescription: string;
  /** 學制的中文名與顯示名。順序同 getPrograms()。 */
  programs: { value: string; label: string }[];
}) {
  const t = translate(ADMISSIONS, lang);
  const [filter, setFilter] = useState(ALL);

  const tagged = resources.some((r) => r.program) || documents.some((d) => d.program);
  const shown = !tagged || filter === ALL
    ? resources
    : resources.filter((r) => !r.program || r.program === filter);
  const shownDocuments = !tagged || filter === ALL
    ? documents
    : documents.filter((d) => !d.program || d.program === filter);

  // 「全部」的 value 兩種語言都維持中文：它是哨兵值，不是標籤（見 FilterTab）。
  const tabs: FilterTab[] = [
    { value: ALL, label: t.section4.filterAll },
    ...programs,
  ];

  return (
    <>
      {tagged && (
        <FilterTabs
          tabs={tabs}
          ariaLabel={t.section4.filterLabel}
          onChange={setFilter}
        />
      )}

      {/* 系上自己的檔案先出現 —— 底下那排是別的單位維護的系統。
          一個檔都沒有時整區不印，§4 維持原樣。 */}
      <SiteDocuments
        lang={lang}
        documents={shownDocuments}
        heading={documentsHeading}
        description={documentsDescription}
      />

      {/* Anchors, never <div>s — `.resource-row a` owns the cell border,
          the 120px min-height and the flex alignment. */}
      <div className="resource-row">
        {shown.map((resource) => (
          <MaybeLink
            href={resource.url}
            key={resource.key}
            arrow={<span> ↗︎</span>}
          >
            {resource.label}
          </MaybeLink>
        ))}
      </div>

      {/* 只有在「有標記、而且這個學制真的一筆都沒有」時才會出現。共通的卡片
          （program 為 null）在每個學制底下都在，所以實務上很難走到這裡 ——
          除非系辦把每一筆都標了學制，而其中一個學制還沒建卡片。 */}
      {shown.length === 0 && (
        <p className="resource-empty" role="status">
          {t.section4.filterEmpty}
        </p>
      )}
    </>
  );
}
