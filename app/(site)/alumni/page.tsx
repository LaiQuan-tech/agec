import type { Metadata } from "next";
import { getLinks } from "@/lib/data";
import { ClassicAlumni } from "@/components/classic/Alumni";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "系友專區",
};

export default async function AlumniPage() {
  const links = await getLinks("alumni");

  return <ClassicAlumni links={links} />;
}
