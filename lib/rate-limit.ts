import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { headers } from "next/headers";

/**
 * 公開寫入端點的節流：同一個來源 IP，十分鐘內最多 N 次。
 *
 * 目前只有一個呼叫端 —— app/(site)/alumni/events/actions.ts 的報名。那一支
 * 是站上唯一不在 /admin 後面的寫入，原本的防線只有 honeypot ＋ 同信箱唯一
 * 索引（migration 檔尾的「已知缺口 4」）：有心人換一個信箱就能再灌一筆，
 * 把名額灌滿、把個資表灌大、拿別人的信箱觸發確認信。這裡把「換信箱」這條
 * 路的成本拉高：一條連線十分鐘只給 N 筆。
 *
 * ## 存 hash 不存 IP
 *
 * 記憶體裡放的是 sha256(salt ‖ ip) 的前 32 個字元，salt 在行程啟動時隨機
 * 產生。IP 是個資，這裡沒有任何理由留原值 —— 需要的只是「同一個來源」的
 * 判斷，hash 就夠。
 *
 * ## 只在行程記憶體裡
 *
 * 刻意不開表、不改 RPC：那需要一支 migration，而 migration 必須在推程式碼
 * 之前跑（見 supabase/README.md 一路以來的 🔴），這一輪做不到。代價是
 * Vercel 上每一個函式實例各算各的、冷啟動就歸零，所以這是「拉高成本」，
 * 不是「保證」。要做成保證的路徑 migration 檔尾寫了（ip_hash 一欄 ＋ 在
 * 函式裡數），到時候把 takeSlot() 換成一次 select count 就好，呼叫端不動。
 *
 * ## 上限怎麼訂
 *
 * 12 筆／10 分鐘。一個人替家人報名是一筆（攜伴走 guests 欄）；系辦同一間
 * 辦公室（同一個 NAT 出口）替系友代填、或行動網路 CGNAT 共用 IP 的報名者，
 * 訂 5 會誤擋到正常人 —— 超過就分批，錯誤訊息（errorTooMany）有寫。只數
 * 通過欄位驗證、真的要進資料庫的那些送出，填錯格式重送不算。
 */
const WINDOW_MS = 10 * 60 * 1000;
const MAX_HITS = 12;
/** 超過這個數量時順手清一次過期的桶，免得 Map 只增不減。 */
const SWEEP_AT = 1000;

const SALT = randomBytes(16);

/** ip hash → 這個窗口內每次命中的時間戳（ms）。 */
const buckets = new Map<string, number[]>();

/**
 * 目前請求的來源 IP 的 hash。
 *
 * Vercel 的 proxy 會覆寫 x-forwarded-for（客戶端塞的假值不會留下），第一
 * 段就是真正的來源。本機 dev 沒有這個標頭 —— 退回 "unknown"，所有本機請求
 * 共用一個桶，測試時剛好可以直接看到節流生效。
 */
export async function clientIpHash(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = forwarded || h.get("x-real-ip") || "unknown";
  return createHash("sha256").update(SALT).update(ip).digest("hex").slice(0, 32);
}

/**
 * 嘗試佔用一次配額。回 false 表示這個來源在窗口內已經用完，呼叫端應該
 * 直接拒絕、不要碰資料庫。
 */
export function takeSlot(ipHash: string, now = Date.now()): boolean {
  const since = now - WINDOW_MS;
  const hits = (buckets.get(ipHash) ?? []).filter((t) => t > since);
  if (hits.length >= MAX_HITS) {
    buckets.set(ipHash, hits);
    return false;
  }
  hits.push(now);
  buckets.set(ipHash, hits);

  if (buckets.size > SWEEP_AT) {
    for (const [key, times] of buckets) {
      if (!times.some((t) => t > since)) buckets.delete(key);
    }
  }
  return true;
}
