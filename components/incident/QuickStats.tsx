"use client";

import { useIncidentStore } from '@/store/useIncidentStore';
import { parseOutageHrs } from '@/lib/incidentUtils';

export function QuickStats() {
  const filtered = useIncidentStore((s) => s.filtered);

  const total = filtered.length;
  const p1 = filtered.filter((d) => d.sev === 'P1').length;
  const outageHrs = filtered.reduce((s, d) => s + parseOutageHrs(d.downtime), 0);
  const dasCaused = filtered.filter((d) => d.dasCaused === 1).length;

  const stats = [
    { label: 'Total', value: String(total), color: 'var(--id-text)' },
    { label: 'P1 Critical', value: String(p1), color: 'var(--id-danger)' },
    { label: 'Outage Hrs', value: outageHrs.toFixed(0), color: 'var(--id-text)' },
    { label: 'DAS Caused', value: String(dasCaused), color: 'var(--id-accent)' },
  ];

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {stats.map((s) => (
        <div
          key={s.label}
          className="flex items-center gap-2 px-3 py-2 rounded-lg shadow-sm text-sm id-quick-stat"
          style={{ borderColor: 'var(--id-border)', background: 'var(--id-surface)' }}
        >
          <span className="font-medium" style={{ color: 'var(--id-muted)' }}>{s.label}</span>
          <span className="font-bold tabular-nums" style={{ color: s.color === 'text-[#dc2626]' ? 'var(--id-danger)' : s.color === 'text-[#d66a06]' ? 'var(--id-accent)' : 'var(--id-text)' }}>{s.value}</span>
        </div>
      ))}
    </div>
  );
}
