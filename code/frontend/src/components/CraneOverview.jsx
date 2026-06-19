import React from 'react';
import { usePolling } from '../hooks/usePolling';
import { getLatestReadings } from '../services/api';
import LoadingState from './LoadingState';
import ErrorState from './ErrorState';
import EmptyState from './EmptyState';
import StatusBadge from './StatusBadge';

function formatTimestamp(ts) {
  return new Date(ts).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function CraneCard({ reading }) {
  const isHot = reading.motor_temp_c > 80;

  return (
    <div className="bg-white dark:bg-stone-800 rounded-2xl shadow-card hover:shadow-card-hover transition-shadow border border-orange-100 dark:border-stone-700 p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display font-bold text-lg text-stone-800 dark:text-stone-100">
          {reading.crane_id}
        </h3>
        <StatusBadge status={reading.status} />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <p className="text-xs text-stone-400 dark:text-stone-500 font-medium uppercase tracking-wide">Load</p>
          <p className="font-mono font-semibold text-stone-800 dark:text-stone-100 text-sm mt-0.5">
            {reading.load_kg.toLocaleString(undefined, { maximumFractionDigits: 1 })} kg
          </p>
        </div>
        <div>
          <p className="text-xs text-stone-400 dark:text-stone-500 font-medium uppercase tracking-wide">Motor Temp</p>
          <p className={`font-mono font-semibold text-sm mt-0.5 ${isHot ? 'text-status-fault' : 'text-stone-800 dark:text-stone-100'}`}>
            {reading.motor_temp_c.toFixed(1)}°C
          </p>
        </div>
        <div>
          <p className="text-xs text-stone-400 dark:text-stone-500 font-medium uppercase tracking-wide">Vibration</p>
          <p className="font-mono font-semibold text-stone-800 dark:text-stone-100 text-sm mt-0.5">
            {reading.vibration_mm_s.toFixed(1)} mm/s
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-orange-50 dark:border-stone-700 pt-3">
        <span className="text-xs text-stone-400 dark:text-stone-500">Last update</span>
        <span className="text-xs font-medium text-stone-600 dark:text-stone-300">{formatTimestamp(reading.ts)}</span>
      </div>
    </div>
  );
}

export default function CraneOverview() {
  const { data, error, loading, refetch } = usePolling(getLatestReadings, 5000);
  const readings = data?.data || [];

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display font-bold text-xl text-stone-800 dark:text-stone-100">Crane Overview</h2>
      </div>

      {loading && !data && <LoadingState label="Loading crane status..." />}
      {error && !loading && <ErrorState message={error} onRetry={refetch} />}
      {!loading && !error && readings.length === 0 && <EmptyState message="No readings have been ingested yet." />}

      {!error && readings.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {readings.map((reading) => (
            <CraneCard key={reading.crane_id} reading={reading} />
          ))}
        </div>
      )}
    </section>
  );
}
