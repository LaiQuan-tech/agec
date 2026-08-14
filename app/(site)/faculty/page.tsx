import type { Metadata } from "next";
import { getFaculty } from "@/lib/data";
import { Faculty } from "@/components/site/Faculty";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "系所成員",
};

export default async function FacultyPage() {
  // One query for all 37 people; the component splits them by `category` into
  // the four card layouts — see components/site/Faculty.tsx.
  const faculty = await getFaculty();

  return <Faculty faculty={faculty} />;
}
