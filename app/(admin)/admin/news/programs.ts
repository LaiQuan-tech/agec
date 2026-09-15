import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * 消息表單「學制」下拉的選項：programs.name，順序同 /admin/programs。
 * 與 /admin/links、/admin/documents 同一個做法（純文字比對、沒有 FK，所以
 * 表單另外保留「已不在學制清單中」那一項）。新增與編輯兩頁共用。
 */
export async function loadProgramNames(supabase: SupabaseClient): Promise<string[]> {
  const { data, error } = await supabase
    .from("programs")
    .select("name")
    .order("sort_order", { ascending: true })
    .returns<{ name: string }[]>();
  if (error) console.error("[admin/news] program list failed:", error.message);
  return (data ?? []).map((p) => p.name);
}
