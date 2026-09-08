-- ============================================================
-- 消息的結束日期
--
-- 招生公告有截止日、徵才有應徵期限、演講公告在活動結束後就沒有意義 —— 系辦
-- 目前只能自己記得回來把它改成草稿或刪掉。加一個結束日期，讓消息自己下架。
--
--   expires_at = null        永遠顯示（現有 585 列全部是這個，行為不變）
--   expires_at = 2026-10-31  含當天顯示，11/01 起從前台消失
--
-- date 而不是 timestamptz，與 published_at 一致：系辦想的是「哪一天之後不要
-- 再出現」，不是「幾點幾分」。比較也因此是純日期，不必處理時區。
--
-- ⚠️ 沒有 CHECK 擋「結束日期早於發佈日期」。那種列的行為是明確的（一發佈
--    就已經過期，等於不顯示），而且系辦可能真的要用它把一則舊消息暫時收起來。
--    加約束只會在他們最想快速處理的時候擋住存檔。後台的表單會提醒，不會擋。
--
-- 🔴 **必須在推程式碼之前跑。** 前台的每一支查詢都會加上
--    `expires_at is null or expires_at >= 今天`；欄位不存在時 PostgREST 直接
--    回錯誤，/news、首頁的消息帶、搜尋會一起變空。
--
-- 索引：585 列的表不需要。published_at 那個 desc 索引已經負責排序，結束日期
-- 只是額外的過濾條件，planner 在這個量級會直接掃。
--
-- ⚠️ 這個專案沒有 Supabase CLI，migration 是人工貼進 Dashboard SQL Editor
--    （或 Management API）。跑完請回 supabase/README.md 勾記。
--
-- 可重複執行。
-- ============================================================

alter table public.news
  add column if not exists expires_at date;

comment on column public.news.expires_at is
  '結束日期（含當天）。null = 永遠顯示。隔天起前台的所有清單與該則的頁面都不再出現。';

-- ------------------------------------------------------------
-- 給查詢用的衍生欄位
--
-- 條件本來是「expires_at is null OR expires_at >= 今天」，在 PostgREST 要寫成
-- `.or(...)`。那樣是可以動的（直接打 REST 驗過：同一個請求上兩個 or= 參數確實
-- 會 AND），所以這一欄不是在修 bug。
--
-- 它換到的是「不必去想」：有些查詢本來就有自己的 `.or()`（搜尋的關鍵字、
-- /news 的分類），而「一個請求上有幾個 or、彼此是 AND 還是 OR」是一條要翻文件
-- 才敢確定的規則。把 null 折成 'infinity' 之後，條件變成單純的
-- `expires_effective >= 今天` —— 可以跟任何其他條件並存，而且吃得到索引。
--
-- date 支援 'infinity'，coalesce 是 immutable，所以可以做 stored generated。
-- ------------------------------------------------------------
alter table public.news
  add column if not exists expires_effective date
  generated always as (coalesce(expires_at, 'infinity'::date)) stored;

comment on column public.news.expires_effective is
  '查詢用：expires_at 折成 infinity 的版本，讓「還沒過期」變成單一條件。不要寫入，它是 generated。';

create index if not exists news_expires_effective_idx
  on public.news (expires_effective);

-- ------------------------------------------------------------
-- 驗收（唯讀）
-- ------------------------------------------------------------
-- 1) 欄位存在、可為 null、型別是 date：
--    select column_name, is_nullable, data_type from information_schema.columns
--     where table_schema='public' and table_name='news' and column_name='expires_at';
--    期望：expires_at | YES | date
--
-- 2) 現有的列全部是 null（行為不變）：
--    select count(*)::int as total, count(expires_at)::int as with_expiry from public.news;
--    期望：with_expiry = 0
--
-- 3) 衍生欄位把 null 折成 infinity：
--    select expires_at, expires_effective from public.news where id in (443, 444) order by id;
--    期望：null → infinity；有日期 → 同一個日期
--
-- 4) 可重複執行 —— 再跑一次不應該有任何錯誤，也不會清掉已設定的日期。
