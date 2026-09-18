-- ============================================================
-- news：公開讀只放行已發佈
--
-- 20260814090200_rls_policies.sql 建的 "public read news" 是 using (true)。
-- 那時 news 還沒有草稿（status 是 20260831120000_news_extend.sql 才加的），
-- 「整張表都是公開資訊」在當時是對的；加了草稿之後就不對了 —— 任何人拿
-- 公開的 anon key 直接打 PostgREST，就能讀到系辦還沒發布的公告全文
-- （那把 key 在前台 bundle 裡，lib/data.ts 的 status 過濾只擋得住走前台的人）。
-- 上線前的安全測試抓到這一條：目前草稿 0 筆所以還沒外洩，但後台一存草稿
-- 就會。
--
-- 改成與 alumni_events（20260901120000）同一種縱深防禦：草稿不外流由資料庫
-- 保證，不靠每個查詢都記得加 .eq('status','published')。
--
-- 後台不受影響：管理者走 authenticated ＋ "admin write news"（for all，
-- 含 select，判準 is_admin()），與這條是 OR。前台走 service_role，本來就
-- 繞過 RLS —— 所以也沒有部署順序限制。
--
-- ⚠️ 刻意不跟著加 published_at / expires_effective 的條件：那兩個是「要不要
--    顯示」，不是「能不能看」—— 到期下架的公告本來就公開過，不是機密。
--
-- ⚠️ 這個專案沒有 Supabase CLI，migration 是人工貼進 Dashboard SQL Editor
--    （或 Management API）。跑完請回 supabase/README.md 勾記。
--
-- 可重複執行。
-- ============================================================
begin;

-- 🔴 正式 DB 上還有一條 repo 裡沒有的舊 policy "public read"（roles = public，
--    using (true)），是最早在 Dashboard 手建的；policy 之間是 OR，不把它一起
--    刪掉，下面這條等於白寫（上線前測試第一次就是這樣漏掉的）。faculty／
--    courses／links／programs 也各有一條同名的舊 policy，但那四張表本來就
--    整表公開，留著只是重複，不在這裡動。
drop policy if exists "public read" on public.news;

drop policy if exists "public read news" on public.news;
create policy "public read news" on public.news
  for select to anon, authenticated
  using (status = 'published');

commit;

-- ------------------------------------------------------------
-- 驗收（用 anon key 直接打 REST，應回 []；改之前會回草稿全文）：
--   curl "$URL/rest/v1/news?select=id,title,status&status=eq.draft" \
--     -H "apikey: $ANON" -H "Authorization: Bearer $ANON"
-- ------------------------------------------------------------
