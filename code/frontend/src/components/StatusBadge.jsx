import React from 'react';

const STATUS_CONFIG = {
  ACTIVE: { color: 'bg-status-active', label: 'Active' },
  RUNNING: { color: 'bg-status-active', label: 'Running' },
  IDLE: { color: 'bg-status-idle', label: 'Idle' },
  FAULT: { color: 'bg-status-fault', label: 'Fault' },
};

export default function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || { color: 'bg-stone-400', label: status };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold text-white ${config.color}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-white/80" />
      {config.label}
    </span>
  );
}

export { STATUS_CONFIG };
