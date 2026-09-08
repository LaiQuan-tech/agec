import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FacultyProfile } from "@/components/site/FacultyProfile";
import { getFacultyBioIds, getFacultyById } from "@/lib/data";
import { articleMetadata } from "@/lib/site-routes";

export const revalidate = 300;

/**
 * ⚠️ true，不是 false。系辦在後台寫完一位老師的介紹之後，那一頁必須立刻能
 * 開 —— false 的話要等下一次 build。代價是任何數字都會被路由接住，所以
 * getFacultyById 對「沒有內文」與「不存在」都回 null，下面一律 404。
 */
export const dynamicParams = true;

export async function generateStaticParams() {
  return (await getFacultyBioIds()).map((id) => ({ id: String(id) }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const member = /^\d+$/.test(id) ? await getFacultyById(Number(id), "zh") : null;
  if (!member) notFound();

  // 與 /news/[id]、/alumni/events/[slug] 共用同一支：標題、摘要、封面。
  // 摘要用職稱加領域 —— 那是搜尋結果裡最能分辨兩位老師的一行。
  return articleMetadata(`/faculty/${id}`, "zh", {
    title: member.name,
    excerpt: [member.title, member.fields].filter(Boolean).join(" · "),
    cover_url: member.photo_url,
  });
}

/** 單一位老師的個人頁 (/faculty/[id]) */
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  // 網址上那一段是任意字串，先擋掉不是正整數的，再進資料庫。
  const numeric = /^\d+$/.test(id) ? Number(id) : NaN;
  if (!Number.isSafeInteger(numeric)) notFound();

  const member = await getFacultyById(numeric, "zh");
  if (!member) notFound();

  return <FacultyProfile lang="zh" member={member} />;
}
