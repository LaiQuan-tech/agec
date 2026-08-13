import type { Metadata } from "next";
import { requireAdminOrRedirect } from "@/lib/admin/auth";
import { PostForm } from "../PostForm";
import { createPost } from "../actions";

export const metadata: Metadata = { title: "新增文章" };
export const dynamic = "force-dynamic";

export default async function NewPostPage() {
  await requireAdminOrRedirect();

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-[22px] font-bold" style={{ color: "var(--brand-green)" }}>
        新增文章
      </h1>
      {/*
        Starts as a draft with no publication time. Long pieces are rarely
        finished in one sitting, and the action fills the time in the moment
        someone switches the status to 已發佈.
      */}
      <PostForm
        action={createPost}
        submitLabel="新增"
        initial={{
          slug: "",
          title: "",
          excerpt: "",
          cover_url: "",
          content_html: "",
          content_json: null,
          author: "",
          tags: "",
          status: "draft",
          published_at: "",
        }}
      />
    </div>
  );
}
