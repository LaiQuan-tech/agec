# scripts/ — 舊站消息搬運

2026-08-31 一次性把現行官網 `agec.ntu.edu.tw` 的 428 則消息搬進新站 `news` 表所用的腳本。
留在 repo 裡當審計紀錄，**不進 CI、不進 build**，`package.json` 也沒有對應的 npm script——
這些不該被誰不小心跑到。

## 跑的順序

```bash
AGEC_SOURCE=<清單 json> python3 scripts/fetch-news.py   # 1+2 建清單、抓 428 篇內文
python3 scripts/parse-news.py                           # 3  HTML → 結構化資料
python3 scripts/fetch-assets.py                         # 4a 下載圖片與附件
python3 scripts/upload-assets.py                        # 4b 上傳 Supabase Storage
npx tsx scripts/import-news.ts --dry                    # 5  轉換＋消毒，只看報告
npx tsx scripts/import-news.ts --write                  # 5  ⚠️ 清空 news 後全量寫入
npx tsx scripts/import-news.ts --write --append --only 招生   # 5' 只新增某一類
python3 scripts/shrink-oversized.py                     # 6  縮掉過大的圖（選用）
```

另有一支 `scripts/import-forms.py`（2026-09-15，一次性）：把舊站「常用表格」
`/zh_tw/link/link4` 的 39 份表單連檔案搬進 `documents` 表（section=courses、五組
分類照舊站順序）。`--dry` 只下載＋印清單，`--write` 上傳 Storage `attachments/forms/<舊站 id>.<ext>`
（x-upsert，可重跑）並以 `file_url` 判斷已匯入就跳過；舊站標題裡用底線代替斜線與
括號的那幾筆是人工給定的標籤（`LABEL_OVERRIDES`）。已執行：上傳 37、寫列 37、
既有 2 列補分類。⚠️ 走 service role，這批不進稽核日誌。

另有一支 `scripts/import-exams.py`（2026-09-17，一次性）：把舊站「考古題專區」
`/zh_tw/link/link5` 的 97 個檔案連檔案搬進 `documents` 表（section=admissions、
category=考古題，依 program 分 碩士班 36／博士班 18／碩士在職專班 43；年度標題
分組數 碩士班 14＝招生 8＋甄試 6／博士班 6／碩士在職專班 19）。`--dry` 只下載＋
印清單，`--write` 上傳 Storage `attachments/exams/<舊站 file id>.<ext>`（x-upsert，
可重跑）並以 `file_url` 判斷已匯入就跳過；`description` 存舊站年度標題原文（例如
「111碩士班招生考題」「105年碩士在職專班入學試題」），是前台依年度分組、科目
並排顯示的鍵（另一位 agent 在改的前台會照這個鍵分組，不是 category）。碩士在職
專班那組 43 筆裡有 21 筆的舊站 `title` 屬性其實是原始檔名（例如
「112年碩士在職專班入學試題-管理與經營實務_Final_.pdf」），`clean_subject_label()`
清出真正科目名；清出來的「管理與經營實務」有 4 種寫法（字序相反／多「含統計
應用」／多一個「學」字）——舊站本身逐年命名不一致，如實保留、不強行合併，這
14 筆的 `label_en` 是 null（其餘 5 種科目——農業經濟學／經濟學／統計學／英文／
經濟理論——都有對照）。`sort_order` 公式：分組序（舊站頁面順序 0–3）×1000 ＋
(150 − 民國年)×10 ＋ 組內科目序（該年度標題底下第幾個科目，從 1 算），150 是
刻意選的民國年上界，理論最大值 3549，在後台 `/admin/documents` 表單 0–9999 的
驗證範圍內。已執行：上傳 97、寫列 97，重跑一次驗過冪等（0 新增、0 錯誤）。
⚠️ 走 service role，這批不進稽核日誌（同上面表單匯入那支）。

另有一支獨立的 `scripts/build-logos.py`（從客戶的識別母檔產 logo SVG），與消息
搬運無關，說明在檔案開頭。

每一步都可以單獨重跑：抓取會沿用快取，上傳走 `x-upsert`，只有最後一步會動資料庫。
前四步的快取放在 `/tmp`（`AGEC_CACHE`、`AGEC_ASSETS` 可覆寫），不進 repo。

## 為什麼是兩種語言

