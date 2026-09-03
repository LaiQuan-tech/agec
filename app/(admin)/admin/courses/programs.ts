import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { COURSE_PROGRAMS } from "./constants";

/**
 * 課程表單的「學制」下拉選項。
 *
 * 🔴 從 `programs` 資料表讀，不用寫死的清單：`courses.program` 與
 * `programs.name` 是**文字比對**（Courses.tsx 的 programRank 與分頁籤都靠它），
 * 兩份各自維護就會漂移 —— 而漂移的表現是「這門課排到最後、也不屬於任何分頁
 * 籤」，沒有任何錯誤訊息。系辦在「招生學制」加一個學制之後，課程表單就該
 * 立刻有那個選項。
 *
 * 查詢失敗時退回 constants.ts 的備援清單，讓表單不至於只剩「其他」。
 */
export async function loadProgramNames(
  supabase: SupabaseClient
): Promise<readonly string[]> {
  const { data, error } = await supabase
    .from("programs")
    .select("name")
    .order("sort_order", { ascending: true })
    .returns<{ name: string }[]>();

  if (error || !data?.length) {
    if (error) console.error("[admin/courses] 讀取學制清單失敗:", error.message);
    return COURSE_PROGRAMS;
  }
  return data.map((p) => p.name);
}
