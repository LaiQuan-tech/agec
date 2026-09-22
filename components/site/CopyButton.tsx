"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

/**
 * 一鍵複製：按下去把 `value` 放進剪貼簿，按鈕文字變成 `copiedLabel` 兩秒。
 *
 * 站上唯一會碰剪貼簿的元件，目前只有匯款帳號頁（GivingPage.tsx）在用 ——
 * 帳號十幾位數字，讓人用眼睛抄再打進網銀，抄錯一位錢就進錯戶。
 *
 * ## 兩條路
 *
 * `navigator.clipboard.writeText()` 是正路，但它只在 secure context（https 或
 * localhost）存在，而且舊一點的瀏覽器沒有。不在那條路上時退回老方法：塞一個
 * 看不見的 textarea、選取、`document.execCommand("copy")`。execCommand 已經
 * 標成 deprecated，但每一個瀏覽器都還留著它，正是為了這種退路。
 *
 * ## 失敗不假裝成功
 *
 * 兩條路都失敗（權限被拒、iframe 沙盒、execCommand 回 false）時按鈕**維持
 * 原字**，不印「已複製」—— 印了，捐款人就會拿著空的剪貼簿去網銀貼。沒有另做
 * 失敗訊息：值本身就印在按鈕旁邊，手動選取永遠可以。
 *
 * `aria-live="polite"` 掛在文字節點上，讀屏在文字換成「已複製」時會念出來；
 * `aria-label` 給的是「複製帳號」這種帶欄位名的說法，一頁六顆「複製」才分得開。
 */
export function CopyButton({
  value,
  label,
  copiedLabel,
  ariaLabel,
  className,
}: {
  /** 要放進剪貼簿的字，可多行。 */
  value: string;
  label: string;
  /** 複製成功後兩秒內顯示的字。 */
  copiedLabel: string;
  ariaLabel?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | null>(null);

  // 兩秒還沒到就離開頁面的話，把計時器清掉，免得對已卸載的元件 setState。
  useEffect(() => {
    return () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    };
  }, []);

  async function onClick() {
    const ok = await copyText(value);
    if (!ok) return;
    setCopied(true);
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      setCopied(false);
      timer.current = null;
    }, 2000);
  }

  return (
    <button
      type="button"
      className={cn("copy-button", copied && "is-copied", className)}
      onClick={onClick}
      aria-label={ariaLabel}
    >
      <span aria-live="polite">{copied ? copiedLabel : label}</span>
    </button>
  );
}

/** true = 已經在剪貼簿裡；false = 兩條路都失敗，呼叫端不要宣稱成功。 */
async function copyText(text: string): Promise<boolean> {
  try {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // 非 secure context、權限被拒、或使用者手勢已過期 —— 走下面的退路。
  }

  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.setAttribute("aria-hidden", "true");
    // 放在視窗內但看不見：移到畫面外的元素在 iOS 上會讓頁面捲動。
    textarea.style.position = "fixed";
    textarea.style.top = "0";
    textarea.style.left = "0";
    textarea.style.opacity = "0";
    textarea.style.pointerEvents = "none";
    document.body.appendChild(textarea);
    textarea.select();
    textarea.setSelectionRange(0, text.length);
    const ok = document.execCommand("copy");
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}
