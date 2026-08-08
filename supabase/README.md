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
| 0 | `checks/00_preflight.sql` | **先跑這支**（唯讀）。列出既有 policy，確認沒有會與白名單 OR 疊加的舊寫入 policy | ⬜ |
| 1 | `migrations/20260814090000_posts_table.sql` | 建 `posts` 表、constraints、indexes、`updated_at` trigger | ⬜ |
| 2 | `migrations/20260814090100_admin_allowlist.sql` | 建 `admin_users` 白名單表與 `is_admin()` 函式 | ⬜ |
| 3 | **人工步驟** | 在 Dashboard 建系辦帳號後，執行檔案末尾註解裡的 `insert into admin_users` | ⬜ |
| 4 | `migrations/20260814090200_rls_policies.sql` | 六張表的讀寫 policy | ⬜ |
| 5 | `migrations/20260814090300_storage_buckets.sql` | `blog` bucket、四個 bucket 的大小與 mime 限制、objects policy | ⬜ |
| 6 | `checks/verify_rls.sql` | 驗收（唯讀），逐段對照 FAIL 判準 | ⬜ |

## Dashboard 上要手動做的事（SQL 做不到）

1. **Authentication → Sign In / Providers → 關閉「Allow new users to sign up」**
   目前是開著的，任何人拿公開的 anon key 都能自行註冊成 `authenticated`。`admin_users` 白名單已經讓這件事不足以取得寫入權，但沒有理由留著。
2. **Authentication → Users → Add user**，建 2–3 個系辦帳號，**勾選 Auto Confirm User**。
   建完把 email 填進步驟 3 的 insert 語句。

## 為什麼寫入權限用白名單而不是 `to authenticated`

`design_handoff_agec/DEPLOYMENT.md` 原本規劃的是 `auth.role() = 'authenticated'`。在這個專案那等於把寫入權開給全世界 —— 因為開放註冊是開著的，任何人註冊完就是 `authenticated`。

`admin_users` 白名單把「登入者」與「系辦人員」拆開。即使日後有人不小心把註冊打開，資料表仍然安全。

## schema 變更規則

app 端**不執行 DDL**。任何 schema 變更都要在這個目錄新增一支 migration，跑完回來勾記。
