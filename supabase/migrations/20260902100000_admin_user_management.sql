-- ============================================================
-- 後台人員管理 ＋ 兩層權限 ＋ 操作日誌
--
-- 三件事一起做，因為它們共用同一張表與同一套授權判斷：
--   1. 兩層權限：管理員（能管人、看日誌）／操作人員（只能編內容）
--   2. 人員管理：讓管理員自己開帳號，不必每次找開發者拿 service-role 金鑰
--   3. 操作日誌：誰新增、修改、刪除了什麼
--
-- ⚠️ 這個專案沒有 Supabase CLI，migration 是人工貼進 Dashboard SQL Editor。
--    跑完請回 supabase/README.md 勾記。
--
-- 可重複執行。
-- ============================================================
begin;

-- ============================================================
-- 一、兩層權限
-- ============================================================

-- ------------------------------------------------------------
-- 1.1 role 欄位
--
-- 預設 'operator' 而不是 'admin'：任何漏填 role 的寫入都落在權限較小的那一層。
-- 反過來設的話，一次疏忽就是多一個能管人的帳號。
-- ------------------------------------------------------------
alter table public.admin_users
  add column if not exists role text not null default 'operator';

alter table public.admin_users drop constraint if exists admin_users_role_valid;
alter table public.admin_users
  add constraint admin_users_role_valid check (role in ('admin', 'operator'));

comment on column public.admin_users.role is
  'admin = 管理員（能管人、看操作日誌）／operator = 操作人員（只能編內容）。'
  '⚠️ 預設 operator：漏填時落在權限較小的那一層。';

-- 誰把這個人加進來的。到目前為止白名單只有 email 與 created_at，
-- 「這個帳號是誰開的」完全查不到 —— 六個帳號還看得出來，二十個就不行了。
-- on delete set null 而不是 cascade：開帳號的人離職時，不該把他開過的
-- 每一個帳號一起帶走。
alter table public.admin_users
  add column if not exists created_by uuid references auth.users (id) on delete set null;

comment on column public.admin_users.created_by is
  '把這個人加進白名單的管理員。null = 早於這個欄位存在，或開帳號的人已被刪除。';

-- ------------------------------------------------------------
-- 1.2 現有帳號的分層
--
-- 依系辦指定：這兩個是管理員，其餘沿用 default 的 operator。
-- 用 email 比對而不是 user_id：user_id 是每個環境各自產生的。
-- ------------------------------------------------------------
update public.admin_users
   set role = 'admin'
 where lower(email) in ('armand7951@gmail.com', 'ntuagecmba@ntu.edu.tw');

-- ------------------------------------------------------------
-- 1.3 判斷函式
--
-- 🔴 `is_admin()` 完全不動。
--
-- 它被 14 條 policy 依賴，分散在 5 支 migration（內容六表、storage.objects、
-- alumni_events、報名紀錄），而那些是人工一支一支貼進 Dashboard 執行的。
-- 改它的名字或語意要同時改對 14 處，漏一處就是那張表的權限靜默走樣。
--
-- ⚠️ 這留下一筆命名債：`is_admin()` 對操作人員也回 true，它真正的意思是
--    「在白名單裡 ＝ 可以進後台、可以編內容」，名字其實該叫 is_staff()。
--    **沒有改名是刻意的**，不是疏忽 —— 名字不精確的成本遠低於同時改 14 條
--    人工執行的 policy 的風險。
--
-- 新的兩支給第二層用：
--   admin_role()  'admin' | 'operator' | null —— 一次呼叫拿到「在不在」與「哪一層」
--   is_manager()  admin_role() = 'admin'，給 policy 用
--
-- 兩支都 SECURITY DEFINER：操作人員讀不到 admin_users（policy 是 manager 限定），
-- 但必須能問「我是哪一層」。
-- ------------------------------------------------------------
create or replace function public.admin_role()
returns text
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select a.role from public.admin_users a where a.user_id = auth.uid();
$$;

revoke all     on function public.admin_role() from public, anon;
grant  execute on function public.admin_role() to authenticated;

comment on function public.admin_role() is
  '目前請求者的後台層級：admin / operator / null（不在白名單）。';

create or replace function public.is_manager()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.admin_users a
     where a.user_id = auth.uid() and a.role = 'admin'
  );
$$;

revoke all     on function public.is_manager() from public, anon;
grant  execute on function public.is_manager() to authenticated;

comment on function public.is_manager() is
  '目前請求者是否為「管理員」層。⚠️ 與 is_admin() 不同：is_admin() 對操作人員'
  '也回 true（它的意思是「在白名單裡」）。人員管理與操作日誌一律用這一支。';

