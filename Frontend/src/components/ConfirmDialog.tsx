import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { FiX } from "react-icons/fi";
import { HiOutlineExclamationTriangle } from "react-icons/hi2";
import { FiHelpCircle } from "react-icons/fi";

type Tone = "danger" | "primary" | "neutral";

type Props = {
  open: boolean;
  title: string;
  description?: string;

  confirmText?: string;
  cancelText?: string;

  tone?: Tone;
  loading?: boolean;
  disabled?: boolean;

  onConfirm: () => void;
  onClose: () => void;
};

function toneConfig(tone: Tone) {
  if (tone === "danger") {
    return {
      iconWrap:
        "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400",
      IconCmp: HiOutlineExclamationTriangle,
      confirmBtn:
        "bg-red-600 hover:bg-red-700 text-white dark:bg-red-500 dark:hover:bg-red-400",
      confirmBtnDisabled:
        "bg-red-300 text-white/80 dark:bg-red-500/30 dark:text-white/60 cursor-not-allowed",
    };
  }

  if (tone === "primary") {
    return {
      iconWrap:
        "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300",
      IconCmp: FiHelpCircle,
      confirmBtn:
        "bg-indigo-600 hover:bg-indigo-700 text-white dark:bg-indigo-500 dark:hover:bg-indigo-400",
      confirmBtnDisabled:
        "bg-indigo-300 text-white/80 dark:bg-indigo-500/30 dark:text-white/60 cursor-not-allowed",
    };
  }

  return {
    iconWrap:
      "bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-gray-200",
    IconCmp: FiHelpCircle,
    confirmBtn:
      "bg-gray-900 hover:bg-black text-white dark:bg-white dark:text-gray-900",
    confirmBtnDisabled:
      "bg-gray-300 text-white/80 dark:bg-white/10 dark:text-white/60 cursor-not-allowed",
  };
}

const Spinner = () => (
  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/70 border-t-white" />
);

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  tone = "neutral",
  loading = false,
  disabled = false,
  onConfirm,
  onClose,
}: Props) {
  const cfg = toneConfig(tone);
  const IconCmp = cfg.IconCmp;

  const closeBtnRef = useRef<HTMLButtonElement | null>(null);

  // ESC close
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !loading) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, loading, onClose]);

  // focus close button
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => closeBtnRef.current?.focus(), 0);
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

  const confirmDisabled = disabled || loading;

  return createPortal(
    <div className="fixed inset-0 z-[9999] grid place-items-center p-4">
      {/* backdrop */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-[4px]"
        onClick={() => !loading && onClose()}
      />

      {/* modal */}
      <div
        className="
          relative w-full max-w-md
          rounded-2xl
          border border-base
          bg-surface
          shadow-xl
        "
      >
        {/* close */}
        <button
          ref={closeBtnRef}
          onClick={() => !loading && onClose()}
          className="
            absolute right-3 top-3
            rounded-lg p-1.5
            text-muted hover:text-basec
            hover:bg-black/5 dark:hover:bg-white/5
          "
        >
          <FiX className="h-5 w-5" />
        </button>

        <div className="px-6 py-7 text-center">
          {/* icon */}
          <div className="flex justify-center">
            <div className={`grid h-12 w-12 place-items-center rounded-full ${cfg.iconWrap}`}>
              <IconCmp className="h-6 w-6" />
            </div>
          </div>

          {/* title */}
          <h2 className="mt-4 text-lg font-bold text-basec">
            {title}
          </h2>

          {/* desc */}
          {description && (
            <p className="mt-2 text-sm text-muted leading-relaxed">
              {description}
            </p>
          )}

          {/* actions */}
          <div className="mt-6 flex gap-3">
            <button
              onClick={() => !loading && onClose()}
              disabled={loading}
              className="
                flex-1 h-10
                rounded-lg border border-base
                text-sm font-semibold text-basec
                hover:bg-black/5 dark:hover:bg-white/5
                disabled:opacity-60
              "
            >
              {cancelText}
            </button>

            <button
              onClick={onConfirm}
              disabled={confirmDisabled}
              className={`
                flex-1 h-10 rounded-lg
                text-sm font-semibold
                transition
                flex items-center justify-center gap-2
                ${
                  confirmDisabled
                    ? cfg.confirmBtnDisabled
                    : cfg.confirmBtn
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