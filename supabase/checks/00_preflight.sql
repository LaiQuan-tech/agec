-- ============================================================
-- 前置檢查：跑 migration 之前先執行這一支（純唯讀）
--
-- 為什麼需要：RLS 的多條 policy 之間是 OR。20260814090200_rls_policies.sql
-- 只會 drop 它自己命名的 policy（"public read *" / "admin write *"）。
-- 如果這些表上已經存在**別的名字**的寫入 policy（例如原本規劃的
-- auth.role() = 'authenticated'），它不會被移除，而是與新的白名單 policy
-- 疊加 —— 結果是任何登入者都還是寫得進去，白名單形同虛設。
--
-- 所以：先看清楚現在有什麼，再決定要不要一併刪掉。
-- ============================================================

-- 1) 現有的所有 policy。重點看 cmd 是 INSERT / UPDATE / DELETE / ALL 的那幾條。
select
  tablename,
  policyname,
  cmd,
  roles,
  qual        as using_expression,
  with_check  as check_expression
from pg_policies
where schemaname = 'public'
  and tablename in ('news','faculty','courses','programs','links')
order by tablename, cmd, policyname;

-- 判讀：
--   * 只有 cmd = SELECT 的 policy → 安全，直接跑 migration。
--   * 出現 cmd = ALL / INSERT / UPDATE / DELETE 且名稱不是 "admin write *"
--     → 記下它的 policyname，跑完 migration 後用下面的語句刪掉：
--
--         drop policy "<那個 policyname>" on public.<那張表>;
--
--     刪之前先確認沒有其他系統依賴它（這個專案的前台走 service_role，
--     完全繞過 RLS，所以刪掉不影響前台）。

-- 2) storage.objects 上有沒有既有 policy（同樣的 OR 疊加問題）。
select policyname, cmd, roles, qual, with_check
from pg_policies
where schemaname = 'storage' and tablename = 'objects'
order by cmd, policyname;

-- 3) 確認 RLS 真的開著（不是「沒開所以什麼都擋不住」）。
select relname, relrowsecurity
from pg_class
where relnamespace = 'public'::regnamespace
  and relname in ('news','faculty','courses','programs','links')
order by relname;
-- 五列都必須是 t。
