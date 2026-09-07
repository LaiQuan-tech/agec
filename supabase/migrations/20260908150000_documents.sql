-- ============================================================
-- 檔案下載從「課程資訊專用」放大成全站共用
--
-- 20260908120000 建了 course_forms，只服務 /courses §3 的系上表單。現在
-- /admissions §4 也要能放檔案 —— 舊系網上的當年度招生簡章、書面資料格式與
-- 考古題（97 個下載檔）要逐步搬進新站，那些是系上自己的內容，不該長期
-- 寄居在舊站。
--
-- 兩件事：
--   1. 改名 course_forms → documents。表名本來就綁著「課程」，再放招生的檔案
--      就開始說謊。現在改是最便宜的時機：這張表昨天才建、目前 0 列、
--      也還沒有任何稽核紀錄。rename 會自動帶走 policy、trigger 與 grant
--      （它們吃的是 OID 不是名字）。
--   2. 加 section 欄，值與 links.section 同一套（'courses' / 'admissions'）。
--      既有列（沒有）與未填的列都預設 'courses'，也就是原本的行為。
--
-- ⚠️ section 是純文字加 CHECK，不是 enum：加一個新區塊時 enum 要 ALTER TYPE
--    （在交易裡有限制），CHECK 直接改就好。值域刻意收斂 —— 沒有頁面會渲染的
--    區塊等於一筆看不到的資料。
--
-- 🔴 **必須在推程式碼之前跑。** DOCUMENT_COLUMNS 是逐一列欄位的字串，而且
--    表名也變了；舊程式查 course_forms 會查不到（那一區本來就是空的，所以
--    畫面上看不出差別），新程式查 documents 則需要這支先跑完。
--
-- ⚠️ 這個專案沒有 Supabase CLI，migration 是人工貼進 Dashboard SQL Editor
--    （或 Management API）。跑完請回 supabase/README.md 勾記。
--
-- 可重複執行（改名與加欄都先檢查現況）。
-- ============================================================

-- 1) 改名。已經改過就跳過；兩張都不存在時（20260908120000 還沒跑）也不失敗。
do $$
begin
  if to_regclass('public.course_forms') is not null
     and to_regclass('public.documents') is null then
    alter table public.course_forms rename to documents;
    raise notice 'course_forms 已改名為 documents。';
  elsif to_regclass('public.documents') is null then
    raise exception 'public.course_forms 與 public.documents 都不存在，請先跑 20260908120000_course_forms.sql。';
  end if;
end
$$;

-- 2) 區塊欄。
alter table public.documents
  add column if not exists section text not null default 'courses';

alter table public.documents
  drop constraint if exists documents_section_check;
alter table public.documents
  add constraint documents_section_check
  check (section in ('courses', 'admissions'));

comment on table  public.documents         is '全站的檔案下載卡。section 決定它出現在哪一頁。';
comment on column public.documents.section is 'courses = /courses §3 系上表單；admissions = /admissions §4 招生檔案。值域與 links.section 同一套。';

-- 3) policy 的名字裡還帶著舊表名，一起換掉 —— rename 只改表名不改 policy 名。
--    RLS 的效力不受影響，這純粹是為了下次有人 `\d documents` 時不會困惑。
drop policy if exists "public read course_forms" on public.documents;
drop policy if exists "admin write course_forms" on public.documents;

drop policy if exists "public read documents" on public.documents;
create policy "public read documents" on public.documents
  for select to anon, authenticated using (true);

drop policy if exists "admin write documents" on public.documents;
create policy "admin write documents" on public.documents
  for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- ------------------------------------------------------------
-- 驗收（唯讀）
-- ------------------------------------------------------------
-- 1) 舊表名已經不在、新表名在：
--    select to_regclass('public.course_forms') as old, to_regclass('public.documents') as new;
--    期望：old = null，new = documents
--
-- 2) section 欄與 CHECK：
--    select column_name, is_nullable, column_default from information_schema.columns
--     where table_schema='public' and table_name='documents' and column_name='section';
--    期望：section | NO | 'courses'::text
--
--    insert into public.documents (label, section) values ('x','nope');
--    期望：被 documents_section_check 擋下（測完記得 rollback）
--
-- 3) policy 與 trigger 都還在（rename 會自動帶走）：
--    select policyname from pg_policies where tablename='documents';
--    期望：public read documents / admin write documents
--    select tgname from pg_trigger where tgrelid='public.documents'::regclass and not tgisinternal;
--    期望：log_admin_change
--
-- 4) 表層權限（rename 帶得走，這裡只是確認）：
--    select grantee, privilege_type from information_schema.role_table_grants
--     where table_schema='public' and table_name='documents' and grantee in ('anon','authenticated')
--     order by grantee, privilege_type;
--    期望：anon 只有 SELECT；authenticated 有 DELETE/INSERT/SELECT/UPDATE
