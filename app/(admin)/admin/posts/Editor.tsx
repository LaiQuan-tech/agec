"use client";

import { useCallback, useRef, type ReactNode } from "react";
import { EditorContent, useEditor, useEditorState, type JSONContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import { Button } from "@/components/admin/ui/Button";

/**
 * Writes a value into a form field in a way React notices.
 *
 * Two things conspire here. React only raises its synthetic change event for
 * text-like inputs, so the two payload fields are `type="text"` kept out of the
 * layout with the `hidden` attribute rather than `type="hidden"` — the latter
 * would submit fine but never reach FormShell's onChange. And React remembers
 * the last value it saw on the node itself, so a plain `node.value = …` would
 * update that record and make the event that follows look like a no-op; the
 * write has to go through the prototype's own setter.
 *
 * Without both, the unsaved-changes guard stays disarmed for anyone who only
 * ever touched the editor, and closing the tab would silently drop the article.
 */
function writeField(node: HTMLInputElement | null, value: string) {
  if (!node || node.value === value) return;

  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
  if (setter) setter.call(node, value);
  else node.value = value;

  node.dispatchEvent(new Event("input", { bubbles: true }));
}

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

export function Editor({
  initialHtml,
  initialJson,
}: {
  initialHtml: string;
  /** ProseMirror JSON from content_json; null for posts saved before it existed. */
  initialJson: unknown;
}) {
  const htmlRef = useRef<HTMLInputElement>(null);
  const jsonRef = useRef<HTMLInputElement>(null);

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
      }),
      Image.configure({ inline: false, allowBase64: false }),
    ],
    // content_json is the editor's own format and round-trips exactly;
    // content_html is the fallback for anything stored before it, and for rows
    // whose JSON failed to parse on the way in.
    content: (initialJson as JSONContent | null) ?? initialHtml,
    editorProps: {
      attributes: {
        class: "min-h-[320px] outline-none",
        "aria-label": "文章內文編輯區",
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
      canUndo: editor?.can().undo() ?? false,
      canRedo: editor?.can().redo() ?? false,
    }),
  });

  const insertImage = useCallback(() => {
    if (!editor) return;
    const answer = window.prompt("請輸入圖片網址（以 http:// 或 https:// 開頭）");
    if (answer === null) return;

    const url = answer.trim();
    if (!url) return;
    if (!/^https?:\/\//i.test(url)) {
      window.alert("圖片網址必須以 http:// 或 https:// 開頭，這張圖片沒有插入。");
      return;
    }
    editor.chain().focus().setImage({ src: url }).run();
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
          label="分隔線"
          title="插入分隔線"
          onClick={() => editor?.chain().focus().setHorizontalRule().run()}
        />
        <ToolButton label="插入圖片" title="插入圖片" onClick={insertImage} />

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
          "[&_code]:text-[13px]"
        }
        style={{ color: "var(--ink)" }}
      />

      {/* See writeField() above for why these are text inputs rather than hidden ones. */}
      <input ref={htmlRef} type="text" name="content_html" defaultValue={initialHtml} hidden readOnly />
      <input
        ref={jsonRef}
        type="text"
        name="content_json"
        defaultValue={initialJson ? JSON.stringify(initialJson) : ""}
        hidden
        readOnly
      />
    </div>
  );
}
