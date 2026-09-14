-- ============================================================
-- 頁面文案格位 page_copy（第一頁：學生專區 /students）
--
-- 客戶回饋：「學生專區這一頁後台沒有編輯」。整頁只有 §4 的連結卡走 links 表，
-- §1 四個步驟、§2 校園生活的標題／內文／按鈕、§3 會長方塊＋五個部門，全部寫死
-- 在 lib/i18n/students.ts。
--
-- ## 為什麼是 key/value 的「格位」，不是可增刪的「卡片」表
--
-- §1 與 §3 是格數寫死的網格：site.css 靠 :nth-child 在 1180px／860px 斷點補
-- 格線，多一格就在平板寬度破圖（components/site/README.md §4）。所以開放的是
-- 每一格的**文字**，不是格子的數量 —— 24 個固定的 name，後台一張表單存整批。
--
--   page   'students'（下一頁要接時不必再開表）
--   name   'section1.steps.1.title' 這種路徑；叫 name 而不是 key，是讓
--          log_admin_change() 的 coalesce(title, name, label, …) 自動把它當
--          日誌的顯示文字
--   zh/en  not null default ''：英文空白 = 英文站顯示中文（與其他表的 *_en 同義）
--
-- ## 種子 = 字典裡現在的字
--
-- 逐字取自 lib/i18n/students.ts（zh 與 en 都塞），on conflict do nothing：
-- 上線那一刻前台一個字都不會變，重跑也不會蓋掉系辦改過的字。
--
-- ## 順手：四條教務處表格連結從 links.section='courses' 搬到 'students'
--
-- /courses 早就不讀 section='courses'（components/site/pages.tsx），那四條
-- （選課相關表格、學位考試申請、離校程序表格、研究計畫申請）只有 /students §4
-- 在印，但後台把它們標成「課程資訊」，系辦在「學生專區」底下找不到。搬過去、
-- 排在原本四條學生資源前面（前台順序不變）。整段包在 if exists 裡，可重複執行。
--
-- 🔴 **必須在推程式碼之前跑。** 新程式只讀 links.section='students'；沒搬的話
--    那四條會從 /students 消失。page_copy 本身沒有順序限制（表不在時前台退回
--    字典）。
--
-- ⚠️ 這個專案沒有 Supabase CLI，migration 是人工貼進 Dashboard SQL Editor
--    （或 Management API）。跑完請回 supabase/README.md 勾記。
-- ============================================================

create table if not exists public.page_copy (
  id         bigint      generated always as identity primary key,
  page       text        not null,
  name       text        not null,
  zh         text        not null default '',
  en         text        not null default '',
  updated_at timestamptz not null default now(),
  unique (page, name)
);

comment on table  public.page_copy      is '固定格位的頁面文案（目前只有 students）。格數由程式決定，後台只能改字。';
comment on column public.page_copy.name is '格位的路徑，例如 section1.steps.1.title；清單在 lib/page-copy/<page>.ts。';
comment on column public.page_copy.en   is '空字串 = 還沒翻，英文站顯示 zh。網址類格位只用 zh。';

-- ------------------------------------------------------------
-- RLS（與 capabilities 同一套：公開讀、白名單寫；明寫 grant/revoke）
-- ------------------------------------------------------------
alter table public.page_copy enable row level security;

drop policy if exists "public read page_copy" on public.page_copy;
create policy "public read page_copy" on public.page_copy
  for select to anon, authenticated using (true);

drop policy if exists "admin write page_copy" on public.page_copy;
create policy "admin write page_copy" on public.page_copy
  for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

revoke all on table public.page_copy from anon, authenticated;
grant select on table public.page_copy to anon, authenticated;
grant insert, update, delete on table public.page_copy to authenticated;

-- ------------------------------------------------------------
-- 稽核 trigger（函式不存在時跳過，不讓這支失敗）
-- ------------------------------------------------------------
do $$
begin
  if exists (
    select 1 from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public' and p.proname = 'log_admin_change'
  ) then
    drop trigger if exists log_admin_change on public.page_copy;
    create trigger log_admin_change
      after insert or update or delete on public.page_copy
      for each row execute function public.log_admin_change();
  else
    raise notice '略過稽核 trigger：public.log_admin_change() 不存在，請先跑 20260902100000。';
  end if;
end
$$;

