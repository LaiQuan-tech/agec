-- ============================================================
-- 核心能力標籤（/admissions §3 的膠囊）
--
-- 原本硬編在 lib/i18n/admissions.ts 的 ADMISSIONS.section3.capabilities，
-- 8 個 { zh, en } 物件。系辦要能自己增刪改，所以搬進資料庫。
--
-- 形狀照 links 抄（那是全站最單純的「短標籤 + 排序 + 中英一對」）：
--   label / label_en    中文欄用原名、英文欄加 _en，永遠 nullable、永遠沒有
--                       default。null = 「還沒翻」，由 pick() 退回中文。
--   sort_order          與其他五張表一致的欄名，不用 position / display_order。
--
-- ⚠️ 顯示欄一定要叫 label，不是 name 也不是 text。20260902100000 的稽核
--    trigger（log_admin_change）是用 coalesce(title, name, label, slug, code,
--    email) 去找「人看得懂的名稱」，取別的欄名會讓操作日誌那一欄變成 null。
--
-- ⚠️ i18n 那 8 筆**不刪**，改成「資料表是空的時候才用」的備援（與 links 的
--    .resource-row 同一個模式）。這同時解決了部署順序：程式先上線時表還不
--    存在，getCapabilities() 會 log 完回空陣列，前台照樣顯示原本那 8 顆；
--    等這支跑完種進 8 筆才自動切換成 DB 版。中間沒有一刻會空白。
--
-- ⚠️ 這個專案沒有 Supabase CLI，migration 是人工貼進 Dashboard SQL Editor。
--    跑完請回 supabase/README.md 勾記。
--
-- 可重複執行。
-- ============================================================

create table if not exists public.capabilities (
  id         bigint      generated always as identity primary key,
  label      text        not null,
  label_en   text,
  sort_order int         not null default 0,
  created_at timestamptz not null default now()
);

comment on table  public.capabilities        is '/admissions §3 的核心能力膠囊。順序由 sort_order 決定。';
comment on column public.capabilities.label_en is 'null = 還沒翻，英文站會顯示中文的 label。';

-- ------------------------------------------------------------
-- RLS
--
-- 這是公開內容，anon 讀得到是正確的；寫入限白名單。
-- (select public.is_admin()) 的括號是刻意的（見 20260814090200 檔頭）：
-- 讓 planner 每個 statement 只求值一次，而不是每一列都求值一次。
--
-- ⚠️ is_admin() 的語意是「在後台白名單裡」，對操作人員也回 true。內容表一律
--    用它，不要換成 is_manager() —— 那是 admin_users 與 admin_audit_log 專用的。
-- ------------------------------------------------------------
alter table public.capabilities enable row level security;

drop policy if exists "public read capabilities" on public.capabilities;
create policy "public read capabilities" on public.capabilities
  for select to anon, authenticated using (true);

drop policy if exists "admin write capabilities" on public.capabilities;
create policy "admin write capabilities" on public.capabilities
  for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- ⚠️ 明寫 grant / revoke，不要倚賴預設。Supabase 的 default privileges 會把
--    新表 grant all 給 anon 與 authenticated，所以「沒給權限」在這個平台上
--    不成立 —— 沒有 revoke 的話 anon 連 delete 的表層權限都有，擋下它的只剩
--    RLS 一道。
revoke all on table public.capabilities from anon, authenticated;
grant select on table public.capabilities to anon, authenticated;
grant insert, update, delete on table public.capabilities to authenticated;

-- ------------------------------------------------------------
-- 稽核日誌
--
-- 20260902100000 用一個 do 迴圈把 log_admin_change 掛到七張表上。這裡單獨掛
-- 一次，不必為了一張新表重跑那支大 migration。那支的表名陣列也補上
-- 'capabilities'，讓兩個檔案不會對不起來（重跑它只會把這個 trigger 重建一次）。
--
-- 函式不存在時（20260902100000 還沒跑）整段跳過，不讓這支 migration 失敗。
-- ------------------------------------------------------------
do $$
begin
  if exists (
    select 1 from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public' and p.proname = 'log_admin_change'
  ) then
    drop trigger if exists log_admin_change on public.capabilities;
    create trigger log_admin_change
      after insert or update or delete on public.capabilities
      for each row execute function public.log_admin_change();
  else
    raise notice '略過稽核 trigger：public.log_admin_change() 不存在，請先跑 20260902100000。';
  end if;
end
$$;

-- ------------------------------------------------------------
-- 種入現有的 8 筆
--
-- 逐字取自 lib/i18n/admissions.ts:166-176，順序就是原本畫面上的順序。
-- 用 where not exists 而不是 on conflict：label 上沒有 unique constraint
-- （之後系辦可能真的想要兩個字一樣但情境不同的標籤，加約束是替他們決定）。
-- 這樣重跑不會產生重複列，但也不會覆蓋系辦自己改過的文字。
-- ------------------------------------------------------------
insert into public.capabilities (label, label_en, sort_order)
select v.label, v.label_en, v.sort_order
  from (values
    ('經濟理論',   'Economic theory',                   1),
    ('政策分析',   'Policy analysis',                   2),
    ('資料科學',   'Data science',                      3),
    ('農企業管理', 'Agribusiness management',           4),
    ('國際貿易',   'International trade',               5),
    ('永續與 ESG', 'Sustainability and ESG',            6),
    ('跨域整合',   'Interdisciplinary integration',     7),
    ('溝通決策',   'Communication and decision-making', 8)
  ) as v(label, label_en, sort_order)
 where not exists (
   select 1 from public.capabilities c where c.label = v.label
 );

-- ------------------------------------------------------------
-- 驗收（唯讀）
-- ------------------------------------------------------------
-- 1) 8 筆、順序正確、英文都有：
--    select sort_order, label, label_en from public.capabilities order by sort_order, id;
--    期望：8 列，1 經濟理論 … 8 溝通決策，label_en 無 null
--
-- 2) 可重複執行 —— 再跑一次整支，這個數字不變：
--    select count(*) from public.capabilities;   -- 期望 8
--
-- 3) 表層權限收乾淨了（anon 只剩 SELECT）：
--    select grantee, privilege_type
--      from information_schema.role_table_grants
--     where table_schema = 'public' and table_name = 'capabilities'
--       and grantee in ('anon', 'authenticated')
--     order by grantee, privilege_type;
--    期望：anon 只有 SELECT；authenticated 有 DELETE / INSERT / SELECT / UPDATE
--
-- 4) 稽核 trigger 掛上了：
--    select tgname from pg_trigger
--     where tgrelid = 'public.capabilities'::regclass and not tgisinternal;
--    期望：log_admin_change
