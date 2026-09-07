-- ============================================================
-- faculty 加「分機」欄位
--
-- /faculty 的卡片目前只有 email 一個聯絡方式。系辦要求四種版型（標準卡、
-- 客座、名譽／退休、行政同仁）全部都能顯示分機。
--
-- ⚠️ 型別是 text 不是 int。台大的分機在實際文件裡有好幾種寫法：
--    「5501」「5501、5502」「#12345」「3366-5501」。用 int 會裝不下前三種，
--    而且會讓「05501」變成「5501」。這一欄不做算術，只做顯示。
--
-- ⚠️ 刻意**不加** extension_en。理由與 email 完全相同：這是跨語言相同的
--    識別字串，不是需要翻譯的內容。20260825120000_i18n_columns.sql 那支
--    「補英文欄」的 migration 補了 12 個 _en 欄，就是刻意跳過 email 的。
--    加了會讓後台的英文進度徽章（admin/faculty/page.tsx 的 enProgress）
--    多一格永遠填不滿的分母。
--
-- 不需要動 RLS：20260814090200_rls_policies.sql 的 policy 是掛在整張表上
-- （public read / admin write），新增欄位自動涵蓋。
-- 也不需要動稽核 trigger：faculty 已經在 20260902100000 的表名陣列裡。
--
-- 🔴 **這一支必須在推程式碼之前跑完。** lib/data.ts 的 FACULTY_COLUMNS 是
--    逐一列欄位的字串，不是 select("*")。欄位還不存在就先推了新版程式，
--    PostgREST 會回錯誤、getFaculty() 依慣例回空陣列，於是 /faculty 變成
--    一片空白 —— 而且不會有任何錯誤畫面，只有 server log 裡一行字。
--
-- ⚠️ 這個專案沒有 Supabase CLI，migration 是人工貼進 Dashboard SQL Editor。
--    跑完請回 supabase/README.md 勾記。
--
-- 可重複執行。
-- ============================================================

alter table public.faculty add column if not exists extension text;

comment on column public.faculty.extension is
  '系辦分機，純顯示用。text 不是 int：實際寫法有「5501」「5501、5502」「#12345」。'
  'null = 沒有分機或還沒填，前台會整行不顯示，不會留空位。'
  '與 email 一樣沒有 _en 版本 —— 跨語言相同的識別字串。';

-- ------------------------------------------------------------
-- 驗收（唯讀，跑完可以直接執行確認）
-- ------------------------------------------------------------
-- 1) 欄位存在且型別正確：
--    select column_name, data_type, is_nullable
--      from information_schema.columns
--     where table_schema = 'public' and table_name = 'faculty'
--       and column_name = 'extension';
--    期望：extension | text | YES
--
-- 2) 現有 37 筆一筆都沒被動到（分機全為 null 是正確的初始狀態）：
--    select count(*) as 總數,
--           count(extension) as 已填分機,
--           count(email) as 有信箱
--      from public.faculty;
--    期望：總數 37、已填分機 0、有信箱 36
--    （柏靖峰是唯一沒有 email 的人，見 20260814090500 的 seed 註解）
