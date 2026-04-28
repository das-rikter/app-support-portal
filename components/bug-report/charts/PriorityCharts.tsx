'use client';

import { useRef, useEffect, useMemo } from 'react';
import { Chart } from 'chart.js/auto';
import { useBugReportStore } from '@/store/useBugReportStore';
import { PRIORITY_ORDER, PRIORITY_COLORS, axisDefaults, tickDefaults } from '@/lib/chartUtils';

const SECTION_LABEL = "flex items-center gap-2 text-[0.68rem] font-bold uppercase tracking-[0.08em] text-primary-clementine-900 pb-1 border-b-2 border-border before:content-[''] before:block before:w-0.75 before:h-3.5 before:bg-primary-clementine-900 before:rounded-sm before:shrink-0";

const PRIO_LABELS = ['Medium', 'Low', 'Lowest', 'Highest', 'High'];
const PRIO_COLORS = ['#d4610a', '#0891b2', '#94a3b8', '#dc2626', '#f97316'];

export function PriorityCharts() {
  const bugs = useBugReportStore((s) => s.bugs);
  const donutRef   = useRef<HTMLCanvasElement>(null);
  const stackedRef = useRef<HTMLCanvasElement>(null);
  const donutChart   = useRef<Chart | null>(null);
  const stackedChart = useRef<Chart | null>(null);

  const { prioLabels, prioCounts, projShort, projPrio } = useMemo(() => {
    const projMap: Record<string, number> = {};
    bugs.forEach((b) => {
      if (b.project) projMap[b.project] = (projMap[b.project] || 0) + 1;
    });
    const sorted = Object.entries(projMap).sort((a, b) => b[1] - a[1]);
    const projShort = sorted.map(([p]) => p.replace(/^New /, ''));

    const projPrio: Record<string, Record<string, number>> = {};
    sorted.forEach(([p]) => {
      const s = p.replace(/^New /, '');
      projPrio[s] = { Highest: 0, High: 0, Medium: 0, Low: 0, Lowest: 0 };
      bugs.filter((b) => b.project === p).forEach((b) => {
        if (projPrio[s][b.priority] !== undefined) projPrio[s][b.priority]++;
      });
    });

    const prioCounts = PRIO_LABELS.map((p) => bugs.filter((b) => b.priority === p).length);
    return { prioLabels: PRIO_LABELS, prioCounts, projShort, projPrio };
  }, [bugs]);

  const pTotal = prioCounts.reduce((a, b) => a + b, 0) || 1;

  useEffect(() => {
    if (!donutRef.current) return;
    donutChart.current?.destroy();
    donutChart.current = new Chart(donutRef.current, {
      type: 'doughnut',
      data: {
        labels: prioLabels,
        datasets: [{
          data: prioCounts,
          backgroundColor: PRIO_COLORS,
          borderWidth: 2,
          borderColor: '#ffffff',
          hoverOffset: 6,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '68%',
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (c) => ` ${c.parsed} bugs (${Math.round(((c.parsed as number) / pTotal) * 100)}%)`,
            },
          },
        },
      },
    });
    return () => { donutChart.current?.destroy(); };
  }, [prioLabels, prioCounts, pTotal]);

  useEffect(() => {
    if (!stackedRef.current) return;
    stackedChart.current?.destroy();
    const datasets = PRIORITY_ORDER.map((p) => ({
      label: p,
      data: projShort.map((proj) => projPrio[proj]?.[p] || 0),
      backgroundColor: PRIORITY_COLORS[p],
      borderRadius: 2,
      borderSkipped: false,
    }));
    stackedChart.current = new Chart(stackedRef.current, {
      type: 'bar',
      data: { labels: projShort, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { font: { family: "'Satoshi', sans-serif", size: 10 }, color: '#5a6478', boxWidth: 10, padding: 12 },
          },
          tooltip: { mode: 'index', intersect: false },
        },
        scales: {
          x: {
            stacked: true,
            grid: { color: 'transparent' },
            ticks: { color: '#1a202c', font: { family: "'Satoshi', sans-serif", size: 9 }, maxRotation: 35 },
            border: { color: 'transparent' },
          },
          y: { stacked: true, ...axisDefaults(), ticks: { ...tickDefaults(), stepSize: 5 } },
        },
      },
    });
    return () => { stackedChart.current?.destroy(); };
  }, [projShort, projPrio]);

  return (
    <section id="section-priority" className="scroll-mt-14 flex flex-col gap-4">
      <div className={SECTION_LABEL}>Priority</div>
      <div className="grid grid-cols-2 gap-5 max-[900px]:grid-cols-1">
        <div className="bg-card rounded-xl border border-border shadow-xs p-6 flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <h2 className="font-sans text-base font-bold">Priority Breakdown</h2>
            <span className="text-xs text-muted-foreground">Distribution across all projects</span>
          </div>
          <div className="relative h-50">
            <canvas ref={donutRef} />
          </div>
          <div className="flex flex-col gap-2 pt-3 border-t border-border">
            {prioLabels.map((label, i) => (
              <div key={label} className="flex items-center gap-2 text-xs">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: PRIO_COLORS[i] }} />
                <span className="flex-1 text-muted-foreground">{label}</span>
                <span className="tabular-nums font-bold text-foreground">{prioCounts[i]}</span>
                <span className="text-muted-foreground/70 text-[0.7rem]">
                  &nbsp;({Math.round((prioCounts[i] / pTotal) * 100)}%)
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border shadow-xs p-6 flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <h2 className="font-sans text-base font-bold">Priority by Project</h2>
            <span className="text-xs text-muted-foreground">Stacked breakdown of priority per project</span>
          </div>
          <div className="relative" style={{ height: 280 }}>
            <canvas ref={stackedRef} />
          </div>
        </div>
      </div>
    </section>
  );
}
