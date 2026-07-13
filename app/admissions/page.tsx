import type { Metadata } from "next";
import { getPrograms } from "@/lib/data";
import { ThemedRoute } from "@/components/theme/ThemedRoute";
import { ClassicAdmissions } from "@/components/classic/Admissions";
import { ModernAdmissions } from "@/components/modern/Admissions";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "招生資訊",
};

export default async function AdmissionsPage() {
  const programs = await getPrograms();

  return (
    <ThemedRoute
      classic={<ClassicAdmissions programs={programs} />}
      modern={<ModernAdmissions programs={programs} />}
    />
  );
}
