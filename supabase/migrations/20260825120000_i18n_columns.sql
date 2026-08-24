-- 中英雙語：為五張內容表補英文欄位
--
-- 每一欄都可為 null 且預設空白。網站端由 lib/i18n.pick() 決定：英文有值就用
-- 英文，沒有就退回中文。所以這支跑完當下 /en 就能完整顯示（全中文），系辦之後
-- 在後台一格一格補，補一格就有一格是英文，不需要一次翻完才能上線。
--
-- 可重複執行（add column if not exists）。

-- news --------------------------------------------------------------------
alter table public.news add column if not exists title_en    text;
alter table public.news add column if not exists body_en     text;
alter table public.news add column if not exists category_en text;

-- faculty -----------------------------------------------------------------
-- name_en 已存在（20260814090400_faculty_extend.sql），這裡只補其餘三欄。
alter table public.faculty add column if not exists title_en      text;
alter table public.faculty add column if not exists fields_en     text;
alter table public.faculty add column if not exists experience_en text;

-- courses -----------------------------------------------------------------
-- ⚠️ 不加 program_en。courses.program 是對到 programs.name 的文字外鍵，課程表
-- 的排序與分頁籤都靠它比對。若兩邊各自翻譯、其中一邊沒填，比對就會斷掉而且是
-- 靜默的（課程會排到最後、篩選籤點不到）。英文顯示名一律從 programs.name_en
-- 查，courses.program 永遠保持中文原值當比對鍵。
alter table public.courses add column if not exists name_en  text;
alter table public.courses add column if not exists ctype_en text;

-- programs ----------------------------------------------------------------
-- name_en 已存在。
alter table public.programs add column if not exists description_en text;

-- links -------------------------------------------------------------------
alter table public.links add column if not exists label_en text;

-- 驗收 ---------------------------------------------------------------------
-- select table_name, column_name
--   from information_schema.columns
--  where table_schema = 'public' and column_name like '%\_en'
--  order by table_name, column_name;
-- 預期 12 筆：
--   courses.ctype_en, courses.name_en,
--   faculty.experience_en, faculty.fields_en, faculty.name_en, faculty.title_en,
--   links.label_en,
--   news.body_en, news.category_en, news.title_en,
--   programs.description_en, programs.name_en
