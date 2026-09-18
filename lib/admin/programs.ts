import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * 學制名稱被哪些資料引用。
 *
 * `programs.name` 是四張表的文字外鍵：courses / news / links / documents 的
 * `program` 欄都存中文原值、都沒有 FK（為什麼不加，見 migration
 * 20260908140000 的說明）。它同時也是 lib/program-slugs.ts 網址代稱表的 key。
 * 所以改名或刪除不會有任何錯誤，只會靜默留下孤兒：/courses/<代稱> 與
 * /admissions/<代稱> 變 404、招生消息與檔案從該學制頁消失、課程掉到課程表
 * 最後且不屬於任何分頁籤。news 裡那 16 則「國際專班」就是這樣來的。
 *
 * updateProgram（改名時）與 deleteProgram 動手前先問這一支；列表頁也用它決定
 * 要不要給刪除鈕。⚠️ 只讀，不做授權 —— 呼叫端先 requireAdmin*()。傳進來的是
 * 後台的 session client（RLS 生效），四張表對白名單都是 for all，讀得到草稿。
 *
 * 用 head + count 而不是把 program 欄整欄撈回來數：PostgREST 一次最多回
 * 1000 列，news 的招生消息哪天超過那個數，整欄撈的話某個學制就可能數成 0。
 */
export const PROGRAM_REFERENCE_TABLES = ["courses", "news", "links", "documents"] as const;

export type ProgramReferenceTable = (typeof PROGRAM_REFERENCE_TABLES)[number];

export type ProgramReferences = {
  total: number;
  byTable: Record<ProgramReferenceTable, number>;
};

/**
 * 回 null 表示數不到（某張表讀取失敗）。呼叫端要把 null 當成「有引用」處理 ——
 * 寧可多擋一次，也不要因為一次讀取失敗就放行改名或刪除。
 */
export async function countProgramReferences(
  supabase: SupabaseClient,
  name: string
): Promise<ProgramReferences | null> {
  const counts = await Promise.all(
    PROGRAM_REFERENCE_TABLES.map(async (table) => {
      const { count, error } = await supabase
        .from(table)
        .select("id", { count: "exact", head: true })
        .eq("program", name);
      if (error) {
        console.error(`[admin/programs] 數 ${table}.program 的引用失敗:`, error.message);
        return null;
      }
      return [table, count ?? 0] as const;
    })
  );
  if (counts.some((c) => c === null)) return null;

  const pairs = counts as ReadonlyArray<readonly [ProgramReferenceTable, number]>;
  const byTable = Object.fromEntries(pairs) as Record<ProgramReferenceTable, number>;
  return { total: pairs.reduce((sum, [, n]) => sum + n, 0), byTable };
}

/** 給列表頁與錯誤訊息用的一句話：「課程 1 筆、消息 20 筆、檔案 36 筆」。 */
export function describeProgramReferences(refs: ProgramReferences): string {
  const label: Record<ProgramReferenceTable, string> = {
    courses: "課程",
    news: "消息",
    links: "連結",
    documents: "檔案",
  };
  return PROGRAM_REFERENCE_TABLES.filter((t) => refs.byTable[t] > 0)
    .map((t) => `${label[t]} ${refs.byTable[t]} 筆`)
    .join("、");
}
