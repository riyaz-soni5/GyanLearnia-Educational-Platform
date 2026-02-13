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

    // ✅ StrictMode-safe: if React remounts, wipe previous DOM
    container.innerHTML = "";

    // Quill needs an inner element to mount into
    const editorEl = document.createElement("div");
    container.appendChild(editorEl);

    const q = new Quill(editorEl, {
      theme: "snow",
      placeholder,
      modules: {
        toolbar: [
          [{ header: [1, 2, 3, false] }],
          ["bold", "italic", "underline", "strike"],
          [{ list: "ordered" }, { list: "bullet" }],
          [{ align: [] }],
          ["blockquote", "code-block"],
          ["link"],
          ["clean"],
        ],
      },
    });

    quillRef.current = q;

    // set initial HTML
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
      // ✅ remove listener
      q.off("text-change", handler);

      // ✅ destroy DOM Quill created (prevents duplicate toolbar)
      quillRef.current = null;
      if (containerRef.current) containerRef.current.innerHTML = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // If parent updates value (rare), sync it
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