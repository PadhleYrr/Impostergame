import { useEffect, useState } from "react";

interface Toast {
  id: number;
  message: string;
  type: "success" | "error" | "info";
}

let toastId = 0;
let addToast: ((msg: string, type: Toast["type"]) => void) | null = null;

export const toast = {
  success: (msg: string) => addToast?.(msg, "success"),
  error: (msg: string) => addToast?.(msg, "error"),
  info: (msg: string) => addToast?.(msg, "info"),
};

export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    addToast = (message, type) => {
      const id = ++toastId;
      setToasts((t) => [...t, { id, message, type }]);
      setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
    };
    return () => { addToast = null; };
  }, []);

  if (!toasts.length) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 w-[min(90vw,360px)]">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`rounded-2xl px-4 py-3 text-sm font-semibold shadow-card border border-white/10 animate-floatIn backdrop-blur-sm ${
            t.type === "success"
              ? "bg-emerald-500/20 text-emerald-300"
              : t.type === "error"
              ? "bg-red-500/20 text-red-300"
              : "bg-purple-500/20 text-purple-300"
          }`}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}
