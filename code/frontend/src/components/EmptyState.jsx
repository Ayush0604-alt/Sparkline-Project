import React from 'react';

export default function EmptyState({ message = 'No data available yet.' }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-2 text-stone-400 dark:text-stone-500">
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M9 9h6v6H9z" />
      </svg>
      <p className="text-sm font-medium">{message}</p>
    </div>
  );
}
