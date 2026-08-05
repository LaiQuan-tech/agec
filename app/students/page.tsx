import type { Metadata } from "next";
import { getLinks } from "@/lib/data";
import { ThemedRoute } from "@/components/theme/ThemedRoute";
import { ClassicStudents } from "@/components/classic/Students";
import { ModernStudents } from "@/components/modern/Students";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "學生專區",
};

export default async function StudentsPage() {
  const links = await getLinks("students");

  return (
    <ThemedRoute
      classic={<ClassicStudents links={links} />}
      modern={<ModernStudents links={links} />}
    />
  );
}
