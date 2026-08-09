-- ============================================================
-- 六張表的 RLS policy
--
-- 政策：anon 公開讀（posts 只讀已發佈）；只有 admin_users 白名單內的人能寫。
--
-- 兩個實作細節：
-- 1. auth 相關函式一律包在 (select ...) 內。這讓 planner 每個 statement 只
--    求值一次，而不是每一列都呼叫一次 —— 資料量大時差很多。
-- 2. 同一個 cmd 的多條 policy 之間是 OR。所以 posts 有兩條 select policy：
--    公開的那條只放行已發佈，管理者那條放行全部（含草稿）。
--
-- 執行前提：20260814090100_admin_allowlist.sql 已跑過（需要 is_admin()）。
-- 本檔可重複執行。
-- ============================================================
begin;

-- RLS 五張既有表在本專案已經是開啟狀態（2026-08-09 實測 anon 寫入回 42501），
-- 這裡再宣告一次確保冪等，並補上 posts。
alter table public.news     enable row level security;
alter table public.faculty  enable row level security;
alter table public.courses  enable row level security;
alter table public.programs enable row level security;
alter table public.links    enable row level security;
alter table public.posts    enable row level security;

-- ------------------------------------------------------------
-- 公開讀：五張既有表全部內容都是公開資訊
-- ------------------------------------------------------------
drop policy if exists "public read news" on public.news;
create policy "public read news" on public.news
  for select to anon, authenticated using (true);

drop policy if exists "public read faculty" on public.faculty;
create policy "public read faculty" on public.faculty
  for select to anon, authenticated using (true);

drop policy if exists "public read courses" on public.courses;
create policy "public read courses" on public.courses
  for select to anon, authenticated using (true);

drop policy if exists "public read programs" on public.programs;
create policy "public read programs" on public.programs
  for select to anon, authenticated using (true);

drop policy if exists "public read links" on public.links;
create policy "public read links" on public.links
  for select to anon, authenticated using (true);

-- ------------------------------------------------------------
-- posts：公開只讀「已發佈且已到發佈時間」
-- 草稿不外流由資料庫保證，而不是靠每個查詢都記得加 .eq('status','published')。
-- ------------------------------------------------------------
drop policy if exists "public read published posts" on public.posts;
create policy "public read published posts" on public.posts
  for select to anon, authenticated
  using (
    status = 'published'
    and published_at is not null
    and published_at <= now()
  );

-- 管理者才看得到草稿與排程中的文章（與上一條是 OR 關係）。
drop policy if exists "admin read all posts" on public.posts;
create policy "admin read all posts" on public.posts
  for select to authenticated
  using ((select public.is_admin()));

-- ------------------------------------------------------------
-- 先清掉任何「不是白名單」的既有寫入 policy
--
-- 這段是白名單能不能成立的關鍵。RLS 的多條 policy 之間是 OR，所以只要
-- 表上還留著一條舊的寬鬆寫入 policy（例如原 DEPLOYMENT.md 規劃的
-- auth.role() = 'authenticated'），它就會與下面的白名單 policy 疊加，
-- 任何註冊過的人依然寫得進去 —— 白名單等於沒做。
--
-- 下面用名稱與 cmd 判斷：保留 SELECT 類（公開讀本來就該在）與我們自己
-- 建的 "admin %"，其餘寫入類一律移除，並逐條 RAISE NOTICE 讓執行者看到
-- 到底刪了什麼。前台走 service_role 完全繞過 RLS，刪這些不影響前台。
-- ------------------------------------------------------------
do $$
declare
  pol record;
begin
  for pol in
    select schemaname, tablename, policyname
    from pg_policies
    where (
      (schemaname = 'public'
       and tablename in ('news','faculty','courses','programs','links','posts'))
      or (schemaname = 'storage' and tablename = 'objects')
    )
      and cmd in ('ALL','INSERT','UPDATE','DELETE')
      and policyname not like 'admin %'
  loop
    raise notice '移除既有寫入 policy：%.% → %',
      pol.schemaname, pol.tablename, pol.policyname;
    execute format('drop policy %I on %I.%I',
      pol.policyname, pol.schemaname, pol.tablename);
  end loop;
end
$$;

-- ------------------------------------------------------------
-- 寫入：六張表一律只開給白名單
-- ------------------------------------------------------------
drop policy if exists "admin write news" on public.news;
create policy "admin write news" on public.news for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

drop policy if exists "admin write faculty" on public.faculty;
create policy "admin write faculty" on public.faculty for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

drop policy if exists "admin write courses" on public.courses;
create policy "admin write courses" on public.courses for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

drop policy if exists "admin write programs" on public.programs;
create policy "admin write programs" on public.programs for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

drop policy if exists "admin write links" on public.links;
create policy "admin write links" on public.links for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

drop policy if exists "admin write posts" on public.posts;
create policy "admin write posts" on public.posts for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

commit;

-- ------------------------------------------------------------
-- 這支跑完前台會不會掛？不會。
-- 前台 lib/data.ts 走的是 service_role，service_role 完全繞過 RLS，
-- 所以無論 policy 怎麼寫前台都讀得到。真正受影響的是用 anon key 讀的路徑，
-- 也就是即將新增的 lib/data.ts 內 getPosts() —— 這正是我們要的。
-- ------------------------------------------------------------
