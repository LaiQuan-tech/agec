-- ============================================================
-- 系上專屬表單（/courses §3「常用表格」底下的下載卡）
--
-- §3 原本只有一排 .resource-row，四條裡有三條指向臺大教務處
-- （aca.ntu.edu.tw）—— 那是**校方**的表格。系上自己的表單（申請書、
-- 計畫變更、實習同意…）沒有任何地方可以放，也沒有辦法讓系辦自己維護。
-- 這張表就是那些表單，檔案上傳到既有的 attachments bucket。
--
-- 形狀照 capabilities（20260908110000）抄，多三件事：
--   description / description_en   卡片上的一句話說明，選填
--   file_url                       檔案網址。可以是上傳到 attachments 的
--                                  公開網址，也可以是貼進來的站外網址 ——
--                                  後台的 UploadField 兩種都支援
--   file_name                      上傳時的原始檔名。用途有二：推導卡片左上
--                                  角那個副檔名徽章（PDF / DOCX…），以及讓
--                                  下載存檔時是看得懂的名字，而不是 uuid
--
-- ⚠️ file_url 允許 null。系辦常常先把表單名稱列出來、檔案晚一點才補；
--    前台的 MaybeLink 對沒有網址的卡片會拿掉 href 與箭頭，變成一張還不能
--    點的卡，而不是一個點了會跳回頁首的假連結。
--
-- ⚠️ 顯示欄一定要叫 label（不是 name / title）。20260902100000 的稽核
--    trigger 是用 coalesce(title, name, label, slug, code, email) 找「人看得
--    懂的名稱」，取別的欄名會讓操作日誌那一欄變成 null。
--
-- 沒有種子資料：這張表在此之前不存在，沒有硬編的內容要搬。表是空的時候前台
-- 不會印出任何東西（連小標都不印），/courses §3 就跟今天一模一樣 ——
-- 所以這支 migration 與程式碼誰先上線都可以。
--
-- ⚠️ 這個專案沒有 Supabase CLI，migration 是人工貼進 Dashboard SQL Editor。
--    跑完請回 supabase/README.md 勾記。
--
-- 可重複執行。
-- ============================================================

create table if not exists public.course_forms (
  id             bigint      generated always as identity primary key,
  label          text        not null,
  label_en       text,
  description    text,
  description_en text,
  file_url       text,
  file_name      text,
  sort_order     int         not null default 0,
  created_at     timestamptz not null default now()
);

comment on table  public.course_forms                is '/courses §3 的系上專屬表單下載卡。順序由 sort_order 決定。';
comment on column public.course_forms.label_en       is 'null = 還沒翻，英文站會顯示中文的 label。';
comment on column public.course_forms.file_url       is 'null = 檔案還沒上傳，前台會印出卡片但不給連結。';
comment on column public.course_forms.file_name      is '上傳時的原始檔名。推導卡片的副檔名徽章，並讓下載存檔時有看得懂的名字。';

-- ------------------------------------------------------------
-- RLS
--
-- 公開內容，anon 讀得到是正確的；寫入限白名單。
-- (select public.is_admin()) 的括號是刻意的（見 20260814090200 檔頭）：
-- 讓 planner 每個 statement 只求值一次，而不是每一列都求值一次。
-- ------------------------------------------------------------
alter table public.course_forms enable row level security;

drop policy if exists "public read course_forms" on public.course_forms;
create policy "public read course_forms" on public.course_forms
  for select to anon, authenticated using (true);

drop policy if exists "admin write course_forms" on public.course_forms;
create policy "admin write course_forms" on public.course_forms
  for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- ⚠️ 明寫 grant / revoke，不要倚賴預設。Supabase 的 default privileges 會把
--    新表 grant all 給 anon 與 authenticated，所以「沒給權限」在這個平台上
--    不成立 —— 沒有 revoke 的話 anon 連 delete 的表層權限都有，擋下它的只剩
--    RLS 一道。
revoke all on table public.course_forms from anon, authenticated;
grant select on table public.course_forms to anon, authenticated;
grant insert, update, delete on table public.course_forms to authenticated;

-- ------------------------------------------------------------
-- 稽核日誌。函式不存在時（20260902100000 還沒跑）整段跳過，不讓這支失敗。
-- ------------------------------------------------------------
do $$
begin
  if exists (
    select 1 from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public' and p.proname = 'log_admin_change'
  ) then
    drop trigger if exists log_admin_change on public.course_forms;
    create trigger log_admin_change
      after insert or update or delete on public.course_forms
      for each row execute function public.log_admin_change();
  else
    raise notice '略過稽核 trigger：public.log_admin_change() 不存在，請先跑 20260902100000。';
  end if;
end
$$;

-- ------------------------------------------------------------
-- 驗收（唯讀）
-- ------------------------------------------------------------
-- 1) 表建好了、而且是空的：
--    select count(*) from public.course_forms;   -- 期望 0
--
-- 2) 表層權限收乾淨了（anon 只剩 SELECT）：
--    select grantee, privilege_type
--      from information_schema.role_table_grants
--     where table_schema = 'public' and table_name = 'course_forms'
--       and grantee in ('anon', 'authenticated')
--     order by grantee, privilege_type;
--    期望：anon 只有 SELECT；authenticated 有 DELETE / INSERT / SELECT / UPDATE
--
-- 3) 稽核 trigger 掛上了：
--    select tgname from pg_trigger
--     where tgrelid = 'public.course_forms'::regclass and not tgisinternal;
--    期望：log_admin_change
--
-- 4) 可重複執行 —— 整支再跑一次不應該有任何錯誤，count 仍然是跑之前的數字。
