import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/auth";
import { NotAdminError, NotAuthenticatedError } from "@/lib/admin/errors";

/**
 * File upload for the admin editors.
 *
 * Until this existed, four storage buckets sat configured and empty while the
 * office was told, in the hint text under two different forms, to "upload the
 * image somewhere else and paste the URL" — which in practice meant signing in
 * to the Supabase dashboard. Every image on the site got there that way.
 *
 * It lives under /admin rather than /api so the proxy matcher (`/admin/:path*`)
 * covers it and refreshes the session cookie on the way in, exactly as it does
 * for the pages that call it.
 *
 * Three checks, deliberately layered, because the first two are ours and the
 * third is not:
 *
 *   1. requireAdmin() — the same boundary every admin page and Server Action
 *      uses. A route handler is reachable by anyone who can POST to the path,
 *      so this is not optional here.
 *   2. the extension allowlist below, per bucket.
 *   3. the bucket's own `allowed_mime_types` and `file_size_limit`, enforced by
 *      Supabase Storage, plus the `is_admin()` RLS policy on storage.objects.
 *      This is the one that cannot be bypassed by a bug in the two above, which
 *      is why the upload uses the caller's own session client rather than the
 *      service role — dropping to service-role here would switch that check off.
 *
 * The client's `file.type` is never trusted. Content-Type is derived from the
 * extension we allowed, so a .exe renamed to .pdf is rejected at step 2, and if
 * it somehow were not, Storage would reject the mismatch at step 3.
 *
 * ## 🔴 為什麼檔案不經過這個路由
 *
 * 這一支**只發放上傳許可，不接收檔案**。瀏覽器拿到簽章網址之後直接 PUT 到
 * Supabase Storage。
 *
 * 原因是 Vercel 的 serverless function 請求主體上限是 **4.5MB**，而且那是平台
 * 層的限制 —— 函式根本不會被執行。實測（2026-09-08，正式站）：
 *
 *   100KB → 307（正常走到 proxy 的登入導向）
 *   6MB   → 413，body 是純文字 `Request Entity Too Large FUNCTION_PAYLOAD_TOO_LARGE`
 *
 * 舊版直接把檔案 POST 進來，所以 BUCKETS 裡宣告的 50MB 從來沒有成立過，而且
 * 失敗時回的不是 JSON —— upload.ts 的「非 JSON 就當作登入過期」那道防護會把它
 * 誤報成「登入狀態已過期，請重新登入」。系辦傳一份 6MB 的簡章，看到的是叫他
 * 重新登入，重登再傳還是一樣。
 *
 * 三道防線一道都沒少：
 *   1. requireAdmin() 仍在這裡，簽章網址只發給管理員
 *   2. 副檔名白名單仍在這裡，而且**物件的 key 由伺服器決定**（uuid + 我們認可
 *      的副檔名），瀏覽器無法指定要寫到哪個路徑
 *   3. 真正的位元組仍然由 Supabase Storage 依 bucket 的 allowed_mime_types 與
 *      file_size_limit 把關，且 createSignedUploadUrl 走的是**呼叫者自己的
 *      session client**，所以 storage.objects 的 is_admin() RLS 一樣要過
 *
 * 唯一的差別是 size：以前伺服器拿得到位元組所以 file.size 可信，現在是瀏覽器
 * 宣告的。這裡照樣擋（早點給出好訊息），但真正不可繞過的那道是 bucket 的
 * file_size_limit —— 兩者的數字刻意相同，所以謊報大小換不到任何東西。
 */

/** Uploads are per-request and must never be cached or statically evaluated. */
export const dynamic = "force-dynamic";

/**
 * ⚠️ These two maps and the bucket `allowed_mime_types` in
 * supabase/migrations/*_bucket_mimes_from_real_data.sql are one contract in two
 * halves. Adding an extension here without adding its mime there produces an
 * upload that passes every check we wrote and is then refused by Storage with a
 * message the office cannot act on.
 */
const IMAGE_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  avif: "image/avif",
  gif: "image/gif",
};

/**
 * Attachment types.
 *
 * Not guessed: this is what the 66 files attached to the 428 imported
 * announcements actually turned out to be once their bytes were sniffed — pdf,
 * docx, doc, one 7z, one .ods spreadsheet, one file named .doc that is really
 * RTF, and three JPEGs — plus the obvious siblings of each.
 *
 * Anything not listed is refused. This bucket is public and served back
 * verbatim, so "allow whatever, it is only staff who can upload" would make it
 * a place to host an executable behind a university domain.
 */
