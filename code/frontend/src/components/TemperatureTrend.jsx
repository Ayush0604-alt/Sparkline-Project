import React, { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { usePolling } from '../hooks/usePolling';
import { getReadingsByCrane } from '../services/api';
import LoadingState from './LoadingState';
import ErrorState from './ErrorState';
import EmptyState from './EmptyState';

const CRANE_OPTIONS = ['CR-101', 'CR-102', 'CR-103'];
const ALERT_THRESHOLD = 80;

function formatTick(ts) {
  return new Date(ts).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || payload.length === 0) return null;

  const value = payload[0].value;
  const isHot = value > ALERT_THRESHOLD;

  return (
    <div className="bg-white dark:bg-stone-800 border border-orange-200 dark:border-stone-700 rounded-lg shadow-card-hover px-3 py-2">
      <p className="text-xs text-stone-400 dark:text-stone-500 mb-1">{formatTick(label)}</p>
      <p className={`font-mono font-semibold text-sm ${isHot ? 'text-status-fault' : 'text-brand-dark'}`}>
        {value.toFixed(1)}°C
      </p>
    </div>
  );
}

export default function TemperatureTrend() {
  const [selectedCrane, setSelectedCrane] = useState(CRANE_OPTIONS[0]);

  const { data, error, loading, refetch } = usePolling(
    () => getReadingsByCrane(selectedCrane),
    5000,
    [selectedCrane]
  );

  const readings = data?.data || [];
  const chartData = readings.map((r) => ({ ts: r.ts, motor_temp_c: r.motor_temp_c }));

  return (
    <section className="bg-white dark:bg-stone-800 rounded-2xl shadow-card border border-orange-100 dark:border-stone-700 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 className="font-display font-bold text-xl text-stone-800 dark:text-stone-100">Temperature Trend</h2>

        <div className="flex items-center gap-2">
          <label htmlFor="crane-select" className="text-sm text-stone-500 dark:text-stone-400 font-medium">
            Crane:
          </label>
          <select
            id="crane-select"
            value={selectedCrane}
            onChange={(e) => setSelectedCrane(e.target.value)}
            className="bg-brand-bg dark:bg-stone-700 border border-orange-200 dark:border-stone-600 text-stone-800 dark:text-stone-100 rounded-lg px-3 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand"
          >
            {CRANE_OPTIONS.map((id) => (
              <option key={id} value={id}>{id}</option>
            ))}
          </select>
        </div>
      </div>

      {loading && !data && <LoadingState label={`Loading temperature history for ${selectedCrane}...`} />}
      {error && !loading && <ErrorState message={error} onRetry={refetch} />}
      {!loading && !error && chartData.length === 0 && (
        <EmptyState message={`No readings found for ${selectedCrane} yet.`} />
      )}

      {!error && chartData.length > 0 && (
        <ResponsiveContainer width="100%" height={340}>
          <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#FED7AA" />
            <XAxis
              dataKey="ts"
              tickFormatter={formatTick}
              stroke="#A8A29E"
              fontSize={11}
              minTickGap={40}
            />
            <YAxis
              stroke="#A8A29E"
              fontSize={11}
              domain={['auto', 'auto']}
              label={{ value: '°C', angle: -90, position: 'insideLeft', fill: '#A8A29E', fontSize: 11 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <ReferenceLine
              y={ALERT_THRESHOLD}
              stroke="#DC2626"
              strokeDasharray="5 3"
              label={{ value: 'Alert threshold (80°C)', position: 'insideTopRight', fill: '#DC2626', fontSize: 11 }}
            />
            <Line
              type="monotone"
              dataKey="motor_temp_c"
              name="Motor Temp (°C)"
              stroke="#EA580C"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 4, fill: '#EA580C' }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </section>
  );
}
