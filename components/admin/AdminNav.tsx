"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ADMIN_SITE_MAP, ADMIN_SYSTEM, type AdminBlock } from "@/lib/admin/site-map";

/**
 * 後台側欄：照前台選單分組。
 *
 * 每一組是前台的一頁（首頁、最新消息、…、系友專區），底下列出那一頁可以編輯
 * 的區塊，點進去就是對應的後台模組（清單在 lib/admin/site-map.ts）。系辦不必
 * 先知道「招生資訊頁底下那排標籤在後台叫核心能力」—— 打開招生資訊那一組就
 * 看到它。最後一組「系統」是人員管理與操作日誌，只有管理員看得到。
 *
 * ## 「目前在哪」
 *
 * AdminShell 是 Server Component，layout 在前端導覽時不會重新渲染，所以判斷
 * 目前頁面的邏輯放在這個 client 元件：`usePathname()` 配 `useSearchParams()`。
 * 帶 `?section=` 的項目（連結卡片、檔案下載）要 section 也一樣才算；沒帶參數
 * 時（列表在「全部」模式）該模組的每一個入口都亮 —— 一個模組供應三頁時三處
 * 都亮是事實，不做假的單選。
 *
 * ## lg 以下
 *
 * 原本的側欄在窄螢幕是一條橫向捲動列，分組塞不進去。改用原生 `<details>`：
 * 收合時 summary 印「選單 · 目前：學生專區 › 學習與發展資源」，展開是同一份
 * 直向清單。沒有 JS 狀態，也不用處理點外面關閉。
 */

function blockIsActive(block: AdminBlock, pathname: string, section: string | null): boolean {
  const [path, query] = block.href.split("?");
  const samePath = pathname === path || pathname.startsWith(`${path}/`);
  if (!samePath) return false;
  const blockSection = query ? new URLSearchParams(query).get("section") : null;
  if (!blockSection || !section) return true;
  return blockSection === section;
}

export function AdminNav({ isManager }: { isManager: boolean }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const section = searchParams.get("section");

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

  // 收合狀態的摘要：第一個亮著的項目。
  let current: string | null = null;
  for (const g of groups) {
    const hit = g.blocks.find((b) => blockIsActive(b, pathname, section));
    if (hit) {
      current = `${g.label} › ${hit.label}`;
      break;
    }
  }

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
                const active = blockIsActive(b, pathname, section);
                return (
                  <li key={b.href}>
                    <Link
                      href={b.href}
                      aria-current={active ? "page" : undefined}
                      className="block rounded-md px-3 py-1.5 text-[14px] leading-snug hover:bg-neutral-100"
                      style={
                        active
                          ? { background: "var(--cream)", color: "var(--gold-ink)", fontWeight: 600 }
                          : { color: "var(--ink)" }
                      }
                    >
                      {b.label}
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
          {current ? (
            <span className="ml-2 text-[12px]" style={{ color: "var(--muted)" }}>
              目前：{current}
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
