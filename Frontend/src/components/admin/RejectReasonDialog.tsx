import { useEffect, useRef, useState } from "react";
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
  initialReason?: string;
  minLength?: number;
  onConfirm: (reason: string) => void;
  onClose: () => void;
};

type RejectReasonDialogBodyProps = Omit<Props, "open"> & {
  initialReason: string;
  minLength: number;
};

const Spinner = () => (
  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/70 border-t-white" />
);

function RejectReasonDialogBody({
  title = "Reject verification?",
  description = "Please provide a clear reason. The instructor will see this message.",
  confirmText = "Reject",
  cancelText = "Cancel",
  loading = false,
  disabled = false,
  initialReason = "",
  minLength = 1,
  onConfirm,
  onClose,
}: RejectReasonDialogBodyProps) {
  const [reason, setReason] = useState(initialReason);
  const [touched, setTouched] = useState(false);

  const closeBtnRef = useRef<HTMLButtonElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !loading) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [loading, onClose]);

  useEffect(() => {
    const t = setTimeout(() => textareaRef.current?.focus(), 0);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const trimmed = reason.trim();
  const tooShort = trimmed.length < minLength;

  const reasonError =
    touched && !trimmed
      ? "Reject reason is required."
      : touched && tooShort
      ? `Reason must be at least ${minLength} characters.`
      : "";

  const confirmDisabled = disabled || loading || !trimmed || tooShort;

  return createPortal(
    <div className="fixed inset-0 z-[9999] grid place-items-center p-4">
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-[4px]"
        onClick={() => !loading && onClose()}
      />

      <div className="relative w-full max-w-md rounded-2xl border border-base bg-surface shadow-xl">
        <button
          type="button"
          ref={closeBtnRef}
          onClick={() => !loading && onClose()}
          className="absolute right-3 top-3 rounded-lg p-1.5 text-muted hover:text-basec hover:bg-black/5 dark:hover:bg-white/5"
        >
          <FiX className="h-5 w-5" />
        </button>

        <div className="px-6 py-7">
          <div className="flex justify-center">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400">
              <HiOutlineExclamationTriangle className="h-6 w-6" />
            </div>
          </div>

          <h2 className="mt-4 text-center text-lg font-bold text-basec">{title}</h2>

          {description ? (
            <p className="mt-2 text-center text-sm leading-relaxed text-muted">{description}</p>
          ) : null}

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
              className="mt-2 w-full rounded-lg border border-base bg-transparent px-3 py-2.5 text-sm text-basec placeholder:text-muted/70 focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-100 disabled:opacity-60 dark:focus:ring-red-500/20"
            />

            {reasonError ? (
              <p className="mt-2 text-xs font-semibold text-red-600 dark:text-red-400">{reasonError}</p>
            ) : null}
          </div>

          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={() => !loading && onClose()}
              disabled={loading}
              className="h-10 flex-1 rounded-lg border border-base text-sm font-semibold text-basec hover:bg-black/5 disabled:opacity-60 dark:hover:bg-white/5"
            >
              {cancelText}
            </button>

            <button
              type="button"
              onClick={() => {
                setTouched(true);
                if (!trimmed || tooShort) return;
                onConfirm(trimmed);
              }}
              disabled={confirmDisabled}
              className={`
                flex h-10 flex-1 items-center justify-center gap-2 rounded-lg
                text-sm font-semibold transition
                ${
                  confirmDisabled
                    ? "cursor-not-allowed bg-red-300 text-white/80 dark:bg-red-500/30 dark:text-white/60"
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

export default function RejectReasonDialog({
  open,
  title,
  description,
  confirmText,
  cancelText,
  loading,
  disabled,
  initialReason = "",
  minLength = 1,
  onConfirm,
  onClose,
}: Props) {
  if (!open) return null;

  return (
    <RejectReasonDialogBody
      key={initialReason}
      title={title}
      description={description}
      confirmText={confirmText}
      cancelText={cancelText}
      loading={loading}
      disabled={disabled}
      initialReason={initialReason}
      minLength={minLength}
      onConfirm={onConfirm}
      onClose={onClose}
    />
  );
}
