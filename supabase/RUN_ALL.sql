-- ============================================================================
-- 農經系官網後台：一次貼上執行
--
-- 用法：整份複製 → Supabase Dashboard → SQL Editor → New query → 貼上 → Run
-- 專案：agec (amwiaanlvxupzfzaruwr)
--
-- 這份是 migrations/ 底下四支檔案的串接，內容完全一致（那四支是版控裡的
-- 真相來源，這份只是為了少貼四次）。全部可重複執行，跑第二次不會炸。
--
-- 執行後請注意輸出的 NOTICE：rls_policies 那段會列出它移除了哪些既有的
-- 寬鬆寫入 policy。如果一條都沒列出來，代表原本就只有讀取 policy，正常。
--
-- ⚠️ 跑完還有兩件事只能在 Dashboard 做（見本檔最後）。
-- ============================================================================



-- ############################################################################
-- # 20260814090000_posts_table.sql
-- ############################################################################

-- ============================================================
-- posts：部落格文章
--
-- 與 news 刻意分離：news 是短公告（published_at 是 date、無 slug、
-- 無草稿狀態），posts 是長文。硬把長文塞進 news 的改造成本高於新建。
--
-- 本檔可重複執行（idempotent）。執行方式：貼進 Supabase SQL Editor。
-- ============================================================
begin;

create table if not exists public.posts (
  id            bigint generated always as identity primary key,
  slug          text        not null,
  title         text        not null,
  excerpt       text,
  cover_url     text,
  content_html  text        not null default '',
  content_json  jsonb,
  author        text,
  tags          text[]      not null default '{}'::text[],
  status        text        not null default 'draft',
  published_at  timestamptz,
  created_by    uuid        references auth.users(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ---------- constraints ----------
-- 全部先 drop 再 add，讓本檔可重跑。

alter table public.posts drop constraint if exists posts_slug_key;
alter table public.posts add  constraint posts_slug_key unique (slug);

-- slug 只允許小寫英數與連字號（不允許中文、空白、開頭或結尾的連字號）。
-- 後台表單留空時會自動產生 post-YYYYMMDD-xxxx，所以系辦不會被卡住。
alter table public.posts drop constraint if exists posts_slug_format;
alter table public.posts add  constraint posts_slug_format
  check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) between 1 and 120);

alter table public.posts drop constraint if exists posts_status_check;
alter table public.posts add  constraint posts_status_check
  check (status in ('draft', 'published'));

-- 已發佈的文章一定要有發佈時間：前台排序與 RLS 的 published_at <= now() 都靠它。
alter table public.posts drop constraint if exists posts_published_needs_date;
alter table public.posts add  constraint posts_published_needs_date
  check (status <> 'published' or published_at is not null);

alter table public.posts drop constraint if exists posts_title_not_blank;
alter table public.posts add  constraint posts_title_not_blank
  check (char_length(btrim(title)) > 0);

-- ---------- indexes ----------
-- 前台列表只查已發佈，用 partial index 讓草稿不進索引。
create index if not exists posts_published_idx
  on public.posts (published_at desc) where status = 'published';

-- 後台列表依狀態篩選 + 建立時間排序。
create index if not exists posts_status_created_idx
  on public.posts (status, created_at desc);

-- 標籤篩選頁這次不做，但欄位與索引先備好，之後 tags @> array['政策'] 直接可用。
create index if not exists posts_tags_gin_idx
  on public.posts using gin (tags);

-- ---------- updated_at 自動維護 ----------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists posts_set_updated_at on public.posts;
create trigger posts_set_updated_at
  before update on public.posts
  for each row execute function public.set_updated_at();

-- ---------- 註解 ----------
comment on table  public.posts              is '部落格文章。與 news 分離：news 是短公告，posts 是長文。';
comment on column public.posts.content_html is 'TipTap 產出、並已於 Server Action 用 sanitize-html 清洗過的 HTML。前台渲染的唯一來源。';
comment on column public.posts.content_json is 'TipTap 的 ProseMirror JSON。僅供編輯器回載，不是渲染來源。';
comment on column public.posts.author       is '顯示用的作者名稱（可能是「農經系辦公室」或教授姓名）。與 created_by 用途不同，不要合併。';
comment on column public.posts.created_by   is '實際建立者的 auth.users id，供稽核用。';

commit;


-- ############################################################################
-- # 20260814090100_admin_allowlist.sql
-- ############################################################################

-- ============================================================
-- 管理者白名單
--
-- 為什麼寫入條件不直接用 `to authenticated`：
-- 這個 Supabase 專案的 Email provider 已開啟。只要 disable_signup 沒關，
-- 任何人拿公開的 anon key 打 /auth/v1/signup 就能取得 authenticated 角色。
-- 白名單把「登入者」與「系辦人員」拆開，即使日後有人不小心把註冊打開，
-- 資料表仍然安全。
--
-- 注意：這不是角色分級 —— 白名單內的所有人權限完全相同。
--
-- 本檔可重複執行。
-- ============================================================
begin;

create table if not exists public.admin_users (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  email      text,
  note       text,
  created_at timestamptz not null default now()
);

-- RLS 開啟但刻意「不建任何 policy」＝ anon 與 authenticated 都讀不到也寫不到。
-- 只有 service_role 與 SECURITY DEFINER 函式看得到這張表。
alter table public.admin_users enable row level security;

