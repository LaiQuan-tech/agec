import type { Metadata } from "next";
import { getPrograms } from "@/lib/data";
import { ClassicAdmissions } from "@/components/classic/Admissions";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "招生資訊",
};

export default async function AdmissionsPage() {
  const programs = await getPrograms();

  return <ClassicAdmissions programs={programs} />;
}
