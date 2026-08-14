import type { Metadata } from "next";
import { getFaculty } from "@/lib/data";
import { ClassicFaculty } from "@/components/classic/Faculty";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "系所成員",
};

export default async function FacultyPage() {
  const faculty = await getFaculty();

  return <ClassicFaculty faculty={faculty} />;
}
