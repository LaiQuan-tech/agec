-- ============================================================
-- 師資的個人網頁連結
--
-- 系上老師多半有自己的實驗室／個人學術網頁，但站上沒有任何地方放得下 ——
-- 讀者看完卡片上的職稱、領域與 email 之後就沒有下一步了。加一欄，讓系辦在
-- /admin/faculty 逐一填；四種卡片版型都會印，沒填就整行不印。
--
-- text 而不是加約束：實際會是各式各樣的網址（實驗室站、Google Scholar、
-- 系上舊站的個人頁、ResearchMap⋯），限定格式只會擋住合理的輸入。
--
-- 與 email、extension 一樣是語言無關的識別字串，所以沒有 _en 版本：一個人
-- 就一個網頁。真的有中英兩版時，那一頁自己會有語言切換。
--
-- 🔴 **必須在推程式碼之前跑。** lib/data.ts 的 FACULTY_COLUMNS 是逐一列欄位的
--    字串，欄位不存在時 PostgREST 回錯誤、getFaculty() 回空陣列，
--    /faculty 會變成一片空白而且沒有任何錯誤畫面 —— 與 20260908100000
--    （分機）當時實測到的症狀完全一樣。
--
-- RLS 與稽核 trigger 都不必動：faculty 的 policy 是整張表的，
-- 20260902100000 的 log_admin_change 也早就掛在這張表上。
--
-- ⚠️ 這個專案沒有 Supabase CLI，migration 是人工貼進 Dashboard SQL Editor
--    （或 Management API）。跑完請回 supabase/README.md 勾記。
--
-- 可重複執行。
-- ============================================================

alter table public.faculty
  add column if not exists homepage_url text;

comment on column public.faculty.homepage_url is
  '老師的個人／實驗室網頁。null = 沒有或還沒填，前台就不印那一行。';

-- ------------------------------------------------------------
-- 驗收（唯讀）
-- ------------------------------------------------------------
-- 1) 欄位存在、可為 null：
--    select column_name, is_nullable, data_type from information_schema.columns
--     where table_schema='public' and table_name='faculty' and column_name='homepage_url';
--    期望：homepage_url | YES | text
--
-- 2) 現有 37 列都還是 null（前台維持原本的樣子）：
--    select count(*)::int as total, count(homepage_url)::int as filled from public.faculty;
--    期望：total 37、filled 0
--
-- 3) 可重複執行 —— 再跑一次不應該有任何錯誤，也不會清掉已填的值。
