// src/components/instructor/courseBuilder/LessonCard.tsx
import { useRef, useState } from "react";
import { FiChevronUp, FiChevronDown, FiTrash2, FiUploadCloud, FiPaperclip } from "react-icons/fi";
import { useToast } from "../toast";
import { getVideoDurationMin, uploadFileToCloud } from "../../features/instructor/uploadHelpers";
import type { LessonDraft, LessonResource, LessonType } from "../../app/types/course.type";

type Props = {
  lesson: LessonDraft;
  index: number;
  isFirst: boolean;
  isLast: boolean;
  disabled?: boolean;

  onChange: (patch: Partial<LessonDraft>) => void;
  onRemove: () => void;
  onMove: (dir: -1 | 1) => void;
};

export default function LessonCard({
  lesson,
  index,
  isFirst,
  isLast,
  disabled = false,
  onChange,
  onRemove,
  onMove,
}: Props) {
  const { showToast } = useToast();
  const videoRef = useRef<HTMLInputElement | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);

  const resources = lesson.resources ?? [];

  async function uploadVideo(file: File) {
    setUploadingVideo(true);
    try {
      const durationMin = await getVideoDurationMin(file);
      const out = await uploadFileToCloud({ file, kind: "video" });
      onChange({ videoUrl: out.publicUrl, durationMin });
      showToast("Video uploaded", "success");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Video upload failed";
      showToast(msg, "error");
    } finally {
      setUploadingVideo(false);
      if (videoRef.current) videoRef.current.value = "";
    }
  }

  async function uploadResource(file: File) {
    setUploadingFile(true);
    try {
      const out = await uploadFileToCloud({ file, kind: "resource" });

      const next: LessonResource[] = [
        ...resources,
        { name: out.name, url: out.publicUrl, sizeBytes: out.sizeBytes },
      ];

      onChange({ resources: next });
      showToast("File added", "success");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "File upload failed";
      showToast(msg, "error");
    } finally {
      setUploadingFile(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  const type = lesson.type as LessonType;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-gray-500">Lesson {index + 1}</p>

          <div className="mt-3 grid gap-3 sm:grid-cols-12">
            <div className="sm:col-span-6">
              <label className="text-xs font-medium text-gray-700">Lesson Title *</label>
              <input
                value={lesson.title}
                onChange={(e) => onChange({ title: e.target.value })}
                placeholder="e.g., Quadratic Equations (SEE)"
                className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                disabled={disabled}
              />
            </div>

            <div className="sm:col-span-3">
              <label className="text-xs font-medium text-gray-700">Type</label>
              <select
                value={lesson.type}
                onChange={(e) => onChange({ type: e.target.value as LessonType })}
                className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                disabled={disabled}
              >
                <option>Video</option>
                <option>Note</option>
                <option>Quiz</option>
                <option>File</option>
              </select>
            </div>

            {type === "Video" ? (
              <div className="sm:col-span-3">
                <label className="text-xs font-medium text-gray-700">Duration</label>
                <input
                  value={lesson.durationMin > 0 ? `${lesson.durationMin} min` : ""}
                  readOnly
                  className="mt-2 w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-700"
                />

              </div>
            ) : (
              <div className="sm:col-span-3">
                <label className="text-xs font-medium text-gray-700">Duration</label>
                <input
                  value="N/A for this lesson type"
                  readOnly
                  className="mt-2 w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-500"
                />
              </div>
            )}
          </div>

          <label className="mt-4 inline-flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={lesson.isPreview}
              onChange={(e) => onChange({ isPreview: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-200"
              disabled={disabled}
            />
            Mark as Preview (free access)
          </label>

          {/* Type-specific area */}
          <div className="mt-4 rounded-2xl bg-gray-50 p-4">
            {type === "Video" ? (
              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-gray-900">Video Upload</p>

                  <div className="flex items-center gap-2">
                    <input
                      ref={videoRef}
                      type="file"
                      accept="video/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) void uploadVideo(f);
                      }}
                    />

                    <button
                      type="button"
                      disabled={disabled || uploadingVideo}
                      onClick={() => videoRef.current?.click()}
                      className={[
                        "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-white",
                        disabled || uploadingVideo ? "bg-gray-400 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700",
                      ].join(" ")}
                    >
                      <FiUploadCloud className="h-4 w-4" />
                      {uploadingVideo ? "Uploading..." : lesson.videoUrl ? "Replace video" : "Upload video"}
                    </button>
                  </div>
                </div>

                {lesson.videoUrl ? (
                  <video src={lesson.videoUrl} controls className="w-full rounded-xl border border-gray-200 bg-white" />
                ) : (
                  <p className="text-xs text-gray-600">No video uploaded yet.</p>
                )}
              </div>
            ) : null}

            {type === "Note" ? (
              <div className="space-y-2">
                <p className="text-sm font-semibold text-gray-900">Note Content</p>
                <textarea
                  value={lesson.noteText ?? ""}
                  onChange={(e) => onChange({ noteText: e.target.value })}
                  rows={4}
                  placeholder="Write note content for this lesson..."
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  disabled={disabled}
                />
              </div>
            ) : null}

            {type === "Quiz" ? (
              <div className="space-y-2">
                <p className="text-sm font-semibold text-gray-900">Quiz (simple)</p>
                <p className="text-xs text-gray-600">
                  For now, keep quiz authoring minimal. We’ll upgrade to full quiz builder next step.
                </p>

                <input
                  value={lesson.quiz?.questions?.[0]?.q ?? ""}
                  onChange={(e) =>
                    onChange({
                      quiz: {
                        questions: [
                          {
                            q: e.target.value,
                            options: ["A", "B", "C", "D"],
                            answerIndex: 0,
                          },
                        ],
                      },
                    })
                  }
                  placeholder="Question 1 (example)"
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  disabled={disabled}
                />
              </div>
            ) : null}

            {type === "File" ? (
              <div className="space-y-2">
                <p className="text-sm font-semibold text-gray-900">File Lesson</p>
                <p className="text-xs text-gray-600">
                  Upload a file in Resources below. Duration is not required for file lessons.
                </p>
              </div>
            ) : null}
          </div>

          {/* Resources upload */}
          <div className="mt-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold text-gray-900">Resources (PDF/ZIP/etc)</p>

              <div className="flex items-center gap-2">
                <input
                  ref={fileRef}
                  type="file"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void uploadResource(f);
                  }}
                />
                <button
                  type="button"
                  disabled={disabled || uploadingFile}
                  onClick={() => fileRef.current?.click()}
                  className={[
                    "inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-800 hover:bg-gray-50",
                    disabled || uploadingFile ? "opacity-60 cursor-not-allowed" : "",
                  ].join(" ")}
                >
                  <FiPaperclip className="h-4 w-4" />
                  {uploadingFile ? "Uploading..." : "Add file"}
                </button>
              </div>
            </div>

            {resources.length ? (
              <div className="mt-3 space-y-2">
                {resources.map((r, i) => (
                  <div
                    key={r.url + i}
                    className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-gray-900">{r.name}</p>
                      <p className="text-xs text-gray-600">{Math.ceil(r.sizeBytes / 1024)} KB</p>
                    </div>

                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => {
                        const next = resources.filter((_, idx) => idx !== i);
                        onChange({ resources: next });
                      }}
                      className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-800 hover:bg-gray-50 disabled:opacity-60"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-xs text-gray-600">No resources attached.</p>
            )}
          </div>
        </div>

        {/* right actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            title="Move up"
            onClick={() => onMove(-1)}
            disabled={disabled || isFirst}
            className="rounded-lg border border-gray-300 p-2 text-gray-700 hover:bg-gray-50 disabled:opacity-60"
          >
            <FiChevronUp className="h-4 w-4" />
          </button>

          <button
            type="button"
            title="Move down"
            onClick={() => onMove(1)}
            disabled={disabled || isLast}
            className="rounded-lg border border-gray-300 p-2 text-gray-700 hover:bg-gray-50 disabled:opacity-60"
          >
            <FiChevronDown className="h-4 w-4" />
          </button>

          <button
            type="button"
            title="Delete"
            onClick={onRemove}
            disabled={disabled}
            className="rounded-lg border border-gray-300 p-2 text-red-700 hover:bg-red-50 disabled:opacity-60"
          >
            <FiTrash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
