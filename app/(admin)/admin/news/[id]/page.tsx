import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminOrRedirect } from "@/lib/admin/auth";
import { localizePath } from "@/lib/i18n";
import type { NewsAttachment } from "@/lib/data";
import { NewsForm } from "../NewsForm";
import { updateNews } from "../actions";

export const metadata: Metadata = { title: "編輯消息" };
export const dynamic = "force-dynamic";

type Row = {
  id: number;
  published_at: string;
  category: string;
  category_en: string | null;
  title: string;
  title_en: string | null;
  body: string | null;
  body_en: string | null;
  content_html: string | null;
  content_json: unknown;
  content_html_en: string | null;
  content_json_en: unknown;
  cover_url: string | null;
  is_pinned: boolean;
  status: string;
  attachments: NewsAttachment[] | null;
  speaker: string | null;
  speaker_en: string | null;
  venue: string | null;
  venue_en: string | null;
  event_at: string | null;
};

/**
 * A `timestamptz` from Postgres into the wall-clock string
 * `<input type="datetime-local">` requires — Taipei time, no offset, no
 * seconds.
 *
 * The round trip's other half is datetimeLocal() in lib/admin/validate.ts,
 * which stamps +08:00 back on. Doing this with toISOString() instead would
 * shift the displayed time to UTC and quietly move every talk eight hours
 * earlier each time the form was saved.
 */
function toDatetimeLocal(value: string | null): string {
  if (!value) return "";
  const at = new Date(value);
  if (Number.isNaN(at.getTime())) return "";
  const taipei = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(at);
  // sv-SE formats as "2026-06-08 14:30"; the input wants a T.
  return taipei.replace(" ", "T");
}

export default async function EditNewsPage({
  params,
  searchParams,
}: {
  // Next 16: both are promises.
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string }>;
}) {
  const { supabase } = await requireAdminOrRedirect();
  const { id } = await params;
  const { created } = await searchParams;

  const numericId = Number(id);
  if (!Number.isInteger(numericId)) notFound();

  const { data, error } = await supabase
    .from("news")
    .select(
      "id, published_at, category, category_en, title, title_en, " +
        "body, body_en, content_html, content_json, content_html_en, content_json_en, " +
        "cover_url, is_pinned, status, attachments, speaker, speaker_en, " +
        "venue, venue_en, event_at"
    )
    .eq("id", numericId)
    .maybeSingle<Row>();

  if (error) console.error("[admin/news] load failed:", error.message);
  if (!data) notFound();

  // Two links, and both point at this one announcement rather than at /news:
  // the list used to be the only thing there was to look at, and now each row
  // has a page of its own. /en is the half nobody on staff would otherwise
  // open — which is exactly the half where a missing translation shows.
  //
  // Unconditional, unlike the blog's pair: `news` has no `status` column and no
  // future-dated publishing, so there is no draft state that would make
  // /news/[id] 404 and nothing for an isPostLive()-style guard to test. The id
  // is a bigint from the database and needs no escaping.
  const publicPath = `/news/${data.id}`;

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-[22px] font-bold" style={{ color: "var(--brand-green)" }}>
          編輯消息
        </h1>
        <span className="flex flex-wrap items-baseline gap-3">
          {/* A draft 404s on the public site, so offering the link would send
              the office to an error page and leave them wondering what they
              broke. Same rule the blog's editor follows with isPostLive(). */}
          {data.status === "published" ? (
            <>
              <Link
                href={publicPath}
                target="_blank"
                className="text-[13px] underline underline-offset-2"
                style={{ color: "var(--muted)" }}
              >
                在前台查看 ↗︎
              </Link>
              <Link
                href={localizePath(publicPath, "en")}
                target="_blank"
                className="text-[13px] underline underline-offset-2"
                style={{ color: "var(--muted)" }}
              >
                英文版 ↗︎
              </Link>
            </>
          ) : (
            <span className="text-[13px]" style={{ color: "var(--muted)" }}>
              草稿：前台看不到，改成「已發佈」才會出現
            </span>
          )}
        </span>
      </header>

      {created === "1" && (
        <p className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-[13px] text-green-800">
          已新增，前台已同步更新。
        </p>
      )}

      <NewsForm
        action={updateNews}
        submitLabel="儲存變更"
        initial={{
          id: data.id,
          published_at: data.published_at.slice(0, 10),
          category: data.category,
          category_en: data.category_en ?? "",
          title: data.title,
          title_en: data.title_en ?? "",
          body: data.body ?? "",
          body_en: data.body_en ?? "",
          content_html: data.content_html ?? "",
          content_json: data.content_json ?? null,
          content_html_en: data.content_html_en ?? "",
          content_json_en: data.content_json_en ?? null,
          cover_url: data.cover_url ?? "",
          is_pinned: data.is_pinned,
          status: data.status,
          attachments: data.attachments ?? [],
          speaker: data.speaker ?? "",
          speaker_en: data.speaker_en ?? "",
          venue: data.venue ?? "",
          venue_en: data.venue_en ?? "",
          event_at: toDatetimeLocal(data.event_at),
        }}
      />
    </div>
  );
}