-- SECURITY DEFINER：讓一般登入者能「問」自己是不是管理者，
-- 但看不到白名單本身的內容（避免列舉出所有管理者的 email）。
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.admin_users a where a.user_id = auth.uid()
  );
$$;

revoke all     on function public.is_admin() from public, anon;
grant  execute on function public.is_admin() to authenticated;

comment on table    public.admin_users is '可寫入後台的帳號白名單。新增帳號後必須手動 insert 一列，否則登入了也不能改任何東西。';
comment on function public.is_admin()  is '目前請求者是否在 admin_users 內。所有寫入 policy 的唯一判準。';

commit;

-- ------------------------------------------------------------
-- 建完 Auth 使用者後，人工執行一次（把 email 換成實際帳號）：
--
--   insert into public.admin_users (user_id, email, note)
--   select id, email, '系辦'
--   from auth.users
--   where email in ('請填實際帳號1', '請填實際帳號2')
--   on conflict (user_id) do nothing;
--
--   select user_id, email, note from public.admin_users;   -- 應該有 2–3 列
-- ------------------------------------------------------------


-- ############################################################################
-- # 20260814090200_rls_policies.sql
-- ############################################################################

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


-- ############################################################################
-- # 20260814090300_storage_buckets.sql
-- ############################################################################

-- ============================================================
-- Storage：bucket 設定與 objects policy
--
-- 現況（2026-08-09 實測）：photos / posters / journal 三個 bucket 已存在
-- 且都是 public，但三者都沒有 file_size_limit、沒有 mime 白名單，
-- 也沒有任何 storage.objects policy —— 等於目前誰都不能上傳。
--
-- 本檔補齊上述限制、新增 blog bucket，並開放白名單管理者上傳。
--
-- 執行前提：20260814090100_admin_allowlist.sql 已跑過（需要 is_admin()）。
-- 本檔可重複執行。
-- ============================================================
begin;

-- ------------------------------------------------------------
-- bucket
-- ------------------------------------------------------------

-- 新增 blog bucket：文章封面與內文插圖
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('blog', 'blog', true, 10485760,
        array['image/jpeg','image/png','image/webp','image/gif','image/avif'])
on conflict (id) do update
  set public             = excluded.public,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- 既有三個 bucket 補上限制。
-- 在 bucket 層設限比在 app 層檢查可靠，因為繞不過去。
update storage.buckets
   set file_size_limit    = 10485760,   -- 10 MB
       allowed_mime_types = array['image/jpeg','image/png','image/webp','image/avif']
 where id in ('photos', 'posters');

update storage.buckets
   set file_size_limit    = 52428800,   -- 50 MB，期刊 PDF
       allowed_mime_types = array['application/pdf']
 where id = 'journal';

-- ------------------------------------------------------------
-- storage.objects policy
--
-- public bucket 的「公開讀」不需要 policy（Supabase 官方文件明載），
-- 所以下面只處理管理端。SELECT 仍要給管理者，否則 upsert 與後台的
-- 檔案列表會失敗。
-- ------------------------------------------------------------
drop policy if exists "admin read media" on storage.objects;
create policy "admin read media" on storage.objects
  for select to authenticated
  using (
    bucket_id in ('photos','posters','journal','blog')
    and (select public.is_admin())
  );

drop policy if exists "admin upload media" on storage.objects;
create policy "admin upload media" on storage.objects
  for insert to authenticated
  with check (
    bucket_id in ('photos','posters','journal','blog')
    and (select public.is_admin())
  );

drop policy if exists "admin update media" on storage.objects;
create policy "admin update media" on storage.objects
  for update to authenticated
  using (
    bucket_id in ('photos','posters','journal','blog')
    and (select public.is_admin())
  )
  with check (
    bucket_id in ('photos','posters','journal','blog')
    and (select public.is_admin())
  );

drop policy if exists "admin delete media" on storage.objects;
create policy "admin delete media" on storage.objects
  for delete to authenticated
  using (
    bucket_id in ('photos','posters','journal','blog')
    and (select public.is_admin())
  );

commit;


-- ============================================================================
-- 跑完之後
-- ============================================================================
--
-- 【只能在 Dashboard 做的兩件事】
--
-- 1. Authentication → Sign In / Providers → 關閉「Allow new users to sign up」
--    現在是開著的，任何人拿公開的 anon key 都能自行註冊。白名單已經讓這件事
--    不足以取得寫入權，但沒有理由留著。
--
-- 2. Authentication → Users → Add user，建 2–3 個系辦帳號，勾「Auto Confirm User」。
--
--
-- 【建完帳號後，回來執行這段】把 email 換成實際帳號：
--
--   insert into public.admin_users (user_id, email, note)
--   select id, email, '系辦'
--   from auth.users
--   where email in ('請填帳號1@example.com', '請填帳號2@example.com')
--   on conflict (user_id) do nothing;
--
--   select user_id, email, note from public.admin_users;
--   -- 必須有 2–3 列。0 列的話沒有人能在後台做任何事。
--
--
-- 【驗收】接著跑 checks/verify_rls.sql，逐段對照裡面標的 FAIL 判準。
-- ============================================================================
