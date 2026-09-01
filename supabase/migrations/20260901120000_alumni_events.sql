-- ============================================================
-- 系友活動與線上報名（系友回娘家）
--
-- 兩張表 + 兩支函式：
--   alumni_events                 活動本身，後台上架
--   alumni_event_registrations    報名紀錄（個資：anon 完全不可讀，管理者唯讀）
--   register_for_alumni_event()   前台報名的唯一寫入路徑
--   cancel_alumni_registration()  後台取消報名，並把位子還回去
--
-- 形狀參考快樂手（happyhand）的 workshop_sessions / workshop_waitlist，但
-- **刻意不搬購物車與金流**：那一套的 seats_taken 要跟訂單狀態同步，光是
-- 「後台手動標記付款」與「線上刷卡 APN」兩條路徑就各要維護一次，漏一條就
-- 超賣。系友回娘家不收費，報名就是一列資料，所以名額只有一個增減來源。
--
-- 從那個專案搬過來的是三件教訓，不是程式碼：
--   1. 名額必須有唯一定義。那邊前台算 `capacity - seats_taken`、下單算
--      `capacity - seats_taken - 未付款佔位`，於是出現「頁面說剩 4 位、
--      結帳說滿了」。這裡把「能不能報名」整個判斷放進 register_for_alumni_event()，
--      前台只負責顯示，不做決定。
--   2. 資料庫要有最後一道防超賣。就算應用層寫錯，CHECK 也不允許
--      seats_taken 超過 capacity。
--   3. 「誰報名了這一場」只能有一份定義，否則後台人數與匯出的 CSV 會對不起來
--      而且不會有任何錯誤訊息。這裡用 status = 'confirmed' 一個條件，
--      lib/admin/events.ts 是唯一的查詢處。
--
-- ⚠️ 這個專案沒有 Supabase CLI，migration 是人工貼進 Dashboard SQL Editor。
--    跑完請回 supabase/README.md 勾記。
--
-- 可重複執行。
-- ============================================================
begin;

