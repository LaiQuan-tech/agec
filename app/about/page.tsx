import type { Metadata } from "next";
import { ThemedRoute } from "@/components/theme/ThemedRoute";
import { ClassicAbout } from "@/components/classic/About";
import { ModernAbout } from "@/components/modern/About";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "本系簡介",
};

export default function AboutPage() {
  return <ThemedRoute classic={<ClassicAbout />} modern={<ModernAbout />} />;
}
