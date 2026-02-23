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

      onChange({ resources: next, fileUrl: next[0]?.url });
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
  const quizQuestions = lesson.quiz?.questions ?? [];

  const ensureQuiz = () => ({
    title: lesson.quiz?.title ?? (lesson.title || "Quiz"),
    passPercent: lesson.quiz?.passPercent ?? 60,
    questions:
      quizQuestions.length > 0
        ? quizQuestions
        : [{ q: "", options: ["", "", "", ""], answerIndex: 0, explanation: "" }],
  });

  const addQuizQuestion = () => {
    const quiz = ensureQuiz();
    onChange({
      quiz: {
        ...quiz,
        questions: [...quiz.questions, { q: "", options: ["", "", "", ""], answerIndex: 0, explanation: "" }],
      },
    });
  };

  const removeQuizQuestion = (idx: number) => {
    const quiz = ensureQuiz();
    const next = quiz.questions.filter((_, i) => i !== idx);
    onChange({
      quiz: {
        ...quiz,
        questions: next.length > 0 ? next : [{ q: "", options: ["", "", "", ""], answerIndex: 0, explanation: "" }],
      },
    });
  };

  const updateQuizQuestion = (idx: number, patch: Partial<(typeof quizQuestions)[number]>) => {
    const quiz = ensureQuiz();
    const questions = quiz.questions.map((q, i) => {
      if (i !== idx) return q;
      return {
        ...q,
        ...patch,
        options: Array.isArray((patch as { options?: string[] }).options)
          ? ((patch as { options?: string[] }).options as string[])
          : q.options,
      };
    });
    onChange({ quiz: { ...quiz, questions } });
  };

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
                  <p className="text-xs text-gray-600"></p>
                )}
              </div>
            ) : null}

            {type === "Quiz" ? (
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-12">
                  <div className="sm:col-span-8">
                    <label className="text-xs font-medium text-gray-700">Quiz Title</label>
                    <input
                      value={lesson.quiz?.title ?? lesson.title}
                      onChange={(e) => {
                        const quiz = ensureQuiz();
                        onChange({ quiz: { ...quiz, title: e.target.value } });
                      }}
                      className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                      disabled={disabled}
                    />
                  </div>

                  <div className="sm:col-span-4">
                    <label className="text-xs font-medium text-gray-700">Pass %</label>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={lesson.quiz?.passPercent ?? 60}
                      onChange={(e) => {
                        const quiz = ensureQuiz();
                        onChange({ quiz: { ...quiz, passPercent: Number(e.target.value || 60) } });
                      }}
                      className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                      disabled={disabled}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  {quizQuestions.map((q, idx) => (
                    <div key={idx} className="rounded-xl border border-gray-200 bg-white p-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-semibold text-gray-600">Question {idx + 1}</p>
                        <button
                          type="button"
                          onClick={() => removeQuizQuestion(idx)}
                          disabled={disabled}
                          className="rounded-md border border-gray-300 px-2 py-1 text-[11px] font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                        >
                          Remove
                        </button>
                      </div>

                      <input
                        value={q.q}
                        onChange={(e) => updateQuizQuestion(idx, { q: e.target.value })}
                        placeholder="Write the question"
                        className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                        disabled={disabled}
                      />

                      <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        {q.options.map((opt, optIdx) => (
                          <div key={optIdx} className="flex items-center gap-2">
                            <input
                              type="radio"
                              name={`q-${lesson.id}-${idx}`}
                              checked={q.answerIndex === optIdx}
                              onChange={() => updateQuizQuestion(idx, { answerIndex: optIdx })}
                              disabled={disabled}
                            />
                            <input
                              value={opt}
                              onChange={(e) => {
                                const nextOptions = [...q.options];
                                nextOptions[optIdx] = e.target.value;
                                updateQuizQuestion(idx, { options: nextOptions });
                              }}
                              placeholder={`Option ${optIdx + 1}`}
                              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                              disabled={disabled}
                            />
                          </div>
                        ))}
                      </div>

                      <textarea
                        value={q.explanation ?? ""}
                        onChange={(e) => updateQuizQuestion(idx, { explanation: e.target.value })}
                        rows={2}
                        placeholder="Optional explanation"
                        className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                        disabled={disabled}
                      />
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={addQuizQuestion}
                  disabled={disabled}
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-800 hover:bg-gray-50 disabled:opacity-60"
                >
                  Add Question
                </button>
              </div>
            ) : null}

            {type === "File" ? (
              <div className="space-y-3">
                <p className="text-sm font-semibold text-gray-900">File Lesson</p>
                <p className="text-xs text-gray-600">Attach files only for this lesson type.</p>

                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-gray-900">Files (PDF/ZIP/etc)</p>

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
                  <div className="mt-2 space-y-2">
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
                            onChange({ resources: next, fileUrl: next[0]?.url });
                          }}
                          className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-800 hover:bg-gray-50 disabled:opacity-60"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-xs text-gray-600">No files attached yet.</p>
                )}
              </div>
            ) : null}
          </div>

          {type === "File" && resources.length ? (
            <div className="mt-2 text-xs text-gray-500">
              Primary file: <span className="font-semibold text-gray-700">{resources[0]?.name}</span>
            </div>
          ) : null}
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
