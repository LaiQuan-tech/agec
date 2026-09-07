-- ============================================================
-- 學制卡各自的招生資訊連結（/admissions §1）
--
-- 四張學制卡下方的「查看招生資訊」目前全部指向同一個網址
-- （/news/category/admissions）。那是 2026-09 才從「跳到本頁的重要時程」改過來
-- 的，當時的理由是：招生消息沒有「這則屬於哪個學制」的欄位，學制只寫在標題裡，
-- 與其用關鍵字猜著篩、篩錯還沒人會發現，不如四張都進同一份完整清單。
--
-- 那個理由對「站內的消息」仍然成立 —— 這一欄解的是另一件事：讓系辦替每一個
-- 學制各自指定一個真正對應的去處（教務處的大學部招生、註冊組的碩博士班招生、
-- 在職專班自己的網站……）。客戶回報四張卡點下去都一樣，指的就是這個。
--
-- 一欄就好，不做 admission_url_en：與 links 表同一個約定 —— 標籤有中英兩份，
-- 網址只有一份。招生頁本身通常自己就有語言切換。
--
-- 🔴 **必須在推程式碼之前跑。** lib/data.ts 的 PROGRAM_COLUMNS 是逐一列欄位的
--    字串，欄位不存在時 PostgREST 直接回錯誤、getPrograms() 回空陣列 ——
--    受影響的不只 /admissions 的學制卡，還有首頁的招生卡與 /courses 的學制
--    篩選籤（它的籤與排序都靠 getPrograms）。與 20260908100000 的分機欄位
--    同一種風險。
--
-- RLS 與稽核 trigger 都不必動：programs 的 policy 是整張表的，
-- 20260902100000 的 log_admin_change 也早就掛在這張表上。
--
-- ⚠️ 這個專案沒有 Supabase CLI，migration 是人工貼進 Dashboard SQL Editor
--    （或 Management API）。跑完請回 supabase/README.md 勾記。
--
-- 可重複執行。
-- ============================================================

alter table public.programs
  add column if not exists admission_url text;

comment on column public.programs.admission_url is
  '/admissions §1 學制卡「查看招生資訊」的去處。null = 沒指定，前台退回 /news/category/admissions。';

-- ------------------------------------------------------------
-- 驗收（唯讀）
-- ------------------------------------------------------------
-- 1) 欄位存在、可為 null、四列都還是 null：
--    select column_name, is_nullable, data_type
--      from information_schema.columns
--     where table_schema='public' and table_name='programs' and column_name='admission_url';
--    期望：admission_url | YES | text
--
--    select name, admission_url from public.programs order by sort_order;
--    期望：四列，admission_url 全為 null（前台維持原本的行為）
--
-- 2) 可重複執行 —— 再跑一次不應該有任何錯誤，也不會清掉已填的值
--    （add column if not exists 對已存在的欄位是 no-op）。
