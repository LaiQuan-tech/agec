import type { Metadata } from "next";
import { getNews } from "@/lib/data";
import { ThemedRoute } from "@/components/theme/ThemedRoute";
import { ClassicNews } from "@/components/classic/News";
import { ModernNews } from "@/components/modern/News";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "最新消息",
};

export default async function NewsPage() {
  const news = await getNews();

  return (
    <ThemedRoute
      classic={<ClassicNews news={news} />}
      modern={<ModernNews news={news} />}
    />
  );
}
