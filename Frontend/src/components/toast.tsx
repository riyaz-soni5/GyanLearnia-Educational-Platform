// src/components/toast.tsx
import { createContext, useContext, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";

type ToastType = "success" | "error" | "info";

type Toast = {
  id: number;
  message: string;
  type: ToastType;
  createdAt: number;
  durationMs: number;
};

type ToastContextType = {
  showToast: (
    message: string,
    type?: ToastType,
    opts?: { durationMs?: number }
  ) => void;
};

const ToastContext = createContext<ToastContextType | null>(null);

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx;
};

const Icon = {
  Success: (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...p}>
      <path
        d="M12 22a10 10 0 1 0-10-10 10 10 0 0 0 10 10z"
        className="stroke-current"
        strokeWidth="1.8"
      />
      <path
        d="M8 12.5l2.3 2.3L16.5 9"
        className="stroke-current"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  Error: (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...p}>
      <path
        d="M12 22a10 10 0 1 0-10-10 10 10 0 0 0 10 10z"
        className="stroke-current"
        strokeWidth="1.8"
      />
      <path
        d="M9 9l6 6M15 9l-6 6"
        className="stroke-current"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  ),
  Info: (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...p}>
      <path
        d="M12 22a10 10 0 1 0-10-10 10 10 0 0 0 10 10z"
        className="stroke-current"
        strokeWidth="1.8"
      />
      <path
        d="M12 10v6"
        className="stroke-current"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path
        d="M12 7h.01"
        className="stroke-current"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  ),
  Close: (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...p}>
      <path
        d="M6 6l12 12M18 6L6 18"
        className="stroke-current"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  ),
};

function typeConfig(type: ToastType) {
  if (type === "success")
    return {
      iconWrap:
        "bg-green-50 text-green-700 dark:bg-green-900/25 dark:text-green-300",
      bar: "bg-green-600 dark:bg-green-400",
      IconCmp: Icon.Success,
    };

  if (type === "error")
    return {
      iconWrap: "bg-red-50 text-red-700 dark:bg-red-900/25 dark:text-red-300",
      bar: "bg-red-600 dark:bg-red-400",
      IconCmp: Icon.Error,
    };

  return {
    iconWrap:
      "bg-gray-50 text-gray-700 dark:bg-gray-800 dark:text-gray-200",
    bar: "bg-gray-900 dark:bg-gray-200",
    IconCmp: Icon.Info,
  };
}

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Record<number, number>>({});

  const removeToast = (id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    if (timers.current[id]) window.clearTimeout(timers.current[id]);
    delete timers.current[id];
  };

  const showToast: ToastContextType["showToast"] = (
    message,
    type = "success",
    opts
  ) => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    const durationMs = opts?.durationMs ?? 2800;

    const toast: Toast = {
      id,
      message,
      type,
      createdAt: Date.now(),
      durationMs,
    };

    setToasts((prev) => [...prev, toast]);
    timers.current[id] = window.setTimeout(() => removeToast(id), durationMs);
  };

  const value = useMemo(() => ({ showToast }), []);

  return (
    <ToastContext.Provider value={value}>
      {children}

      {createPortal(
        <div className="fixed right-4 top-4 z-[9999] flex w-[min(420px,calc(100vw-2rem))] flex-col gap-3">
          {toasts.map((t) => {
            const cfg = typeConfig(t.type);
            const IconCmp = cfg.IconCmp;

            return (
              <div
                key={t.id}
                onMouseEnter={() => {
                  if (timers.current[t.id]) window.clearTimeout(timers.current[t.id]);
                }}
                onMouseLeave={() => {
                  timers.current[t.id] = window.setTimeout(
                    () => removeToast(t.id),
                    1200
                  );
                }}
                className={[
                  "group overflow-hidden rounded-2xl border border-base bg-surface shadow-md",
                  "supports-[backdrop-filter]:bg-surface/90 supports-[backdrop-filter]:backdrop-blur",
                ].join(" ")}
              >
                <div className="flex gap-3 p-4">
                  <div
                    className={[
                      "mt-0.5 grid h-10 w-10 place-items-center rounded-xl",
                      cfg.iconWrap,
                    ].join(" ")}
                  >
                    <IconCmp className="h-5 w-5" />
                  </div>

                  <div className="min-w-0 flex-1">
                    {/* ✅ No title (Success/Error removed) */}
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm text-basec font-semibold leading-relaxed">
                        {t.message}
                      </p>

                      <button
                        type="button"
                        onClick={() => removeToast(t.id)}
                        className="rounded-lg p-1 text-muted hover:text-basec"
                        aria-label="Close toast"
                      >
                        <Icon.Close className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* ✅ progress bar: matches type + animates over duration */}
                <div className="h-1 w-full bg-[rgb(var(--bg))]">
                  <div
                    className={["h-full origin-left", cfg.bar].join(" ")}
                    style={{
                      animation: `gl-toast-progress ${t.durationMs}ms linear forwards`,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>,
        document.body
      )}

      {/* keyframes injected once */}
      {createPortal(
        <style>
          {`
            @keyframes gl-toast-progress {
              from { transform: scaleX(1); }
              to   { transform: scaleX(0); }
            }
          `}
        </style>,
        document.head
      )}
    </ToastContext.Provider>
  );
};