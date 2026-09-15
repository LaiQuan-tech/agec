"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ADMIN_SITE_MAP, ADMIN_SYSTEM, activeAdminBlock, aliasTarget } from "@/lib/admin/site-map";

/**
 * 後台側欄：照前台選單分組。
 *
 * 每一組是前台的一頁（首頁、最新消息、…、系友專區），底下列出那一頁可以編輯
 * 的區塊，點進去就是對應的後台模組（清單在 lib/admin/site-map.ts）。系辦不必
 * 先知道「招生資訊頁底下那排標籤在後台叫核心能力」—— 打開招生資訊那一組就
 * 看到它。最後一組「系統」是人員管理與操作日誌，只有管理員看得到。
 *
 * ## 「目前在哪」—— 永遠只亮一個
 *
 * AdminShell 是 Server Component，layout 在前端導覽時不會重新渲染，所以判斷
 * 目前頁面的邏輯放在這個 client 元件：`usePathname()` 配 `useSearchParams()`
 * 餵給 `activeAdminBlock()`。一個模組供應三頁（最新消息在首頁、最新消息、
 * 招生資訊都有入口），第一版三處一起亮，系辦看到的是「壞掉了」。現在的規則：
 * 網址參數對得上的入口亮（`?section=students`、`?category=admissions`），
 * 對不上就亮那個模組標了 `primary` 的入口；其餘沒參數的入口是捷徑，旁邊印
 * 「→ 最新消息」告訴人點下去會落在哪一組。
 *
 * ## lg 以下
 *
 * 原本的側欄在窄螢幕是一條橫向捲動列，分組塞不進去。改用原生 `<details>`：
 * 收合時 summary 印「選單 · 目前：學生專區 › 學習與發展資源」，展開是同一份
 * 直向清單。沒有 JS 狀態，也不用處理點外面關閉。
 */

export function AdminNav({ isManager }: { isManager: boolean }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = activeAdminBlock(pathname, searchParams);

  const groups = [
    ...ADMIN_SITE_MAP.map((p) => ({
      key: p.href,
      label: p.label,
      publicHref: p.href,
      note: p.note,
      blocks: p.blocks,
    })),
    ...(isManager
      ? [{ key: "system", label: "系統", publicHref: null, note: undefined, blocks: ADMIN_SYSTEM }]
      : []),
  ];

  // 收合狀態的摘要：亮著的那一項（只會有一個）。
  const currentGroup = current ? groups.find((g) => g.blocks.includes(current)) : undefined;
  const summary = current && currentGroup ? `${currentGroup.label} › ${current.label}` : null;

  // 組與組之間 28px：大標（頁名）與上一組最後一個項目要明顯分開，
  // 否則「招生資訊」看起來像「系所成員」那組的第二個項目。
  const list = (
    <ul className="flex flex-col gap-7">
      {groups.map((g) => (
        <li key={g.key}>
          <div
            className="flex items-baseline justify-between gap-2 border-t px-3 pt-3"
            style={{ borderColor: "var(--hairline)" }}
          >
            <span
              className="text-[12px] font-semibold tracking-wide"
              style={{ color: "var(--muted)" }}
            >
              {g.label}
            </span>
            {g.publicHref ? (
              <Link
                href={g.publicHref}
                target="_blank"
                className="text-[11px] hover:underline"
                style={{ color: "var(--muted)" }}
                title={`在新分頁開啟前台的「${g.label}」`}
              >
                前台 ↗︎
              </Link>
            ) : null}
          </div>
          {g.blocks.length === 0 ? (
            <p className="px-3 pt-1 text-[12px] leading-relaxed" style={{ color: "var(--muted)" }}>
              {g.note}
            </p>
          ) : (
            <ul className="mt-1.5 flex flex-col gap-0.5">
              {g.blocks.map((b) => {
                const active = b === current;
                const alias = aliasTarget(b);
                return (
                  <li key={b.href}>
                    <Link
                      href={b.href}
                      aria-current={active ? "page" : undefined}
                      className="flex items-baseline justify-between gap-2 rounded-md px-3 py-1.5 text-[14px] leading-snug hover:bg-neutral-100"
                      style={
                        active
                          ? { background: "var(--cream)", color: "var(--gold-ink)", fontWeight: 600 }
                          : { color: "var(--ink)" }
                      }
                      title={alias ? `這裡的內容在「${alias}」維護，點下去會到那一組` : undefined}
                    >
                      <span>{b.label}</span>
                      {alias ? (
                        <span className="shrink-0 text-[11px]" style={{ color: "var(--muted)" }}>
                          → {alias}
                        </span>
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </li>
      ))}
    </ul>
  );

  return (
    <>
      {/* lg 以上：直向側欄。 */}
      <nav aria-label="後台選單" className="hidden px-3 pb-4 lg:block">
        {list}
      </nav>

      {/* lg 以下：收合成一列，展開是同一份清單。 */}
      <details className="border-t px-3 py-2 lg:hidden" style={{ borderColor: "var(--hairline)" }}>
        <summary
          className="cursor-pointer select-none py-1 text-[14px]"
          style={{ color: "var(--ink)" }}
        >
          選單
          {summary ? (
            <span className="ml-2 text-[12px]" style={{ color: "var(--muted)" }}>
              目前：{summary}
            </span>
          ) : null}
        </summary>
        <nav aria-label="後台選單" className="pt-3">
          {list}
        </nav>
      </details>
    </>
  );
}
