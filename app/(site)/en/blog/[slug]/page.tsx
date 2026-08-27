import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlogPostRoute } from "@/components/site/pages";
import { getPostBySlug, getPostSlugs } from "@/lib/data";
import { postMetadata } from "@/lib/site-routes";

export const revalidate = 300;

/**
 * Prebuild the posts that exist at deploy time; anything published afterwards
 * is rendered on first request and then cached like the rest. `false` would
 * 404 a post the office publishes between deploys, which is the normal case.
 */
export const dynamicParams = true;

export async function generateStaticParams() {
  return (await getPostSlugs()).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug, "en");
  if (!post) notFound();
  return postMetadata(slug, "en", post);
}

/** 單篇文章 (/blog/[slug]) —— 英文版，路徑加 /en 前綴 */
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <BlogPostRoute lang="en" slug={slug} />;
}
