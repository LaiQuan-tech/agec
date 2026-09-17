-- ============================================================
-- 活動加「對象」：系友活動之外，也能開一般活動放到最新消息讓大家報名
--
-- 客戶 2026-09-16：「活動的功能，我要改成除了校友活動之外，也可以開一般的
-- 活動，並且放到最新消息區讓大家報名。」
--
-- 做法是**加一欄，不改表名**。alumni_events／alumni_event_registrations 這兩個
-- 名字散在 lib/data.ts、lib/admin/events.ts、lib/search.ts、後台 actions、儀表板
-- COUNTS、稽核 trigger 清單與兩支 RPC 的函式名裡，改名只有成本沒有收益；
-- 「一般活動住在叫 alumni_events 的表裡」這件事在 lib/alumni-events.ts 檔頭
-- 有說明。
--
--   audience  'alumni'   系友活動：出現在 /alumni#section-events，活動頁
--                        /alumni/events/<slug>，報名表收畢業年度與學制
--             'general'  一般活動：出現在 /news 的「活動報名」區塊，活動頁
--                        /news/events/<slug>，報名表不收畢業年度與學制
--
-- 既有的活動全部是系友活動（default 'alumni'，not null），所以這支跑完前台
-- 一個字都不會變；報名的兩支 RPC 不看對象，不用改。
--
-- 🔴 必須在推程式碼之前跑：lib/data.ts 的 ALUMNI_EVENT_COLUMNS 是逐一列欄位
--    的字串，欄位不存在時 /alumni 的活動區與所有活動頁會整個空掉（同 faculty
--    加欄位那次的教訓）。
--
-- ⚠️ 這個專案沒有 Supabase CLI，migration 是人工貼進 Dashboard SQL Editor
--    （或 Management API）。跑完請回 supabase/README.md 勾記。
-- ============================================================

alter table public.alumni_events
  add column if not exists audience text not null default 'alumni';

alter table public.alumni_events
  drop constraint if exists alumni_events_audience_valid;
alter table public.alumni_events
  add constraint alumni_events_audience_valid
    check (audience in ('alumni', 'general'));

comment on column public.alumni_events.audience is
  '對象：alumni＝系友活動（/alumni）、general＝一般活動（/news 活動報名區）。決定活動出現在哪一頁、活動頁網址前綴，以及報名表收不收畢業年度／學制。';

-- 前台列表依對象＋開始時間查（getAlumniEvents 的 audience 參數）。
create index if not exists alumni_events_audience_starts_at_idx
  on public.alumni_events (audience, starts_at);
