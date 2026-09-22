import type { Metadata } from "next";
import { requireAdminOrRedirect } from "@/lib/admin/auth";
import {
  GIVING_COPY_DEFAULTS,
  GIVING_COPY_FIELDS,
  GIVING_PAGE,
} from "@/lib/page-copy/giving";
import { GivingCopyForm, type GivingCopyValues } from "./GivingCopyForm";
import { saveGivingCopy } from "./actions";
import { AppearsOn } from "../_components/AppearsOn";

export const metadata: Metadata = { title: "匯款帳號資訊" };
export const dynamic = "force-dynamic";

/**
 * 匯款帳號資訊（/alumni/giving）—— 單頁表單，沒有列表／新增／刪除。與
 * about/page.tsx 同一套。
 *
 * 8 個格位固定（lib/page-copy/giving.ts）。表單的初始值：資料庫有的列用資料庫
 * 的，沒有的用空字串 —— 這一頁沒有字典可退（帳號只有系辦知道），第一次打開
 * 全空是預期的，系辦填完儲存才有列。
 */
export default async function GivingCopyPage() {
  const { supabase } = await requireAdminOrRedirect();

  const { data, error } = await supabase
    .from("page_copy")
    .select("name, zh, en")
    .eq("page", GIVING_PAGE)
    .returns<{ name: string; zh: string; en: string }[]>();

  // 表還沒建（migration 未執行）與「真的讀取失敗」要分開講。
  const tableMissing = error?.code === "42P01" || error?.code === "PGRST205";
  if (error && !tableMissing) console.error("[admin/giving] load failed:", error.message);

  const byName = new Map((data ?? []).map((row) => [row.name, row]));
  const initial: GivingCopyValues = Object.fromEntries(
    GIVING_COPY_FIELDS.map((field) => {
      const row = byName.get(field.name);
      const fallback = GIVING_COPY_DEFAULTS[field.name] ?? { zh: "", en: "" };
      return [field.name, row ? { zh: row.zh, en: row.en } : fallback];
    })
  );

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="text-[22px] font-bold" style={{ color: "var(--brand-green)" }}>
          匯款帳號資訊
        </h1>
        <AppearsOn pathname="/admin/giving" />
        <p className="mt-1 text-[13px]" style={{ color: "var(--muted)" }}>
          系友專區「支持農經」底下那一頁的匯款帳戶。填了「帳號」之後，系友專區的
          「匯款帳號資訊」按鈕才會出現；銀行代碼、分行、SWIFT／BIC、說明、聯絡窗口
          可留空。前台每一欄旁邊都有複製鈕，系友可以一鍵複製。改完按最下面的
          「儲存全部」，前台立刻更新。
        </p>
      </header>

      {tableMissing ? (
        <p role="alert" className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-[13px] text-amber-800">
          資料表還沒建立。請先執行
          <code className="mx-1">supabase/migrations/20260914110000_page_copy_students.sql</code>
          。在那之前儲存會失敗；前台顯示「匯款資訊整理中」。
        </p>
      ) : error ? (
        <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700">
          讀取失敗，請重新整理。若持續發生請回報。
        </p>
      ) : null}

      <GivingCopyForm action={saveGivingCopy} initial={initial} />
    </div>
  );
}