const FILE_TYPES: Record<string, string> = {
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ppt: "application/vnd.ms-powerpoint",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  odt: "application/vnd.oasis.opendocument.text",
  ods: "application/vnd.oasis.opendocument.spreadsheet",
  rtf: "application/rtf",
  zip: "application/zip",
  "7z": "application/x-7z-compressed",
  rar: "application/vnd.rar",
  txt: "text/plain",
  ...IMAGE_TYPES,
};

/**
 * Which buckets this endpoint will write to, and what each accepts.
 *
 * A closed map rather than a passthrough parameter: `bucket` arrives from the
 * browser, and an open one would let a caller aim an upload at any bucket the
 * signed-in admin can write to.
 */
const BUCKETS = {
  posters: { types: IMAGE_TYPES, limit: 10 * 1024 * 1024 },
  photos: { types: IMAGE_TYPES, limit: 10 * 1024 * 1024 },
  attachments: { types: FILE_TYPES, limit: 50 * 1024 * 1024 },
} as const;

type BucketName = keyof typeof BUCKETS;

function isBucket(value: string): value is BucketName {
  return Object.hasOwn(BUCKETS, value);
}

function extensionOf(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot === -1 ? "" : name.slice(dot + 1).toLowerCase();
}

/**
 * The stored object key.
 *
 * Not the original filename: half the imported attachments are named in Chinese
 * and two of them share a name. A uuid is unique without a round-trip, and the
 * readable name is kept in the row that references the file
 * (`news.attachments[].name`) where it can be shown to a reader.
 */
function objectKey(ext: string): string {
  const now = new Date();
  const month = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
  return `${month}/${crypto.randomUUID()}${ext ? `.${ext}` : ""}`;
}

function fail(status: number, message: string) {
  return NextResponse.json({ error: message }, { status });
}

/** 瀏覽器送來的中繼資料。檔案本身不經過這裡。 */
type SignRequest = { bucket?: unknown; name?: unknown; size?: unknown };

export async function POST(request: Request) {
  let supabase;
  try {
    ({ supabase } = await requireAdmin());
  } catch (error) {
    // Same two errors the Server Actions surface, mapped to status codes. The
    // difference matters to the caller: 401 means "log in again", 403 means
    // "this account will never be allowed" and retrying is pointless.
    if (error instanceof NotAuthenticatedError) return fail(401, "請重新登入。");
    if (error instanceof NotAdminError) return fail(403, "這個帳號沒有編輯權限。");
    throw error;
  }

  let body: SignRequest;
  try {
    body = (await request.json()) as SignRequest;
  } catch {
    return fail(400, "請求格式不正確。");
  }

  const bucket = String(body.bucket ?? "");
  const name = String(body.name ?? "");
  const size = Number(body.size);

  if (!isBucket(bucket)) return fail(400, "未知的儲存位置。");
  if (!name) return fail(400, "沒有收到檔名。");
  if (!Number.isFinite(size) || size <= 0) return fail(400, "沒有收到檔案大小。");

  const { types, limit } = BUCKETS[bucket];
  const ext = extensionOf(name);
  const contentType = types[ext];

  if (!contentType) {
    const allowed = Object.keys(types).join("、");
    return fail(415, `不支援的檔案格式 .${ext || "（無副檔名）"}。可用：${allowed}`);
  }
  if (size > limit) {
    return fail(413, `檔案 ${(size / 1048576).toFixed(1)}MB，超過上限 ${limit / 1048576}MB。`);
  }

  // ⚠️ key 一定要在這裡產生，不能讓瀏覽器指定。簽章網址是綁定單一路徑的，
  //    路徑由客戶端決定就等於讓它挑要覆寫哪個物件。
  const key = objectKey(ext);

  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUploadUrl(key);

  if (error || !data) {
    console.error(`[admin/upload] sign ${bucket}/${key} failed:`, error?.message);
    return fail(502, "無法取得上傳許可，請再試一次。");
  }

  const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(key);

  return NextResponse.json({
    /** 瀏覽器要 PUT 過去的絕對網址，token 已含在裡面。單一路徑、會過期。 */
    signedUrl: data.signedUrl,
    /** 上傳成功之後這個檔案的公開網址。 */
    url: publicData.publicUrl,
    /** 由副檔名推導，不是瀏覽器宣告的 —— PUT 的時候要原樣帶上。 */
    mime: contentType,
  });
}
