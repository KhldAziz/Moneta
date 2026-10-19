import React, { useEffect, useState } from 'react';
import { RotateCcw, X, CheckCircle, AlertTriangle, AlertOctagon, Info } from 'lucide-react';

export interface ToastData {
  id: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'danger';
  durationMs?: number;
  undoAction?: () => void;
  undoLabel?: string;
}

interface ToastProps {
  toast: ToastData | null;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ toast, onClose }) => {
  const [countdown, setCountdown] = useState<number>(5);

  useEffect(() => {
    if (!toast) return;

    if (toast.undoAction) {
      setCountdown(5);
      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            onClose();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    } else {
      const timer = setTimeout(() => {
        onClose();
      }, toast.durationMs || 4000);
      return () => clearTimeout(timer);
    }
  }, [toast, onClose]);

  if (!toast) return null;

  const getTypeStyle = () => {
    switch (toast.type) {
      case 'danger':
        return 'bg-moneta-danger text-white';
      case 'warning':
        return 'bg-amber-600 text-white';
      case 'success':
        return 'bg-teal-700 text-white';
      case 'info':
      default:
        return 'bg-slate-900 text-white';
    }
  };

  const getIcon = () => {
    switch (toast.type) {
      case 'danger':
        return <AlertOctagon size={18} />;
      case 'warning':
        return <AlertTriangle size={18} />;
      case 'success':
        return <CheckCircle size={18} />;
      default:
        return <Info size={18} />;
    }
  };

  return (
    <div className="fixed bottom-20 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 w-11/12 max-w-md animate-in slide-in-from-bottom duration-200">
      <div
        className={`px-4 py-3 rounded-2xl shadow-xl flex items-center justify-between gap-3 text-xs font-medium ${getTypeStyle()}`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="shrink-0">{getIcon()}</span>
          <span className="truncate">{toast.message}</span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {toast.undoAction && (
            <button
              type="button"
              onClick={() => {
                toast.undoAction?.();
                onClose();
              }}
              className="px-2.5 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg font-bold flex items-center gap-1 transition"
            >
              <RotateCcw size={14} />
              <span>{toast.undoLabel || 'Undo'} ({countdown}s)</span>
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="p-1 hover:bg-white/10 rounded-full transition"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
