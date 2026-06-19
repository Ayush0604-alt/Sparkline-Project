import React from 'react';

export default function Header({ darkMode, onToggleDarkMode }) {
  return (
    <header className="bg-gradient-to-r from-brand-dark via-brand to-brand-light shadow-card sticky top-0 z-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-white/15 rounded-xl p-2.5 backdrop-blur-sm">
            <svg width="24" height="24" viewBox="0 0 32 32" fill="none">
              <path d="M6 26V10M6 10H22M22 10L26 14M22 10V26" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="22" cy="22" r="1.5" fill="white"/>
            </svg>
          </div>
          <div>
            <h1 className="font-display font-bold text-white text-xl sm:text-2xl tracking-tight">
              Sparkline Crane Monitoring
            </h1>
            <p className="text-white/80 text-xs sm:text-sm font-medium">
              Real-time industrial telemetry dashboard
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden sm:flex items-center gap-1.5 bg-white/15 text-white text-xs font-semibold px-3 py-1.5 rounded-full backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            Live · refreshes every 5s
          </span>
          <button
            onClick={onToggleDarkMode}
            aria-label="Toggle dark mode"
            className="bg-white/15 hover:bg-white/25 transition-colors rounded-lg p-2 text-white"
          >
            {darkMode ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="5" />
                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
