"use client";

import { useCallback, useRef, useState, type ReactNode } from "react";
import { EditorContent, useEditor, useEditorState, type JSONContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import { TableKit } from "@tiptap/extension-table";
import Youtube from "@tiptap/extension-youtube";
import { Button } from "@/components/admin/ui/Button";
import { writeField } from "@/components/admin/ui/native-value";
import { uploadFile } from "@/components/admin/ui/upload";

/*
 * writeField() moved to components/admin/ui/native-value.ts when the upload
 * controls needed the same trick. Its two payload fields below are still
 * `type="text"` + the `hidden` attribute rather than `type="hidden"`, for the
 * reason recorded there: React raises its synthetic change event only for
 * text-like inputs, and a real hidden input would submit correctly but never
 * reach FormShell's onChange — leaving the unsaved-changes guard disarmed for
 * anyone who only ever touched the editor.
 */

function ToolButton({
  label,
  title,
  active,
  disabled,
  onClick,
}: {
  label: ReactNode;
  title: string;
  /** Omitted for undo/redo, which are actions rather than toggles. */
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      title={title}
      aria-label={title}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={active ? "font-bold" : undefined}
      style={active ? { background: "var(--cream)", color: "var(--gold-deep)" } : undefined}
    >
      {label}
    </Button>
  );
}

/**
 * A rich-text body, plus the two hidden fields that carry it to the action.
 *
 * The field names are props rather than constants because the form renders this
 * twice — once for `content_html` / `content_json` and once for their `_en`
 * twins. Two instances sharing a name would post two values under one key, and
 * FormData.get() returns the first, so the English body would silently
 * overwrite the Chinese one on every save (or the reverse, depending on which
 * rendered first). Nothing would look wrong until someone reloaded the article.
 */
export function Editor({
  initialHtml,
  initialJson,
  htmlName,
  jsonName,
  ariaLabel,
  lang,
}: {
  initialHtml: string;
  /** ProseMirror JSON from content_json; null for posts saved before it existed. */
  initialJson: unknown;
  /** Form field the serialised HTML is posted under. */
  htmlName: string;
  /** Form field the ProseMirror JSON is posted under. */
  jsonName: string;
  /** The editing surface is a div, so it has no label of its own to borrow. */
  ariaLabel: string;
  /** BCP 47 tag for the text being typed, for screen readers and hyphenation. */
  lang?: string;
}) {
  const htmlRef = useRef<HTMLInputElement>(null);
  const jsonRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const editor = useEditor({
    // This project server-renders the admin, and a Tiptap instance built during
    // SSR produces markup React then disagrees with on hydration.
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        // Only h2–h4 survive the server-side sanitiser, and h1 belongs to the
        // page title anyway.
        heading: { levels: [2, 3, 4] },
        // <u> is not on the sanitiser's allowlist, so an underline would vanish
        // on save. Better to not offer the shortcut at all than to lose it.
        underline: false,
        // StarterKit ships Link; it just had no button. openOnClick would
        // navigate away from the admin mid-edit, which is never what someone
        // clicking a link inside an editor meant to do.
        link: { openOnClick: false, autolink: true },
      }),
      Image.configure({ inline: false, allowBase64: false }),
      /*
       * ⚠️ Table and Youtube are here because the sanitiser allows them, and
       * that is not a nicety — it is the only thing keeping the imported
       * announcements intact.
       *
       * Tiptap silently drops nodes it has no extension for while parsing. The
       * hidden HTML field starts out holding the row exactly as stored, so
       * opening an item and saving it untouched is safe; but the first
       * keystroke fires onUpdate, which overwrites that field with
       * editor.getHTML() — by then already stripped of every table and embed.
       * No error, no warning, and only on the migrated rows.
       *
       * 7 of the 428 imported news items are a Word table (for the job
       * postings, the table *is* the announcement) and 15 are a YouTube embed.
       * Remove either extension and those 22 empty themselves out the next time
       * the office edits a typo.
       */
      TableKit.configure({ table: { resizable: false } }),
      Youtube.configure({
        // The sanitiser's allowedIframeHostnames is the real boundary; this is
        // the editor half agreeing with it. nocookie is YouTube's own
        // privacy-preserving host.
        nocookie: true,
        controls: true,
        // Sized by CSS on both sides, so the width/height attributes Youtube
        // would otherwise write are dropped by the sanitiser anyway.
        width: 640,
        height: 360,
      }),
    ],
    // content_json is the editor's own format and round-trips exactly;
    // content_html is the fallback for anything stored before it, and for rows
    // whose JSON failed to parse on the way in.
    content: (initialJson as JSONContent | null) ?? initialHtml,
    editorProps: {
      attributes: {
        class: "min-h-[320px] outline-none",
        "aria-label": ariaLabel,
        ...(lang ? { lang } : {}),
      },
    },
    onUpdate: ({ editor }) => {
      writeField(htmlRef.current, editor.getHTML());
      writeField(jsonRef.current, JSON.stringify(editor.getJSON()));
    },
  });

  // useEditor no longer re-renders on every transaction, so the toolbar's active
  // states have to be subscribed to explicitly.
  const toolbar = useEditorState({
    editor,
    selector: ({ editor }) => ({
      bold: editor?.isActive("bold") ?? false,
      italic: editor?.isActive("italic") ?? false,
      h2: editor?.isActive("heading", { level: 2 }) ?? false,
      h3: editor?.isActive("heading", { level: 3 }) ?? false,
      bulletList: editor?.isActive("bulletList") ?? false,
      orderedList: editor?.isActive("orderedList") ?? false,
      blockquote: editor?.isActive("blockquote") ?? false,
      link: editor?.isActive("link") ?? false,
      inTable: editor?.isActive("table") ?? false,
      canUndo: editor?.can().undo() ?? false,
      canRedo: editor?.can().redo() ?? false,
    }),
  });

  /*
   * Pick a file, upload it, insert it. This used to be a window.prompt asking
   * for a URL, with the hint text telling the office to "upload the image
   * somewhere else first" — which meant the Supabase dashboard.
   */
  const pickImage = useCallback(() => imageInputRef.current?.click(), []);

  const insertImageFile = useCallback(
    async (file: File) => {
      if (!editor) return;
      setUploading(true);
      try {
        // posters：消息的圖片桶。這個編輯器原本住在部落格區、傳到 blog 桶，
        // 部落格收掉之後它唯一的使用者是最新消息，桶子也跟著換過來。
        const { url } = await uploadFile(file, "posters");
        // alt is left empty rather than filled with the filename: a decorative
        // image wants an empty alt, and "poster-web.jpg" read aloud is worse
        // than silence. The author can add a real one.
        editor.chain().focus().setImage({ src: url, alt: "" }).run();
      } catch (cause) {
        window.alert(cause instanceof Error ? cause.message : "圖片上傳失敗。");
      } finally {
        setUploading(false);
        if (imageInputRef.current) imageInputRef.current.value = "";
      }
    },
    [editor],
  );

  const toggleLink = useCallback(() => {
    if (!editor) return;
    if (editor.isActive("link")) {
      editor.chain().focus().unsetLink().run();
      return;
    }
    const answer = window.prompt("連結網址（http://、https:// 或 mailto:）");
    if (answer === null) return;
    const href = answer.trim();
    if (!href) return;
    // The same three schemes lib/sanitize.ts allows. Checking here means the
    // author is told now, rather than watching the link disappear on save.
    if (!/^(https?:\/\/|mailto:)/i.test(href)) {
      window.alert("網址必須以 http://、https:// 或 mailto: 開頭，連結沒有建立。");
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href }).run();
  }, [editor]);

  const insertVideo = useCallback(() => {
    if (!editor) return;
    const answer = window.prompt("YouTube 影片網址");
    if (answer === null) return;
    const src = answer.trim();
    if (!src) return;
    // Only YouTube survives the sanitiser (allowedIframeHostnames), so anything
    // else would be stored and then vanish on render.
    if (!/^https?:\/\/(www\.)?(youtube\.com|youtu\.be|youtube-nocookie\.com)\//i.test(src)) {
      window.alert("目前只支援 YouTube 影片，這個網址沒有插入。");
      return;
    }
    editor.commands.setYoutubeVideo({ src });
  }, [editor]);

  return (
    <div className="rounded-md border bg-white" style={{ borderColor: "var(--hairline)" }}>
      <div
        className="flex flex-wrap items-center gap-0.5 border-b px-1.5 py-1.5"
        style={{ borderColor: "var(--hairline)" }}
      >
        <ToolButton
          label="粗體"
          title="粗體"
          active={toolbar?.bold}
          onClick={() => editor?.chain().focus().toggleBold().run()}
        />
        <ToolButton
          label="斜體"
          title="斜體"
          active={toolbar?.italic}
          onClick={() => editor?.chain().focus().toggleItalic().run()}
        />
        <ToolButton
          label="H2"
          title="大標題"
          active={toolbar?.h2}
          onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
        />
        <ToolButton
          label="H3"
          title="小標題"
          active={toolbar?.h3}
          onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
        />
        <ToolButton
          label="• 清單"
          title="項目符號清單"
          active={toolbar?.bulletList}
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
        />
        <ToolButton
          label="1. 清單"
          title="編號清單"
          active={toolbar?.orderedList}
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
        />
        <ToolButton
          label="引言"
          title="引言"
          active={toolbar?.blockquote}
          onClick={() => editor?.chain().focus().toggleBlockquote().run()}
        />
        <ToolButton
          label="連結"
          title={toolbar?.link ? "移除連結" : "插入連結"}
          active={toolbar?.link}
          onClick={toggleLink}
        />
        <ToolButton
          label="分隔線"
          title="插入分隔線"
          onClick={() => editor?.chain().focus().setHorizontalRule().run()}
        />
        <ToolButton
          label={uploading ? "上傳中…" : "插入圖片"}
          title="從電腦選一張圖片上傳"
          disabled={uploading}
          onClick={pickImage}
        />
        <ToolButton label="插入影片" title="插入 YouTube 影片" onClick={insertVideo} />
        <ToolButton
          label="表格"
          title="插入 3×3 表格"
          active={toolbar?.inTable}
          onClick={() =>
            editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
          }
        />
        {/* Only shown inside a table: four more buttons on every toolbar, for
            something most posts never use, is four more things to scan past. */}
        {toolbar?.inTable && (
          <>
            <ToolButton
              label="＋列"
              title="在下方增加一列"
              onClick={() => editor?.chain().focus().addRowAfter().run()}
            />
            <ToolButton
              label="＋欄"
              title="在右方增加一欄"
              onClick={() => editor?.chain().focus().addColumnAfter().run()}
            />
            <ToolButton
              label="－列"
              title="刪除目前這一列"
              onClick={() => editor?.chain().focus().deleteRow().run()}
            />
            <ToolButton
              label="－欄"
              title="刪除目前這一欄"
              onClick={() => editor?.chain().focus().deleteColumn().run()}
            />
            <ToolButton
              label="刪表格"
              title="刪除整個表格"
              onClick={() => editor?.chain().focus().deleteTable().run()}
            />
          </>
        )}
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => {
            const file = e.currentTarget.files?.[0];
            if (file) void insertImageFile(file);
          }}
        />

        <span className="mx-1 h-4 w-px" style={{ background: "var(--hairline)" }} aria-hidden="true" />

        <ToolButton
          label="復原"
          title="復原"
          disabled={!toolbar?.canUndo}
          onClick={() => editor?.chain().focus().undo().run()}
        />
        <ToolButton
          label="重做"
          title="重做"
          disabled={!toolbar?.canRedo}
          onClick={() => editor?.chain().focus().redo().run()}
        />
      </div>

      {/*
        No Tailwind typography plugin in this project, so the editing surface
        gets the handful of block styles it needs directly. This is only what
        the author sees while writing — the public page will bring its own.
      */}
      <EditorContent
        editor={editor}
        className={
          "px-3 py-3 text-[14px] leading-7 " +
          "[&_p]:my-2 " +
          "[&_h2]:mt-4 [&_h2]:mb-2 [&_h2]:text-[19px] [&_h2]:font-bold " +
          "[&_h3]:mt-3 [&_h3]:mb-1.5 [&_h3]:text-[16px] [&_h3]:font-semibold " +
          "[&_h4]:mt-3 [&_h4]:mb-1 [&_h4]:text-[15px] [&_h4]:font-semibold " +
          "[&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-6 " +
          "[&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-6 " +
          "[&_blockquote]:my-3 [&_blockquote]:border-l-4 [&_blockquote]:pl-3 [&_blockquote]:italic " +
          "[&_hr]:my-4 [&_hr]:border-t " +
          "[&_img]:my-3 [&_img]:max-w-full [&_img]:rounded " +
          "[&_a]:underline [&_a]:underline-offset-2 " +
          "[&_pre]:my-3 [&_pre]:overflow-x-auto [&_pre]:rounded [&_pre]:bg-neutral-100 [&_pre]:p-3 " +
          "[&_code]:text-[13px] " +
          // Tables and embeds need visible structure while editing too —
          // without borders a table is an indistinguishable run of words, and
          // the author cannot tell where the cells are to click into them.
          "[&_table]:my-3 [&_table]:w-full [&_table]:table-fixed [&_table]:border-collapse " +
          "[&_th]:border [&_th]:border-neutral-300 [&_th]:bg-neutral-100 [&_th]:p-2 [&_th]:text-left " +
          "[&_td]:border [&_td]:border-neutral-300 [&_td]:p-2 " +
          "[&_.ProseMirror-selectedcell]:bg-neutral-200 " +
          "[&_iframe]:my-3 [&_iframe]:aspect-video [&_iframe]:h-auto [&_iframe]:w-full [&_iframe]:max-w-xl"
        }
        style={{ color: "var(--ink)" }}
      />

      {/* See writeField() above for why these are text inputs rather than hidden ones. */}
      <input ref={htmlRef} type="text" name={htmlName} defaultValue={initialHtml} hidden readOnly />
      <input
        ref={jsonRef}
        type="text"
        name={jsonName}
        defaultValue={initialJson ? JSON.stringify(initialJson) : ""}
        hidden
        readOnly
      />
    </div>
  );
}
