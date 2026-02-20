// src/pages/instructor/InstructorVerificationPage.tsx
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiUploadCloud,
  FiFileText,
  FiShield,
  FiCheckCircle,
  FiAlertTriangle,
  FiX,
  FiClock,
  FiXCircle,
  FiInfo,
  FiEdit2,
  FiEye,
  FiTrash2,
  FiTrash,
} from "react-icons/fi";


import { http } from "../../services/http";
import { getUser } from "../../services/session";
import { useToast } from "../../components/toast";

type UploadRes = { id: string; url?: string };

type VerificationStatus = "NotSubmitted" | "Pending" | "Rejected" | "Verified";
type MyVerificationRes = {
  status: VerificationStatus;
  isVerified: boolean;
  reason: string | null;
  submittedAt: string | null;
};

type ExistingDoc = {
  id: string;
  status: "Pending" | "Verified" | "Rejected";
  fileName?: string;
  createdAt?: string;
} | null;

type MyDocsRes = {
  docs: {
    idCard: ExistingDoc;
    certificate: ExistingDoc;
    experienceLetter: ExistingDoc;
  };
};

const inputBase =
  "w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 " +
  "placeholder:text-gray-400 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-100 " +
  "dark:border-white/10 dark:bg-gray-950 dark:text-white dark:focus:ring-indigo-500/20";

const Card = ({ children }: { children: React.ReactNode }) => (
  <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-gray-900">
    {children}
  </section>
);

