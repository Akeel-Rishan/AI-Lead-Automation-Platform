"use client";

import { CheckCircle, Info, X, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export type ToastType = "success" | "error" | "info";

export type ToastMessage = {
  id: string;
  message: string;
  type: ToastType;
};

type ToastProps = ToastMessage & {
  onClose: () => void;
};

const toastStyles: Record<ToastType, string> = {
  success: "border-green-500/30 bg-green-950/90 text-green-100",
  error: "border-red-500/30 bg-red-950/90 text-red-100",
  info: "border-indigo-500/30 bg-indigo-950/90 text-indigo-100"
};

const iconStyles: Record<ToastType, string> = {
  success: "text-green-300",
  error: "text-red-300",
  info: "text-indigo-300"
};

function ToastIcon({ type }: { type: ToastType }) {
  if (type === "success") {
    return <CheckCircle className={cn("h-5 w-5", iconStyles[type])} />;
  }

  if (type === "error") {
    return <XCircle className={cn("h-5 w-5", iconStyles[type])} />;
  }

  return <Info className={cn("h-5 w-5", iconStyles[type])} />;
}

export function Toast({ id: _id, message, type, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const showTimer = window.setTimeout(() => setIsVisible(true), 20);
    const closeTimer = window.setTimeout(onClose, 4000);

    return () => {
      window.clearTimeout(showTimer);
      window.clearTimeout(closeTimer);
    };
  }, [onClose]);

  return (
    <div
      className={cn(
        "flex w-full max-w-sm translate-x-6 items-start gap-3 rounded-lg border p-4 opacity-0 shadow-xl shadow-black/30 transition-all duration-300",
        toastStyles[type],
        isVisible && "translate-x-0 opacity-100"
      )}
    >
      <ToastIcon type={type} />
      <p className="min-w-0 flex-1 text-sm font-medium">{message}</p>
      <button
        aria-label="Close notification"
        className="rounded text-current opacity-70 transition hover:opacity-100"
        onClick={onClose}
        type="button"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export function ToastContainer({
  toasts,
  removeToast
}: {
  toasts: ToastMessage[];
  removeToast: (id: string) => void;
}) {
  return (
    <div className="fixed bottom-6 right-6 z-[60] flex w-[calc(100%-3rem)] max-w-sm flex-col gap-3">
      {toasts.map((toast) => (
        <Toast
          id={toast.id}
          key={toast.id}
          message={toast.message}
          onClose={() => removeToast(toast.id)}
          type={toast.type}
        />
      ))}
    </div>
  );
}
