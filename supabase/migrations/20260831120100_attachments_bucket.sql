-- Storage：消息附件 bucket
--
-- 起因：搬運舊站消息時，24% 的公告帶附件下載，實際抓下來的副檔名有
-- .pdf / .docx / .doc / .zip / .rar。既有四個 bucket 沒有一個收得下——
-- photos / posters / blog 只允許圖片，journal 上限 50MB 但只允許
-- application/pdf。
--
-- 為什麼不放寬 journal 而要新開一個：journal 的語意是「農業與經濟期刊」的
-- PDF，把報名表和考古題壓縮檔倒進去，之後沒有人分得出哪些是期刊。
--
-- 執行前提：20260814090300_storage_buckets.sql 已跑過（要沿用它的 is_admin()
-- policy 形狀）。本檔可重複執行。
begin;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('attachments', 'attachments', true, 52428800, array[
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/zip',
  'application/x-rar-compressed',
  'application/vnd.rar',
  'text/plain'
])
on conflict (id) do update
  set public             = excluded.public,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- 四條 policy 全部重建，只為了把 'attachments' 加進 bucket 清單。
-- 這裡刻意重複整份 bucket 陣列而不抽成常數：policy 的 using 子句無法引用
-- 變數，抽成函式反而讓「這個 bucket 誰能寫」變得要跳兩層才看得到。
drop policy if exists "admin read media" on storage.objects;
create policy "admin read media" on storage.objects
  for select to authenticated
  using (
    bucket_id in ('photos','posters','journal','blog','attachments')
    and (select public.is_admin())
  );

drop policy if exists "admin upload media" on storage.objects;
create policy "admin upload media" on storage.objects
  for insert to authenticated
  with check (
    bucket_id in ('photos','posters','journal','blog','attachments')
    and (select public.is_admin())
  );

drop policy if exists "admin update media" on storage.objects;
create policy "admin update media" on storage.objects
  for update to authenticated
  using (
    bucket_id in ('photos','posters','journal','blog','attachments')
    and (select public.is_admin())
  )
  with check (
    bucket_id in ('photos','posters','journal','blog','attachments')
    and (select public.is_admin())
  );

drop policy if exists "admin delete media" on storage.objects;
create policy "admin delete media" on storage.objects
  for delete to authenticated
  using (
    bucket_id in ('photos','posters','journal','blog','attachments')
    and (select public.is_admin())
  );

commit;

-- 驗收
-- select id, public, file_size_limit, array_length(allowed_mime_types,1)
--   from storage.buckets order by id;
-- 預期 5 個 bucket，attachments 上限 52428800、11 種 mime。
