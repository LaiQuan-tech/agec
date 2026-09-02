# Supabase 資料庫變更

專案 ref：`amwiaanlvxupzfzaruwr`

## 怎麼執行

這個專案**沒有裝 Supabase CLI**（需要 Docker，且本機磁碟吃緊），所以 migration 是**人工貼進 Supabase Dashboard 的 SQL Editor** 執行。

因為沒有 CLI 就沒有 `schema_migrations` 表，執行紀錄只能靠下面這張表人工維護。**跑完一支就回來勾記。**

檔名慣例沿用 Supabase CLI 的 `YYYYMMDDHHMMSS_描述.sql`，這樣日後想接 CLI 可以直接用。

**每一支 SQL 都寫成可重複執行**（`create ... if not exists`、`drop policy if exists` 後才 `create`），重跑不會炸。

## 執行順序與紀錄

依檔名順序執行。`admin_allowlist` 必須早於 `rls_policies` 與 `storage_buckets`（後兩者依賴 `is_admin()`）。

| # | 檔案 | 內容 | 已執行 |
|---|---|---|---|
| 0 | `checks/00_preflight.sql` | 唯讀。列出既有 policy | ✅ 2026-08-09 |
| 1 | `migrations/20260814090000_posts_table.sql` | 建 `posts` 表、constraints、indexes、`updated_at` trigger | ✅ 2026-08-09 |
| 2 | `migrations/20260814090100_admin_allowlist.sql` | 建 `admin_users` 白名單表與 `is_admin()` 函式 | ✅ 2026-08-09 |
| 3 | **人工步驟** | 在 Dashboard 建系辦帳號後，執行檔案末尾註解裡的 `insert into admin_users` | ✅ 2026-08-12 |
| 4 | `migrations/20260814090200_rls_policies.sql` | 六張表的讀寫 policy | ✅ 2026-08-09 |
| 5 | `migrations/20260814090300_storage_buckets.sql` | `blog` bucket、四個 bucket 的大小與 mime 限制、objects policy | ✅ 2026-08-09 |
| 6 | `checks/verify_rls.sql` | 驗收（唯讀），逐段對照 FAIL 判準 | ✅ 2026-08-09 全數 PASS |
| 7 | `migrations/20260814090400_faculty_extend.sql` | `faculty` 加 `name_en`、`experience` 兩欄（另有一行防禦性的 `email` if not exists）；註解記錄 7 種 category 對應的卡片版型 | ✅ 2026-08-14 |
| 8 | `migrations/20260814090500_faculty_seed_2026.sql` | 師資頁 37 筆人員資料（22 主卡 + 客座 1 + 名譽 5 + 退休 6 + 行政 3）。以姓名為自然鍵 upsert，不刪任何資料 | ✅ 2026-08-14 |
| 10 | `migrations/20260901120000_alumni_events.sql` | 建 `alumni_events` / `alumni_event_registrations` 兩張表、RLS、`register_for_alumni_event()` 與 `cancel_alumni_registration()` 兩支函式 | ⬜ 待執行 |
| 11 | `migrations/20260902100000_admin_user_management.sql` | 後台兩層權限（`admin_users.role`、`admin_role()`、`is_manager()`）、`created_by`、保底 trigger、操作日誌 `admin_audit_log` 與通用稽核 trigger | ⬜ 待執行 |
| 9 | **人工步驟** | 清掉 `faculty` 原本的 8 筆佔位假資料。語句在第 8 支檔案末尾的註解區塊，**先跑 select 版本確認清單再改成 delete** | ✅ 2026-08-14 |

第 7、8 支必須照順序跑（seed 依賴 extend 新增的兩個欄位）。兩支都在本機
PostgreSQL 18 上連跑兩次驗證過：第二次不會產生重複列，欄位值與參考站
`faculty.html` 逐欄比對 37/37 相符，23 個 `photo_url` 全部對得到
`public/images/faculty/` 的實體檔案。

