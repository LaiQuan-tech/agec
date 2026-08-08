-- ============================================================
-- 驗收用查詢（純唯讀，不會改任何東西）
-- 在 Supabase SQL Editor 逐段執行，對照下方 FAIL 判準。
-- ============================================================

-- 1) RLS 是否真的開了？七列必須全為 t。
select relname, relrowsecurity
from pg_class
where relnamespace = 'public'::regnamespace
  and relname in ('news','faculty','courses','programs','links','posts','admin_users')
order by relname;
-- FAIL：任何一列 relrowsecurity = f
-- FAIL：少於 7 列（表沒建起來）

-- 2) policy 清單。
select schemaname, tablename, policyname, cmd, roles
from pg_policies
where schemaname in ('public','storage')
order by schemaname, tablename, cmd, policyname;
-- FAIL：六張表少任何一條 "admin write *"
-- FAIL：posts 少任何一條 select policy（應有 public read published posts + admin read all posts）
-- FAIL：storage.objects 少任何一條 "admin * media"（應有 read/upload/update/delete 四條）
-- 注意：admin_users 應該「一條 policy 都沒有」，那是刻意的。

-- 2b) 有沒有「不是白名單」的寫入 policy 殘留？
-- 多條 policy 之間是 OR，所以任何一條舊的寬鬆寫入 policy 都會讓白名單失效。
select tablename, policyname, cmd, roles, qual, with_check
from pg_policies
where schemaname in ('public', 'storage')
  and cmd in ('ALL', 'INSERT', 'UPDATE', 'DELETE')
  and policyname not like 'admin %'
order by tablename, policyname;
-- FAIL：這個查詢回傳任何一列。逐條 drop 掉再重驗。

-- 3) 白名單有人嗎？
select user_id, email, note, created_at from public.admin_users order by created_at;
-- FAIL：0 列（沒人能登入後做任何事）

-- 4) bucket 設定。
select id, public, file_size_limit, allowed_mime_types
from storage.buckets
order by id;
-- FAIL：blog 不存在
-- FAIL：photos / posters / blog 的 file_size_limit 是 null
-- FAIL：任何 bucket 的 allowed_mime_types 是 null

-- 5) is_admin() 的權限設定正確嗎？
select p.proname, p.prosecdef as security_definer,
       array_to_string(p.proacl, ', ') as acl
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname = 'is_admin';
-- FAIL：security_definer 不是 t
-- FAIL：acl 內出現 anon=X 或 =X（等於公開可執行）

-- 6) posts 的 constraint 都在嗎？
select conname, pg_get_constraintdef(oid) as definition
from pg_constraint
where conrelid = 'public.posts'::regclass
order by conname;
-- FAIL：缺 posts_slug_key / posts_slug_format / posts_status_check
--       / posts_published_needs_date / posts_title_not_blank 任一條
