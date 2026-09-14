import { useState, useEffect } from "react";
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from "lucide-react";

export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
}

let toastListeners: ((toast: ToastMessage) => void)[] = [];

export function showToast(message: string, type: ToastType = "info") {
  const toast: ToastMessage = {
    id: Math.random().toString(36).substring(2, 9),
    message,
    type,
  };
  toastListeners.forEach((listener) => listener(toast));
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const handleNewToast = (toast: ToastMessage) => {
      setToasts((prev) => [...prev, toast]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== toast.id));
      }, 4000);
    };

    toastListeners.push(handleNewToast);
    return () => {
      toastListeners = toastListeners.filter((l) => l !== handleNewToast);
    };
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col space-y-2 pointer-events-none max-w-sm w-full px-4">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-lg border backdrop-blur-md transition-all duration-300 animate-in slide-in-from-bottom-3 ${
            toast.type === "success"
              ? "bg-emerald-950/90 border-emerald-800 text-emerald-100"
              : toast.type === "error"
              ? "bg-rose-950/90 border-rose-800 text-rose-100"
              : toast.type === "warning"
              ? "bg-amber-950/90 border-amber-800 text-amber-100"
              : "bg-slate-900/95 border-slate-700 text-slate-100"
          }`}
        >
          {toast.type === "success" && <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />}
          {toast.type === "error" && <AlertCircle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />}
          {toast.type === "warning" && <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />}
          {toast.type === "info" && <Info className="h-5 w-5 text-sky-400 shrink-0 mt-0.5" />}
          <div className="flex-1 text-sm font-medium leading-snug">{toast.message}</div>
          <button
            onClick={() => removeToast(toast.id)}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