前四步是 Python：解析 HTML、跟一個不是我們的 CMS 打交道、處理逾時與死連結，
用 `curl` 子行程最直接（Cloudflare 會擋 Python 的預設 User-Agent，所以不用 urllib）。

第五步是 TypeScript，只為了一件事：**消毒規則只能有一份**。
`import-news.ts` 直接 `import { RICH_TEXT_SANITIZE } from "../lib/sanitize"`，
與兩支 Server Action 和兩個前台元件用的是同一個模組。
用 Python 重寫一次 allowlist，就是第四份拷貝——而且是清單改動時最不會有人想到要更新的那一份。

## `data/` 裡有什麼

進版控的是**查不回來的東西**：

| 檔案 | 內容 |
|---|---|
| `titles-en.json` | 585 則英文標題。329 則（172 一般 + 157 招生 + 41 無講者的演講）是逐句翻的；其餘 215 則演講由講者＋日期組出來 |
| `speakers-en.json` | 208 個不重複的講者字串中譯英。同一個人在九年的公告裡有好幾種寫法，所以是「逐字串」不是「逐人」 |
| `legacy-news-backup.json` | 被清空的那 11 列。它們的 `category_en` 是當初對照系上英文站查證過的，`import-news.ts` 的 `CATEGORY_EN` 直接沿用 |
| `assets-dead.json` | 抓不到的來源檔案，依主機分組。舊站有四分之一的內文圖是連到早就掛掉的外部主機 |
| `upload-skipped.json` | 抓到了但沒能上傳的（型別無法判斷或 Storage 拒絕） |
| `fetch-failures.json` | 抓不到的消息頁。這次是空的 |
| `url-map.json` | 舊網址 → Supabase 網址對照 |

沒進版控的（`.gitignore` 有列，重跑即可重建）：
`news-list.json`、`news-parsed.json`（4MB，內容就是舊站 HTML）、`news-prepared.json`。

## ⚠️ 第 5 步只有第一次能用 `--write`

`news.id` 是 identity 欄位，**DELETE 不會把序列倒回去**。證據就在資料裡：目前
的 id 是 443–870 而不是 1–428，因為第一次匯入刪掉的是編號從 1 開始的那批。

所以再跑一次 `--write`，585 則會拿到 871 以上的全新號碼，**現有每一個
`/news/<id>` 網址都會 404，而且新舊之間沒有任何對照表可以重導**。順帶還會賠掉：
系辦自搬運後在 /admin 做的所有編輯、所有置頂（prepared 把 `is_pinned` 寫死
false）、手工填的英文欄、所有草稿（`id=gt.0` 連草稿一起刪）、所有 `content_json`。

第二批（157 則招生）因此走 `--append --only 招生`：不清空，只寫入該分類。
`--only` 在那個分類還是空的時候，就是「新列」的精確定義——不需要比對，也不
需要改 schema。腳本會先查該分類現有筆數，非 0 就中止。

**這個做法每個分類只安全一次。** 真正讓第 5 步可重跑的做法是給 `news` 一個
`legacy_id` 欄加 unique index，改用 `Prefer: resolution=merge-duplicates` upsert。
還沒做——下一次搬運之前應該先做。

## scripts/import-news-incremental.ts — 增量匯入（不必等 legacy_id 欄位）

上面那句「還沒做」在 2026-09 這次要用到之前，先用一個不改 schema 的過渡做法
頂著：`scripts/import-news-incremental.ts`。跟第 5 步的差別只在怎麼判斷
「這筆是不是已經匯入過」——沒有 `legacy_id` 可以查，改成拿 `(title,
published_at)` 去對現有的 `news` 資料，一樣就跳過，不一樣就當新資料處理。

**為什麼不能直接用 `import-news.ts`**：純 `--write` 會先清空整張表（見上面
整段說明），這次不能用；`--append --only <分類>` 只在該分類還是空的時候才
放行，而現在五個分類（最新公告／演講公告／求職徵才／活動剪影／招生）全部
已經有資料，guard 會直接擋下來，兩條路都走不通。

```bash
npx tsx scripts/import-news-incremental.ts --since 2026-09-01 --dry     # 預設；只印報告，不寫入
npx tsx scripts/import-news-incremental.ts --since 2026-09-01 --write   # 真的寫入
```

