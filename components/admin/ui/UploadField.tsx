"use client";

import { useId, useRef, useState } from "react";
import { Button } from "./Button";
import { Input } from "./Input";
import { writeField } from "./native-value";
import { uploadFile, type UploadBucket } from "./upload";

/**
 * A URL text field with an upload button beside it.
 *
 * The text field stays, and stays editable. Every existing cover image on the
 * site is a URL somebody pasted, some of them pointing outside Supabase
 * entirely; replacing the input with a file picker would strand those rows and
 * remove the only way to reuse an image already uploaded for something else.
 * Uploading just fills the box in.
 *
 * The value is posted by the text input's own `name`, so the surrounding form
 * needs no knowledge of this component. It is written through writeField() —
 * assigning `.value` directly would leave FormShell's unsaved-changes guard
 * thinking nothing had been touched.
 *
 * 兩個選用的延伸，都是 /admin/forms（系上表單）加的，預設行為不變：
 *
 *   `nameField`   除了網址，再把上傳時的原始檔名寫進一個同名的 hidden input。
 *                 Storage 的 key 是 uuid（見 api/upload/route.ts），原始檔名
 *                 只有這一刻拿得到 —— 沒存下來就永遠沒有了。手動改網址時會
 *                 一併清掉：那個檔名已經不屬於新的網址。
 *   `preview`     縮圖。附件是 PDF/DOCX，<img> 一定載不起來，關掉比留一個
 *                 靠 onError 自己藏起來的空元素誠實。
 */
export function UploadField({
  id,
  name,
  bucket,
  defaultValue,
  placeholder,
  invalid,
  accept = "image/*",
  nameField,
  defaultFileName,
  preview: showPreview = true,
}: {
  id: string;
  name: string;
  bucket: UploadBucket;
  defaultValue?: string;
  placeholder?: string;
  invalid?: boolean;
  accept?: string;
  /** `name` of a hidden input that receives the uploaded file's original name. */
  nameField?: string;
  /** Seed for that hidden input when editing an existing row. */
  defaultFileName?: string;
  /** Render the thumbnail. Off for non-image buckets. */
  preview?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState(defaultValue ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const errorId = useId();

  async function handlePick(file: File) {
    setBusy(true);
    setError(null);
    try {
      const uploaded = await uploadFile(file, bucket);
      writeField(inputRef.current, uploaded.url);
      writeField(nameRef.current, uploaded.name);
      setPreview(uploaded.url);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "上傳失敗。");
    } finally {
      setBusy(false);
      // Clear the picker so choosing the same file twice in a row still fires
      // onChange — after a failed upload that is exactly what someone will do.
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <Input
          ref={inputRef}
          id={id}
          name={name}
          type="url"
          defaultValue={defaultValue}
          placeholder={placeholder}
          aria-invalid={invalid || undefined}
          aria-describedby={error ? errorId : undefined}
          onChange={(e) => {
            setPreview(e.currentTarget.value);
            // 手動改網址 → 舊檔名不再屬於它。留著會讓前台的副檔名徽章繼續印
            // 上一個檔案的格式。
            writeField(nameRef.current, "");
          }}
        />
        {nameField && (
          <input
            ref={nameRef}
            type="hidden"
            name={nameField}
            defaultValue={defaultFileName ?? ""}
          />
        )}
        {/* The real control is the hidden file input; the button is what gets
            styled and labelled. A bare <input type="file"> cannot be restyled
            consistently across browsers. */}
        <input
          ref={fileRef}
          type="file"
          accept={accept}
          hidden
          onChange={(e) => {
            const file = e.currentTarget.files?.[0];
            if (file) void handlePick(file);
          }}
        />
        <Button
          type="button"
          size="sm"
          className="shrink-0"
          disabled={busy}
          onClick={() => fileRef.current?.click()}
        >
          {busy ? "上傳中…" : "上傳"}
        </Button>
      </div>

      {error && (
        <p id={errorId} role="alert" className="text-[13px] text-red-700">
          {error}
        </p>
      )}

      {showPreview && preview && (
        // eslint-disable-next-line @next/next/no-img-element -- an arbitrary
        // remote URL the user just typed; next/image would need it configured
        // as a remote pattern first, and this is a 96px admin thumbnail.
        <img
          src={preview}
          alt=""
          className="h-24 w-auto rounded border object-contain"
          style={{ borderColor: "var(--hairline)" }}
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
      )}
    </div>
  );
}
