import type { Metadata } from "next";
import { getNews } from "@/lib/data";
import { ClassicNews } from "@/components/classic/News";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "最新消息",
};

export default async function NewsPage() {
  const news = await getNews();

  return <ClassicNews news={news} />;
}
