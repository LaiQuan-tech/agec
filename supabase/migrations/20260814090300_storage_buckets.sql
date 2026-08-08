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
