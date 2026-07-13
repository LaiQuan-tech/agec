import type { Metadata } from "next";
import { getCourses } from "@/lib/data";
import { ThemedRoute } from "@/components/theme/ThemedRoute";
import { ClassicCourses } from "@/components/classic/Courses";
import { ModernCourses } from "@/components/modern/Courses";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "課程資訊",
};

export default async function CoursesPage() {
  const courses = await getCourses();

  return (
    <ThemedRoute
      classic={<ClassicCourses courses={courses} />}
      modern={<ModernCourses courses={courses} />}
    />
  );
}