const FileRow = ({
  title,
  subtitle,
  required,
  file,
  existing,
  onPick,
  onClear,
  accept,
  disabled,
}: {
  title: string;
  subtitle: string;
  required?: boolean;
  file: File | null;
  existing: ExistingDoc;
  onPick: (f: File) => void;
  onClear: () => void;
  accept: string;
  disabled?: boolean;
}) => {
  const [dragOver, setDragOver] = useState(false);

  const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
  const existingUrl = existing?.id ? `${API_BASE}/api/instructor-docs/${existing.id}` : null;

  // ✅ local preview for newly picked file
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setLocalPreviewUrl(null);
      return;
    }

    // only create objectURL for images; for pdf we show an icon/card
    if (file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      setLocalPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }

    setLocalPreviewUrl(null);
  }, [file]);

  const hasAny = Boolean(file || existing);
  const showEmpty = !hasAny;

  // Determine what we can preview
  const isPickedImage = Boolean(file && file.type.startsWith("image/") && localPreviewUrl);
  const isPickedPdf = Boolean(file && file.type === "application/pdf");

  const existingLooksPdf = Boolean(existing?.fileName?.toLowerCase().endsWith(".pdf"));
  // For existing doc, we can't reliably know contentType from your MyDocsRes,
  // so we infer pdf from filename; otherwise we attempt to render as image.
  const canTryExistingImage = Boolean(existingUrl && !existingLooksPdf);

  const fileLabel = file?.name || existing?.fileName || "Document";

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-white/10 dark:bg-gray-950">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
            <FiFileText className="h-4 w-4" />
            {title}
            {required ? (
              <span className="rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-700 ring-1 ring-red-200 dark:bg-red-500/10 dark:text-red-300 dark:ring-red-500/20">
                Required
              </span>
            ) : (
              <span className="rounded-full bg-gray-50 px-2 py-0.5 text-[11px] font-semibold text-gray-700 ring-1 ring-gray-200 dark:bg-white/5 dark:text-gray-200 dark:ring-white/10">
                Optional
              </span>
            )}
          </p>
          <p className="mt-1 text-xs text-gray-600 dark:text-gray-300">{subtitle}</p>
        </div>

      </div>

      {/* Upload / Preview area */}
      <div
        className={[
          "mt-4 rounded-xl border border-dashed p-4 transition",
          dragOver
            ? "border-indigo-400 bg-indigo-50/40 dark:border-indigo-500/50 dark:bg-indigo-500/10"
            : "border-gray-300 bg-gray-50 dark:border-white/10 dark:bg-white/5",
          disabled ? "opacity-60" : "",
        ].join(" ")}
        onDragOver={(e) => {
          e.preventDefault();
          if (disabled) return;
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (disabled) return;
          const f = e.dataTransfer.files?.[0];
          if (f) onPick(f);
        }}
      >
        {/* ✅ EMPTY STATE */}
        {showEmpty ? (
          <div className="grid place-items-center">
            <div className="flex flex-col items-center text-center">
              <FiUploadCloud className="h-7 w-7 text-gray-600 dark:text-gray-300" />
              <p className="mt-2 text-sm font-semibold text-gray-900 dark:text-white">
                Drag &amp; drop or choose a file
              </p>
              <p className="mt-1 text-xs text-gray-600 dark:text-gray-300">
                PDF/JPG/PNG • Max 2MB
              </p>

              <label
                className={[
                  "mt-3 inline-flex cursor-pointer items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700",
                  disabled ? "opacity-50 cursor-not-allowed pointer-events-none" : "",
                ].join(" ")}
              >
                <input
                  type="file"
                  className="hidden"
                  accept={accept}
                  disabled={disabled}
                  onChange={(e) => {
                    const f = e.target.files?.[0] || null;
                    if (f) onPick(f);
                  }}
                />
                Choose file
              </label>
            </div>
          </div>
        ) : (
          /* ✅ PREVIEW STATE (existing or selected) */
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              {/* Thumbnail */}
              <div className="h-16 w-16 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-white/10 dark:bg-gray-950">
                {isPickedImage ? (
                  <img
                    src={localPreviewUrl as string}
                    alt={fileLabel}
                    className="h-full w-full object-cover"
                  />
                ) : isPickedPdf ? (
                  <div className="grid h-full w-full place-items-center">
                    <FiFileText className="h-7 w-7 text-gray-600 dark:text-gray-300" />
                  </div>
                ) : existingLooksPdf ? (
                  <div className="grid h-full w-full place-items-center">
                    <FiFileText className="h-7 w-7 text-gray-600 dark:text-gray-300" />
                  </div>
                ) : canTryExistingImage ? (
                  <img
                    src={existingUrl as string}
                    alt={fileLabel}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      // if existing is not an image (or auth/cors), fallback icon
                      (e.currentTarget as HTMLImageElement).style.display = "none";
                    }}
                  />
                ) : (
                  <div className="grid h-full w-full place-items-center">
                    <FiFileText className="h-7 w-7 text-gray-600 dark:text-gray-300" />
                  </div>
                )}
              </div>

              {/* Meta */}
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                  {fileLabel}
                </p>
                <p className="mt-0.5 text-xs text-gray-600 dark:text-gray-300">
                  {file
                    ? `${(file.size / 1024).toFixed(0)} KB • Selected`
                    : "Submitted • Using existing"}
                </p>

                {existingUrl ? (
                  <a
                    href={existingUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-indigo-700 hover:underline dark:text-indigo-300"
                  >
                    <FiEye className="h-4 w-4" />
                    Preview
                  </a>
                ) : null}
              </div>
            </div>

            {/* Replace button */}
            <div className="flex flex-wrap items-center gap-2">
              <label
                className={[
                  "inline-flex cursor-pointer items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700",
                  disabled ? "opacity-50 cursor-not-allowed pointer-events-none" : "",
                ].join(" ")}
              >
                <input
                  type="file"
                  className="hidden"
                  accept={accept}
                  disabled={disabled}
                  onChange={(e) => {
                    const f = e.target.files?.[0] || null;
                    if (f) onPick(f);
                  }}
                />
                Choose file
              </label>

              {/* Only show clear for newly selected file */}
              {file ? (
                <button
                  type="button"
                  onClick={onClear}
                  disabled={disabled}
                  className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-800 hover:bg-gray-50 disabled:opacity-50 dark:border-white/10 dark:bg-gray-950 dark:text-gray-200 dark:hover:bg-white/5"
                >
                  <FiTrash color="red"/>
                </button>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const MAX_BYTES = 2 * 1024 * 1024;
const ACCEPT = ".pdf,.png,.jpg,.jpeg";

const statusBadgeClass = (s: VerificationStatus) => {
  if (s === "Verified")
    return "bg-green-50 text-green-700 ring-green-200 dark:bg-green-500/10 dark:text-green-300 dark:ring-green-500/20";
  if (s === "Rejected")
    return "bg-red-50 text-red-700 ring-red-200 dark:bg-red-500/10 dark:text-red-300 dark:ring-red-500/20";
  if (s === "Pending")
    return "bg-yellow-50 text-yellow-800 ring-yellow-200 dark:bg-yellow-500/10 dark:text-yellow-200 dark:ring-yellow-500/20";
  return "bg-gray-50 text-gray-700 ring-gray-200 dark:bg-white/5 dark:text-gray-200 dark:ring-white/10";
};

const prettyStatus = (s: VerificationStatus) => (s === "NotSubmitted" ? "Not submitted" : s);

const InstructorVerificationPage = () => {
  const nav = useNavigate();
  const { showToast } = useToast();

  const me = useMemo(() => getUser(), []);
  const isInstructor = me?.role === "instructor";

  const [fullName, setFullName] = useState(`${me?.firstName ?? ""} ${me?.lastName ?? ""}`.trim());
  const [note, setNote] = useState("");

  const [idCard, setIdCard] = useState<File | null>(null);
  const [certificate, setCertificate] = useState<File | null>(null);
  const [experienceLetter, setExperienceLetter] = useState<File | null>(null);

  const [submitting, setSubmitting] = useState(false);

  const [status, setStatus] = useState<VerificationStatus>("NotSubmitted");
  const [reason, setReason] = useState<string | null>(null);
  const [submittedAt, setSubmittedAt] = useState<string | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);

  // ✅ existing docs from server (so edit doesn't "lose" them)
  const [existingDocs, setExistingDocs] = useState<MyDocsRes["docs"]>({
    idCard: null,
    certificate: null,
    experienceLetter: null,
  });

  // ✅ edit mode (only for Rejected)
  const [editMode, setEditMode] = useState(false);

  const locked = status === "Pending" || status === "Verified";
  const showForm = status === "NotSubmitted" || (status === "Rejected" && editMode);

  useEffect(() => {
    if (!me) nav("/login", { replace: true });
    else if (!isInstructor) nav("/", { replace: true });
  }, [me, isInstructor, nav]);

  const loadMyDocs = async () => {
    try {
      const res = await http<MyDocsRes>("/api/instructor-docs/me");
      setExistingDocs(res.docs);
    } catch (e: any) {
      // not fatal
      setExistingDocs({ idCard: null, certificate: null, experienceLetter: null });
    }
  };

  const loadStatus = async () => {
    setLoadingStatus(true);
    try {
      const res = await http<MyVerificationRes>("/api/instructor-verification/me");
      setStatus(res.status);
      setReason(res.reason);
      setSubmittedAt(res.submittedAt);

      if (res.status !== "Rejected") setEditMode(false);

      // ✅ always refresh docs snapshot too
      await loadMyDocs();
    } catch (e: any) {
      showToast(e?.message || "Failed to load verification status", "error");
      const fallback: VerificationStatus = me?.isVerified ? "Verified" : "NotSubmitted";
      setStatus(fallback);
      setReason(null);
      setSubmittedAt(null);
      setEditMode(false);
      await loadMyDocs();
    } finally {
      setLoadingStatus(false);
    }
  };

  useEffect(() => {
    if (!me || !isInstructor) return;
    loadStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me?.id, isInstructor]);

  const validateFile = (f: File) => {
    const okType = f.type === "application/pdf" || f.type === "image/png" || f.type === "image/jpeg";
    if (!okType) {
      showToast("Only PDF, PNG, JPG files are allowed.", "error");
      return false;
    }
    if (f.size > MAX_BYTES) {
      showToast("Max 2MB per file.", "error");
      return false;
    }
    return true;
  };

  const uploadOne = async (file: File, docType: "idCard" | "certificate" | "experienceLetter") => {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("docType", docType);

    const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

    const res = await fetch(`${API_BASE}/api/instructor-docs`, {
      method: "POST",
      credentials: "include",
      body: fd,
    });

    const data = await res.json().catch(() => null);
    if (!res.ok) throw new Error(data?.message || "Upload failed");
    return data as UploadRes;
  };

  const submitVerification = async () => {
    return http<{ message: string; status: VerificationStatus }>("/api/instructor-verification/submit", {
      method: "POST",
      body: JSON.stringify({}),
    });
  };

  const hasIdCard = Boolean(idCard || existingDocs.idCard);
  const hasCertificate = Boolean(certificate || existingDocs.certificate);

  const onSubmit = async () => {
    if (locked) {
      showToast("Your verification is under review. You cannot edit/submit now.", "error");
      return;
    }

    if (status === "Rejected" && !editMode) {
      showToast("Click Edit to update documents and resubmit.", "error");
      return;
    }

    // ✅ required satisfied by either "new file" OR "existing doc"
    if (!hasIdCard || !hasCertificate) {
      showToast("Please provide ID Card and Certificate (you can keep existing ones).", "error");
      return;
    }

    if (!fullName.trim()) {
      showToast("Please enter your full name.", "error");
      return;
    }

    setSubmitting(true);
    try {
      // ✅ upload only what user changed
      const uploads: Promise<any>[] = [];
      if (idCard) uploads.push(uploadOne(idCard, "idCard"));
      if (certificate) uploads.push(uploadOne(certificate, "certificate"));
      if (experienceLetter) uploads.push(uploadOne(experienceLetter, "experienceLetter"));

      await Promise.all(uploads);

      await submitVerification();

      showToast("Submitted successfully. Status: Pending", "success", { durationMs: 2500 });

      // refresh status + doc snapshot
      await loadStatus();

      // clear only local picked files (server docs still shown)
      setIdCard(null);
      setCertificate(null);
      setExperienceLetter(null);
      setEditMode(false);
    } catch (e: any) {
      showToast(e?.message || "Failed to submit verification", "error", { durationMs: 3500 });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-screen bg-gray-50 px-4 dark:bg-black">
      <main className="mx-auto flex min-h-screen w-full max-w-5xl items-center justify-center py-10">
        <div className="w-full space-y-6">
          {/* Header */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-gray-900">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">Instructor Verification</p>
                <h1 className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">Submit documents to get verified</h1>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Link
                  to="/courses"
                  className="inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-4 py-2 text-xs font-semibold text-gray-800 hover:bg-gray-50 dark:border-white/10 dark:bg-gray-950 dark:text-gray-200 dark:hover:bg-white/5"
                >
                  Skip for now
                </Link>
              </div>
            </div>

            {/* Status panel */}
            <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-white/10 dark:bg-white/5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-gray-600 dark:text-gray-300">Current status</p>

                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ring-1 ${statusBadgeClass(status)}`}>
                      {status === "Pending" ? <FiClock className="h-4 w-4" /> : null}
                      {status === "Rejected" ? <FiXCircle className="h-4 w-4" /> : null}
                      {status === "Verified" ? <FiCheckCircle className="h-4 w-4" /> : null}
                      {status === "NotSubmitted" ? <FiInfo className="h-4 w-4" /> : null}
                      {prettyStatus(status)}
                    </span>

                    {submittedAt ? (
                      <span className="text-xs text-gray-600 dark:text-gray-300">
                        Submitted: {new Date(submittedAt).toLocaleString()}
                      </span>
                    ) : null}
                  </div>

                  {loadingStatus ? <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">Loading status...</p> : null}

                  {status === "Pending" ? (
                    <p className="mt-2 text-xs text-gray-600 dark:text-gray-300">
                      Your documents are under review. Please wait for admin approval/rejection.
                    </p>
                  ) : null}

                  {status === "Rejected" && reason ? (
                    <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
                      <p className="font-semibold">Admin message</p>
                      <p className="mt-1 text-sm">{reason}</p>
                      <p className="mt-2 text-xs">
                        Click <span className="font-semibold">Edit</span> to update documents and resubmit.
                      </p>
                    </div>
                  ) : null}
                </div>

                <div className="flex flex-wrap items-center justify-end gap-2">
                  {status === "Rejected" ? (
                    <button
                      type="button"
                      onClick={() => setEditMode(true)}
                      disabled={submitting || loadingStatus}
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-xs font-semibold text-white hover:bg-gray-800 disabled:opacity-60"
                    >
                      <FiEdit2 className="h-4 w-4" />
                      Edit
                    </button>
                  ) : null}

                </div>
              </div>
            </div>

            {/* Before you submit only when form visible */}
            {showForm ? (
              <div className="mt-4 rounded-xl border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800 dark:border-yellow-500/30 dark:bg-yellow-500/10 dark:text-yellow-200">
                <div className="flex items-start gap-2">
                  <FiAlertTriangle className="mt-0.5 h-4 w-4" />
                  <div>
                    <p className="font-semibold">Before you submit</p>
                    <ul className="mt-1 list-disc pl-5 text-xs leading-relaxed">
                      <li>Upload clear scans/photos (PDF/JPG/PNG).</li>
                      <li>Max 2MB per file</li>
                      <li>You can keep already submitted documents and only replace the ones you want.</li>
                    </ul>
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          {/* Body: show only when allowed */}
          {showForm ? (
            <div className="space-y-6">
              <Card>
                <h2 className="text-sm font-bold text-gray-900 dark:text-white">Basic details</h2>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Full name</label>
                    <input
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className={`${inputBase} mt-2`}
                      placeholder="Your full name"
                      disabled={submitting}
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Note to admin (optional)</label>
                    <textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      className={`${inputBase} mt-2 min-h-[96px]`}
                      placeholder="Example: I teach +2 Physics at XYZ College..."
                      disabled={submitting}
                    />
                  </div>
                </div>
              </Card>

              <Card>
                <h2 className="text-sm font-bold text-gray-900 dark:text-white">Upload documents</h2>
                <p className="mt-1 text-xs text-gray-600 dark:text-gray-300">
                  Required documents must be provided. You can keep already submitted ones.
                </p>

                <div className="mt-4 space-y-4">
                  <FileRow
                    title="ID Card"
                    subtitle="College/School ID card or government-issued ID."
                    required
                    file={idCard}
                    existing={existingDocs.idCard}
                    accept={ACCEPT}
                    disabled={submitting}
                    onPick={(f) => {
                      if (!validateFile(f)) return;
                      setIdCard(f);
                    }}
                    onClear={() => setIdCard(null)}
                  />

                  <FileRow
                    title="Certificate"
                    subtitle="Teaching license, degree certificate, training certificate, etc."
                    required
                    file={certificate}
                    existing={existingDocs.certificate}
                    accept={ACCEPT}
                    disabled={submitting}
                    onPick={(f) => {
                      if (!validateFile(f)) return;
                      setCertificate(f);
                    }}
                    onClear={() => setCertificate(null)}
                  />

                  <FileRow
                    title="Experience Letter"
                    subtitle=""
                    file={experienceLetter}
                    existing={existingDocs.experienceLetter}
                    accept={ACCEPT}
                    disabled={submitting}
                    onPick={(f) => {
                      if (!validateFile(f)) return;
                      setExperienceLetter(f);
                    }}
                    onClear={() => setExperienceLetter(null)}
                  />
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={onSubmit}
                    disabled={submitting || !hasIdCard || !hasCertificate}
                    className={[
                      "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white transition",
                      submitting || !hasIdCard || !hasCertificate ? "bg-gray-400 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700",
                    ].join(" ")}
                  >
                    <FiUploadCloud className="h-4 w-4" />
                    {submitting ? "Submitting..." : status === "Rejected" ? "Resubmit for verification" : "Submit for verification"}
                  </button>
                </div>
              </Card>
            </div>
          ) : null}
        </div>
      </main>
    </div>
  );
};

export default InstructorVerificationPage;