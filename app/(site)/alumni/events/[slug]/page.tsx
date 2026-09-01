import type { Metadata } from "next";
import { AlumniEventRoute } from "@/components/site/pages";
import { getAlumniEventBySlug, getAlumniEventSlugs } from "@/lib/data";
import { articleMetadata } from "@/lib/site-routes";

/**
 * ⚠️ 60 秒，不是全站的 300。
 *
 * 這一頁印著剩餘名額。五分鐘的快取在一場快額滿的活動上就是五分鐘的錯誤數字，
 * 而錯誤的方向剛好是最糟的那一邊（顯示還有位子、送出卻被擋下）。報名成功時
 * server action 會直接 revalidatePath 這兩個網址，所以正常情況是即時更新；
 * 這個 60 秒是那條路徑失效時的兜底。
 */
export const revalidate = 60;

/**
 * `dynamicParams = true`：後台上架一場新活動之後，它的頁面要立刻能開，
 * 不能等到下一次部署。generateStaticParams 只回已上架的，草稿不會被預產。
 */
export const dynamicParams = true;

export async function generateStaticParams() {
  return (await getAlumniEventSlugs()).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const event = await getAlumniEventBySlug(slug, "zh");
  if (!event) return { title: "系友活動" };
  return articleMetadata(`/alumni/events/${slug}`, "zh", {
    title: event.title,
    excerpt: event.summary,
    cover_url: event.coverUrl,
  });
}

/** 單一系友活動 */
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <AlumniEventRoute lang={"zh"} slug={slug} />;
}
