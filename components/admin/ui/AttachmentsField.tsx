"use client";

import { useId, useRef, useState } from "react";
import type { NewsAttachment } from "@/lib/data";
import { Button } from "./Button";
import { writeField } from "./native-value";
import { formatBytes, uploadFile } from "./upload";

/**
 * The downloadable files attached to a news item.
 *
 * Posts the whole list as JSON in one hidden field rather than as indexed form
 * inputs (`attachments[0][url]`…): the column is `jsonb`, the action stores it
 * whole, and indexed names would mean re-deriving the array from flat FormData
 * keys on the server — a parser to write and a parser to get wrong, for a value
 * that is already an array on this side.
 *
 * ## 一次多筆
 *
 * `<input multiple>` 與底下的迴圈從一開始就在 —— 可以在選檔視窗裡 ⌘／Ctrl
 * 點選多個檔案。但 2026-09 客戶回報「建議允許一次上傳多筆」，也就是說**畫面
 * 上看不出來可以**：按鈕寫「加入附件」，說明只寫格式與大小，點一次選一個檔，
 * 看起來就是一次一個。
 *
 * 所以這一版沒有新增能力，是把既有的能力講出來、並讓它用起來像那麼回事：
 *   - 說明改成明講可以一次選多個，也可以直接把檔案拖進來
 *   - 整塊變成拖放區（dragover 時有視覺回饋）
 *   - 上傳中顯示進度（3/5）與正在傳的檔名 —— 五個檔的等待不再是一團「上傳中…」
 *
 * Removal takes the row out of this list only. The object stays in storage,
 * deliberately: the same file may be referenced by another news item or linked
 * from a page nobody thought to check, and a delete here would break those
 * silently. Storage is cheap; a dead download link on a public announcement is
 * not.
 */
export function AttachmentsField({
  name,
  defaultValue,
}: {
  name: string;
  defaultValue: NewsAttachment[];
}) {
  const [files, setFiles] = useState<NewsAttachment[]>(defaultValue);
  /** null = 沒有在上傳。有值時是「第幾個／共幾個」與正在傳的檔名。 */
  const [progress, setProgress] = useState<
    { done: number; total: number; name: string } | null
  >(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const busy = progress !== null;
  const hiddenRef = useRef<HTMLInputElement>(null);
  const pickerRef = useRef<HTMLInputElement>(null);
  const errorId = useId();

  function commit(next: NewsAttachment[]) {
    setFiles(next);
    writeField(hiddenRef.current, JSON.stringify(next));
  }

  async function handlePick(picked: FileList | File[]) {
    const list = Array.from(picked);
    if (list.length === 0) return;

    setError(null);
    const added: NewsAttachment[] = [];
    const failed: string[] = [];

    // Sequential, not Promise.all: the office picks a handful of files at once
    // and one 50MB PDF alongside four small ones is enough for parallel uploads
    // to start timing out on a slow connection. Order is also the order they
    // appear in, which matters — these lists are usually 要點, then 申請書.
    for (const [i, file] of list.entries()) {
      // 先更新進度再送出，畫面上顯示的才是「正在傳的那一個」而不是上一個。
      setProgress({ done: i, total: list.length, name: file.name });
      try {
        const uploaded = await uploadFile(file, "attachments");
        added.push(uploaded);
      } catch (cause) {
        failed.push(`${file.name}：${cause instanceof Error ? cause.message : "上傳失敗"}`);
      }
    }

    // Whatever succeeded is kept even when something else failed — making the
    // office re-upload four good files because the fifth was a .pages is worse
    // than a partial result plus an explicit message.
    if (added.length) commit([...files, ...added]);
    if (failed.length) setError(failed.join("；"));

    setProgress(null);
    if (pickerRef.current) pickerRef.current.value = "";
  }

  return (
    <div className="flex flex-col gap-2">
      <input ref={hiddenRef} type="text" name={name} defaultValue={JSON.stringify(defaultValue)} hidden readOnly />

      {files.length > 0 && (
        <ul className="flex flex-col gap-1">
          {files.map((file, i) => (
            <li
              key={file.url}
              className="flex items-center gap-2 rounded-md border px-3 py-2 text-[13px]"
              style={{ borderColor: "var(--hairline)" }}
            >
              <a
                href={file.url}
                target="_blank"
                rel="noopener noreferrer"
                className="min-w-0 flex-1 truncate underline"
                style={{ color: "var(--ink)" }}
              >
                {file.name}
              </a>
              <span className="shrink-0 tabular-nums" style={{ color: "var(--ink-soft)" }}>
                {formatBytes(file.size)}
              </span>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                aria-label={`移除 ${file.name}`}
                onClick={() => commit(files.filter((_, at) => at !== i))}
              >
                移除
              </Button>
            </li>
          ))}
        </ul>
      )}

      {/*
        拖放區。整塊都可以放，不只按鈕 —— 一次要加五個檔時，從 Finder 拖過來
        比開選檔視窗再 ⌘ 點選五次快得多。

        ⚠️ onDragOver 一定要 preventDefault()，否則瀏覽器的預設行為是「開啟
        這個檔案」，使用者放手後會離開整個後台頁面，未存的內容一起消失。
        dragleave 用 currentTarget 判斷，避免滑過子元素時閃爍。
      */}
      <div
        className="flex flex-wrap items-center gap-2 rounded-md border border-dashed px-3 py-3 transition-colors"
        style={{
          borderColor: dragging ? "var(--brand-green)" : "var(--hairline)",
          background: dragging ? "rgba(6, 71, 46, 0.04)" : "transparent",
        }}
        onDragOver={(e) => {
          e.preventDefault();
          if (!busy) setDragging(true);
        }}
        onDragLeave={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDragging(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (busy) return;
          const dropped = e.dataTransfer.files;
          if (dropped?.length) void handlePick(dropped);
        }}
      >
        <input
          ref={pickerRef}
          type="file"
          multiple
          hidden
          onChange={(e) => {
            const picked = e.currentTarget.files;
            if (picked?.length) void handlePick(picked);
          }}
        />
        <Button type="button" size="sm" disabled={busy} onClick={() => pickerRef.current?.click()}>
          {busy ? `上傳中… ${progress.done + 1}/${progress.total}` : "加入附件"}
        </Button>
        <span className="text-[13px]" style={{ color: "var(--ink-soft)" }}>
          {busy ? (
            // 正在傳哪一個檔。五個檔的等待不再是一團看不出進展的「上傳中…」。
            <span className="truncate">{progress.name}</span>
          ) : (
            <>可一次選多個檔案，或直接把檔案拖進這一塊。PDF、Word、Excel、簡報、壓縮檔或圖片，單檔 50MB 以內</>
          )}
        </span>
      </div>

      {error && (
        <p id={errorId} role="alert" className="text-[13px] text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
