import type { Metadata } from "next";
import { requireAdminOrRedirect } from "@/lib/admin/auth";
import { EventForm } from "../EventForm";
import { createEvent } from "../actions";
import { EVENT_AUDIENCE_SHORT, toEventAudience } from "../constants";

export const metadata: Metadata = { title: "新增活動" };
export const dynamic = "force-dynamic";

export default async function NewEventPage({
  searchParams,
}: {
  // `?audience=` 由列表頁的「新增活動」帶進來（列表當時篩著哪一種就預選哪一種），
  // 也是側欄「最新消息 › 活動報名」入口一路帶下來的。沒有或認不得就預設系友活動。
  searchParams: Promise<{ audience?: string }>;
}) {
  await requireAdminOrRedirect();
  const { audience: audienceParam } = await searchParams;
  const audience = toEventAudience(audienceParam) ?? "alumni";

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="text-[22px] font-bold" style={{ color: "var(--brand-green)" }}>
          新增{EVENT_AUDIENCE_SHORT[audience]}
        </h1>
        <p className="mt-1 text-[13px]" style={{ color: "var(--muted)" }}>
          先存成「草稿」把內容排好，確認無誤再改成「已上架」開放報名。對象可以在下面的表單裡改。
        </p>
      </header>
      <EventForm
        action={createEvent}
        submitLabel="建立活動"
        initial={{
          slug: "",
          audience,
          title: "",
          title_en: "",
          summary: "",
          summary_en: "",
          body: "",
          body_en: "",
          starts_at: "",
          ends_at: "",
          location: "",
          location_en: "",
          address: "",
          capacity: "",
          registration_closes_at: "",
          cover_url: "",
          contact: "",
          status: "draft",
        }}
      />
    </div>
  );
}
