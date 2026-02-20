// src/components/RejectReasonDialog.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FiX } from "react-icons/fi";
import { HiOutlineExclamationTriangle } from "react-icons/hi2";

type Props = {
  open: boolean;
  title?: string;
  description?: string;

  confirmText?: string;
  cancelText?: string;

  loading?: boolean;
  disabled?: boolean;

  // You can prefill (optional)
  initialReason?: string;

  onConfirm: (reason: string) => void;
  onClose: () => void;
};

const Spinner = () => (
  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/70 border-t-white" />
);

export default function RejectReasonDialog({
  open,
  title = "Reject verification?",
  description = "Please provide a clear reason. The instructor will see this message.",
  confirmText = "Reject",
  cancelText = "Cancel",
  loading = false,
  disabled = false,
  initialReason = "",
  onConfirm,
  onClose,
}: Props) {
  const [reason, setReason] = useState(initialReason);
  const [touched, setTouched] = useState(false);

  const closeBtnRef = useRef<HTMLButtonElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // reset when opened
  useEffect(() => {
    if (!open) return;
    setReason(initialReason);
    setTouched(false);
  }, [open, initialReason]);

  // ESC close
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !loading) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, loading, onClose]);

  // focus textarea
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => textareaRef.current?.focus(), 0);
    return () => clearTimeout(t);
  }, [open]);

  // lock scroll
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  const trimmed = reason.trim();
  const reasonError = touched && !trimmed ? "Reject reason is required." : "";
  const confirmDisabled = disabled || loading || !trimmed;

  return createPortal(
    <div className="fixed inset-0 z-[9999] grid place-items-center p-4">
      {/* backdrop */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-[4px]"
        onClick={() => !loading && onClose()}
      />

      {/* modal */}
      <div className="relative w-full max-w-md rounded-2xl border border-base bg-surface shadow-xl">
        {/* close */}
        <button
          ref={closeBtnRef}
          onClick={() => !loading && onClose()}
          className="absolute right-3 top-3 rounded-lg p-1.5 text-muted hover:text-basec hover:bg-black/5 dark:hover:bg-white/5"
        >
          <FiX className="h-5 w-5" />
        </button>

        <div className="px-6 py-7">
          {/* icon */}
          <div className="flex justify-center">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400">
              <HiOutlineExclamationTriangle className="h-6 w-6" />
            </div>
          </div>

          {/* title */}
          <h2 className="mt-4 text-center text-lg font-bold text-basec">{title}</h2>

          {/* desc */}
          {description ? (
            <p className="mt-2 text-center text-sm text-muted leading-relaxed">{description}</p>
          ) : null}

          {/* textarea */}
          <div className="mt-5">
            <label className="text-xs font-semibold text-muted">Reject reason</label>
            <textarea
              ref={textareaRef}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              onBlur={() => setTouched(true)}
              disabled={loading || disabled}
              rows={4}
              placeholder="Example: ID card image is unclear. Please upload a clearer scan."
              className="
                mt-2 w-full rounded-lg border border-base bg-transparent px-3 py-2.5 text-sm text-basec
                placeholder:text-muted/70
                focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-100
                dark:focus:ring-red-500/20
                disabled:opacity-60
              "
            />

            {reasonError ? (
              <p className="mt-2 text-xs font-semibold text-red-600 dark:text-red-400">{reasonError}</p>
            ) : null}
          </div>

          {/* actions */}
          <div className="mt-6 flex gap-3">
            <button
              onClick={() => !loading && onClose()}
              disabled={loading}
              className="
                flex-1 h-10 rounded-lg border border-base text-sm font-semibold text-basec
                hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-60
              "
            >
              {cancelText}
            </button>

            <button
              onClick={() => {
                setTouched(true);
                if (!trimmed) return;
                onConfirm(trimmed);
              }}
              disabled={confirmDisabled}
              className={`
                flex-1 h-10 rounded-lg text-sm font-semibold transition
                flex items-center justify-center gap-2
                ${
                  confirmDisabled
                    ? "bg-red-300 text-white/80 dark:bg-red-500/30 dark:text-white/60 cursor-not-allowed"
                    : "bg-red-600 hover:bg-red-700 text-white dark:bg-red-500 dark:hover:bg-red-400"
                }
              `}
            >
              {loading && <Spinner />}
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}