import type { Metadata } from "next";
import { requireAdminOrRedirect } from "@/lib/admin/auth";
import { EventForm } from "../EventForm";
import { createEvent } from "../actions";

export const metadata: Metadata = { title: "新增系友活動" };
export const dynamic = "force-dynamic";

export default async function NewEventPage() {
  await requireAdminOrRedirect();

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="text-[22px] font-bold" style={{ color: "var(--brand-green)" }}>
          新增系友活動
        </h1>
        <p className="mt-1 text-[13px]" style={{ color: "var(--muted)" }}>
          先存成「草稿」把內容排好，確認無誤再改成「已上架」開放報名。
        </p>
      </header>
      <EventForm
        action={createEvent}
        submitLabel="建立活動"
        initial={{
          slug: "",
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
