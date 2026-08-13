import type { Metadata } from "next";
import { ClassicAbout } from "@/components/classic/About";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "本系簡介",
};

export default function AboutPage() {
  return <ClassicAbout />;
}
