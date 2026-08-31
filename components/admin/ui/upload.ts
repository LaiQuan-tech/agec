"use client";

/**
 * Client half of the admin upload endpoint. See
 * app/(admin)/admin/api/upload/route.ts for what it enforces.
 */

/** Which store a file goes to. Mirrors BUCKETS in the route handler. */
export type UploadBucket = "posters" | "photos" | "blog" | "attachments";

export type UploadedFile = {
  url: string;
  /** The original filename, echoed back — the label a reader sees. */
  name: string;
  size: number;
  mime: string;
};

/**
 * Uploads one file and resolves to its public URL.
 *
 * Rejects with the server's own message, which is written for the office rather
 * than for a log: "不支援的檔案格式 .key。可用：pdf、doc…" tells them what to do
 * next, where "400 Bad Request" would not. Callers show `error.message`
 * verbatim.
 */
export async function uploadFile(file: File, bucket: UploadBucket): Promise<UploadedFile> {
  const body = new FormData();
  body.set("file", file);
  body.set("bucket", bucket);

  const response = await fetch("/admin/api/upload", { method: "POST", body });

  if (!response.ok) {
    // A crashed route or a proxy in between answers with HTML, not JSON, and
    // response.json() would then throw something unreadable over the real
    // failure.
    const message = await response
      .json()
      .then((data: { error?: string }) => data.error)
      .catch(() => null);
    throw new Error(message ?? `上傳失敗（${response.status}）。`);
  }

  return (await response.json()) as UploadedFile;
}

/** Human-readable size for the file list. */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}
