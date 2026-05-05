'use client';

import { useBugReportStore } from '@/store/useBugReportStore';
import { useMemo } from 'react';

const SECTION_LABEL = "flex items-center gap-2 text-[0.68rem] font-bold uppercase tracking-[0.08em] text-primary-clementine-900 pb-1 border-b-2 border-border before:content-[''] before:block before:w-0.75 before:h-3.5 before:bg-primary-clementine-900 before:rounded-sm before:shrink-0";

export function LeadSection() {
  const bugs = useBugReportStore((s) => s.bugs);

  const leads = useMemo(() => {
    const leadMap: Record<string, number> = {};
    const leadProjects: Record<string, Set<string>> = {};
    bugs.forEach((b) => {
      if (!b.lead) return;
      leadMap[b.lead] = (leadMap[b.lead] || 0) + 1;
      if (!leadProjects[b.lead]) leadProjects[b.lead] = new Set();
      leadProjects[b.lead].add(b.project.replace(/^New /, ''));
    });
    const total = bugs.length || 1;
    return Object.entries(leadMap)
      .sort((a, b) => b[1] - a[1])
      .map(([lead, count]) => ({
        lead,
        count,
        pct: Math.round((count / total) * 100),
        barW: ((count / total) * 100).toFixed(1),
        initials: lead
          .split(' ')
          .map((w) => w[0])
          .join('')
          .toUpperCase()
          .slice(0, 2),
        projects: [...(leadProjects[lead] || [])].join(' · '),
      }));
  }, [bugs]);

  return (
    <section id="section-leads" className="scroll-mt-14 flex flex-col gap-4 print:break-before-page">
      <div className={SECTION_LABEL}>By Lead</div>
      <div className="bg-card rounded-xl border border-border shadow-xs p-6 flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="font-sans text-base font-bold">Bugs by Project Lead</h2>
          <span className="text-xs text-muted-foreground">
            Total open bug ownership across all projects
          </span>
        </div>
        <div className="grid grid-cols-4 gap-4 max-[900px]:grid-cols-2 max-[480px]:grid-cols-1">
          {leads.map((l) => (
            <div
              key={l.lead}
              className="bg-secondary border border-border rounded-lg px-5 py-4 grid grid-cols-[auto_1fr_auto] grid-rows-[auto_auto] gap-x-3 gap-y-1 items-center"
            >
              <div className="row-span-2 w-10 h-10 rounded-full bg-primary-clementine-50 text-primary-clementine-900 flex items-center justify-center font-sans font-extrabold text-xs tracking-[0.04em] shrink-0">
                {l.initials}
              </div>
              <div className="col-start-2">
                <div className="text-sm font-bold leading-tight">{l.lead}</div>
                <div className="text-xs text-muted-foreground">{l.projects}</div>
              </div>
              <div className="col-start-3 row-span-2 text-right">
                <div className="font-sans text-[clamp(1.4rem,2vw,1.75rem)] font-extrabold text-primary-clementine-900 tabular-nums leading-none">
                  {l.count}
                </div>
                <div className="text-xs text-muted-foreground/70">{l.pct}%</div>
              </div>
              <div className="col-span-3 h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary-clementine-900 rounded-full transition-[width] duration-1000"
                  style={{ width: `${l.barW}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
