-- attachments bucket：補上實際會用到的檔案型別
--
-- 起因：20260831120100 建立這個 bucket 時，允許的 mime 是從舊站標記裡的
-- 「檔名」推出來的，而那些檔名有一半根本沒有副檔名（「課程講義」「公文
-- 1150034053」）。實際把 66 個附件抓下來、看 Content-Disposition 給的原始
-- 檔名之後，才發現裡面還有 .jpg 與 .7z——公告有時候直接附一張掃描的公文圖，
-- 或把一整包表格壓成 7z。
--
-- 這裡不是把 bucket 開成什麼都收：這份清單與
-- app/(admin)/admin/api/upload/route.ts 的 FILE_TYPES 是同一份合約的兩半，
-- 兩邊必須一致。bucket 這一半是繞不過去的那一半——上傳端點的檢查是我們寫的
-- 程式碼，這一條是 Storage 自己執行的。
--
-- ⚠️ 刻意不加 application/octet-stream。那是「什麼都收」的同義詞，這個 bucket
-- 是 public 而且原樣送回，等於在系上的網域底下開一個放執行檔的空間。
--
-- 可重複執行。

update storage.buckets
   set allowed_mime_types = array[
     'application/pdf',
     'application/msword',
     'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
     'application/vnd.ms-excel',
     'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
     'application/vnd.ms-powerpoint',
     'application/vnd.openxmlformats-officedocument.presentationml.presentation',
     'application/zip',
     'application/x-7z-compressed',
     'application/x-rar-compressed',
     'application/vnd.rar',
     'text/plain',
     -- 掃描件與海報，附件裡確實有
     'image/jpeg',
     'image/png',
     'image/webp',
     'image/avif',
     'image/gif'
   ]
 where id = 'attachments';

-- 驗收
-- select array_length(allowed_mime_types,1) from storage.buckets where id='attachments';
-- 預期 17。