第 9 步為什麼不寫進 migration：第 8 支是以姓名比對做 upsert，只會覆蓋名字
對得上的佔位資料，對不上的會留在表上（實測 8 筆裡有 7 筆會留下），讓師資頁
多出幾張沒照片、分類也對不上篩選標籤的卡片。刪除不可逆，且系辦若已自行在
後台新增過真的師資也會被同一條 `where` 掃到，所以交給人工確認。

## 2026-08-14 執行紀錄（第 7–9 步）

三步都經 Supabase Management API（`/v1/projects/{ref}/database/query`）執行，
不是貼進 Dashboard。**注意 API 有 Cloudflare 擋 User-Agent** —— python
`urllib` 直打會回 403 error code 1010，看起來像 token 無效其實不是；用
`curl` 或自帶合理 UA 就正常。

第 8 支跑完統計是 45 筆＝新的 37 筆＋原本 8 筆佔位（與上面預期的一致，
upsert 沒有覆蓋到它們）。第 9 步照檔尾指示先跑 select 版本，列出的 8 筆
全部是 `教師姓名 1`～`教師姓名 8`、照片都指向同一張 `portrait.png`，確認
無誤後才執行 delete。刪除前已備份到 `/tmp/faculty-placeholder-backup.json`。

刪除後統計：專任 12／兼任 9／退休 6／名譽 5／行政 3／合聘 1／客座 1，
合計 **37 筆**，有照片 23、有 email 36 —— 與 seed 檔自己寫的驗收預期逐項相符。

## 2026-08-09 執行紀錄

preflight 發現五張表都有一條名為 `auth write` 的 policy：

```
cmd=ALL   using = (auth.role() = 'authenticated')
```

配上當時開著的 `disable_signup`，代表任何人註冊一個帳號就能對 news /
faculty / courses / programs / links 任意增刪改。這是實際可利用的，不是
理論風險。`rls_policies` 的 DO block 已將這五條移除。

移除後以「模擬 authenticated 身分」實測（未建立任何帳號，用
`set_config('role','authenticated')` 加隨機 uuid claims）：寫入 news /
posts、更新 faculty、刪除 links、讀取或竄改 `admin_users` 全部被擋，
公開讀取不受影響。資料筆數在測試前後一致（10/8/6/5/7）。

## Dashboard 上要手動做的事（SQL 做不到）

1. **Authentication → Sign In / Providers → 關閉「Allow new users to sign up」**
   目前是開著的，任何人拿公開的 anon key 都能自行註冊成 `authenticated`。`admin_users` 白名單已經讓這件事不足以取得寫入權，但沒有理由留著。
2. **Authentication → Users → Add user**，建 2–3 個系辦帳號，**勾選 Auto Confirm User**。
   建完把 email 填進步驟 3 的 insert 語句。

   2026-08-12 已用 Admin API（service role）建好第一個帳號並加進白名單：

   | email | user_id | 備註 |
   |---|---|---|
   | `armand7951@gmail.com` | `1b60935c-5cff-4f24-83e4-3f5b685f1234` | 系辦/開發者，`email_confirm` 已設 |

   密碼是暫用的弱密碼，交付系辦前務必在 Dashboard 改掉。系辦自己的帳號請照同一步驟再建：
   建完 auth 使用者 → `insert into public.admin_users`（語句在 migration 檔尾）。

## 為什麼寫入權限用白名單而不是 `to authenticated`

`design_handoff_agec/DEPLOYMENT.md` 原本規劃的是 `auth.role() = 'authenticated'`。在這個專案那等於把寫入權開給全世界 —— 因為開放註冊是開著的，任何人註冊完就是 `authenticated`。

`admin_users` 白名單把「登入者」與「系辦人員」拆開。即使日後有人不小心把註冊打開，資料表仍然安全。

## schema 變更規則

app 端**不執行 DDL**。任何 schema 變更都要在這個目錄新增一支 migration，跑完回來勾記。
