import sanitizeHtml from "sanitize-html";

/**
 * The single allowlist for stored rich text, shared by every place that writes
 * or renders it.
 *
 * It lives here — a plain module, not beside either consumer — because it has
 * two of them and they are in different trees:
 *
 *   app/(admin)/admin/news/actions.ts    on save
 *   components/site/NewsPost.tsx         on render
 *
 * It cannot live in either actions.ts: those are `"use server"` files, which
 * may only export async functions, so the constant would have to be duplicated
 * to be shared. It was, briefly, in three copies — and a copied allowlist is
 * the kind of thing that drifts silently: add a tag to the editor, forget one
 * file, and authors watch their formatting vanish somewhere between saving and
 * viewing, with no error anywhere.
 *
 * Sanitising on both save and render is deliberate, not redundancy. The Server
 * Actions are only one of the ways a row can be written; anything that reaches
 * the table another way — the SQL editor, a script holding the service-role
 * key, the news import — never passed through them, and the render pass is the
 * last point before the HTML reaches a browser.
 *
 * ⚠️ Three things move together. Change one and check the others:
 *   1. this list
 *   2. the extensions in app/(admin)/admin/posts/Editor.tsx — the client-side
 *      half of the same contract. Every tag allowed here that the editor
 *      cannot parse is a tag it *deletes* the moment an author touches the
 *      body, which is why Table and Youtube are loaded there rather than left
 *      to the sanitiser alone. See the note on iframe below.
 *   3. `.post-body` in app/(site)/site-extensions.css, which supplies the block
 *      styling every allowed tag needs (site.css ships Tailwind's Preflight, so
 *      an unstyled tag renders with no list marker, no heading size and no
 *      spacing — and a table with no styling renders as run-together text)
 *
 * Current three-way state: p/br/hr, h2–h4, strong/em/s, code/pre, blockquote,
 * ul/ol/li, a, img, the table family, and iframe (YouTube only). `u` is absent
 * from all three on purpose.
 */
export const RICH_TEXT_SANITIZE: sanitizeHtml.IOptions = {
  allowedTags: [
    "p", "br", "hr",
    "h2", "h3", "h4",
    "strong", "em", "s", "code", "pre",
    "blockquote",
    "ul", "ol", "li",
    "a", "img",
    // Tables came in with the 428 news items imported from the old site: a
    // tenth of them are a Word document pasted whole, and for some — the job
    // postings especially — the table *is* the article. Discarding the tags
    // keeps the cell text but runs every cell together into one paragraph,
    // which reads as corrupted rather than as plain.
    "table", "thead", "tbody", "tfoot", "tr", "th", "td", "caption",
    // Videos, same import. Restricted to YouTube by allowedIframeHostnames
    // below — see the note there.
    "iframe",
  ],
  allowedAttributes: {
    a: ["href", "target", "rel"],
    img: ["src", "alt"],
    // colspan/rowspan carry structure, so they survive. Everything else the
    // old CMS wrote — width, height, border, cellpadding, inline style — is
    // dropped: those tables hard-code `width:699px`, which overflows a phone.
    // `.post-body` sizes them instead.
    th: ["colspan", "rowspan"],
    td: ["colspan", "rowspan"],
    iframe: ["src", "title", "allow", "allowfullscreen", "loading"],
  },
  /**
   * ⚠️ The whole reason `iframe` is safe to allow.
   *
   * An unrestricted iframe lets anyone who can write a post embed anything at
   * all — a login form on another origin, a page that reads the referrer, an
   * ad. This narrows it to the one thing the imported content actually needs.
   * sanitize-html drops any iframe whose src is not on this list, so widening
   * the allowlist above without widening this is not a partial mistake; it is
   * the entire mistake.
   *
   * youtube-nocookie is the privacy-preserving host YouTube itself offers, and
   * is preferred when someone is pasting a fresh embed.
   */
  allowedIframeHostnames: [
    "www.youtube.com",
    "youtube.com",
    "www.youtube-nocookie.com",
    "youtube-nocookie.com",
  ],
  allowedSchemes: ["http", "https", "mailto"],
  allowedSchemesByTag: { img: ["http", "https"], iframe: ["https"] },
  transformTags: {
    // Every link leaves the site, and rel is not optional: without noopener the
    // opened page gets a handle on window.opener.
    a: sanitizeHtml.simpleTransform("a", {
      target: "_blank",
      rel: "noopener noreferrer",
    }),
    // Imported embeds arrive with neither, and both matter on a page that may
    // carry several: without lazy loading each one loads a YouTube player up
    // front, and without a title a screen reader announces only "frame".
    iframe: sanitizeHtml.simpleTransform("iframe", {
      loading: "lazy",
      title: "YouTube",
    }),
  },
  /**
   * "discard" drops a disallowed tag but keeps the text inside it, which is
   * what makes the Word residue harmless: the imported bodies are full of
   * `<span style="font-family:'新細明體'">` and 2017-era `<font>`, and dropping
   * those leaves the sentence intact and unstyled, which is the goal. Switching
   * this to "escape" would print the tags on the page as text.
   */
  disallowedTagsMode: "discard",
  /**
   * Drop an embed that has lost its source rather than leaving the shell.
   *
   * `allowedIframeHostnames` strips the `src` of anything that is not YouTube
   * but leaves the `<iframe>` itself, because iframe is an allowed tag. What
   * reaches the page is `<iframe loading="lazy" title="YouTube"></iframe>` —
   * which `.post-body` sizes at 16:9, so the reader gets a blank rectangle
   * where a video appears to be missing. Nothing at all is the honest render.
   *
   * The same goes for `<img>`: a src stripped for a bad scheme (the three
   * `data:` URIs in the imported bodies) would otherwise leave a broken-image
   * icon with no alt text.
   *
   * Returning true discards the element and its contents; both of these are
   * void elements, so there are no contents to lose.
   */
  exclusiveFilter: (frame) =>
    (frame.tag === "iframe" || frame.tag === "img") && !frame.attribs.src,
};
