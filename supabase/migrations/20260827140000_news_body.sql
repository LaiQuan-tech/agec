-- 單則消息頁所需的內文欄位
--
-- 起因：前台消息列表每一列的箭頭本來都是 href="#"（參考站沒有單則頁面，移植時
-- 照抄了），點下去只會跳到頁首。客戶要求點進去要看到文章，所以需要有內文可看。
--
-- 沿用 posts 的欄位形狀，不要把內文塞進既有的 body：
--   body / body_en            = 純文字摘要。前台 News.tsx 的 feature 卡拿它當
--                               標語（`.inner-news-feature p`），是純文字節點，
--                               改成 HTML 會把標籤當字印出來。
--   content_html / _en        = 編輯器產出的 HTML，單則頁面的內文
--   content_json / _en        = ProseMirror JSON，只回餵編輯器
--
-- 與 posts 一樣不給 content_html default ''：null 才代表「沒填」，前台據此
-- 判斷要不要顯示內文區塊、以及英文要不要退回中文。
--
-- 可重複執行。

alter table public.news add column if not exists content_html    text;
alter table public.news add column if not exists content_json    jsonb;
alter table public.news add column if not exists content_html_en text;
alter table public.news add column if not exists content_json_en jsonb;

-- 驗收
-- select column_name from information_schema.columns
--  where table_schema='public' and table_name='news' order by ordinal_position;
-- 預期新增 4 欄，合計 15 欄。
