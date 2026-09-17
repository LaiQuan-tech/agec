/**
 * /admissions §4 三張入口卡（當年度招生簡章／書面資料格式／考古題專區）要落在
 * 「真正對應的資料」上，這裡是決定落點的純函式。前台（AdmissionKinds、
 * ExamPapers）與測試共用；**不 import supabase、不 import React**，所以可以
 * 直接用 tsx / node 跑。
 *
 * ## 為什麼簡章與書面資料落在「公告」而不是「檔案清單」
 *
 * 客戶回饋：「這邊每個點進去，都是招生資訊。點進去應該要是對應的資料檔才對。」
 * 舊站的簡章與書面資料就是每年一則招生公告（簡章有的是內嵌圖片、有的是教務處
 * 外部連結；書面資料是公告附件），這 156 則已全部搬進 `news`（category='招生'、
 * `program` 標了學制、附件在 `attachments`）。所以「大學部的簡章」= 該學制
 * **最新一則標題含「簡章」的公告** `/news/<id>`，不是另外維護一份檔案清單 ——
 * 系辦每年照舊發公告，卡片自己跟著跳到新的一則。
 *
 * ## 為什麼是標題關鍵字，不是新欄位
 *
 * 舊站的標題本來就有固定用語（「115學年度申請入學-簡章」「…書面資料表格下載」），
 * 多開一個「這是簡章」的勾選欄位等於要系辦每年多做一個動作、而且會忘。關鍵字
 * 對不到時退回該學制招生頁的公告區（AdmissionKinds 負責退路），不會壞。
 *
 * ## 考古題
 *
 * 舊站 link5 的 97 個檔案在 `documents`（section='admissions'、category='考古題'、
 * program=學制）。約定：`label`＝科目、`description`＝年度標題（「111碩士班招生
 * 考題」），`groupExamPapers` 依 description 分組，每年度一列。大學部沒有考古題，
 * 這是對的（大學部不考系上的科目）。
 */

/** `documents.category` 裡代表考古題的中文原值（比對用 `category_zh`，不是翻譯後的）。 */
export const EXAM_CATEGORY = "考古題";

/** 三張卡的識別鍵；與 lib/i18n/admissions.ts `section4.kinds[].key` 一致。 */
export type KindKey = "guide" | "forms" | "exams";

/**
 * 簡章／書面資料兩張卡各自的標題關鍵字（任一命中即算）。
 *
 * 「簡章」一詞在書面資料的公告裡也常出現（「甄試簡章(含個人資料表、推薦函格式
 * 下載)」），所以碩士班兩張卡可能落在同一則 —— 那是對的，那一則就是同時有
 * 簡章與表格的公告。
 */
export const KIND_KEYWORDS: Record<Exclude<KindKey, "exams">, readonly string[]> = {
  guide: ["簡章"],
  forms: ["書面資料", "表格", "格式", "申請表"],
};

/**
 * `getAdmissionsPostIndex()`（lib/data.ts）回的一列：已發布、未過期、
 * category='招生' 的公告，只有決定落點需要的四欄。`title` 是中文原文 ——
 * 關鍵字是中文，而卡片上印的是學制名與年度，不印標題，所以不需要 `title_en`。
 */
export type AdmissionsPostRef = {
  id: number;
  title: string;
  /** programs.name 的中文原值；null = 不分學制（這裡永遠比不到）。 */
  program: string | null;
  /** timestamptz 的字串；比大小用字串就夠（同一格式、同一時區）。 */
  published_at: string;
};

/** `latestAdmissionsPost` 的結果：卡片連到 `/news/<id>`，年度印在學制名後面。 */
export type AdmissionsPostHit = {
  id: number;
  title: string;
  /** 從標題抓到的學年度（「115」），抓不到就 null、卡片不印年度。 */
  year: string | null;
};

/**
 * 「115學年度」「114年度 碩士在職專班」「113 學年度」都抓得到；西元年
 * （「2026年」）不算 —— 招生用的是學年度，標題裡寫「年度」的都是民國。
 */
// 前面不能再有數字：「2026年度」會被抓成「026」。
const YEAR_RE = /(?<!\d)(\d{2,3})\s*學?年度/;

