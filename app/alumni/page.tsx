import type { Metadata } from "next";
import { getLinks } from "@/lib/data";
import { ThemedRoute } from "@/components/theme/ThemedRoute";
import { ClassicAlumni } from "@/components/classic/Alumni";
import { ModernAlumni } from "@/components/modern/Alumni";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "系友專區",
};

export default async function AlumniPage() {
  const links = await getLinks("alumni");

  return (
    <ThemedRoute
      classic={<ClassicAlumni links={links} />}
      modern={<ModernAlumni links={links} />}
    />
  );
}
