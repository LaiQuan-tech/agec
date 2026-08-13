import type { Metadata } from "next";
import { requireAdminOrRedirect } from "@/lib/admin/auth";
import { NewsForm } from "../NewsForm";
import { createNews } from "../actions";

export const metadata: Metadata = { title: "新增消息" };
export const dynamic = "force-dynamic";

export default async function NewNewsPage() {
  await requireAdminOrRedirect();

  // Default to today — new announcements are almost always dated today, and a
  // blank date field is one more thing to fill in.
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-[22px] font-bold" style={{ color: "var(--brand-green)" }}>
        新增消息
      </h1>
      <NewsForm
        action={createNews}
        submitLabel="新增"
        initial={{ published_at: today, category: "最新公告", title: "", is_pinned: false }}
      />
    </div>
  );
}
