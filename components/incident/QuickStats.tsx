"use client";

import { useIncidentStore } from '@/store/useIncidentStore';
import { parseOutageHrs } from '@/lib/incidentUtils';

export function QuickStats() {
  const filtered = useIncidentStore((s) => s.filtered);

  const total = filtered.length;
  const p1 = filtered.filter((d) => d.sev === 'P1').length;
  const outageHrs = filtered.reduce((s, d) => s + parseOutageHrs(d.outage), 0);
  const dasCaused = filtered.filter((d) => d.dasCaused === 1).length;

  const stats = [
    { label: 'Total', value: String(total), color: 'text-gray-900' },
    { label: 'P1 Critical', value: String(p1), color: 'text-[#dc2626]' },
    { label: 'Outage Hrs', value: outageHrs.toFixed(0), color: 'text-gray-900' },
    { label: 'DAS Caused', value: String(dasCaused), color: 'text-[#d66a06]' },
  ];

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {stats.map((s) => (
        <div
          key={s.label}
          className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg shadow-sm text-sm"
        >
          <span className="text-gray-500 font-medium">{s.label}</span>
          <span className={`font-bold tabular-nums ${s.color}`}>{s.value}</span>
        </div>
      ))}
    </div>
  );
}
