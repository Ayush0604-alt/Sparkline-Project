import React, { useState, useMemo } from 'react';
import { usePolling } from '../hooks/usePolling';
import { getAlerts } from '../services/api';
import LoadingState from './LoadingState';
import ErrorState from './ErrorState';
import EmptyState from './EmptyState';

const CRITICAL_TEMP = 85; // above the 80°C alert threshold = highlighted as critical

function formatTimestamp(ts) {
  return new Date(ts).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export default function AlertsList() {
  const [searchTerm, setSearchTerm] = useState('');

  const { data, error, loading, refetch } = usePolling(() => getAlerts(), 5000);
  const alerts = useMemo(() => data?.data || [], [data]);

  const filteredAlerts = useMemo(() => {
    if (!searchTerm.trim()) return alerts;
    const term = searchTerm.trim().toLowerCase();
    return alerts.filter((a) => a.crane_id.toLowerCase().includes(term));
  }, [alerts, searchTerm]);

  return (
    <section className="bg-white dark:bg-stone-800 rounded-2xl shadow-card border border-orange-100 dark:border-stone-700 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 className="font-display font-bold text-xl text-stone-800 dark:text-stone-100">
          Alerts
          {alerts.length > 0 && (
            <span className="ml-2 text-sm font-semibold bg-brand-pale/40 text-brand-dark px-2 py-0.5 rounded-full">
              {alerts.length}
            </span>
          )}
        </h2>

        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
            width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by crane ID..."
            className="bg-brand-bg dark:bg-stone-700 border border-orange-200 dark:border-stone-600 text-stone-800 dark:text-stone-100 rounded-lg pl-8 pr-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand w-48"
          />
        </div>
      </div>

      {loading && !data && <LoadingState label="Loading alerts..." />}
      {error && !loading && <ErrorState message={error} onRetry={refetch} />}
      {!loading && !error && alerts.length === 0 && <EmptyState message="No alerts have been raised. All cranes within range." />}
      {!loading && !error && alerts.length > 0 && filteredAlerts.length === 0 && (
        <EmptyState message={`No alerts found for "${searchTerm}".`} />
      )}

      {!error && filteredAlerts.length > 0 && (
        <div className="overflow-x-auto -mx-1">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-stone-400 dark:text-stone-500 uppercase tracking-wide border-b border-orange-100 dark:border-stone-700">
                <th className="px-2 py-2 font-medium">Crane</th>
                <th className="px-2 py-2 font-medium">Temp</th>
                <th className="px-2 py-2 font-medium">Message</th>
                <th className="px-2 py-2 font-medium">Created</th>
              </tr>
            </thead>
            <tbody>
              {filteredAlerts.map((alert) => {
                const isCritical = alert.motor_temp_c >= CRITICAL_TEMP;
                return (
                  <tr
                    key={alert.id}
                    className={`border-b border-orange-50 dark:border-stone-700 last:border-0 ${
                      isCritical ? 'bg-red-50 dark:bg-red-950/20' : ''
                    }`}
                  >
                    <td className="px-2 py-2.5 font-semibold text-stone-800 dark:text-stone-100">{alert.crane_id}</td>
                    <td className={`px-2 py-2.5 font-mono font-semibold ${isCritical ? 'text-status-fault' : 'text-brand-dark'}`}>
                      {alert.motor_temp_c.toFixed(1)}°C
                      {isCritical && (
                        <span className="ml-1.5 text-[10px] font-bold bg-status-fault text-white px-1.5 py-0.5 rounded uppercase">
                          Critical
                        </span>
                      )}
                    </td>
                    <td className="px-2 py-2.5 text-stone-600 dark:text-stone-300">{alert.message}</td>
                    <td className="px-2 py-2.5 text-stone-400 dark:text-stone-500 whitespace-nowrap">
                      {formatTimestamp(alert.created_at)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