`--since` 必填，只處理該日（含）之後貼出的消息。腳本自己逐頁翻舊站列表頁，
翻到整頁都比 `--since` 舊為止，不假設固定頁數（也不假設列表本身完全照日期
排序——置頂消息會插在最前面，順序可能亂，所以是整頁一起判斷，不是看到第一筆
舊的就停）。

**去重規則**：查 `news?select=id,title,published_at,category`，`(title,
published_at)` 完全相同就視為已匯入、跳過。只比 `title` 不夠——舊站會把同一
件事同時貼進兩個分類（例如「最新公告」與「活動剪影」各一則，標題相同、日期
差一兩天），這是兩筆該收的獨立記錄，不是重複；既有 584 列裡就有 4 組同標題
的先例，其中 3 組連 `published_at` 都一樣，一樣是當年匯入了兩筆獨立資料，不
是誤植。跟 `import-forms.py`／`import-exams.py` 用 `file_url` 判斷已匯入是
同一類「沒有專屬 id 欄位，只能比內容」的權宜做法，差別是 `news` 連一個能拿
來比對的 URL 欄位都沒有，只剩標題和日期可用。

英文標題不在腳本裡翻譯——從 `scripts/data/titles-en-september.json`（舊站
數字 id → 英文標題）讀；找不到對應的那一筆會被列進報告的「缺英文標題」區，
且拒絕寫入，不會用機器翻譯頂著先發。

`--dry` 只打唯讀請求（舊站列表頁/內頁、`news` 的去重查詢），報告裡的圖片數/
附件數是直接算舊站內頁解析出來的數量。下載圖片與附件、上傳 Storage、消毒
HTML、寫入 `news`——這一整段只在 `--write` 才會執行。暫存檔（內頁快取、
`--write` 之後「舊站 id ↔ 新 news.id」的對照紀錄）放在 `scripts/data/
incremental/`，不會動這個子目錄以外、原本就在 `data/` 裡的既有檔案。

## 第 6 步在做什麼

舊 CMS 存的是上傳者丟進去的原檔。搬過來的 376 張圖裡，有 100 張寬度超過
2000px，光這 100 張就佔 337MB——直接從 Photoshop 匯出的海報，最大一張 17MB。
內文欄寬只有 760px，2000px 已經是 2.6 倍。縮完 **337MB → 50MB（省 85%）**。

刻意做得很窄，所以不會弄壞任何東西：只動寬度超過 2000px 的、**格式不變**
（物件鍵因此不變，`cover_url` 與 `content_html` 完全不用改）、原始下載檔留著
不動、走 upsert 所以可以重跑。

**還沒做的**：另外 73 張海報是 PNG（合計 81MB，單張 1–2.5MB），轉成 JPEG 大約
還能省 60MB。但那會改副檔名 → 改物件鍵 → 要重寫資料庫裡每一個引用，是另一件
風險不同的事。影響也比想像小：/news 的主打卡目前用的是本地預設圖，這些 PNG
只在各自的單則消息頁載入，一頁一張。

## 兩個踩過的坑

**`extract_div()` 的 off-by-one**。結束標籤的 regex 是 `</?div\b`，只吃到 `</div`（5 字元），
但回退時用了 `len("</div>")`（6）——每一則內文都被多砍一個字元。
多數情況只砍到空白，但 92% 的演講公告內文正好就是 `<div class="post-body"><img …></div>`，
砍掉的就是 `<img>` 的收尾 `>`：439 張圖只認得出 184 張，而且不會報錯。
現在改成記下結束標籤的 `start()`。

**附件檔名在標記裡是不完整的**。舊站 `title` 屬性給的檔名有一半沒有副檔名
（「課程講義」「公文1150034053」）。真正的檔名要從下載時的 `Content-Disposition` 拿，
`fetch-assets.py` 就是為此把 header 一起存下來。

## page-copy-seed.ts — 頁面文案的 migration 種子

```bash
npx tsx --tsconfig tsconfig.json scripts/page-copy-seed.ts about      # 或 students
```

把某一頁 `page_copy` 的全部格位印成 `insert … on conflict (page, name) do nothing` 的
SQL（stdout），值逐字取自 `lib/page-copy/<page>.ts` 的 `*_COPY_DEFAULTS`（也就是字典），
貼進 migration 即可；檔頭說明另外手寫。新增一頁：在腳本的 `PAGES` 加一筆。
20260916100000_page_copy_about.sql 的 42 列就是它印的。
