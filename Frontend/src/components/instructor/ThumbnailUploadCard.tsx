// src/components/instructor/courseBuilder/ThumbnailUploadCard.tsx
import { useRef, useState } from "react";
import { FiImage, FiUploadCloud, FiX } from "react-icons/fi";
import { useToast } from "../toast";
import { uploadFileToCloud } from "../../features/instructor/uploadHelpers";

type Props = {
  thumbnailUrl?: string;
  onChange: (url?: string) => void;
};

export default function ThumbnailUploadCard({ thumbnailUrl, onChange }: Props) {
  const { showToast } = useToast();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);

  async function onPick(file: File) {
    if (!file.type.startsWith("image/")) {
      showToast("Only image files allowed (JPG/PNG/WebP).", "error");
      return;
    }

    setUploading(true);
    try {
      const out = await uploadFileToCloud({ file, kind: "thumbnail" });
      onChange(out.publicUrl);
      showToast("Thumbnail uploaded", "success");
    } catch (e: any) {
      showToast(e?.message || "Thumbnail upload failed", "error");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-gray-900">Thumbnail</p>
          <p className="mt-1 text-xs text-gray-600">
             (recommended 1280×720)
          </p>
        </div>

        {thumbnailUrl ? (
          <button
            type="button"
            onClick={() => onChange(undefined)}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-800 hover:bg-gray-50"
          >
            <FiX className="h-4 w-4" />
            Remove
          </button>
        ) : null}
      </div>

      <div className="mt-4 rounded-xl bg-white">
        <div className="grid gap-4 sm:grid-cols-12">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void onPick(f);
            }}
          />

          <button
            type="button"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
            className={[
              "col-span-12 flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition w-full",
              uploading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-indigo-600 hover:bg-indigo-700",
            ].join(" ")}
          >
            <FiUploadCloud className="h-4 w-4" />
            {uploading ? "Uploading..." : "Upload"}
          </button>
        </div>
      </div>

      {thumbnailUrl ? (
        <div className="mt-4 overflow-hidden rounded-2xl border border-gray-200">
          <img src={thumbnailUrl} alt="Thumbnail preview" className="h-44 w-full object-cover" />
        </div>
      ) : null}
    </div>
  );
}