import React from 'react';
import { usePolling } from '../hooks/usePolling';
import { getLatestReadings, getAlerts } from '../services/api';
import LoadingState from './LoadingState';
import ErrorState from './ErrorState';

const ACTIVE_STATUSES = ['ACTIVE', 'RUNNING'];

function StatCard({ label, value, icon, accent = 'brand' }) {
  const accentClasses = {
    brand: 'bg-brand-bg dark:bg-stone-700 text-brand-dark',
    green: 'bg-green-50 dark:bg-green-950/30 text-status-active',
    red: 'bg-red-50 dark:bg-red-950/30 text-status-fault',
  };

  return (
    <div className="bg-white dark:bg-stone-800 rounded-2xl shadow-card border border-orange-100 dark:border-stone-700 p-5 flex items-center gap-4">
      <div className={`rounded-xl p-3 ${accentClasses[accent]}`}>{icon}</div>
      <div>
        <p className="text-xs text-stone-400 dark:text-stone-500 font-medium uppercase tracking-wide">{label}</p>
        <p className="font-display font-bold text-2xl text-stone-800 dark:text-stone-100 mt-0.5">{value}</p>
      </div>
    </div>
  );
}

const ICONS = {
  cranes: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 21V9M3 9h14l4 4M17 9v12" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  active: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  alerts: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      <path d="M12 9v4M12 17h.01" strokeLinecap="round" />
    </svg>
  ),
  temp: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 4v10.54a4 4 0 11-4 0V4a2 2 0 014 0z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
};

export default function DashboardStats() {
  const readingsPoll = usePolling(getLatestReadings, 5000);
  const alertsPoll = usePolling(() => getAlerts(), 5000);

  const loading = readingsPoll.loading && alertsPoll.loading;
  const error = readingsPoll.error || alertsPoll.error;

  const readings = readingsPoll.data?.data || [];
  const alerts = alertsPoll.data?.data || [];

  const totalCranes = readings.length;
  const activeCranes = readings.filter((r) => ACTIVE_STATUSES.includes(r.status)).length;
  const totalAlerts = alerts.length;
  const avgTemp =
    readings.length > 0
      ? (readings.reduce((sum, r) => sum + r.motor_temp_c, 0) / readings.length).toFixed(1)
      : '—';

  if (loading && !readingsPoll.data && !alertsPoll.data) {
    return <LoadingState label="Loading dashboard stats..." />;
  }

  if (error && !readingsPoll.data && !alertsPoll.data) {
    return <ErrorState message={error} onRetry={() => { readingsPoll.refetch(); alertsPoll.refetch(); }} />;
  }

  return (
    <section>
      <h2 className="font-display font-bold text-xl text-stone-800 dark:text-stone-100 mb-4">Dashboard Stats</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Cranes" value={totalCranes} icon={ICONS.cranes} accent="brand" />
        <StatCard label="Active Cranes" value={activeCranes} icon={ICONS.active} accent="green" />
        <StatCard label="Total Alerts" value={totalAlerts} icon={ICONS.alerts} accent="red" />
        <StatCard label="Avg Temperature" value={`${avgTemp}°C`} icon={ICONS.temp} accent="brand" />
      </div>
    </section>
  );
}
