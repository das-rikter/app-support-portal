'use client';

import { Chart } from 'chart.js/auto';
import { useEffect, useMemo, useRef } from 'react';
import { useBugReportStore } from '@/store/useBugReportStore';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function TimelineChart() {
  const bugs = useBugReportStore((s) => s.bugs);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  const { labels, counts } = useMemo(() => {
    const monthly: Record<string, number> = {};
    bugs.forEach((b) => {
      const d = new Date(b.created);
      if (isNaN(d.getTime())) return;
      const key = `${d.getMonth() + 1}/${d.getFullYear()}`;
      monthly[key] = (monthly[key] || 0) + 1;
    });
    const mKeys = Object.keys(monthly).sort((a, b) => {
      const [am, ay] = a.split('/').map(Number);
      const [bm, by] = b.split('/').map(Number);
      return ay !== by ? ay - by : am - bm;
    });
    return {
      labels: mKeys.map((k) => {
        const [m, y] = k.split('/');
        return `${MONTH_NAMES[+m - 1]} ${String(y).slice(2)}`;
      }),
      counts: mKeys.map((k) => monthly[k]),
    };
  }, [bugs]);

  useEffect(() => {
    if (!canvasRef.current) return;
    chartRef.current?.destroy();
    const maxTL = Math.max(...counts, 1);
    chartRef.current = new Chart(canvasRef.current, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Bugs Created',
            data: counts,
            backgroundColor: counts.map(
              (v) => `rgba(221,96,0,${0.3 + (v / maxTL) * 0.7})`
            ),
            borderRadius: 3,
            borderSkipped: false,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: (c) => ` ${c.parsed.y} bugs created` } },
        },
        scales: {
          x: {
            grid: { color: 'transparent' },
            ticks: {
              color: '#5a6478',
              font: { family: "'Satoshi', sans-serif", size: 10 },
              maxRotation: 45,
              maxTicksLimit: 24,
            },
            border: { color: 'transparent' },
          },
          y: {
            grid: { color: 'rgba(0,0,0,0.07)' },
            ticks: {
              color: '#1a202c',
              font: { family: "'Satoshi', sans-serif", size: 11 },
              stepSize: 1,
            },
            border: { color: 'transparent' },
          },
        },
      },
    });
    return () => {
      chartRef.current?.destroy();
    };
  }, [labels, counts]);

  return (
    <section id="section-timeline" className="report-section flex flex-col gap-4">
      <div className="section-label">Timeline</div>
      <div className="bg-white rounded-xl border border-[var(--br-border)] shadow-sm p-6 flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="font-sans text-base font-bold">Bug Creation Over Time</h2>
          <span className="text-xs text-[var(--br-text-muted)]">
            Monthly volume of new bugs created - full historical record
          </span>
        </div>
        <div className="relative" style={{ height: 240 }}>
          <canvas ref={canvasRef} />
        </div>
      </div>
    </section>
  );
}
