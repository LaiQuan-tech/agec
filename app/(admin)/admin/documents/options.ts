import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * 新增／編輯表單兩個下拉的選項，兩頁共用。
 *
 * - 分類：資料庫裡**已經用過**的值（去重、依第一次出現的顯示順序）。這張清單
 *   沒有寫死在程式裡 —— 系辦第一次選「其他」打出來的字，下一筆就會在這裡。
 * - 學制：與 /admin/links 同一個做法，讀 programs.name。系辦改了學制名稱，
 *   選項會跟著改，但已經存進 documents.program 的舊字串不會（純文字、沒有 FK），
 *   所以表單保留了「已不在學制清單中」那一項。
 *
 * 不是 `"use server"` 檔：這裡匯出的是給 Server Component 呼叫的普通 async
 * function，不是 Server Action。
 */
export async function loadDocumentFormOptions(
  supabase: SupabaseClient
): Promise<{ categories: string[]; programs: string[] }> {
  const [categoryResult, programResult] = await Promise.all([
    supabase
      .from("documents")
      .select("category")
      .not("category", "is", null)
      .order("sort_order", { ascending: true })
      .order("id", { ascending: true })
      .returns<{ category: string }[]>(),
    supabase
      .from("programs")
      .select("name")
      .order("sort_order", { ascending: true })
      .returns<{ name: string }[]>(),
  ]);

  if (categoryResult.error) {
    console.error("[admin/documents] category list failed:", categoryResult.error.message);
  }
  if (programResult.error) {
    console.error("[admin/documents] program list failed:", programResult.error.message);
  }

  const categories: string[] = [];
  for (const row of categoryResult.data ?? []) {
    const value = row.category.trim();
    if (value && !categories.includes(value)) categories.push(value);
  }
  const programs = (programResult.data ?? []).map((p) => p.name);
  return { categories, programs };
}
