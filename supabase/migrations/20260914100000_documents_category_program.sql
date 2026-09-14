-- ============================================================
-- 檔案下載卡的「分類」與「學制」
--
-- 2026-09 客戶回饋兩件事，都落在 documents 這張表上：
--
--   ① 【修業規定】網頁上有學士班／碩博士班修業規定，但後台沒有 PDF 上傳的地方
--      → 檔案可以標上「學制」，該學制的修業規定頁（/courses/[program]）會把
--        標了它的檔案列在內文底下。
--   ② 【常用表格】要比照舊站，依表單的性質分類管理
--      → 檔案可以填「分類」，前台（/courses 的系上表單、/admissions 的招生檔案）
--        依分類分組、各組一個小標。舊站的五組是：其他／國際碩士專班／碩博相關／
--        招生相關／課程相關 —— 但分類不寫死，系辦在後台自己開。
--
-- 三個欄位都是可為 null 的純文字：
--
--   category    分類（中文）。null = 沒有分類，前台印在所有分組前面、不加小標。
--   category_en 分類的英文；null 時英文版印中文（與 label_en 同一套 fallback）。
--   program     學制，值同 programs.name（中文原值），與 links.program 同一個約定
--               （見 20260908140000 —— 為什麼沒有 FK 也寫在那裡）。null = 不限學制。
--
-- ⚠️ category 刻意沒有 CHECK、沒有另開一張表：分類是系辦的組織方式，會隨表單
--    增減而變；後台的欄位是「既有分類下拉 ＋ 其他（自行輸入）」，第一次打的字
--    就成為之後的選項。改分類名要逐筆改 —— 表單總數幾十筆，這是可以接受的。
--
-- 🔴 **必須在推程式碼之前跑。** lib/data.ts 的 DOCUMENT_COLUMNS 是逐一列欄位的
--    字串，欄位不存在時 PostgREST 回錯誤、getDocuments() 回空陣列 —— /courses
--    與 /admissions 的檔案區會整個消失，而且沒有任何錯誤畫面。
--
-- ⚠️ 這個專案沒有 Supabase CLI，migration 是人工貼進 Dashboard SQL Editor
--    （或 Management API）。跑完請回 supabase/README.md 勾記。
--
-- 可重複執行。
-- ============================================================

alter table public.documents
  add column if not exists category text,
  add column if not exists category_en text,
  add column if not exists program text;

comment on column public.documents.category is
  '分類（中文），前台依它分組、各組一個小標。null = 沒有分類，印在所有分組前面。系辦在後台自由填，沒有固定清單。';
comment on column public.documents.category_en is
  '分類的英文。null 時英文版顯示中文。';
comment on column public.documents.program is
  '學制，值同 programs.name（中文）。標了學制的檔案會出現在該學制的修業規定頁（/courses/[program]）底下；招生資訊頁的學制篩選也讀這一欄。null = 不限學制。';

-- ------------------------------------------------------------
-- 驗收（唯讀）
-- ------------------------------------------------------------
-- 1) 三個欄位都在、都可為 null：
--    select column_name, is_nullable, data_type
--      from information_schema.columns
--     where table_schema='public' and table_name='documents'
--       and column_name in ('category','category_en','program')
--     order by column_name;
--    期望：三列，is_nullable 都是 YES、data_type 都是 text
--
-- 2) 既有的列全部是 null（前台維持原本的行為：沒有分組小標、學制頁沒有檔案）：
--    select id, section, label, category, program from public.documents order by section, sort_order;
--
-- 3) 可重複執行 —— 再跑一次不應該有任何錯誤，也不會清掉已填的值。
