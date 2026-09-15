"use client";

import { useId, useRef, useState } from "react";
import { Button } from "./Button";
import { Input } from "./Input";
import { writeField } from "./native-value";
import { uploadFile, type UploadBucket } from "./upload";

/**
 * 上傳欄位。兩種模式，由 `accept` 決定：
 *
 *   圖片（`accept` 以 `image/` 開頭，預設值）—— **只有上傳，沒有網址輸入框。**
 *   畫面是縮圖（有值時）＋「上傳圖片」／「更換圖片」＋「移除」；值放在
 *   hidden input 裡。系辦 2026-09-16 的指示：「後台所有的圖片功能，都要是直接
 *   上傳，不要再貼網址」—— 之前系友活動的封面圖是純文字框，提示還叫人先去
 *   最新消息上傳再把網址複製過來。
 *
 *   檔案（documents 的 PDF/DOCX，`accept` 是副檔名清單）—— 網址輸入框＋
 *   「上傳」，維持原樣：教務處那類放在別處的 PDF 貼網址是正當用法。
 *
 * 既有資料不會被弄丟：news.cover_url、faculty.photo_url、events.cover_url 裡
 * 有些是系辦以前貼的外站網址，圖片模式下它們照樣在 hidden input 裡原樣送回，
 * 縮圖也照常顯示；要換就按「更換圖片」上傳一張蓋過去。
 *
 * The value is posted by an input carrying `name`, so the surrounding form
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
  const imageMode = accept.startsWith("image/");
  const inputRef = useRef<HTMLInputElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState(defaultValue ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const errorId = useId();

  function clear() {
    writeField(inputRef.current, "");
    writeField(nameRef.current, "");
    setPreview("");
    setError(null);
  }

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

  // 兩種模式共用的隱藏檔案選擇器與原始檔名欄位。
  const picker = (
    <>
      {nameField && (
        <input ref={nameRef} type="hidden" name={nameField} defaultValue={defaultFileName ?? ""} />
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
    </>
  );

  const errorLine = error && (
    <p id={errorId} role="alert" className="text-[13px] text-red-700">
      {error}
    </p>
  );

  if (imageMode) {
    return (
      <div className="flex flex-col gap-2">
        {/* 值只在這裡：沒有可見的網址框。`id` 給按鈕而不是 hidden input，
            <Field> 的 <label for> 才有東西可以指 —— 點欄位標題就開檔案選擇。 */}
        <input ref={inputRef} type="hidden" name={name} defaultValue={defaultValue} />
        {picker}
        {preview && (
          // eslint-disable-next-line @next/next/no-img-element -- 系辦以前貼的
          // 外站網址也要顯示；next/image 得先把每個網域列進 remotePatterns。
          <img
            src={preview}
            alt=""
            className="h-32 w-auto rounded border object-contain"
            style={{ borderColor: "var(--hairline)" }}
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        )}
        <div className="flex gap-2">
          <Button
            id={id}
            type="button"
            size="sm"
            disabled={busy}
            aria-invalid={invalid || undefined}
            aria-describedby={error ? errorId : undefined}
            onClick={() => fileRef.current?.click()}
          >
            {busy ? "上傳中…" : preview ? "更換圖片" : "上傳圖片"}
          </Button>
          {preview && !busy && (
            <Button type="button" size="sm" variant="ghost" onClick={clear}>
              移除
            </Button>
          )}
        </div>
        {errorLine}
      </div>
    );
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
        {picker}
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

      {errorLine}

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
