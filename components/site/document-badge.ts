import type { SiteDocument } from "@/lib/data";

/**
 * 檔案卡左上角（SiteDocuments）／考古題科目連結旁（ExamPapers）的副檔名徽章。
 *
 * 從檔名推導而不是多開一個欄位讓系辦填：他們上傳的就是那個檔，副檔名是檔案
 * 自己的事實，多一格只是多一個可以填錯的地方。`file_name` 是上傳時的原始
 * 檔名（見 app/(admin)/admin/api/upload/route.ts —— 存進 Storage 的 key 是
 * uuid，原始檔名只活在資料列裡），沒有它就退回從網址猜，再不行就印 `fallback`
 * （SHARED.fileBadge：「檔案」／FILE）。
 *
 * ⚠️ 用 lastIndexOf 而不是 split(".").pop()：「農經系_實習同意書.v2.pdf」
 * 這種檔名很常見，split 之後要取哪一段還是得判斷，直接找最後一個點更短。
 *
 * 原本是 SiteDocuments.tsx 裡的私有函式；考古題改成一列一年度的科目連結後
 * 兩處都要印徽章，抽到這裡共用，行為沒變。
 */
export function badgeFor(
  form: Pick<SiteDocument, "file_name" | "file_url">,
  fallback: string
): string {
  const source = form.file_name ?? form.file_url;
  if (!source) return fallback;

  // 網址可能帶 ?token=… 或 #page=2，副檔名在那之前。
  const clean = source.split(/[?#]/)[0];
  const dot = clean.lastIndexOf(".");
  if (dot === -1 || dot === clean.length - 1) return fallback;

  const ext = clean.slice(dot + 1);
  // 8 個字以上的「副檔名」不是副檔名，是檔名裡剛好有個點。
  if (ext.length > 8 || !/^[A-Za-z0-9]+$/.test(ext)) return fallback;
  return ext.toUpperCase();
}
