import type { Metadata } from "next";
import { getCourses } from "@/lib/data";
import { ClassicCourses } from "@/components/classic/Courses";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "課程資訊",
};

export default async function CoursesPage() {
  const courses = await getCourses();

  return <ClassicCourses courses={courses} />;
}
