import React from 'react';

export function ToastContainer({ toasts, onDismiss }) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="alert"
          className={`flex items-start gap-2 px-4 py-3 rounded-lg shadow-card-hover text-sm font-medium text-white animate-[fadeIn_0.2s_ease-out] ${
            toast.type === 'error' ? 'bg-status-fault' : 'bg-brand-dark'
          }`}
        >
          <span className="flex-1">{toast.message}</span>
          <button
            onClick={() => onDismiss(toast.id)}
            aria-label="Dismiss notification"
            className="text-white/80 hover:text-white"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
