import type { Metadata } from "next";
import { EventRoute } from "@/components/site/pages";
import { getAlumniEventBySlug, getAlumniEventSlugs } from "@/lib/data";
import { articleMetadata } from "@/lib/site-routes";

/**
 * 一般活動的活動頁 —— 英文版 (/en/news/events/[slug])。
 * 與中文版逐行相同，只差 lang；說明見 app/(site)/news/events/[slug]/page.tsx。
 */
export const revalidate = 60;
export const dynamicParams = true;

export async function generateStaticParams() {
  return (await getAlumniEventSlugs("general")).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const event = await getAlumniEventBySlug(slug, "en");
  // 系友活動不住在這個網址（頁面本身會 404），metadata 也照 404 的樣子給。
  if (!event || event.audience !== "general") return { title: "Event" };
  return articleMetadata(`/news/events/${slug}`, "en", {
    title: event.title,
    excerpt: event.summary,
    cover_url: event.coverUrl,
  });
}

/** 單一一般活動。audience 對不上（系友活動）時 EventRoute 會 404。 */
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <EventRoute lang={"en"} slug={slug} audience="general" />;
}
