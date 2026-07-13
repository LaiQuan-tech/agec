import type { Metadata } from "next";
import { getFaculty } from "@/lib/data";
import { ThemedRoute } from "@/components/theme/ThemedRoute";
import { ClassicFaculty } from "@/components/classic/Faculty";
import { ModernFaculty } from "@/components/modern/Faculty";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "系所成員",
};

export default async function FacultyPage() {
  const faculty = await getFaculty();

  return (
    <ThemedRoute
      classic={<ClassicFaculty faculty={faculty} />}
      modern={<ModernFaculty faculty={faculty} />}
    />
  );
}
