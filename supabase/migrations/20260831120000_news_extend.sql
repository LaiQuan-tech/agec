-- 消息：草稿狀態、附件、演講場次資訊
--
-- 起因：把現行官網 agec.ntu.edu.tw 的 428 則消息搬進新站時，發現三件事沒有
-- 地方放——
--   1. 24% 的舊消息帶附件下載（簡章 pdf、報名表 doc、考古題 zip），news 表
--      沒有任何檔案欄位。
--   2. 「演講公告」在前台是一級公民（lib/data.ts 的 TALKS_CATEGORY，/news
--      有專屬區塊），但卡片只能顯示日期、分類、標題——誰講、幾點、在哪都
--      沒有欄位，只能塞進標題字串裡。
--   3. news 沒有草稿。insert 完成的瞬間就在公開網際網路上，招生這類有時效
--      的公告無法先打好草稿再排時間發。
--
-- 可重複執行。

/* ---- status ------------------------------------------------------------ */
-- ⚠️ default 是 'published'，與 posts.status 的 'draft' **相反**。
--    posts 是新寫的文章，預設不公開才安全；news 這張表在加這一欄的時候已經
--    有 11 列線上資料，任何其他 default 都會讓它們在 migration 跑完的瞬間
--    整批從網站上消失。這個不一致是刻意的，不要「順手統一」。
alter table public.news add column if not exists status text not null default 'published';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'news_status_check'
  ) then
    alter table public.news
      add constraint news_status_check check (status in ('draft', 'published'));
  end if;
end $$;

comment on column public.news.status is
  '草稿 draft／已發佈 published。default 為 published（與 posts 相反）是因為'
  '加欄位時表上已有線上資料。⚠️ createServerClient() 用 service-role 會完全'
  '繞過 RLS，所以 lib/data.ts 的五個 getter 每一個都必須自己過濾這一欄——'
  'getNewsHome／getNewsPage／getTalks／getNewsById／getNewsIds。漏掉任何一個，'
  '草稿就會出現在公開網際網路上，而且不會有任何錯誤訊息。';

/* ---- attachments ------------------------------------------------------- */
-- jsonb 而不是另開一張表：附件永遠隨著它那則消息一起讀寫，沒有跨消息查詢
-- 附件的需求，多一張表只是多一次 join 和多一個要維護 RLS 的地方。
alter table public.news add column if not exists attachments jsonb not null default '[]'::jsonb;

comment on column public.news.attachments is
  '附件陣列 [{name, url, size, mime}]。name 是原始檔名（含中文）供顯示，'
  'url 指向 Supabase storage 的 attachments bucket。';

/* ---- 演講場次 ---------------------------------------------------------- */
-- 只有 category = '演講公告' 的列會用到，但欄位不設條件約束：舊資料的解析
-- 成功率不到 100%，硬性約束只會讓匯入中途炸掉，而不是讓資料變乾淨。
alter table public.news add column if not exists speaker    text;
alter table public.news add column if not exists speaker_en text;
alter table public.news add column if not exists venue      text;
alter table public.news add column if not exists venue_en   text;
alter table public.news add column if not exists event_at   timestamptz;

comment on column public.news.event_at is
  '演講實際舉行的時間。published_at 是「公告日」而且只有日期精度，兩者不同'
  '——公告 5 月貼出、演講 6 月舉行是常態。';

comment on column public.news.speaker_en is
  '講者姓名的英文寫法。與 title／category 一樣是「翻譯」欄位，走 pick()：'
  '演講卡片只有一個位置放講者，有英文用英文、沒有退回中文。'
  '⚠️ 不要比照 faculty.name_en 當成「中英並列」處理——那是給有兩個位置的'
  '版型用的（大標一種語言、小字另一種），這裡沒有第二個位置。'
  'venue_en 同理。';

-- 驗收
-- select column_name, data_type, is_nullable, column_default
--   from information_schema.columns
--  where table_schema='public' and table_name='news' order by ordinal_position;
-- 預期新增 6 欄，合計 21 欄；既有 11 列的 status 應全為 'published'。
