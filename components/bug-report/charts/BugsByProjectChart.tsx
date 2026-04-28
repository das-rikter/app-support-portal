'use client';

import { Chart } from 'chart.js/auto';
import { useEffect, useMemo, useRef } from 'react';
import { useBugReportStore } from '@/store/useBugReportStore';
import { getProductPalette } from '@/lib/chartUtils';

const SECTION_LABEL = "flex items-center gap-2 text-[0.68rem] font-bold uppercase tracking-[0.08em] text-primary-clementine-900 pb-1 border-b-2 border-border before:content-[''] before:block before:w-0.75 before:h-3.5 before:bg-primary-clementine-900 before:rounded-sm before:shrink-0";

export function BugsByProjectChart() {
  const bugs = useBugReportStore((s) => s.bugs);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef  = useRef<Chart | null>(null);

  const { labels, counts } = useMemo(() => {
    const projMap: Record<string, number> = {};
    bugs.forEach((b) => {
      if (b.project) projMap[b.project] = (projMap[b.project] || 0) + 1;
    });
    const sorted = Object.entries(projMap).sort((a, b) => b[1] - a[1]);
    const labels = sorted.map(([p]) => {
      const s = p.replace(/^New /, '');
      const abbr = s.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 4);
      return `${s} (${abbr})`;
    });
    const counts = sorted.map(([, c]) => c);
    return { labels, counts };
  }, [bugs]);

  useEffect(() => {
    if (!canvasRef.current) return;
    chartRef.current?.destroy();
    chartRef.current = new Chart(canvasRef.current, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Open Bugs',
          data: counts,
          backgroundColor: labels.map((label) => getProductPalette(label)),
          borderRadius: 6,
          borderSkipped: false,
        }],
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: (c) => ` ${c.parsed.x} bugs` } },
        },
        scales: {
          x: {
            grid: { color: 'rgba(0,0,0,0.07)' },
            ticks: { color: '#5a6478', font: { family: "'Satoshi', sans-serif", size: 11 }, stepSize: 5 },
            border: { color: 'transparent' },
          },
          y: {
            grid: { color: 'transparent' },
            ticks: { color: '#1a202c', font: { family: "'Satoshi', sans-serif", size: 11 } },
            border: { color: 'transparent' },
          },
        },
      },
    });
    return () => { chartRef.current?.destroy(); };
  }, [labels, counts]);

  return (
    <section id="section-projects" className="scroll-mt-14 flex flex-col gap-4">
      <div className={SECTION_LABEL}>By Project</div>
      <div className="bg-card rounded-xl border border-border shadow-xs p-6 flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="font-sans text-base font-bold">Open Bugs by Project</h2>
          <span className="text-xs text-muted-foreground">
            Total open bug count per Jira project, sorted by volume
          </span>
        </div>
        <div className="relative" style={{ height: 300 }}>
          <canvas ref={canvasRef} />
        </div>
      </div>
    </section>
  );
}
