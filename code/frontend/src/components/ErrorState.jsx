import React from 'react';

export default function ErrorState({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-3 text-center px-4">
      <div className="bg-red-50 dark:bg-red-950/30 rounded-full p-3">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 8v4M12 16h.01" />
        </svg>
      </div>
      <p className="text-sm font-medium text-stone-700 dark:text-stone-300">
        {message || 'Something went wrong while loading this data.'}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-sm font-semibold text-brand-dark hover:text-brand transition-colors underline"
        >
          Try again
        </button>
      )}
    </div>
  );
}
