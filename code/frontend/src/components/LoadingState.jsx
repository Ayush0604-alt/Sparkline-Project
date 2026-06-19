import React from 'react';

export default function LoadingState({ label = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-3 text-stone-500 dark:text-stone-400">
      <div className="w-8 h-8 border-3 border-brand-pale border-t-brand rounded-full animate-spin" />
      <p className="text-sm font-medium">{label}</p>
    </div>
  );
}