/** 從標題抓學年度；抓不到回 null。先 NFKC，全形的「１１５」也抓得到。 */
export function yearFromTitle(title: string): string | null {
  const m = YEAR_RE.exec(title.normalize("NFKC"));
  return m ? m[1] : null;
}

/**
 * 比對前的正規化：NFKC 把全形英數折成半形（「１１５」→「115」、「Ｐｄｆ」→「Pdf」），
 * 再轉小寫。系辦的標題偶爾會從 Word 貼進全形字，關鍵字不該因此對不到。
 */
function normalize(text: string): string {
  return text.normalize("NFKC").toLowerCase();
}

/**
 * 某學制、某一種卡（關鍵字組）的最新一則公告。
 *
 * 只看 `program` 逐字相符且標題含任一關鍵字的列，取 `published_at` 最大者；
 * 同一天取先出現的（getAdmissionsPostIndex 已是新的在前，但這裡不依賴順序）。
 * 一則都沒有回 null，呼叫端退回學制頁的公告區。
 */
export function latestAdmissionsPost(
  posts: readonly AdmissionsPostRef[],
  programNameZh: string,
  keywords: readonly string[]
): AdmissionsPostHit | null {
  const needles = keywords.map(normalize).filter((k) => k.length > 0);
  if (needles.length === 0) return null;

  let best: AdmissionsPostRef | null = null;
  for (const post of posts) {
    if (post.program !== programNameZh) continue;
    // title 理論上 not null（後台 required），但這裡是全站唯一直接對它呼叫
    // normalize 的地方，一列壞資料不該讓整頁 /admissions 掛掉。
    const haystack = normalize(post.title ?? "");
    if (!needles.some((needle) => haystack.includes(needle))) continue;
    // 同一天發兩則（簡章、再發簡章勘誤）以 id 大的為準：published_at 只有日期，
    // 沒有第二個鍵的話結果會跟資料庫回傳順序走，每次 ISR 重建可能不同。
    if (
      !best ||
      post.published_at > best.published_at ||
      (post.published_at === best.published_at && post.id > best.id)
    )
      best = post;
  }
  if (!best) return null;
  return { id: best.id, title: best.title, year: yearFromTitle(best.title) };
}

/** `groupExamPapers` 的一組：同一年度標題底下的科目，依輸入順序。 */
export type ExamPaperGroup<T> = {
  /** 分組鍵＝description 原字；null 是「沒填年度」那一組。 */
  key: string | null;
  /** 印在該列左邊的年度標題；null 時由元件印「其他」。 */
  heading: string | null;
  items: T[];
};

/**
 * 考古題依年度標題（`description`）分組，每組保留首次出現的順序、組內保留輸入
 * 順序（sort_order 已在 DB 排好：年度新的在前、同年度照科目序）。
 *
 * description 為 null 的列全部放到**最後**一組 —— 與 SiteDocuments 的「沒分類
 * 放最前面」相反：這裡沒填年度是資料不完整，不該排在最新年度前面。
 *
 * 泛型：只要求 `description`，所以測試不必造出完整的 SiteDocument。
 *
 * ⚠️ 用的是解析成當前語言之後的 description（/en 是 description_en）。匯入腳本
 * 整批填了 description_en，所以英文頁每一組一致；若日後系辦只替部分列填英文，
 * 同一年度會在 /en 拆成兩組 —— 這是可接受的，不另外存 description_zh。
 */
export function groupExamPapers<T extends { description: string | null }>(
  documents: readonly T[]
): ExamPaperGroup<T>[] {
  const groups = new Map<string, ExamPaperGroup<T>>();
  const loose: T[] = [];
  for (const doc of documents) {
    const key = doc.description?.trim() || null;
    if (key === null) {
      loose.push(doc);
      continue;
    }
    let group = groups.get(key);
    if (!group) {
      group = { key, heading: key, items: [] };
      groups.set(key, group);
    }
    group.items.push(doc);
  }
  const ordered = [...groups.values()];
  if (loose.length > 0) ordered.push({ key: null, heading: null, items: loose });
  return ordered;
}
