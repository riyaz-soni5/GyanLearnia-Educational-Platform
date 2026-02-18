// src/components/toast.tsx
import { createContext, useContext, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";

import { HiCheckCircle, HiXCircle, HiInformationCircle } from "react-icons/hi2";
import { IoClose } from "react-icons/io5";

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

function typeConfig(type: ToastType) {
  if (type === "success")
    return {
      iconWrap:
        "bg-green-50 text-green-700 dark:bg-green-900/25 dark:text-green-300",
      IconCmp: HiCheckCircle,
    };

  if (type === "error")
    return {
      iconWrap: "bg-red-50 text-red-700 dark:bg-red-900/25 dark:text-red-300",
      IconCmp: HiXCircle,
    };

  return {
    iconWrap: "bg-gray-50 text-gray-700 dark:bg-gray-800 dark:text-gray-200",
    IconCmp: HiInformationCircle,
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
    const durationMs = opts?.durationMs ?? 1600;

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
                className={[
                  "group overflow-hidden rounded-2xl border border-base bg-surface shadow-md",
                  "supports-[backdrop-filter]:bg-surface/90 supports-[backdrop-filter]:backdrop-blur",
                ].join(" ")}
              >
                <div className="flex gap-3 p-2">
                  <div
                    className={[
                      "mt-0.5 grid h-10 w-10 place-items-center rounded-xl",
                      cfg.iconWrap,
                    ].join(" ")}
                  >
                    <IconCmp className="h-6 w-6" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm text-basec text-center font-semibold leading-relaxed">
                        {t.message}
                      </p>
                    </div>
                  </div>
                </div>

              </div>
            );
          })}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
};