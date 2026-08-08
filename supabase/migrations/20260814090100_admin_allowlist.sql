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
