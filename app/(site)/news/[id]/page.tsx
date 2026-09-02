import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NewsItemRoute } from "@/components/site/pages";
import { getNewsById, getNewsIds } from "@/lib/data";
import { articleMetadata } from "@/lib/site-routes";

export const revalidate = 300;
export const dynamicParams = true;

export async function generateStaticParams() {
  return (await getNewsIds()).map((id) => ({ id: String(id) }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const item = /^\d+$/.test(id) ? await getNewsById(Number(id), "zh") : null;
  if (!item) notFound();
  // 與 /alumni/events/[slug] 共用：三樣東西完全相同 —— 標題、前言、封面。
  return articleMetadata(`/news/${id}`, "zh", {
    title: item.title,
    excerpt: item.body,
    cover_url: item.cover_url,
  });
}

/** 單則消息 (/news/[id]) */
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <NewsItemRoute lang="zh" id={id} />;
}
