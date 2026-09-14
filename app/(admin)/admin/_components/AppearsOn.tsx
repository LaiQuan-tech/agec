import Link from "next/link";
import { appearsOn } from "@/lib/admin/site-map";

/**
 * 列表頁 h1 底下那一行：「這裡的內容出現在：招生資訊 › 申請協助 ↗︎」。
 *
 * 反查 lib/admin/site-map.ts，所以跟側欄與儀表板永遠一致 —— 系辦從前台看到
 * 什麼字，在這裡就對到什麼字。`section` 是列表目前的 `?section=`（沒有時列出
 * 這個模組供應的全部頁面）。
 */
export function AppearsOn({ pathname, section }: { pathname: string; section?: string | null }) {
  const entries = appearsOn(pathname, section);
  if (entries.length === 0) return null;
  return (
    <p className="mt-1 text-[13px]" style={{ color: "var(--muted)" }}>
      這裡的內容出現在：
      {entries.map((e, i) => (
        <span key={`${e.page}-${e.block}`}>
          {i > 0 ? "、" : ""}
          <Link
            href={e.publicHref}
            target="_blank"
            className="underline underline-offset-2"
            title={e.note}
          >
            {e.page} › {e.block} ↗︎
          </Link>
        </span>
      ))}
    </p>
  );
}
