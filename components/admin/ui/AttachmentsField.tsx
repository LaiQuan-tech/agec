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
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hiddenRef = useRef<HTMLInputElement>(null);
  const pickerRef = useRef<HTMLInputElement>(null);
  const errorId = useId();

  function commit(next: NewsAttachment[]) {
    setFiles(next);
    writeField(hiddenRef.current, JSON.stringify(next));
  }

  async function handlePick(picked: FileList) {
    setBusy(true);
    setError(null);
    const added: NewsAttachment[] = [];
    const failed: string[] = [];

    // Sequential, not Promise.all: the office picks a handful of files at once
    // and one 50MB PDF alongside four small ones is enough for parallel uploads
    // to start timing out on a slow connection. Order is also the order they
    // appear in, which matters — these lists are usually 要點, then 申請書.
    for (const file of Array.from(picked)) {
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

    setBusy(false);
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

      <div className="flex items-center gap-2">
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
          {busy ? "上傳中…" : "加入附件"}
        </Button>
        <span className="text-[13px]" style={{ color: "var(--ink-soft)" }}>
          PDF、Word、Excel、簡報、壓縮檔或圖片，單檔 50MB 以內
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
