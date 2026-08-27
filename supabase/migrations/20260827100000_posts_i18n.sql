-- posts 的英文欄位
--
-- 2026-08-25 的 20260825120000_i18n_columns.sql 補了 news / faculty / courses /
-- programs / links 五張表，唯獨漏掉 posts —— 當時前台的 /blog 還不存在，這張表
-- 沒有任何公開頁面在讀。現在 /blog 做起來了，補齊。
--
-- 規則與其他五張表相同：全部可為 null，前台由 lib/i18n.pick() 決定用哪個語言
-- （英文有值用英文、沒值退回中文），所以 /en/blog 從第一天就是完整的。
--
-- ⚠️ 刻意沒有 tags_en。`tags` 是 text[]，前台若要做標籤篩選會拿它當比對鍵；
-- 兩邊各自翻譯、其中一邊沒填就會靜默對不上（與 courses.program 同一個理由）。
-- 標籤的英文顯示名日後走字典查表，中文原值永遠是鍵。
--
-- 可重複執行。

alter table public.posts add column if not exists title_en        text;
alter table public.posts add column if not exists excerpt_en      text;
alter table public.posts add column if not exists author_en       text;
-- content_html_en 不給 default ''：空字串與 null 在這裡意義不同，null 才代表
-- 「沒填、請退回中文」，而中文的 content_html 是 not null default '' 因為它是
-- 必要欄位。
alter table public.posts add column if not exists content_html_en text;
-- 只回餵編輯器，與 content_json 同角色。
alter table public.posts add column if not exists content_json_en jsonb;

-- 驗收
-- select column_name from information_schema.columns
--  where table_schema='public' and table_name='posts' and column_name like '%\_en'
--  order by 1;
-- 預期 5 筆：author_en, content_html_en, content_json_en, excerpt_en, title_en
