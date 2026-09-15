import type { Metadata } from "next";
import { requireAdminOrRedirect } from "@/lib/admin/auth";
import {
  ABOUT_COPY_DEFAULTS,
  ABOUT_COPY_FIELDS,
  ABOUT_PAGE,
} from "@/lib/page-copy/about";
import { AboutCopyForm, type AboutCopyValues } from "./AboutCopyForm";
import { saveAboutCopy } from "./actions";
import { AppearsOn } from "../_components/AppearsOn";

export const metadata: Metadata = { title: "本系簡介" };
export const dynamic = "force-dynamic";

/**
 * 本系簡介（/about）的文案 —— 單頁表單，沒有列表／新增／刪除。與 students/page.tsx
 * 同一套。
 *
 * 42 個格位固定（版面的格線是照五個里程碑、四張卡、四格棋盤、三張照片畫的，見
 * lib/page-copy/about.ts）。表單的初始值：資料庫有的列用資料庫的，沒有的用字典
 * （那也是 migration 種子的來源），所以第一次打開就是前台現在的字。
 */
export default async function AboutCopyPage() {
  const { supabase } = await requireAdminOrRedirect();

  const { data, error } = await supabase
    .from("page_copy")
    .select("name, zh, en")
    .eq("page", ABOUT_PAGE)
    .returns<{ name: string; zh: string; en: string }[]>();

  // 表還沒建（migration 未執行）與「真的讀取失敗」要分開講。
  const tableMissing = error?.code === "42P01" || error?.code === "PGRST205";
  if (error && !tableMissing) console.error("[admin/about] load failed:", error.message);

  const byName = new Map((data ?? []).map((row) => [row.name, row]));
  const initial: AboutCopyValues = Object.fromEntries(
    ABOUT_COPY_FIELDS.map((field) => {
      const row = byName.get(field.name);
      const fallback = ABOUT_COPY_DEFAULTS[field.name] ?? { zh: "", en: "" };
      return [field.name, row ? { zh: row.zh, en: row.en } : fallback];
    })
  );

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="text-[22px] font-bold" style={{ color: "var(--brand-green)" }}>
          本系簡介
        </h1>
        <AppearsOn pathname="/admin/about" />
        <p className="mt-1 text-[13px]" style={{ color: "var(--muted)" }}>
          前台「本系簡介」整頁的文字：頁首導言，加系史沿革、使命與願景、系所榮譽、
          環境與設備四區的標題與內文。各區小標上方的英文大寫字、圖片、頁內導覽的
          四個標籤是固定的。改完按最下面的「儲存全部」，前台立刻更新。
        </p>
      </header>

      {tableMissing ? (
        <p role="alert" className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-[13px] text-amber-800">
          資料表還沒建立。請先執行
          <code className="mx-1">supabase/migrations/20260914110000_page_copy_students.sql</code>
          與
          <code className="mx-1">supabase/migrations/20260916100000_page_copy_about.sql</code>
          。在那之前這裡顯示的是程式裡的預設文字，儲存會失敗；前台照常顯示預設文字。
        </p>
      ) : error ? (
        <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700">
          讀取失敗，請重新整理。若持續發生請回報。
        </p>
      ) : null}

      <AboutCopyForm action={saveAboutCopy} initial={initial} />
    </div>
  );
}
