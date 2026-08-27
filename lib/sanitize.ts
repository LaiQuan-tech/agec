import sanitizeHtml from "sanitize-html";

/**
 * The single allowlist for stored rich text, shared by every place that writes
 * or renders it.
 *
 * It lives here — a plain module, not beside either consumer — because it has
 * three of them and they are in different trees:
 *
 *   app/(admin)/admin/posts/actions.ts   on save
 *   app/(admin)/admin/news/actions.ts    on save
 *   components/site/BlogPost / NewsPost  on render
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
 * key, a future import — never passed through them, and the render pass is the
 * last point before the HTML reaches a browser.
 *
 * ⚠️ Three things move together. Change one and check the others:
 *   1. this list
 *   2. the StarterKit configuration in app/(admin)/admin/posts/Editor.tsx —
 *      it is the client-side half of the same contract (h2–h4 only, no
 *      underline) and exists to stop authors producing markup this strips
 *   3. `.post-body` in app/(site)/site-extensions.css, which supplies the block
 *      styling every allowed tag needs (site.css ships Tailwind's Preflight, so
 *      an unstyled tag renders with no list marker, no heading size and no
 *      spacing)
 */
export const RICH_TEXT_SANITIZE: sanitizeHtml.IOptions = {
  allowedTags: [
    "p", "br", "hr",
    "h2", "h3", "h4",
    "strong", "em", "s", "code", "pre",
    "blockquote",
    "ul", "ol", "li",
    "a", "img",
  ],
  allowedAttributes: {
    a: ["href", "target", "rel"],
    img: ["src", "alt"],
  },
  allowedSchemes: ["http", "https", "mailto"],
  allowedSchemesByTag: { img: ["http", "https"] },
  // Every link leaves the site, and rel is not optional: without noopener the
  // opened page gets a handle on window.opener.
  transformTags: {
    a: sanitizeHtml.simpleTransform("a", {
      target: "_blank",
      rel: "noopener noreferrer",
    }),
  },
  disallowedTagsMode: "discard",
};
