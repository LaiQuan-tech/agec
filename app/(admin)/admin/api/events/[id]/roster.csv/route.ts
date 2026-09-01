import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/auth";
import { NotAdminError, NotAuthenticatedError } from "@/lib/admin/errors";
import { CONFIRMED, loadRegistrations } from "@/lib/admin/events";
import { gradYearLabel } from "@/lib/alumni-events";

/**
 * 報名名單的 CSV 匯出（現場簽到表）。
 *
 * 放在 /admin 底下而不是 /api：proxy 的 matcher 是 `/admin/:path*`，所以走這裡
 * 才會順帶更新 session cookie，與它旁邊的上傳路由同樣的理由。
 *
 * ⚠️ 一個 route handler 是任何人都能 GET 的路徑，render-time 的授權在這裡完全
 * 不存在，所以 requireAdmin() 不是可選的。
 */
export const dynamic = "force-dynamic";

/**
 * 🔴 CSV injection 防護。
 *
 * 這份名單的每一格都是**公開表單填進來的**。Excel、Numbers 與 Google Sheets
 * 會把以 `=` `+` `-` `@` 開頭的儲存格當成公式執行，所以有人可以把姓名填成
 * `=HYPERLINK("http://evil","按我")`，或是更糟的 `=cmd|'/c calc'!A1`，等系辦
 * 打開簽到表時觸發。
 *
 * 防法是在前面加一個單引號（試算表會把它當成「這是文字」的前綴而不顯示）。
 * 不是把字元刪掉：那會讓一個名字叫「-」開頭的人資料被改掉。
 *
 * 這一步必須在跳脫引號**之前**做，順序反了的話前綴會被包進引號裡失去作用。
 */
const FORMULA_LEAD = /^[=+\-@\t\r]/;

function cell(value: string | number | null | undefined): string {
  if (value == null) return "";
  let text = String(value);
  if (FORMULA_LEAD.test(text)) text = `'${text}`;
  // RFC 4180：欄位含逗號、引號或換行時整格用引號包起來，內部的引號變兩個。
  if (/[",\n\r]/.test(text)) text = `"${text.replace(/"/g, '""')}"`;
  return text;
}

const HEADERS = [
  "報名時間",
  "報名代碼",
  "姓名",
  "電子信箱",
  "電話",
  "學制",
  "畢業年",
  "本人+攜伴",
  "攜伴人數",
  "飲食需求",
  "備註",
  "狀態",
];

function taipei(iso: string): string {
  return new Intl.DateTimeFormat("zh-TW", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date(iso));
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { supabase } = await requireAdmin();
    const { id } = await params;
    const n = /^\d+$/.test(id) ? Number(id) : NaN;
    if (!Number.isSafeInteger(n)) {
      return NextResponse.json({ error: "活動編號不正確" }, { status: 400 });
    }

    const { data: event } = await supabase
      .from("alumni_events")
      .select("id, slug, title")
      .eq("id", n)
      .maybeSingle<{ id: number; slug: string; title: string }>();
    if (!event) {
      return NextResponse.json({ error: "找不到這場活動" }, { status: 404 });
    }

    const { rows, error } = await loadRegistrations(supabase, n);
    if (error) {
      return NextResponse.json({ error }, { status: 500 });
    }

    const lines = [
      HEADERS.join(","),
      ...rows.map((r) =>
        [
          cell(taipei(r.createdAt)),
          cell(r.code),
          cell(r.name),
          cell(r.email),
          cell(r.phone),
          cell(r.program),
          cell(r.gradYear == null ? "" : gradYearLabel(r.gradYear, "zh")),
          cell(1 + r.guests),
          cell(r.guests),
          cell(r.dietary),
          cell(r.note),
          cell(r.status === CONFIRMED ? "有效" : "已取消"),
        ].join(",")
      ),
    ];

    /*
     * BOM（﻿）不是可有可無的。
     *
     * Excel for Windows 讀 CSV 時預設用系統的 ANSI 編碼（繁中是 CP950），
     * 沒有 BOM 的 UTF-8 中文會整份變成亂碼 —— 而簽到表整份亂碼就是不能用。
     * CRLF 同理：Excel 對只有 LF 的檔案在某些版本會把整份塞進一列。
     */
    const csv = "﻿" + lines.join("\r\n") + "\r\n";

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        // filename* 用 RFC 5987 的形式帶中文；filename 留一個純 ASCII 的備援，
        // 因為舊瀏覽器看不懂 filename* 時會拿它來用。
        "Content-Disposition":
          `attachment; filename="registrations-${event.slug}.csv"; ` +
          `filename*=UTF-8''${encodeURIComponent(`${event.title} 報名名單.csv`)}`,
        // 這是個資，不該被任何一層快取留下來。
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (error) {
    if (error instanceof NotAuthenticatedError) {
      return NextResponse.json({ error: "請先登入" }, { status: 401 });
    }
    if (error instanceof NotAdminError) {
      return NextResponse.json({ error: "沒有權限" }, { status: 403 });
    }
    throw error;
  }
}
