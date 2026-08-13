import type { Metadata } from "next";
import { requireAdminOrRedirect } from "@/lib/admin/auth";
import { LinkForm } from "../LinkForm";
import { createLink } from "../actions";

export const metadata: Metadata = { title: "新增連結卡片" };
export const dynamic = "force-dynamic";

export default async function NewLinkPage() {
  await requireAdminOrRedirect();

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-[22px] font-bold" style={{ color: "var(--brand-green)" }}>
        新增連結卡片
      </h1>
      <LinkForm
        action={createLink}
        submitLabel="新增"
        // Defaults to 學生專區 and 0: the section is the more common of the two,
        // and a new card sitting at the top is easy to spot and reorder.
        initial={{ section: "students", label: "", url: "", sort_order: 0 }}
      />
    </div>
  );
}