-- ------------------------------------------------------------
-- 種子：學生專區 24 個格位（逐字取自 lib/i18n/students.ts）
-- ------------------------------------------------------------
insert into public.page_copy (page, name, zh, en)
values
  ('students', 'section1.steps.1.title', '完成入學程序', 'Complete enrolment'),
  ('students', 'section1.steps.1.body',  '註冊、學雜費、健康檢查與學生證辦理。', 'Registration, tuition and fees, the health check and your student ID card.'),
  ('students', 'section1.steps.2.title', '安排校園生活', 'Settle into campus life'),
  ('students', 'section1.steps.2.body',  '住宿申請、交通、餐飲與學生服務。', 'Housing applications, transport, dining and student services.'),
  ('students', 'section1.steps.3.title', '認識課程系統', 'Learn the course system'),
  ('students', 'section1.steps.3.body',  '選課、學分規劃與跨域學習資源。', 'Course selection, credit planning and cross-disciplinary resources.'),
  ('students', 'section1.steps.4.title', '加入農經社群', 'Join the AGEC community'),
  ('students', 'section1.steps.4.body',  '迎新、系學會、導生與同儕支持。', 'Orientation, the student association, advising groups and peer support.'),
  ('students', 'section2.heading', '從農綜館開始，認識臺大生活', 'Start at the Agriculture Complex and get to know NTU'),
  ('students', 'section2.body',    '小地圖整理農業綜合館周邊的學生餐廳、教學館與日常服務；椰林攻略則提供選課、校園資源與系所資訊，讓新生更快融入。', 'The mini-map gathers the dining halls, teaching buildings and everyday services around the Agriculture Complex Building, while the Royal Palm Boulevard guide covers course selection, campus resources and department information so new students settle in sooner.'),
  ('students', 'section2.cta',     '開啟校園小地圖', 'Open the campus mini-map'),
  ('students', 'section2.url',     'https://map.ntu.edu.tw/', ''),
  ('students', 'section3.leader.title', '會長・副會長', 'President · Vice President'),
  ('students', 'section3.leader.body',  '統籌組織方向與跨部門協作', 'Sets the association''s direction and coordinates across its branches'),
  ('students', 'section3.branches.1.name', '活動部', 'Events'),
  ('students', 'section3.branches.1.body', '活動籌備・企劃發想', 'Event planning · Programme ideas'),
  ('students', 'section3.branches.2.name', '公關部', 'Public Relations'),
  ('students', 'section3.branches.2.body', '系間交流・社群資訊', 'Inter-department exchange · Community updates'),
  ('students', 'section3.branches.3.name', '文書部', 'Secretariat'),
  ('students', 'section3.branches.3.body', '會議記錄・內容製作', 'Meeting minutes · Content production'),
  ('students', 'section3.branches.4.name', '總務部', 'General Affairs'),
  ('students', 'section3.branches.4.body', '預算與費用管理', 'Budget and expense management'),
  ('students', 'section3.branches.5.name', '美宣部', 'Design and Publicity'),
  ('students', 'section3.branches.5.body', '視覺設計・文宣製作', 'Visual design · Promotional materials')
on conflict (page, name) do nothing;

-- ------------------------------------------------------------
-- links：四條教務處表格從 courses 搬到 students，排在既有四條前面
-- ------------------------------------------------------------
do $$
begin
  if exists (select 1 from public.links where section = 'courses') then
    update public.links
       set sort_order = sort_order + 4
     where section = 'students';

    with ordered as (
      select id, row_number() over (order by sort_order, id) as rn
        from public.links
       where section = 'courses'
    )
    update public.links l
       set section = 'students',
           sort_order = o.rn
      from ordered o
     where l.id = o.id;

    raise notice 'links：section=courses 的列已搬到 students。';
  end if;
end
$$;

-- ------------------------------------------------------------
-- 驗收（唯讀）
-- ------------------------------------------------------------
-- 1) 24 列：
--    select count(*) from public.page_copy where page = 'students';
-- 2) links：students 8 列、courses 0 列，教務處四條排前面：
--    select id, section, label, sort_order from public.links
--     where section in ('students','courses') order by section, sort_order;
-- 3) policy / trigger / grant：
--    select policyname from pg_policies where tablename = 'page_copy';
--    select tgname from pg_trigger where tgrelid = 'public.page_copy'::regclass and not tgisinternal;
--    select grantee, privilege_type from information_schema.role_table_grants
--     where table_schema='public' and table_name='page_copy' and grantee in ('anon','authenticated')
--     order by grantee, privilege_type;
-- 4) 可重複執行：再跑一次不報錯、列數不變、links 不會再位移。
