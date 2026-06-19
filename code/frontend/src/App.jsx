import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import DashboardStats from './components/DashboardStats';
import CraneOverview from './components/CraneOverview';
import TemperatureTrend from './components/TemperatureTrend';
import AlertsList from './components/AlertsList';
import { ToastContainer } from './components/Toast';
import { useToasts } from './hooks/useToasts';

export default function App() {
  const [darkMode, setDarkMode] = useState(() => {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  const { toasts, pushToast, dismissToast } = useToasts();

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  // One-time welcome toast to demonstrate the bonus toast-notification feature.
  useEffect(() => {
    pushToast('Dashboard connected. Auto-refreshing every 5 seconds.', 'info');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-brand-bg dark:bg-stone-900 transition-colors">
      <Header darkMode={darkMode} onToggleDarkMode={() => setDarkMode((d) => !d)} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <DashboardStats />
        <CraneOverview />
        <TemperatureTrend />
        <AlertsList />
      </main>

      <footer className="text-center text-xs text-stone-400 dark:text-stone-500 py-6">
        Sparkline Industrial Monitoring · Crane Telemetry Dashboard
      </footer>

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
