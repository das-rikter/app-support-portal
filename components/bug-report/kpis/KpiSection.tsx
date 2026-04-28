'use client';

import { useBugReportStore } from '@/store/useBugReportStore';
import { useBugMetrics } from '@/hooks/useBugMetrics';
import { KpiCard } from './KpiCard';

const SECTION_LABEL = "flex items-center gap-2 text-[0.68rem] font-bold uppercase tracking-[0.08em] text-primary-clementine-900 pb-1 border-b-2 border-border before:content-[''] before:block before:w-0.75 before:h-3.5 before:bg-primary-clementine-900 before:rounded-sm before:shrink-0";

export function KpiSection() {
  const bugs = useBugReportStore((s) => s.bugs);
  const m = useBugMetrics(bugs);

  return (
    <section id="section-kpis" className="scroll-mt-14 flex flex-col gap-4">
      <div className={SECTION_LABEL}>Overview</div>
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
              <span className="text-[clamp(0.9rem,1.2vw,1.1rem)] font-semibold text-muted-foreground">
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
