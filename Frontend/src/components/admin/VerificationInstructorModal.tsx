// src/components/admin/VerificationInstructorModal.tsx
import { FiX, FiExternalLink, FiFileText } from "react-icons/fi";
import type { AdminVerificationItem, VerificationStatus } from "@/services/adminVerification";
import { useMemo, useState } from "react";
import ConfirmDialog from "../ConfirmDialog"; // adjust path if needed
import RejectReasonDialog from "../admin/RejectReasonDialog"; // ✅ new

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

type Props = {
  item: AdminVerificationItem;
  busy?: boolean;
  onClose: () => void;
  onApprove: () => void;
  onReject: (reason: string) => void; // ✅ keep reason
};

export default function VerificationInstructorModal({
  item,
  busy,
  onClose,
  onApprove,
  onReject,
}: Props) {
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);

  const submittedLabel = useMemo(() => {
    try {
      return new Date(item.submittedAt).toLocaleString();
    } catch {
      return item.submittedAt;
    }
  }, [item.submittedAt]);

  const docUrl = (id?: string) => (id ? `${API_BASE}/api/instructor-docs/${id}` : "");

  const DocLink = ({
    title,
    id,
    missingText,
  }: {
    title: string;
    id?: string;
    missingText?: string;
  }) => {
    const ok = Boolean(id);
    return (
      <div className="rounded-xl bg-gray-50 p-4 ring-1 ring-gray-200">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-sm font-semibold text-gray-900">
              <FiFileText className="h-4 w-4 text-gray-700" />
              {title}
            </p>
            <p className="mt-1 text-xs text-gray-600">
              {ok ? "Uploaded" : missingText || "Missing"}
            </p>
          </div>

          {ok ? (
            <a
              href={docUrl(id)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-800 hover:bg-gray-50"
              title="Open document"
            >
              <FiExternalLink className="h-4 w-4" />
              Open
            </a>
          ) : (
            <span className="rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-semibold text-red-700 ring-1 ring-red-200">
              Not provided
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-gray-200 p-6">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-gray-500">Verification Details</p>
            <h3 className="mt-1 truncate text-xl font-bold text-gray-900">{item.fullName}</h3>
            <p className="mt-1 text-sm text-gray-600">{item.email}</p>
            {item.institute ? (
              <p className="mt-1 text-xs text-gray-600">{item.institute}</p>
            ) : null}
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50 disabled:opacity-60"
          >
            <FiX className="h-4 w-4" />
            Close
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Meta */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-gray-50 px-3 py-1 text-xs font-semibold text-gray-700 ring-1 ring-gray-200">
              Submitted: {submittedLabel}
            </span>
            <span
              className={[
                "rounded-full px-3 py-1 text-xs font-semibold ring-1",
                item.status === "Verified"
                  ? "bg-green-50 text-green-700 ring-green-200"
                  : item.status === "Rejected"
                  ? "bg-red-50 text-red-700 ring-red-200"
                  : "bg-yellow-50 text-yellow-700 ring-yellow-200",
              ].join(" ")}
            >
              {item.status}
            </span>
          </div>

          {/* Expertise */}
          <div>
            <p className="text-sm font-bold text-gray-900">Expertise</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {item.expertise?.length ? (
                item.expertise.map((e) => (
                  <span
                    key={e}
                    className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 ring-1 ring-indigo-200"
                  >
                    {e}
                  </span>
                ))
              ) : (
                <span className="text-xs text-gray-500">No expertise provided</span>
              )}
            </div>
          </div>

          {/* Documents */}
          <div>
            <p className="text-sm font-bold text-gray-900">Documents</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <DocLink title="ID Card" id={item.docIds?.idCard} />
              <DocLink title="Certificate" id={item.docIds?.certificate} />
              <DocLink
                title="Experience Letter"
                id={item.docIds?.experienceLetter}
                missingText="Optional"
              />
            </div>
          </div>

          {/* Notes */}
          {item.notes ? (
            <div className="rounded-2xl bg-gray-50 p-4 ring-1 ring-gray-200">
              <p className="text-xs font-semibold text-gray-700">Notes</p>
              <p className="mt-1 text-sm text-gray-700">{item.notes}</p>
            </div>
          ) : null}
        </div>
        {/* Footer actions */}
        <div className="flex flex-wrap justify-end gap-2 border-t border-gray-200 p-6">
          {item.status === "Pending" ? (
            <>
              <button
                type="button"
                disabled={busy}
                className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60"
                onClick={() => setRejectOpen(true)}
              >
                Reject
              </button>

              <button
                type="button"
                disabled={busy}
                className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
                onClick={() => setApproveOpen(true)}
              >
                Approve
              </button>
            </>
          ) : (
            <button
              type="button"
              className="rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-800"
              onClick={onClose}
            >
              Done
            </button>
          )}
        </div>

        {/* ✅ Approve confirmation */}
        <ConfirmDialog
          open={approveOpen}
          title="Approve instructor verification?"
          description="This will mark the instructor as Verified and unlock instructor features."
          tone="primary"
          confirmText="Approve"
          cancelText="Cancel"
          loading={Boolean(busy)}
          disabled={Boolean(busy)}
          onClose={() => setApproveOpen(false)}
          onConfirm={async () => {
            await onApprove();
            setApproveOpen(false);
          }}
        />

        {/* ✅ Reject with reason */}
        <RejectReasonDialog
          open={rejectOpen}
          title="Reject instructor verification?"
          description="Write a reason. The instructor will see it and can resubmit."
          loading={Boolean(busy)}
          disabled={Boolean(busy)}
          confirmText="Reject"
          cancelText="Cancel"
          onClose={() => setRejectOpen(false)}
          onConfirm={async (reason) => {
            await onReject(reason);
            setRejectOpen(false);
          }}
        />
      </div>
    </div>
  );
}