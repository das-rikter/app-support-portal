"use client";

import { cn } from '@/lib/utils';
import { useIncidentStore } from '@/store/useIncidentStore';
import { parseOutageHrs } from '@/lib/incidentUtils';

export function QuickStats() {
  const filtered = useIncidentStore((s) => s.filtered);

  const total = filtered.length;
  const p1 = filtered.filter((d) => d.severity === 'P1').length;
  const outageHrs = filtered.reduce((s, d) => s + parseOutageHrs(d.downtime), 0);
  const dasCaused = filtered.filter((d) => d.dasCaused === 1).length;

  const stats = [
    { label: 'Total',       value: String(total),             colorClass: 'text-foreground' },
    { label: 'P1 Critical', value: String(p1),                colorClass: 'text-[#dc2626]' },
    { label: 'Outage Hrs',  value: outageHrs.toFixed(0),      colorClass: 'text-foreground' },
    { label: 'DAS Caused',  value: String(dasCaused),         colorClass: 'text-[#d66a06]' },
  ];

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {stats.map((s) => (
        <div key={s.label} className="flex items-center gap-2 px-3 py-2 rounded-lg shadow-sm text-sm border border-border bg-card">
          <span className="font-medium text-muted-foreground">{s.label}</span>
          <span className={cn('font-bold tabular-nums', s.colorClass)}>{s.value}</span>
        </div>
      ))}
    </div>
  );
}
