"use client";

/**
 * Client half of the admin upload endpoint. See
 * app/(admin)/admin/api/upload/route.ts for what it enforces.
 */

/** Which store a file goes to. Mirrors BUCKETS in the route handler. */
export type UploadBucket = "posters" | "photos" | "attachments";

export type UploadedFile = {
  url: string;
  /** The original filename, echoed back — the label a reader sees. */
  name: string;
  size: number;
  mime: string;
};

/**
 * 上傳一個檔案，回傳它的公開網址。
 *
 * 兩步：先跟 /admin/api/upload 換一張簽章網址，再把檔案**直接 PUT 到 Supabase
 * Storage**。檔案不經過 Vercel 的函式。
 *
 * 🔴 一步式（把檔案 POST 給我們自己的路由）在 Vercel 上撐不住：serverless
 * function 的請求主體上限是 4.5MB，而且是平台層擋的，函式不會被執行。實測 6MB
 * 會拿到 413 `FUNCTION_PAYLOAD_TOO_LARGE`，body 是純文字 —— 於是下面那道
 * 「非 JSON 就當作登入過期」的判斷會把它誤報成登入失效。系辦傳一份 6MB 的簡章
 * 會被叫去重新登入，重登再傳還是一樣。詳見 route handler 的檔頭。
 *
 * 兩個 fetch 的錯誤要分開講：第一個失敗是「拿不到上傳許可」（多半是登入或格式
 * 問題，訊息由伺服器寫），第二個失敗是「檔案沒送進儲存空間」（多半是大小或
 * 格式被 bucket 擋下）。混在一起會讓系辦拿著「上傳失敗」不知道要改什麼。
 */
export async function uploadFile(file: File, bucket: UploadBucket): Promise<UploadedFile> {
  const response = await fetch("/admin/api/upload", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ bucket, name: file.name, size: file.size }),
  });

  /*
   * The proxy guards `/admin/:path*`, this route included, and answers an
   * expired session with a 307 to /login. fetch() follows that by default, so
   * what comes back is the login page: `response.ok` is true, and the JSON
   * parse below would fail on `<!DOCTYPE html>` — surfacing as a syntax error
   * where the real answer is "you were signed out".
   *
   * Someone leaves the admin open over lunch, comes back, picks a file: this is
   * that. The route's own 401 never gets a chance to run.
   *
   * ⚠️ 這一段現在只可能是真的登入過期了。以前它還會吃到 Vercel 的 413（純文字
   *    body），把「檔案太大」講成「請重新登入」—— 現在送出去的是幾十個位元組的
   *    JSON，不可能撞到主體上限。
   */
  if (response.redirected || !response.headers.get("content-type")?.includes("json")) {
    throw new Error("登入狀態已過期，請重新登入後再上傳。");
  }

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

  const { signedUrl, url, mime } = (await response.json()) as {
    signedUrl: string;
    url: string;
    mime: string;
  };

  // ⚠️ content-type 用伺服器推導出來的那一個，不是 file.type。瀏覽器對 .docx
  //    這類格式常常回空字串或猜錯，而 bucket 的 allowed_mime_types 是逐字比對的。
  const put = await fetch(signedUrl, {
    method: "PUT",
    headers: { "content-type": mime },
    body: file,
  });

  if (!put.ok) {
    // Storage 的錯誤是 JSON（{statusCode, error, message}），但網路中斷或
    // 代理攔截時不是，所以照樣要 catch。
    const detail = await put
      .json()
      .then((data: { message?: string }) => data.message)
      .catch(() => null);

    if (put.status === 413) {
      throw new Error(`檔案太大，${file.name} 沒有上傳成功。`);
    }
    if (put.status === 415) {
      throw new Error(`儲存空間不接受這個格式，${file.name} 沒有上傳成功。`);
    }
    throw new Error(detail ?? `檔案傳送失敗（${put.status}），請再試一次。`);
  }

  return { url, name: file.name, size: file.size, mime };
}

/** Human-readable size for the file list. */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}
