-- bucket mime 白名單：依實際搬進來的檔案修正
--
-- 前一版（20260831140000）的清單還是推測的。把舊站 495 個檔案全部抓下來、
-- 用 `file --mime-type` 逐一驗過位元組之後，出現三個沒被涵蓋的型別：
--
--   text/rtf        一份叫「附件_傅鐘獎學金申請書.doc」的檔案，內容其實是
--                   RTF。這裡照位元組的真實型別放行，不是照副檔名硬塞成
--                   application/msword——mime 是給瀏覽器判斷怎麼處理的，
--                   寫錯就是騙它。
--   .ods            一份 OpenDocument 試算表（暑期實習推薦表）。
--   image/gif       posters bucket 原本只允許 jpeg/png/webp/avif，但舊站
--                   內文有一張 gif。少這一項會讓那張圖上傳失敗，而且失敗
--                   訊息只會說「mime not allowed」，不會說是哪一張。
--
-- 這三份清單與 app/(admin)/admin/api/upload/route.ts 的 IMAGE_TYPES /
-- FILE_TYPES 是同一份合約的兩半。
--
-- 可重複執行。

update storage.buckets
   set allowed_mime_types = array[
     'image/jpeg','image/png','image/webp','image/avif','image/gif'
   ]
 where id in ('photos', 'posters');

update storage.buckets
   set allowed_mime_types = array[
     'application/pdf',
     'application/msword',
     'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
     'application/vnd.ms-excel',
     'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
     'application/vnd.ms-powerpoint',
     'application/vnd.openxmlformats-officedocument.presentationml.presentation',
     'application/vnd.oasis.opendocument.text',
     'application/vnd.oasis.opendocument.spreadsheet',
     'application/rtf',
     'text/rtf',
     'application/zip',
     'application/x-7z-compressed',
     'application/x-rar-compressed',
     'application/vnd.rar',
     'text/plain',
     'image/jpeg','image/png','image/webp','image/avif','image/gif'
   ]
 where id = 'attachments';

-- 驗收
-- select id, array_length(allowed_mime_types,1) from storage.buckets order by id;
-- 預期 attachments 21、photos/posters 各 5。
