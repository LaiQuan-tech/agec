import Link from "next/link";

/**
 * 列表頁的篩選籤（一排 `?param=` 連結）。從 logs/page.tsx 抽出來，links 與
 * documents 的 `?section=` 篩選也用它 —— 三頁長得一樣，系辦不必重新認一次。
 *
 * 是連結不是按鈕：篩選狀態在網址上，重新整理、回上一頁、把網址貼給同事都
 * 保得住。
 */
export function FilterLink({
  label,
  href,
  active,
}: {
  label: string;
  href: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className="rounded-md px-3 py-1.5 text-[13px]"
      style={
        active
          ? { background: "var(--brand-green)", color: "#fff" }
          : { background: "#fff", color: "var(--ink)", border: "1px solid var(--hairline)" }
      }
    >
      {label}
    </Link>
  );
}
