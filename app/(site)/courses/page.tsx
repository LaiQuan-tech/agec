import type { Metadata } from "next";
import { getCourses, getPrograms } from "@/lib/data";
import { Courses } from "@/components/site/Courses";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "課程資訊",
};

export default async function CoursesPage() {
  // getPrograms supplies both the `.filter-tabs` labels and the display order
  // the course table is re-sorted into — see components/site/Courses.tsx.
  const [courses, programs] = await Promise.all([getCourses(), getPrograms()]);

  return <Courses courses={courses} programs={programs} />;
}