-- ------------------------------------------------------------
-- 1.4 白名單的 policy
--
-- 🔴 用 is_manager()，**不能**用 is_admin()。
--    用錯的話操作人員可以把自己升成管理員，兩層當場失效。這是整支 migration
--    裡最容易寫錯也最致命的一行。
--
-- ⚠️ 這條 policy 推翻了 20260814090100_admin_allowlist.sql 的一個刻意設計：
--    原本 admin_users 是「RLS 開啟但零 policy」，而 is_admin() 做成
--    SECURITY DEFINER 正是為了「能問自己是不是管理員，卻看不到名單本身」——
--    那個檔的註解寫著「避免列舉出所有管理者的 email」。
--
--    人員管理頁的整個用途就是列舉，所以這個限制在這裡讓步 —— 但只讓給
--    管理員。操作人員與 anon 依然什麼都讀不到。
--
-- 用單一條 `for all` 而不是拆成 read/write：`for all` 本來就涵蓋 select，
-- 拆開只會多一條互為超集的規則。
-- ------------------------------------------------------------
drop policy if exists "admin manage admin_users" on public.admin_users;
drop policy if exists "manager manage admin_users" on public.admin_users;
create policy "manager manage admin_users" on public.admin_users
  for all to authenticated
  using ((select public.is_manager()))
  with check ((select public.is_manager()));

-- ------------------------------------------------------------
-- 1.5 🔴 保底：至少要留一個管理員
--
-- 白名單如果沒有任何 role='admin' 的人，就沒有人能管人、沒有人能看日誌，
-- 而修復只能靠開發者再拿一次 service-role 金鑰手動 update 一列。
--
-- 應用層也會擋（不能移除／降級自己、移除前先數一次），但這種「一旦發生就得
-- 叫人來救」的狀態值得在資料庫再擋一次 —— 與 alumni_events_not_oversold
-- 同樣的用意：應用層寫錯時讓交易失敗，而不是讓系統進入沒有出口的狀態。
--
-- ⚠️ AFTER STATEMENT，不是 BEFORE ROW。
--    BEFORE ROW 看到的是「這一列還沒被刪」的狀態，所以
--    `delete from admin_users`（一次刪光）在第一列上就會誤判成「還有很多列」
--    而放行。AFTER STATEMENT 在整個語句做完後才看，才是真的。
--
-- ⚠️ 同時掛 delete 與 update：把最後一個管理員**降級成 operator** 造成的後果
--    與刪掉他一模一樣，只擋 delete 會留下一條繞過去的路。
--
-- 這也順帶擋住第三條路：admin_users.user_id 是 references auth.users
-- on delete cascade，所以刪掉最後一個管理員的 auth 帳號會連帶清空白名單 ——
-- 那個 delete 也會被擋下來。
-- ------------------------------------------------------------
create or replace function public.admin_users_keep_manager()
returns trigger
language plpgsql
-- 🔴 SECURITY DEFINER 是必要的，不是順手加的。
--
-- 少了它，這支函式以「觸發它的那個人」的身分執行，於是 RLS 也套用在它身上：
-- 操作人員動到 admin_users 時，它看到的是 0 列，count(*) where role='admin'
-- 因此算出 0，誤判成「最後一個管理員被移除」而丟出 LAST_MANAGER。
--
-- 實測就是這樣炸的：操作人員試圖把自己升級時，被擋下來的原因不是 RLS，
-- 而是這個誤判。結果碰巧是對的（操作人員仍然沒升級成功），但守門的正確性
-- 變成取決於「誰在執行它」—— 那不是守門，那是巧合。
--
-- 加上之後它永遠看得到真實的管理員人數，判斷才與呼叫者無關。
security definer
set search_path = public, pg_temp
as $$
begin
  if (select count(*) from public.admin_users where role = 'admin') = 0 then
    raise exception 'LAST_MANAGER';
  end if;
  return null;
end;
$$;

comment on function public.admin_users_keep_manager() is
  '保底：白名單至少要留一個 role=admin，否則沒有人能管人。AFTER STATEMENT 觸發。';

drop trigger if exists admin_users_keep_one on public.admin_users;
drop trigger if exists admin_users_keep_manager on public.admin_users;
create trigger admin_users_keep_manager
  after delete or update on public.admin_users
  for each statement execute function public.admin_users_keep_manager();

-- ============================================================
-- 二、操作日誌
-- ============================================================

