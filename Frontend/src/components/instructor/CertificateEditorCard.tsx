import { useRef, useState } from "react";
import { FiUploadCloud } from "react-icons/fi";
import { uploadFileToCloud } from "../../features/instructor/uploadHelpers";
import { useToast } from "../toast";

type CertificateDraft = {
  enabled: boolean;
  templateImageUrl?: string;
  nameXPercent: number;
  nameYPercent: number;
  nameFontSizePx: number;
  nameColor: string;
};

type Props = {
  value: CertificateDraft;
  onChange: (next: CertificateDraft) => void;
};

export default function CertificateEditorCard({ value, onChange }: Props) {
  const { showToast } = useToast();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);

  const update = (patch: Partial<CertificateDraft>) => onChange({ ...value, ...patch });

  const onPick = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      showToast("Certificate template must be an image", "error");
      return;
    }
    setUploading(true);
    try {
      const out = await uploadFileToCloud({ file, kind: "thumbnail" });
      update({ templateImageUrl: out.publicUrl });
      showToast("Certificate template uploaded", "success");
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : "Upload failed", "error");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Certificate</h2>
          <p className="mt-1 text-sm text-gray-600">Enable and configure certificate template for this course.</p>
        </div>
        <label className="inline-flex items-center gap-2 text-sm font-semibold text-gray-800">
          <input
            type="checkbox"
            checked={value.enabled}
            onChange={(e) => update({ enabled: e.target.checked })}
          />
          Include certificate
        </label>
      </div>

      {value.enabled ? (
        <div className="mt-5 space-y-4">
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
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:bg-gray-400"
          >
            <FiUploadCloud className="h-4 w-4" />
            {uploading ? "Uploading..." : "Upload Certificate Template"}
          </button>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-xs font-medium text-gray-700">
              Name X Position (%)
              <input
                type="range"
                min={0}
                max={100}
                value={value.nameXPercent}
                onChange={(e) => update({ nameXPercent: Number(e.target.value) })}
                className="mt-2 w-full"
              />
            </label>
            <label className="text-xs font-medium text-gray-700">
              Name Y Position (%)
              <input
                type="range"
                min={0}
                max={100}
                value={value.nameYPercent}
                onChange={(e) => update({ nameYPercent: Number(e.target.value) })}
                className="mt-2 w-full"
              />
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-xs font-medium text-gray-700">
              Font Size (px)
              <input
                type="number"
                min={16}
                max={96}
                value={value.nameFontSizePx}
                onChange={(e) => update({ nameFontSizePx: Number(e.target.value || 42) })}
                className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </label>
            <label className="text-xs font-medium text-gray-700">
              Name Color
              <input
                type="color"
                value={value.nameColor}
                onChange={(e) => update({ nameColor: e.target.value })}
                className="mt-2 h-10 w-full rounded-lg border border-gray-300 bg-white"
              />
            </label>
          </div>

          {value.templateImageUrl ? (
            <div className="relative overflow-hidden rounded-xl border border-gray-200">
              <img src={value.templateImageUrl} alt="Certificate template" className="w-full object-cover" />
              <div
                className="absolute -translate-x-1/2 -translate-y-1/2 font-bold"
                style={{
                  left: `${value.nameXPercent}%`,
                  top: `${value.nameYPercent}%`,
                  fontSize: `${value.nameFontSizePx}px`,
                  color: value.nameColor,
                }}
              >
                Student Name
              </div>
            </div>
          ) : (
            <p className="text-xs text-amber-700">Upload a template image to enable certificate generation.</p>
          )}
        </div>
      ) : null}
    </section>
  );
}
