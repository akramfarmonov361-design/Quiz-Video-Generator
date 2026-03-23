import React from "react";
import { X, CheckCircle, AlertCircle, Info } from "lucide-react";
import { ToastMessage, ToastType } from "../hooks/useToast";

const iconMap: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle size={20} className="text-emerald-400 shrink-0" />,
  error: <AlertCircle size={20} className="text-red-400 shrink-0" />,
  info: <Info size={20} className="text-blue-400 shrink-0" />,
};

const borderMap: Record<ToastType, string> = {
  success: "border-emerald-500/30",
  error: "border-red-500/30",
  info: "border-blue-500/30",
};

const bgMap: Record<ToastType, string> = {
  success: "bg-emerald-500/10",
  error: "bg-red-500/10",
  info: "bg-blue-500/10",
};

interface ToastContainerProps {
  toasts: ToastMessage[];
  onRemove: (id: number) => void;
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-6 right-6 z-[200] flex flex-col gap-3 max-w-sm">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-start gap-3 px-4 py-3 rounded-xl border ${borderMap[toast.type]} ${bgMap[toast.type]} bg-neutral-900/95 backdrop-blur-md shadow-2xl text-white animate-in slide-in-from-right-5 fade-in duration-300`}
        >
          {iconMap[toast.type]}
          <p className="text-sm font-medium flex-1">{toast.message}</p>
          <button
            onClick={() => onRemove(toast.id)}
            className="text-neutral-500 hover:text-white transition-colors shrink-0"
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}