create table if not exists public.admin_audit_log (
  id           bigint generated always as identity primary key,

  -- 誰做的。
  --
  -- 🔴 刻意**沒有**外鍵指向 auth.users，這一點是實測撞出來的：
  --    加了外鍵之後，刪掉某人的 auth 帳號會 cascade 刪掉他的白名單列，
  --    而那個 delete 觸發的日誌寫入又要引用「正在被刪的那個人」——
  --    外鍵違反，於是日誌把它自己要記錄的那個操作弄失敗了。
  --
  --    更根本地說：同時存 actor_email 快照又加外鍵是自相矛盾的。快照存在的
  --    理由就是「這個帳號可能會消失」。稽核日誌是 append-only 的事實紀錄，
  --    不是一張需要維持參照完整性的關聯表。
  actor_id     uuid,
  -- ⚠️ email 存快照而不是 join：帳號刪掉之後仍要看得出是誰做的。
  actor_email  text,

  action       text not null,   -- insert | update | delete
  entity       text not null,   -- 資料表名
  entity_id    text,            -- 被動的那一列
  -- 給人看的名稱（標題／姓名／代稱…），由 trigger 從該列自己挑。
  label        text,

  changed_at   timestamptz not null default now()
);

alter table public.admin_audit_log drop constraint if exists admin_audit_log_action_valid;
alter table public.admin_audit_log
  add constraint admin_audit_log_action_valid
    check (action in ('insert', 'update', 'delete'));

create index if not exists admin_audit_log_recent
  on public.admin_audit_log (changed_at desc);
create index if not exists admin_audit_log_by_entity
  on public.admin_audit_log (entity, changed_at desc);

comment on table public.admin_audit_log is
  '後台操作日誌。由資料庫 trigger 寫入，不由應用層寫 —— 見 log_admin_change()。';

-- ------------------------------------------------------------
-- RLS：管理員唯讀，其餘什麼都不行
--
-- 🔴 刻意**不建 insert / update / delete policy**。
--    沒有任何登入者能偽造一筆紀錄，也沒有任何登入者能抹掉自己的紀錄 ——
--    一份可以被當事人編輯的稽核日誌沒有意義。
--    寫入只經由 SECURITY DEFINER 的 trigger（以表的擁有者身分執行，繞過 RLS）。
-- ------------------------------------------------------------
alter table public.admin_audit_log enable row level security;

-- ⚠️ 明寫 revoke，不要倚賴預設。
--    Supabase 的 default privileges 會把新表 grant all 給 anon 與 authenticated，
--    所以「沒給權限」在這個平台上不成立 —— 不明寫的話，擋住寫入的就只剩 RLS
--    一層。兩層都要有：權限層先擋，RLS 是後備。
revoke all on table public.admin_audit_log from anon, authenticated;
grant select on table public.admin_audit_log to authenticated;

drop policy if exists "manager read audit log" on public.admin_audit_log;
create policy "manager read audit log" on public.admin_audit_log
  for select to authenticated
  using ((select public.is_manager()));

