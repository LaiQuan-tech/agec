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
npx tsx scripts/import-news.ts --write                  # 5  清空 news 後寫入
python3 scripts/shrink-oversized.py                     # 6  縮掉過大的圖（選用）
```

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
| `titles-en.json` | 428 則英文標題。172 則非演講類與 41 則無講者的演講是逐句翻的；其餘 215 則由講者＋日期組出來 |
| `speakers-en.json` | 208 個不重複的講者字串中譯英。同一個人在九年的公告裡有好幾種寫法，所以是「逐字串」不是「逐人」 |
| `legacy-news-backup.json` | 被清空的那 11 列。它們的 `category_en` 是當初對照系上英文站查證過的，`import-news.ts` 的 `CATEGORY_EN` 直接沿用 |
| `assets-dead.json` | 抓不到的來源檔案，依主機分組。舊站有四分之一的內文圖是連到早就掛掉的外部主機 |
| `upload-skipped.json` | 抓到了但沒能上傳的（型別無法判斷或 Storage 拒絕） |
| `fetch-failures.json` | 抓不到的消息頁。這次是空的 |
| `url-map.json` | 舊網址 → Supabase 網址對照 |

沒進版控的（`.gitignore` 有列，重跑即可重建）：
`news-list.json`、`news-parsed.json`（4MB，內容就是舊站 HTML）、`news-prepared.json`。

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