-- ------------------------------------------------------------
-- 1. alumni_events
-- ------------------------------------------------------------
create table if not exists public.alumni_events (
  id            bigint generated always as identity primary key,

  -- 網址用。系友會把連結貼在 LINE 群組裡，/alumni/events/homecoming-2026
  -- 比 /alumni/events/7 看得出是什麼。
  slug          text not null,

  title         text not null,
  title_en      text,
  -- 一句話摘要，列表卡片用
  summary       text,
  summary_en    text,
  -- 長說明。純文字多段（前台用 white-space:pre-line 保留換行），不是 HTML：
  -- 這一頁沒有富文本編輯器，存 HTML 就等於開一個沒有消毒的注入點。
  body          text,
  body_en       text,

  starts_at     timestamptz not null,
  -- 可以不填：只公布日期還沒定結束時間的活動很常見
  ends_at       timestamptz,

  location      text,
  location_en   text,
  address       text,

  -- null = 不限名額。0 與 null 是不同的意思：0 是「開放但一個位子都沒有」。
  capacity      int,
  -- 只能透過 register_for_alumni_event() / cancel_alumni_registration() 異動
  seats_taken   int not null default 0,

  -- null = 開放到活動開始為止（判斷在函式裡，不在這裡）
  registration_closes_at timestamptz,

  cover_url     text,
  -- 承辦人聯絡方式，印在報名成功畫面上。沒有寄信服務，這是報名者唯一的
  -- 後續管道 —— 見檔尾「已知缺口」。
  contact       text,

  -- draft     只有後台看得到
  -- published 前台可見、可報名
  -- cancelled 前台仍可見（要讓已報名的人知道取消了），但不能再報名
  status        text not null default 'draft',

  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create unique index if not exists alumni_events_slug_key
  on public.alumni_events (slug);

alter table public.alumni_events
  drop constraint if exists alumni_events_slug_format;
alter table public.alumni_events
  add constraint alumni_events_slug_format
    check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$');

alter table public.alumni_events
  drop constraint if exists alumni_events_status_valid;
alter table public.alumni_events
  add constraint alumni_events_status_valid
    check (status in ('draft', 'published', 'cancelled'));

alter table public.alumni_events
  drop constraint if exists alumni_events_title_not_blank;
alter table public.alumni_events
  add constraint alumni_events_title_not_blank
    check (length(btrim(title)) > 0);

alter table public.alumni_events
  drop constraint if exists alumni_events_time_valid;
alter table public.alumni_events
  add constraint alumni_events_time_valid
    check (ends_at is null or ends_at > starts_at);

alter table public.alumni_events
  drop constraint if exists alumni_events_capacity_nonneg;
alter table public.alumni_events
  add constraint alumni_events_capacity_nonneg
    check (capacity is null or capacity >= 0);

alter table public.alumni_events
  drop constraint if exists alumni_events_seats_nonneg;
alter table public.alumni_events
  add constraint alumni_events_seats_nonneg
    check (seats_taken >= 0);

-- 🔴 最後一道防超賣。應用層寫錯時，這條讓交易整個失敗，而不是讓現場多出
--    幾個沒有座位的人。快樂手那邊同樣的 constraint 擋下過一次 APN 路徑漏加
--    seats_taken 造成的超賣。
alter table public.alumni_events
  drop constraint if exists alumni_events_not_oversold;
alter table public.alumni_events
  add constraint alumni_events_not_oversold
    check (capacity is null or seats_taken <= capacity);

comment on table public.alumni_events is
  '系友活動（系友回娘家等）。後台上架，前台 /alumni 與 /alumni/events/<slug> 顯示。';
comment on column public.alumni_events.capacity is
  'null = 不限名額。⚠️ 與 0 是不同的意思：0 是「開放報名但沒有位子」。';
comment on column public.alumni_events.seats_taken is
  '含攜伴的已佔用人數。⚠️ 只能透過 register_for_alumni_event() 與 '
  'cancel_alumni_registration() 異動 —— 手改這一欄會讓它與報名紀錄對不起來。';
comment on column public.alumni_events.body is
  '純文字多段，不是 HTML。前台用 white-space:pre-line 渲染。';
comment on column public.alumni_events.status is
  'draft 只有後台看得到／published 前台可見可報名／cancelled 前台仍可見但不能報名'
  '（已報名的人要看得到活動取消了）。';

-- ------------------------------------------------------------
-- 2. alumni_event_registrations
--
-- 🔴 這張表存的是個資：姓名、email、電話、畢業年、飲食需求。
--    anon 一條 policy 都沒有 —— 前台只經由函式寫入，永遠不讀。
--    管理者唯讀（policy 在下面），異動一律走 cancel_alumni_registration()。
-- ------------------------------------------------------------
create table if not exists public.alumni_event_registrations (
  id          uuid primary key default gen_random_uuid(),
  event_id    bigint not null
                references public.alumni_events (id) on delete cascade,

  -- 報名代碼，給報名者向系辦查詢時引用。
  -- ⚠️ 這不是驗證用的 token：沒有寄信服務，所以沒有「憑代碼自助取消」這件事，
  --    它只是一個好唸的參照號。真的要做自助取消時，必須另外發一個夠長、
  --    不可猜測的 token，不要把這一欄拿來當那個用。
  code        text not null,

  name        text not null,
  email       text not null,
  phone       text,
  -- 西元畢業年。民國年在前台就換算掉，資料庫只存一種。
  grad_year   int,
  -- 學士／碩士／博士／碩士在職專班。自由文字，前台給選項。
  program     text,
  -- 攜伴人數（不含本人）。實際佔位 = 1 + guests。
  guests      int not null default 0,
  dietary     text,
  note        text,

  status      text not null default 'confirmed',

  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.alumni_event_registrations
  drop constraint if exists alumni_registrations_status_valid;
alter table public.alumni_event_registrations
  add constraint alumni_registrations_status_valid
    check (status in ('confirmed', 'cancelled'));

alter table public.alumni_event_registrations
  drop constraint if exists alumni_registrations_guests_range;
alter table public.alumni_event_registrations
  add constraint alumni_registrations_guests_range
    check (guests >= 0 and guests <= 5);

alter table public.alumni_event_registrations
  drop constraint if exists alumni_registrations_name_not_blank;
alter table public.alumni_event_registrations
  add constraint alumni_registrations_name_not_blank
    check (length(btrim(name)) > 0);

-- 這裡只做形狀檢查，不做「這個信箱真的存在嗎」。後者只有寄一封信才知道，
-- 而這個站沒有寄信服務。
alter table public.alumni_event_registrations
  drop constraint if exists alumni_registrations_email_shape;
alter table public.alumni_event_registrations
  add constraint alumni_registrations_email_shape
    check (email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$');

-- 同一場活動、同一個信箱只能有一筆有效報名。
-- ⚠️ 部分索引（where status='confirmed'）而不是全表唯一：取消之後要能再報一次。
--    lower() 是因為信箱大小寫不敏感，Ａ@x.com 與 a@x.com 是同一個人。
create unique index if not exists alumni_registrations_one_per_email
  on public.alumni_event_registrations (event_id, lower(email))
  where status = 'confirmed';

create unique index if not exists alumni_registrations_code_key
  on public.alumni_event_registrations (code);

-- 後台主查詢：某一場的報名名單，先報名的排前面
create index if not exists alumni_registrations_by_event
  on public.alumni_event_registrations (event_id, status, created_at);

comment on table public.alumni_event_registrations is
  '系友活動報名紀錄。🔴 含個資：anon 讀不到也寫不到，管理者唯讀，'
  '異動只能經由 cancel_alumni_registration()。';
comment on column public.alumni_event_registrations.code is
  '報名參照號。⚠️ 不是驗證 token，不要拿來做自助取消。';
comment on column public.alumni_event_registrations.guests is
  '攜伴人數（不含本人）。實際佔位 = 1 + guests。';

-- ------------------------------------------------------------
-- 3. updated_at（沿用 20260814090000_posts_table.sql 建的 set_updated_at()）
-- ------------------------------------------------------------
drop trigger if exists alumni_events_set_updated_at on public.alumni_events;
create trigger alumni_events_set_updated_at
  before update on public.alumni_events
  for each row execute function public.set_updated_at();

drop trigger if exists alumni_registrations_set_updated_at
  on public.alumni_event_registrations;
create trigger alumni_registrations_set_updated_at
  before update on public.alumni_event_registrations
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- 4. RLS
-- ------------------------------------------------------------
alter table public.alumni_events              enable row level security;
alter table public.alumni_event_registrations enable row level security;

-- 前台是走 service_role 讀的（與 news / faculty 相同），所以這條 policy 在
-- 目前的程式路徑上不會被用到。留著是縱深防禦，理由與 posts 那條相同：哪天
-- 有人用 anon key 讀這張表，草稿與已取消的活動不會因為某個查詢忘了加
-- `.eq('status','published')` 就外流。
drop policy if exists "public read published events" on public.alumni_events;
create policy "public read published events" on public.alumni_events
  for select to anon, authenticated
  using (status in ('published', 'cancelled'));

drop policy if exists "admin read all events" on public.alumni_events;
create policy "admin read all events" on public.alumni_events
  for select to authenticated
  using ((select public.is_admin()));

drop policy if exists "admin write events" on public.alumni_events;
create policy "admin write events" on public.alumni_events
  for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- alumni_event_registrations：anon 一條 policy 都沒有，管理者可讀。
--
-- 🔴 anon 完全碰不到。報名是寫進去的（而且只能經由下面的函式），
--    讀出來的權利一點都不給 —— 這張表裡是姓名、信箱、電話與飲食需求。
--
-- 管理者可讀，因為看名單的人就是他們。用 is_admin() 而不是「只有 service_role
-- 讀得到、後台改用服務金鑰查」：後者會逼後台去 import lib/supabase/server.ts，
-- 而這個 repo 明文規定後台只能用 ssr-server.ts（見那個檔案的檔頭 —— 兩支
-- client 名字太像，誤用一次就是靜默提權）。授權判斷留在資料庫，跟其他六張表
-- 一致。
--
-- ⚠️ 刻意不給 update / delete / insert。報名紀錄的異動只能經由
--    cancel_alumni_registration()，因為位子必須跟著還回去；開一條 update
--    policy 就等於留了一條「改了 status 但 seats_taken 沒動」的路。
drop policy if exists "admin read registrations" on public.alumni_event_registrations;
create policy "admin read registrations" on public.alumni_event_registrations
  for select to authenticated
  using ((select public.is_admin()));

-- ------------------------------------------------------------
-- 5. register_for_alumni_event()
--
-- 🔴 前台報名的唯一寫入路徑，也是「能不能報名」的唯一判準。
--    前台頁面只負責顯示剩餘名額；決定權完全在這支函式裡。這正是快樂手那邊
--    分岔成兩套判斷、最後出現「頁面說剩 4 位、結帳說滿了」的地方。
--
-- 不是 SECURITY DEFINER：呼叫端是 server action 用 service_role，本來就繞過
-- RLS，不需要再提權。權限只發給 service_role。
-- ------------------------------------------------------------
create or replace function public.register_for_alumni_event(
  p_slug      text,
  p_name      text,
  p_email     text,
  p_phone     text default null,
  p_grad_year int  default null,
  p_program   text default null,
  p_guests    int  default 0,
  p_dietary   text default null,
  p_note      text default null
)
returns table (code text, event_title text)
language plpgsql
set search_path = public, pg_temp
as $$
declare
  v_event public.alumni_events%rowtype;
  v_head  int;
  v_code  text;
begin
  v_head := 1 + greatest(coalesce(p_guests, 0), 0);

  -- 🔴 for update 不能省。
  -- 兩個人同時按下送出時，若只是 select 再 update，兩邊會讀到同一個
  -- seats_taken、各自加上自己的人數，後寫的覆蓋前寫的 —— 位子憑空多出來，
  -- 而且 CHECK 也擋不住（每一筆單獨看都沒有超過 capacity）。
  -- 鎖住這一列之後，第二個人會等到第一個人提交才讀，讀到的是正確的數字。
  select * into v_event
    from public.alumni_events
   where slug = p_slug
   for update;

  if not found then
    raise exception 'EVENT_NOT_FOUND';
  end if;

  if v_event.status <> 'published' then
    -- 草稿與已取消都走這裡。不細分是刻意的：對前台來說「這場現在不能報名」
    -- 就夠了，多說一句「這是草稿」等於洩漏後台狀態。
    raise exception 'EVENT_NOT_OPEN';
  end if;

  if v_event.registration_closes_at is not null
     and now() >= v_event.registration_closes_at then
    raise exception 'REGISTRATION_CLOSED';
  end if;

  -- 活動開始之後就不能再報名。沒有設 registration_closes_at 時，這是預設的
  -- 截止時間 —— 否則去年的活動會永遠開著讓人報名。
  if v_event.registration_closes_at is null and now() >= v_event.starts_at then
    raise exception 'REGISTRATION_CLOSED';
  end if;

  if v_event.capacity is not null
     and v_event.seats_taken + v_head > v_event.capacity then
    raise exception 'EVENT_FULL';
  end if;

  -- 10 個十六進位字元 ≈ 1.1 兆種組合，配合唯一索引足夠。
  -- 不用 random()：gen_random_uuid() 在 Supabase 是內建的，而且不必開 pgcrypto。
  -- 十六進位沒有 O/I/l 這些容易唸錯的字母，適合用電話報給系辦。
  v_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10));

  update public.alumni_events
     set seats_taken = seats_taken + v_head
   where id = v_event.id;

  insert into public.alumni_event_registrations
    (event_id, code, name, email, phone, grad_year, program, guests, dietary, note)
  values
    (v_event.id, v_code, btrim(p_name), lower(btrim(p_email)), p_phone,
     p_grad_year, p_program, greatest(coalesce(p_guests, 0), 0), p_dietary, p_note);

  return query select v_code, v_event.title;
end;
$$;

revoke all     on function public.register_for_alumni_event(
  text, text, text, text, int, text, int, text, text) from public, anon, authenticated;
grant  execute on function public.register_for_alumni_event(
  text, text, text, text, int, text, int, text, text) to service_role;

comment on function public.register_for_alumni_event(
  text, text, text, text, int, text, int, text, text) is
  '系友活動報名的唯一寫入路徑，也是「能不能報名」的唯一判準。'
  '⚠️ 前台頁面只負責顯示剩餘名額，不做決定 —— 兩邊各判一次就會分岔。';

-- ------------------------------------------------------------
-- 6. cancel_alumni_registration()
--
-- 後台取消一筆報名，並把位子還回去。位子的增與減必須成對，否則名額會慢慢
-- 漏光而且沒有任何跡象。
-- ------------------------------------------------------------
create or replace function public.cancel_alumni_registration(p_id uuid)
returns void
language plpgsql
-- SECURITY DEFINER：呼叫者是後台登入的管理者（走 anon key + session），沒有
-- 直接改這兩張表的權限 —— 上面刻意只給了 select。提權集中在這一支函式裡，
-- 而它自己第一件事就是檢查 is_admin()。
security definer
set search_path = public, pg_temp
as $$
declare
  v_reg public.alumni_event_registrations%rowtype;
begin
  -- 🔴 SECURITY DEFINER 的函式必須自己檢查授權。少了這一行，任何註冊過的
  --    帳號（這個 Supabase 專案的 email 註冊是開著的）都能取消任何人的報名。
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

  -- 冪等：重複點取消不會把位子多還一次。
  if v_reg.status = 'cancelled' then
    return;
  end if;

  update public.alumni_event_registrations
     set status = 'cancelled'
   where id = p_id;

  -- greatest(0, …) 是防手改：若有人直接在 Dashboard 動過 seats_taken，
  -- 這裡不該把它減成負數再撞上 CHECK，讓取消整個失敗。
  update public.alumni_events
     set seats_taken = greatest(0, seats_taken - (1 + v_reg.guests))
   where id = v_reg.event_id;
end;
$$;

revoke all     on function public.cancel_alumni_registration(uuid) from public, anon;
grant  execute on function public.cancel_alumni_registration(uuid) to authenticated, service_role;

comment on function public.cancel_alumni_registration(uuid) is
  '後台取消一筆報名並把位子還回去。冪等。'
  'SECURITY DEFINER，內含 is_admin() 檢查 —— 授權在函式裡，不在呼叫端。';

commit;

-- ------------------------------------------------------------
-- 已知缺口（不是這支 migration 能解的，記在這裡免得被當成做完了）
--
-- 1. 沒有報名確認信。這個專案沒有接任何寄信服務，所以報名者收不到副本，
--    只有畫面上的報名代碼。要補的話需要 Resend（或校內 SMTP）＋一張
--    outbox 表，不能只在 server action 裡直接送 —— 送信失敗會讓已經寫進
--    資料庫的報名看起來像失敗。
--
-- 2. 沒有自助取消。報名者要取消得聯絡系辦（contact 欄）。做自助取消需要
--    一個夠長、不可猜測的 token，不能重用上面的 code。
--
-- 3. 沒有候補名單。額滿就是額滿。快樂手有 workshop_waitlist，但那是客服
--    接電話登記用的；這裡先不做，等系辦說真的需要。
--
-- 4. 沒有針對機器人的節流。目前的防線是 honeypot 欄位＋同信箱唯一索引，
--    足以擋掉隨手的濫填，擋不住有心人。若真的被灌，最小的補法是在這張表
--    上加一欄 ip_hash 並在函式裡限制「同一個 hash 十分鐘內 N 筆」——
--    存 hash 不存 IP。
-- ------------------------------------------------------------
