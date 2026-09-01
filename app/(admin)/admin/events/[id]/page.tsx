import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminOrRedirect } from "@/lib/admin/auth";
import { Button } from "@/components/admin/ui/Button";
import { DeleteButton } from "@/components/admin/ui/DeleteButton";
import { EventForm } from "../EventForm";
import { deleteEvent, updateEvent } from "../actions";
import { toDatetimeLocal, toEventStatus } from "../constants";

export const metadata: Metadata = { title: "編輯系友活動" };
export const dynamic = "force-dynamic";

type Row = {
  id: number;
  slug: string;
  title: string;
  title_en: string | null;
  summary: string | null;
  summary_en: string | null;
  body: string | null;
  body_en: string | null;
  starts_at: string;
  ends_at: string | null;
  location: string | null;
  location_en: string | null;
  address: string | null;
  capacity: number | null;
  seats_taken: number;
  registration_closes_at: string | null;
  cover_url: string | null;
  contact: string | null;
  status: string;
};

export default async function EditEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { supabase } = await requireAdminOrRedirect();
  const { id } = await params;
  const n = /^\d+$/.test(id) ? Number(id) : NaN;
  if (!Number.isSafeInteger(n)) notFound();

  const { data, error } = await supabase
    .from("alumni_events")
    .select(
      "id, slug, title, title_en, summary, summary_en, body, body_en, starts_at, " +
        "ends_at, location, location_en, address, capacity, seats_taken, " +
        "registration_closes_at, cover_url, contact, status"
    )
    .eq("id", n)
    .maybeSingle<Row>();

  if (error) console.error("[admin/events] 讀取失敗:", error.message);
  if (!data) notFound();

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-bold" style={{ color: "var(--brand-green)" }}>
            編輯系友活動
          </h1>
          <p className="mt-1 text-[13px]" style={{ color: "var(--muted)" }}>
            目前已佔用 {data.seats_taken} 位（含攜伴）
            {data.capacity != null && `，名額上限 ${data.capacity} 位`}。
          </p>
        </div>
        <div className="flex items-center gap-1">
          <Link href={`/admin/events/${data.id}/registrations`}>
            <Button variant="ghost" size="sm">
              報名名單
            </Button>
          </Link>
          {toEventStatus(data.status) !== "draft" && (
            <Link href={`/alumni/events/${data.slug}`} target="_blank">
              <Button variant="ghost" size="sm">
                前台 ↗︎
              </Button>
            </Link>
          )}
          {/* ⚠️ 刪除會連報名紀錄一起消失（外鍵 cascade）。有人報名時 action 會
              擋下來，所以這顆實質上只給「建錯了、還沒人報名」用。要停辦請把
              狀態改成「已取消」。 */}
          <DeleteButton action={deleteEvent} id={data.id} itemLabel={data.title} />
        </div>
      </header>

      <EventForm
        action={updateEvent}
        submitLabel="儲存"
        initial={{
          id: data.id,
          previousSlug: data.slug,
          slug: data.slug,
          title: data.title,
          title_en: data.title_en ?? "",
          summary: data.summary ?? "",
          summary_en: data.summary_en ?? "",
          body: data.body ?? "",
          body_en: data.body_en ?? "",
          starts_at: toDatetimeLocal(data.starts_at),
          ends_at: toDatetimeLocal(data.ends_at),
          location: data.location ?? "",
          location_en: data.location_en ?? "",
          address: data.address ?? "",
          capacity: data.capacity == null ? "" : String(data.capacity),
          registration_closes_at: toDatetimeLocal(data.registration_closes_at),
          cover_url: data.cover_url ?? "",
          contact: data.contact ?? "",
          status: toEventStatus(data.status),
          seatsTaken: data.seats_taken,
        }}
      />
    </div>
  );
}
