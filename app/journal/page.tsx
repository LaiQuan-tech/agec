import type { Metadata } from "next";
import { getLinks } from "@/lib/data";
import { ThemedRoute } from "@/components/theme/ThemedRoute";
import { ClassicJournal } from "@/components/classic/Journal";
import { ModernJournal } from "@/components/modern/Journal";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "農經期刊",
};

export default async function JournalPage() {
  const links = await getLinks("journal");

  return (
    <ThemedRoute
      classic={<ClassicJournal links={links} />}
      modern={<ModernJournal links={links} />}
    />
  );
}
