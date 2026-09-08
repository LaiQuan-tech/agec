-- ============================================================
-- 老師的個人網頁內容（站內）
--
-- 20260908160000 加的 `homepage_url` 解的是「連出去」：老師有自己的實驗室網頁
-- 就連過去。但很多老師沒有，或那一頁早就不再更新 —— 系辦希望能自己在後台寫、
-- 自己維護，而不是等別人改。
--
-- 所以再加一組內文欄位，形狀完全照 `news` 的內文抄（見 20260827140000）：
--
--   bio_html / bio_html_en    Tiptap 吐出、經 sanitize-html 過濾後的 HTML。
--                             這是**渲染來源**，前台只讀它。
--   bio_json / bio_json_en    同一份內容的 Tiptap 文件。只給編輯器回填用，
--                             前台永遠不讀 —— 兩者一起寫、一起清。
--
-- 為什麼要存 json：Tiptap 從 HTML 反解回文件會遺失它自己的節點屬性，來回幾次
-- 之後排版會慢慢走樣。json 是無損的那一份。
--
-- ⚠️ 四欄都可以是 null，而且 null 是**正常狀態**：37 位老師裡多數不會有內文。
--    前台用 `bio_html` 是不是 null 來決定要不要給這位老師一個頁面 ——
--    有內文才有 /faculty/<id>，卡片上的連結才會指向站內；沒有就維持原本的
--    行為（有 homepage_url 就連出去，都沒有就不印那一行）。
--
-- 🔴 **必須在推程式碼之前跑。** FACULTY_COLUMNS 是逐一列欄位的字串，欄位不
--    存在時 getFaculty() 回空陣列，/faculty 會整頁空白且沒有錯誤畫面
--    （第 12 步加分機時實測過）。
--
-- RLS 與稽核 trigger 都不必動。
--
-- ⚠️ 這個專案沒有 Supabase CLI，migration 是人工貼進 Dashboard SQL Editor
--    （或 Management API）。跑完請回 supabase/README.md 勾記。
--
-- 可重複執行。
-- ============================================================

alter table public.faculty
  add column if not exists bio_html     text,
  add column if not exists bio_html_en  text,
  add column if not exists bio_json     jsonb,
  add column if not exists bio_json_en  jsonb;

comment on column public.faculty.bio_html    is '個人頁內文（已過濾的 HTML）。null = 這位老師沒有站內頁面。';
comment on column public.faculty.bio_json    is 'Tiptap 文件，只給後台編輯器回填；前台永遠不讀。與 bio_html 一起寫、一起清。';
comment on column public.faculty.bio_html_en is 'null = 還沒翻，英文頁會顯示中文的 bio_html。';
comment on column public.faculty.bio_json_en is '同 bio_json，英文那一份。';

-- ------------------------------------------------------------
-- 驗收（唯讀）
-- ------------------------------------------------------------
-- 1) 四欄都在、都可為 null：
--    select column_name, is_nullable, data_type from information_schema.columns
--     where table_schema='public' and table_name='faculty'
--       and column_name in ('bio_html','bio_html_en','bio_json','bio_json_en')
--     order by column_name;
--    期望：四列，is_nullable 全 YES，html 是 text、json 是 jsonb
--
-- 2) 現有 37 列都還是 null：
--    select count(*)::int as total, count(bio_html)::int as with_bio from public.faculty;
--    期望：37 / 0
--
-- 3) 可重複執行 —— 再跑一次不應該有任何錯誤，也不會清掉已寫的內容。
