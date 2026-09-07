-- ============================================================
-- 資源連結卡的學制標記（/admissions §4「申請協助」）
--
-- §4 現在是四張卡：當年度招生簡章、書面資料格式、考古題專區、聯絡系辦，
-- 每一張只有一個網址、四個學制共用。客戶希望點下去能分別看到大學部、碩士班、
-- 博士班與在職專班各自的資訊。
--
-- 做法不是在程式裡拆，而是讓系辦替每一筆連結標上學制：招生簡章想拆成四筆就
-- 建四筆，各自指向各自的網址；不想拆的（例如「聯絡系辦」）就留空。
--
--   program = null   共通 —— 每一個學制的篩選下都看得到
--   program = '碩士班' 只在「全部」與「碩士班」底下出現
--
-- 值是**中文的學制名稱**，與 programs.name 及 courses.program 同一個約定。
-- 沒有 FK：programs 的名稱是系辦可以改的顯示文字，加上外鍵等於讓改一個字就
-- 動到另一張表的資料完整性；courses.program 也是同一個理由用純文字。認不得的
-- 值在前台會被當成「有標記但對不到任何學制」，只在「全部」底下出現 ——
-- 不會消失，所以打錯字看得見。
--
-- ⚠️ 這一欄只有 /admissions §4 會讀。links 還有 students / courses / alumni
--    三個 section，它們的卡片不分學制，欄位留空即可（後台的欄位有寫明）。
--
-- 🔴 **必須在推程式碼之前跑。** lib/data.ts 的 LINK_COLUMNS 是逐一列欄位的
--    字串，欄位不存在時 PostgREST 回錯誤、getLinks() 回空陣列 —— /students、
--    /courses、/admissions 三頁的 .resource-row 會同時退回硬編的備援清單。
--    與 20260908130000（programs.admission_url）同一種風險。
--
-- RLS 與稽核 trigger 都不必動：links 的 policy 是整張表的，20260902100000 的
-- log_admin_change 也早就掛在這張表上。
--
-- ⚠️ 這個專案沒有 Supabase CLI，migration 是人工貼進 Dashboard SQL Editor
--    （或 Management API）。跑完請回 supabase/README.md 勾記。
--
-- 可重複執行。
-- ============================================================

alter table public.links
  add column if not exists program text;

comment on column public.links.program is
  '/admissions §4 的學制標記，值同 programs.name（中文）。null = 共通，每個學制都看得到。其他 section 不讀這一欄。';

-- ------------------------------------------------------------
-- 驗收（唯讀）
-- ------------------------------------------------------------
-- 1) 欄位存在、可為 null：
--    select column_name, is_nullable, data_type
--      from information_schema.columns
--     where table_schema='public' and table_name='links' and column_name='program';
--    期望：program | YES | text
--
-- 2) 現有的列全部是 null（前台維持原本的行為，篩選籤不會出現）：
--    select section, label, program from public.links order by section, sort_order;
--    期望：program 全為 null
--
-- 3) 可重複執行 —— 再跑一次不應該有任何錯誤，也不會清掉已填的值。
