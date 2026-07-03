"use client";

import React from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import { Bold, Italic, Heading1, Heading2, List, Link2, Image as ImageIcon, Sparkles, Upload } from "lucide-react";
import { toast } from "@/lib/toast";

interface TiptapEditorProps {
  value: string;
  onChange: (html: string) => void;
  token: string | null;
}

export default function TiptapEditor({ value, onChange, token }: TiptapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          style: "color: #f43f5e; font-weight: bold; text-decoration: underline;",
        },
      }),
      Image.configure({
        HTMLAttributes: {
          style: "max-width: 100%; border-radius: 12px; margin: 10px 0; display: block;",
        },
        resize: {
          enabled: true,
          directions: ["top-left", "top-right", "bottom-left", "bottom-right"],
          minWidth: 50,
          minHeight: 50,
          alwaysPreserveAspectRatio: true,
        },
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  // Sync value when parent value changes (e.g. template applied)
  React.useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  if (!editor) {
    return null;
  }

  const setLink = () => {
    const previousUrl = editor.getAttributes("link").url;
    const url = window.prompt("Nhập đường dẫn liên kết (URL):", previousUrl || "https://");
    
    if (url === null) {
      return;
    }

    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!token) {
      toast.error("Không tìm thấy mã xác thực. Vui lòng đăng nhập lại!");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", "polystation/notifications");

    try {
      toast.success("Đang tải ảnh lên Cloudinary...");
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5101/api";
      const response = await fetch(`${API_BASE_URL}/Upload/image`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: formData
      });

      const result = await response.json();
      if (response.ok && result.success) {
        editor.chain().focus().setImage({ src: result.url }).run();
        toast.success("Đã tải ảnh lên và chèn vào nội dung thành công!");
      } else {
        toast.error(result.message || "Tải ảnh lên thất bại");
      }
    } catch (err) {
      console.error(err);
      toast.error("Lỗi khi upload ảnh");
    }
  };

  const insertHighlightBox = () => {
    editor.chain().focus().insertContent(
      `<div style="background:#fff1f2; padding:12px; border-radius:12px; border:1px solid #ffe4e6; color:#e11d48; margin:10px 0;">Nội dung nổi bật ở đây</div>`
    ).run();
  };

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 bg-slate-50 border-b border-slate-200">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`p-1.5 rounded transition-colors text-slate-700 font-extrabold text-[11px] hover:bg-slate-200 flex items-center justify-center w-8 h-8 ${
            editor.isActive("heading", { level: 1 }) ? "bg-slate-200 text-rose-600" : ""
          }`}
          title="Tiêu đề lớn"
        >
          H1
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`p-1.5 rounded transition-colors text-slate-700 font-extrabold text-[11px] hover:bg-slate-200 flex items-center justify-center w-8 h-8 ${
            editor.isActive("heading", { level: 2 }) ? "bg-slate-200 text-rose-600" : ""
          }`}
          title="Tiêu đề trung"
        >
          H2
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-1.5 rounded transition-colors text-slate-700 hover:bg-slate-200 flex items-center justify-center w-8 h-8 ${
            editor.isActive("bold") ? "bg-slate-200 text-rose-600" : ""
          }`}
          title="In đậm"
        >
          <Bold size={14} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-1.5 rounded transition-colors text-slate-700 hover:bg-slate-200 flex items-center justify-center w-8 h-8 ${
            editor.isActive("italic") ? "bg-slate-200 text-rose-600" : ""
          }`}
          title="In nghiêng"
        >
          <Italic size={14} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-1.5 rounded transition-colors text-slate-700 hover:bg-slate-200 flex items-center justify-center w-8 h-8 ${
            editor.isActive("bulletList") ? "bg-slate-200 text-rose-600" : ""
          }`}
          title="Danh sách dấu chấm"
        >
          <List size={14} />
        </button>
        <button
          type="button"
          onClick={setLink}
          className={`p-1.5 rounded transition-colors text-slate-700 hover:bg-slate-200 flex items-center justify-center w-8 h-8 ${
            editor.isActive("link") ? "bg-slate-200 text-rose-600" : ""
          }`}
          title="Chèn liên kết"
        >
          <Link2 size={14} />
        </button>
        <label
          className="p-1.5 rounded transition-colors text-slate-700 hover:bg-slate-200 cursor-pointer flex items-center justify-center w-8 h-8"
          title="Tải ảnh lên và chèn vào nội dung"
        >
          <ImageIcon size={14} />
          <input type="file" onChange={handleFileUpload} className="hidden" accept="image/*" />
        </label>
        <button
          type="button"
          onClick={insertHighlightBox}
          className="px-2 py-1 text-[10px] font-bold rounded transition-colors text-rose-600 bg-rose-50 border border-rose-100 hover:bg-rose-100 flex items-center gap-1 h-8 ml-2"
          title="Chèn hộp nổi bật"
        >
          <Sparkles size={11} /> Nổi bật
        </button>
      </div>

      {/* Content Area */}
      <EditorContent 
        editor={editor} 
        className="prose prose-slate max-w-none text-slate-800 text-sm leading-relaxed p-2 bg-white min-h-[220px]"
      />
    </div>
  );
}
