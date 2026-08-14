import type { Metadata } from "next";
import { getLinks } from "@/lib/data";
import { Students } from "@/components/site/Students";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "學生專區",
};

export default async function StudentsPage() {
  const links = await getLinks("students");

  return <Students links={links} />;
}
