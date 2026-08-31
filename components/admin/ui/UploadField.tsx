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
 */
export function UploadField({
  id,
  name,
  bucket,
  defaultValue,
  placeholder,
  invalid,
  accept = "image/*",
}: {
  id: string;
  name: string;
  bucket: UploadBucket;
  defaultValue?: string;
  placeholder?: string;
  invalid?: boolean;
  accept?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
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
          onChange={(e) => setPreview(e.currentTarget.value)}
        />
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

      {preview && (
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
