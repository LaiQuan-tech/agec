import Link from "next/link";
import sanitizeHtml from "sanitize-html";
import type { Post } from "@/lib/data";
import { localizePath, translate, type Lang } from "@/lib/i18n";
import { BLOG, BLOG_TITLE } from "@/lib/i18n/blog";
import { SHARED } from "@/lib/i18n/shared";
import { SiteShell } from "./SiteShell";
import { NextRoute } from "./NextRoute";
import { formatNewsDate } from "./format";
import { RICH_TEXT_SANITIZE } from "@/lib/sanitize";

/**
 * 單篇文章 (/blog/[slug], /en/blog/[slug]).
 *
 * No `InteriorHero`: that block is a full-bleed photo masthead sized for a
 * section landing page, and a post's own cover image belongs above its body,
 * not behind a 106px display title. This page uses a plain text masthead
 * instead — the article's own title is the largest thing on it.
 */


export function BlogPost({ lang, post }: { lang: Lang; post: Post }) {
  const t = translate(BLOG, lang);
  const shared = translate(SHARED, lang);
  const listPath = localizePath("/blog", lang);
  const html = sanitizeHtml(post.content_html, RICH_TEXT_SANITIZE);

  return (
    <SiteShell lang={lang} variant="interior">
      <article className="post-page">
        <div className="container post-head" id="content">
          <div className="breadcrumb">
            <Link href={localizePath("/", lang)}>{shared.home}</Link>
            <span>/</span>
            <Link href={listPath}>{t.breadcrumbList}</Link>
            <span>/</span>
            <span>{post.title}</span>
          </div>
          <p className="eyebrow">
            {formatNewsDate(post.published_at).full}
            {post.tags[0] ? ` · ${post.tags[0]}` : ""}
          </p>
          <h1>{post.title}</h1>
          {post.excerpt ? <p className="post-standfirst">{post.excerpt}</p> : null}
          {post.author ? (
            <p className="post-byline">
              {t.byline.replace("{name}", post.author)}
            </p>
          ) : null}
        </div>

        {post.cover_url ? (
          <div className="container post-cover">
            {/* alt is the title: the cover has no caption column, and a decorative
                empty alt would drop the only description of the image there is. */}
            <img src={post.cover_url} alt={post.title} />
          </div>
        ) : null}

        {/* The one place this site injects stored markup. It is sanitised twice
            — on save and again just above — and `.post-body` in
            site-extensions.css supplies the block styling, because site.css
            ships Tailwind's Preflight and would otherwise render this with no
            list markers, no heading sizes and no paragraph spacing. */}
        <div
          className="container post-body"
          dangerouslySetInnerHTML={{ __html: html }}
        />

        <div className="container post-foot">
          <Link href={listPath}>{t.backToList}</Link>
        </div>
      </article>
      <NextRoute lang={lang} />
    </SiteShell>
  );
}

/** Re-exported so the route file can title the page without a second import. */
export { BLOG_TITLE };
