-- ============================================================
-- faculty：補上 name_en 與 experience 兩欄
--
-- 為什麼要加這兩欄：
--
-- 原本的 faculty 表是照「標準師資卡」的形狀開的（姓名／職稱／分類／
-- 研究領域／照片／email），足以撐起專任、合聘、兼任這三種人。但 2026
-- 改版的師資頁還要放另外三群人，他們的卡片版型與欄位形狀完全不同：
--
--   * 客座教師    —— 卡片上英文姓名是獨立一行（在中文姓名之上），不是
--                    職稱的一部分，塞進 title 會讓後台看起來像亂碼。
--   * 名譽教授    —— 沒有照片、沒有研究領域、沒有職稱，改為呈現英文姓名
--   * 退休師資       ＋一段「重要經歷」長文（最長的一筆逾 60 字，且會隨
--                    時間增補）。這段文字沒有任何現有欄位裝得下：fields
--                    是短標籤（前台當 chip 渲染），title 有 50 字上限。
--
-- 所以這裡加的是「既有欄位裝不下」的兩個資料，而不是為了好看而擴充：
--   name_en    英文姓名。12 人需要（客座 1 + 名譽 5 + 退休 6）。
--   experience 重要經歷長文。11 人需要（名譽 5 + 退休 6）。
--
-- 兩欄都可為 null —— 22 張主卡與 3 位行政同仁不需要，強制填只會逼系辦
-- 填假資料。前台要自己處理 null（見下方 category 對照）。
--
-- 本檔可重複執行（idempotent）。執行方式：貼進 Supabase SQL Editor。
-- ============================================================
begin;

-- ---------- 新增欄位 ----------

alter table public.faculty add column if not exists name_en    text;
alter table public.faculty add column if not exists experience text;

-- email 早就在表上了（後台 actions.ts 有註解說明它刻意不放進表單）。
-- 這一行純粹是保險：faculty 表當初是直接在 Dashboard 開的，repo 裡沒有
-- CREATE TABLE 可以對照，萬一線上實際沒有這欄，下一支 seed 會整支炸掉。
-- 已存在時 if not exists 是 no-op，不會動到既有型別或資料。
alter table public.faculty add column if not exists email      text;

-- ---------- category 值域：7 種，對應 4 種卡片版型 ----------
--
-- 這裡刻意「不」加 CHECK constraint。師資分類是系辦會自己增修的東西
-- （例如哪天多一類「專案教師」），把值域鎖死在 DB 會讓他們卡住而且看不
-- 懂錯誤訊息。改以註解記錄契約，前台用 switch 分派版型、default 走標準卡。
--
--   category      人數   卡片版型              需要的欄位
--   ------------  ----  --------------------  --------------------------------
--   專任師資       12    標準卡 .faculty-grid  photo/title/fields/email
--   合聘師資        1    同上                  同上（title 內含合聘單位）
--   兼任師資        9    同上                  同上（title 內含兼任單位）
--   客座教師        1    figure + <dl>         photo/name_en/title/fields，無 email
--   名譽教授        5    無照片履歷列          name_en/experience/email
--   退休師資        6    同上                  同上
--   行政同仁        3    行政卡（深底）         title(職稱 · 職務)/email，無照片
--
-- 前三種（12+1+9 = 22 人）就是師資頁 #section-1 的 22 張卡，也是篩選標籤
-- 「全部／專任／合聘／兼任」的值域 —— 篩選是拿 category 字串全等比對，
-- 所以這三個字串改一個字，篩選標籤要同步改，否則會安靜地篩不到任何人。
--
-- ⚠️ 後台 FacultyForm 的分類 datalist 目前只有 4 個建議值
--    （專任師資/合聘師資/兼任師資/名譽教授），少了客座教師、退休師資、
--    行政同仁。datalist 只是建議不是限制，打字仍存得進去，但系辦看不到
--    這三個選項。前台版型完成後要一併補上。

-- ---------- 註解 ----------
comment on column public.faculty.name_en    is '英文姓名。客座／名譽／退休師資的卡片會獨立顯示這一行；專任、合聘、兼任與行政同仁不需要，留 null。';
comment on column public.faculty.experience is '重要經歷長文（名譽教授與退休師資專用）。這兩類人的卡片不放照片與研究領域，改以這段經歷為主體。其餘分類留 null。';
comment on column public.faculty.email      is '公開信箱。22 張主卡與行政同仁 100% 有值，客座教師沒有。前台需處理 null。';
comment on column public.faculty.category   is '師資分類，7 種值域決定前台走哪一種卡片版型：專任師資／合聘師資／兼任師資（標準卡）、客座教師、名譽教授／退休師資、行政同仁。詳見本表的 migration 20260814090400。';

commit;