-- ------------------------------------------------------------
-- 通用寫入函式：給其他 SECURITY DEFINER 函式呼叫（例如取消報名）
--
-- 不 grant 給 authenticated：只有資料庫內部的 definer 函式用得到，
-- 應用層沒有直接寫日誌的管道。
-- ------------------------------------------------------------
create or replace function public.log_admin_action(
  p_action text, p_entity text, p_entity_id text, p_label text
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_actor uuid := auth.uid();
  v_email text;
begin
  if v_actor is null then
    return;
  end if;
  select u.email into v_email from auth.users u where u.id = v_actor;
  insert into public.admin_audit_log (actor_id, actor_email, action, entity, entity_id, label)
  values (v_actor, v_email, p_action, p_entity, p_entity_id, p_label);
end;
$$;

revoke all on function public.log_admin_action(text, text, text, text)
  from public, anon, authenticated;

-- ------------------------------------------------------------
-- 通用 trigger：一支函式掛七張表
--
-- 🔴 為什麼由 trigger 寫而不是由應用層寫，三個理由每一個都足以決定：
--
--   交易性   與被記錄的那次寫入是同一個語句。應用層分兩次呼叫的話會出現
--            「內容改了但日誌沒記」，而稽核日誌有洞比沒有日誌更糟。
--   不會漏   日後新增任何一個 Server Action 都自動被記到，不必記得補一行。
--   不可偽造 actor 由 auth.uid() 在資料庫端蓋章，呼叫端沒有機會傳假的操作者。
--
-- ⚠️ 只在 auth.uid() 非 null 時記錄。
--    否則 register_for_alumni_event() 每一筆公開報名都會 update
--    alumni_events.seats_taken，日誌會被公開流量淹沒。
--
--    代價要說清楚：**從 Supabase Dashboard 直接改資料不會留下紀錄**
--    （那是 service_role，auth.uid() 是 null）。這是已知缺口，不是疏忽。
--
-- 名稱（label）從該列自己挑，依序試 title / name / label / slug / code / email
-- —— 這幾個涵蓋了七張表的「人看得懂的識別」。挑不到就留 null。
-- ------------------------------------------------------------
create or replace function public.log_admin_change()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_actor uuid := auth.uid();
  v_email text;
  v_row   jsonb;
begin
  if v_actor is null then
    return null;
  end if;

  if tg_op = 'DELETE' then
    v_row := to_jsonb(old);
  else
    v_row := to_jsonb(new);
  end if;

  select u.email into v_email from auth.users u where u.id = v_actor;

  insert into public.admin_audit_log (actor_id, actor_email, action, entity, entity_id, label)
  values (
    v_actor,
    v_email,
    lower(tg_op),
    tg_table_name,
    -- admin_users 的主鍵是 user_id，其餘六張是 id
    coalesce(v_row ->> 'id', v_row ->> 'user_id'),
    coalesce(
      v_row ->> 'title', v_row ->> 'name', v_row ->> 'label',
      v_row ->> 'slug',  v_row ->> 'code', v_row ->> 'email'
    )
  );
  return null;
end;
$$;

comment on function public.log_admin_change() is
  '通用稽核 trigger。⚠️ auth.uid() 為 null 時不寫 —— 公開報名會 update '
  'alumni_events.seats_taken，記錄它會把日誌淹掉；代價是 Dashboard 的直接'
  '修改也不會留紀錄。';

-- 掛在後台實際會編輯的七張表。
--
-- ⚠️ 刻意不掛 alumni_event_registrations：它的 insert 來自公開報名表單，
--    記錄它同樣會把日誌灌爆。後台取消報名走 cancel_alumni_registration()，
--    那支函式會連帶 update alumni_events（已被記錄），並且下面另外補一行
--    語意更清楚的紀錄。
do $$
declare t text;
begin
  foreach t in array array[
    'news', 'faculty', 'courses', 'programs', 'links', 'alumni_events', 'admin_users'
  ] loop
    execute format('drop trigger if exists log_admin_change on public.%I', t);
    execute format(
      'create trigger log_admin_change after insert or update or delete on public.%I
         for each row execute function public.log_admin_change()', t);
  end loop;
end
$$;

-- ------------------------------------------------------------
-- 取消報名：補一行語意清楚的紀錄
--
-- 自動記錄只會說「更新 alumni_events / 2026 系友回娘家」，看不出是取消了誰的
-- 報名。這裡明寫一行。函式其餘部分與 20260901120000 完全相同。
-- ------------------------------------------------------------
create or replace function public.cancel_alumni_registration(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_reg public.alumni_event_registrations%rowtype;
begin
  if not public.is_admin() then
    raise exception 'NOT_ADMIN';
  end if;

  select * into v_reg
    from public.alumni_event_registrations
   where id = p_id
   for update;

  if not found then
    raise exception 'REGISTRATION_NOT_FOUND';
  end if;

  if v_reg.status = 'cancelled' then
    return;
  end if;

  update public.alumni_event_registrations
     set status = 'cancelled'
   where id = p_id;

  update public.alumni_events
     set seats_taken = greatest(0, seats_taken - (1 + v_reg.guests))
   where id = v_reg.event_id;

  perform public.log_admin_action(
    'update', 'alumni_event_registrations', p_id::text,
    '取消報名：' || v_reg.name || '（' || v_reg.code || '）'
  );
end;
$$;

commit;

-- ------------------------------------------------------------
-- 跑完之後的權限實況
--
--                     admin_users        admin_audit_log      內容六表
--   anon              ✗                  ✗                    唯讀（公開內容）
--   操作人員           ✗                  ✗                    可讀可寫
--   管理員             可讀可寫            唯讀                  可讀可寫
--   service_role      一律通行（繞過 RLS）
--
-- 沒有任何人（含管理員）能 insert / update / delete 日誌 —— 只有
-- SECURITY DEFINER 的 trigger 寫得進去。
--
-- 建立 / 刪除 auth 帳號與重設密碼仍然只能經由 GoTrue 的 Admin API，需要
-- service-role 金鑰。應用層把它關在 lib/admin/provision.ts 一個檔裡，
-- 每一支函式第一行都是 requireManager()。
-- ------------------------------------------------------------
