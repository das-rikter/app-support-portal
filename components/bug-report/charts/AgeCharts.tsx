'use client';

import { axisDefaults, getProductPalette, tickDefaults } from '@/lib/chartUtils';
import { useBugReportStore } from '@/store/useBugReportStore';
import type { Bug } from '@/types/bug-report';
import { Chart } from 'chart.js/auto';
import { useEffect, useMemo, useRef } from 'react';

const SECTION_LABEL = "flex items-center gap-2 text-[0.68rem] font-bold uppercase tracking-[0.08em] text-primary-clementine-900 pb-1 border-b-2 border-border before:content-[''] before:block before:w-0.75 before:h-3.5 before:bg-primary-clementine-900 before:rounded-sm before:shrink-0";

function bugAge(b: Bug): number {
  const d = new Date(b.created);
  return isNaN(d.getTime()) ? 0 : Math.floor((Date.now() - d.getTime()) / 86400000);
}

export function AgeCharts() {
  const bugs = useBugReportStore((s) => s.bugs);
  const distRef = useRef<HTMLCanvasElement>(null);
  const avgRef = useRef<HTMLCanvasElement>(null);
  const distChart = useRef<Chart | null>(null);
  const avgChart = useRef<Chart | null>(null);

  const { ageBuckets, avgAgeData } = useMemo(() => {
    const projMap: Record<string, number> = {};
    bugs.forEach((b) => {
      if (b.project) projMap[b.project] = (projMap[b.project] || 0) + 1;
    });
    const sorted = Object.entries(projMap).sort((a, b) => b[1] - a[1]);

    const bkts = [0, 0, 0, 0, 0];
    bugs.forEach((b) => {
      const a = bugAge(b);
      if (a <= 90) bkts[0]++;
      else if (a <= 180) bkts[1]++;
      else if (a <= 365) bkts[2]++;
      else if (a <= 730) bkts[3]++;
      else bkts[4]++;
    });

    const avgLabels = sorted.map(([p]) => p.replace(/^New /, ''));
    const avgValues = sorted.map(([p]) => {
      const ages = bugs.filter((b) => b.project === p).map(bugAge);
      return ages.length ? Math.round(ages.reduce((a, b) => a + b, 0) / ages.length) : 0;
    });

    return {
      ageBuckets: { counts: bkts },
      avgAgeData: { labels: avgLabels, values: avgValues },
    };
  }, [bugs]);

  useEffect(() => {
    if (!distRef.current) return;
    distChart.current?.destroy();
    distChart.current = new Chart(distRef.current, {
      type: 'bar',
      data: {
        labels: ['0-90 days', '91-180 days', '181-365 days', '366-730 days', '730+ days'],
        datasets: [{
          label: 'Bugs',
          data: ageBuckets.counts,
          backgroundColor: ['#16a34a', '#0891b2', '#d97706', '#ea580c', '#dc2626'],
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
          x: { ...axisDefaults(), ticks: { ...tickDefaults() } },
          y: {
            grid: { color: 'transparent' },
            ticks: { color: '#1a202c', font: { family: "'Satoshi', sans-serif", size: 11 } },
            border: { color: 'transparent' },
          },
        },
      },
    });
    return () => { distChart.current?.destroy(); };
  }, [ageBuckets]);

  useEffect(() => {
    if (!avgRef.current) return;
    avgChart.current?.destroy();
    avgChart.current = new Chart(avgRef.current, {
      type: 'bar',
      data: {
        labels: avgAgeData.labels,
        datasets: [{
          label: 'Avg Days Open',
          data: avgAgeData.values,
          backgroundColor: avgAgeData.labels.map((label) => getProductPalette(label)),
          borderRadius: 5,
          borderSkipped: false,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: (c) => ` ${c.parsed.y} days avg` } },
        },
        scales: {
          x: {
            grid: { color: 'transparent' },
            ticks: { color: '#1a202c', font: { family: "'Satoshi', sans-serif", size: 10 }, maxRotation: 35 },
            border: { color: 'transparent' },
          },
          y: {
            ...axisDefaults(),
            ticks: { ...tickDefaults(), callback: (v: string | number) => `${v}d` },
          },
        },
      },
    });
    return () => { avgChart.current?.destroy(); };
  }, [avgAgeData]);

  return (
    <section id="section-age" className="scroll-mt-14 flex flex-col gap-4 print:break-before-page">
      <div className={SECTION_LABEL}>Age Analysis</div>
      <div className="grid grid-cols-2 gap-5 max-[900px]:grid-cols-1">
        <div className="bg-card rounded-xl border border-border shadow-xs p-6 flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <h2 className="font-sans text-base font-bold">Bug Age Distribution</h2>
            <span className="text-xs text-muted-foreground">How long open bugs have been sitting</span>
          </div>
          <div className="relative" style={{ height: 240 }}>
            <canvas ref={distRef} />
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border shadow-xs p-6 flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <h2 className="font-sans text-base font-bold">Average Bug Age by Project</h2>
            <span className="text-xs text-muted-foreground">Days since creation - red indicates critical aging</span>
          </div>
          <div className="relative" style={{ height: 240 }}>
            <canvas ref={avgRef} />
          </div>
        </div>
      </div>
    </section>
  );
}
