'use client';

import { useBugReportStore } from '@/store/useBugReportStore';
import { useBugMetrics } from '@/hooks/useBugMetrics';
import { KpiCard } from './KpiCard';

export function KpiSection() {
  const bugs = useBugReportStore((s) => s.bugs);
  const m = useBugMetrics(bugs);

  return (
    <section id="section-kpis" className="report-section flex flex-col gap-4">
      <div className="section-label">Overview</div>
      <div className="grid grid-cols-6 gap-4 max-[1100px]:grid-cols-3 max-[640px]:grid-cols-2">
        <KpiCard
          accent="primary"
          label="Total Open Bugs"
          value={m.total}
          sub={`Across all ${m.projCount} projects`}
        />
        <KpiCard
          accent="success"
          label="Active / In Progress"
          value={m.active}
          sub="In Development, Review, or Pending Deployment"
        />
        <KpiCard
          accent="warning"
          label="In Backlog"
          value={m.backlog}
          sub={`${m.total > 0 ? Math.round((m.backlog / m.total) * 100) : 0}% of all open bugs`}
        />
        <KpiCard
          accent="error"
          label="Average Bug Age"
          value={
            <>
              {m.avgAge}{' '}
              <span className="text-[clamp(0.9rem,1.2vw,1.1rem)] font-semibold text-[var(--br-text-muted)]">
                days
              </span>
            </>
          }
          sub={`Oldest: ${m.maxAge.toLocaleString()} days`}
        />
        <KpiCard
          accent="critical"
          label="Critical Priority"
          value={m.highPrio}
          sub="Requires immediate attention"
        />
        <KpiCard
          accent="purple"
          label="Blocked or Waiting"
          value={m.blocked}
          sub="Needs external action"
        />
      </div>
    </section>
  );
}
