import { useEffect, useRef } from "react";
import Quill from "quill";
import "quill/dist/quill.snow.css";

type Props = {
  value: string; // HTML
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
};

export default function RichTextEditor({
  value,
  onChange,
  placeholder = "Write here...",
  className = "",
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const quillRef = useRef<Quill | null>(null);
  const lastHtmlRef = useRef<string>("");

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // ✅ StrictMode-safe: wipe previous DOM
    container.innerHTML = "";

    const editorEl = document.createElement("div");
    container.appendChild(editorEl);

    // ✅ your backend base URL
    const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

    const q = new Quill(editorEl, {
      theme: "snow",
      placeholder,
      modules: {
        toolbar: {
          container: [
            [{ header: [1, 2, 3, false] }],
            ["bold", "italic", "underline", "strike"],
            [{ list: "ordered" }, { list: "bullet" }],
            [{ align: [] }],
            ["blockquote", "code-block"],
            ["link", "image"], // ✅ add image button
            ["clean"],
          ],
          handlers: {
            image: () => {
              const input = document.createElement("input");
              input.type = "file";
              input.accept = "image/*";

              input.onchange = async () => {
                const file = input.files?.[0];
                if (!file) return;

                // optional size limit (match backend)
                if (file.size > 2 * 1024 * 1024) {
                  alert("Max 2MB image allowed.");
                  return;
                }

                try {
                  const fd = new FormData();
                  fd.append("image", file);

                  const res = await fetch(`${API_BASE}/api/images`, {
                    method: "POST",
                    body: fd,
                  });

                  if (!res.ok) throw new Error("Image upload failed");
                  const data = await res.json(); // { id, url }

                  // ✅ insert returned URL into editor
                  const range = q.getSelection(true);
                  const index = range ? range.index : q.getLength();
                  const imgUrl = data.url.startsWith("http") ? data.url : `${API_BASE}${data.url}`;

                  q.insertEmbed(index, "image", imgUrl, "user");
                  q.setSelection(index + 1);
                } catch (e: any) {
                  alert(e?.message || "Upload failed");
                }
              };

              input.click();
            },
          },
        },
      },
    });

    quillRef.current = q;

    // ✅ set initial HTML
    if (value) {
      q.clipboard.dangerouslyPasteHTML(value);
      lastHtmlRef.current = value;
    }

    const handler = () => {
      const html = q.root.innerHTML;
      lastHtmlRef.current = html;
      onChange(html);
    };

    q.on("text-change", handler);

    return () => {
      q.off("text-change", handler);
      quillRef.current = null;
      if (containerRef.current) containerRef.current.innerHTML = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ✅ Sync value changes from parent
  useEffect(() => {
    const q = quillRef.current;
    if (!q) return;

    if ((value ?? "") !== (lastHtmlRef.current ?? "")) {
      const sel = q.getSelection();
      q.clipboard.dangerouslyPasteHTML(value || "");
      lastHtmlRef.current = value || "";
      if (sel) q.setSelection(sel);
    }
  }, [value]);

  return (
    <div className={className}>
      <div ref={containerRef} />
    </div>
  );
}