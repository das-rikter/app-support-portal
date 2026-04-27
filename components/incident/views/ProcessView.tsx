"use client";

import { useMemo } from 'react';
import { useIncidentStore } from '@/store/useIncidentStore';
import { PlotlyChart } from '@/components/incident/PlotlyChart';
import { parseOutageHrs, MONTH_ORDER, CHART_COLORS, chartBase } from '@/lib/incidentUtils';

const c = CHART_COLORS;
const ALERT_SRC_COLORS = [c.g, c.b, c.b2, c.o, c.o2, c.y, c.r, c.p, '#94a3b8', '#64748b', '#94a3b8', '#cbd5e1'];
const MTTR_COLORS = [c.b, c.b2, c.b3, c.o, c.o2, '#94a3b8', '#64748b', '#cbd5e1'];

export function ProcessView() {
  const filtered = useIncidentStore((s) => s.filtered);
  const incidents = useIncidentStore((s) => s.incidents);
  
  const ALL_MONTHS = useMemo(() => 
    [...new Set(incidents.map((d) => d.month))].sort(
      (a, b) => MONTH_ORDER.indexOf(a) - MONTH_ORDER.indexOf(b)
    ),
    [incidents]
  );

  const total = filtered.length;
  const alertedCount = filtered.filter((d) => d.alerted === 1).length;
  const alertPct = Math.round((alertedCount / Math.max(total, 1)) * 100);
  const reoccurN = filtered.filter((d) => d.reoccurring === 1).length;
  const dasCausedN = filtered.filter((d) => d.dasCaused === 1).length;
  const postYes = filtered.filter((d) => d.postmortem === 'Yes').length;
  const postPct = Math.round((postYes / Math.max(total, 1)) * 100);

  // Alert source chart
  const alertSourceChart = useMemo(() => {
    const bySrc: Record<string, number> = {};
    filtered.forEach((d) => {
      const s = d.alertSrc || 'Unknown';
      bySrc[s] = (bySrc[s] || 0) + 1;
    });
    const srcs = Object.entries(bySrc).sort((a, b) => b[1] - a[1]);
    return {
      data: [{
        type: 'bar',
        orientation: 'h',
        x: srcs.map((s) => s[1]),
        y: srcs.map((s) => s[0]),
        text: srcs.map((s) => String(s[1])),
        texttemplate: '%{text}',
        textposition: 'outside',
        textfont: { size: 10, color: 'var(--id-text)' },
        cliponaxis: false,
        marker: { color: srcs.map((_, i) => ALERT_SRC_COLORS[i] || '#94a3b8') },
        hovertemplate: '%{y}: %{x}<extra></extra>',
      }],
      layout: { ...chartBase({ l: 170, r: 80, t: 10, b: 40 }) },
    };
  }, [filtered]);

  // Alert coverage by month chart
  const alertCoverageChart = useMemo(() => {
    const alertByMonth: Record<string, number> = {};
    ALL_MONTHS.forEach((m) => {
      const mData = filtered.filter((d) => d.month === m);
      alertByMonth[m] = mData.length
        ? Math.round((mData.filter((d) => d.alerted === 1).length / mData.length) * 100)
        : 0;
    });
    // Sort months chronologically using MONTH_ORDER
    const alertMonths = Object.keys(alertByMonth).sort(
      (a, b) => MONTH_ORDER.indexOf(a) - MONTH_ORDER.indexOf(b)
    );
    const alertVals = alertMonths.map((m) => alertByMonth[m]);
    return {
      data: [
        {
          type: 'scatter',
          mode: 'lines+markers',
          x: alertMonths,
          y: alertVals,
          line: { color: c.g, width: 3, shape: 'spline' },
          marker: { size: 8, color: c.g },
          fill: 'tozeroy',
          fillcolor: 'rgba(22,163,74,.1)',
          hovertemplate: '%{x}: %{y}%<extra></extra>',
        },
        {
          type: 'scatter',
          mode: 'lines',
          x: alertMonths,
          y: alertMonths.map(() => 70),
          line: { color: c.r, width: 1.5, dash: 'dot' },
          name: '70% target',
          showlegend: true,
          hoverinfo: 'skip',
        },
      ],
      layout: {
        ...chartBase({ l: 50, r: 20, t: 10, b: 40 }),
        yaxis: { gridcolor: 'var(--id-border)', tickfont: { color: 'var(--id-muted)' }, zeroline: false, ticksuffix: '%', range: [0, 110] },
        showlegend: true,
        legend: { x: 0.6, y: 1.1, font: { color: 'var(--id-muted)', size: 11 } },
      },
    };
  }, [filtered]);

  // MTTR by product chart
  const mttrChart = useMemo(() => {
    const mttrByProd: Record<string, { total: number; n: number }> = {};
    filtered.forEach((d) => {
      if (!mttrByProd[d.product]) mttrByProd[d.product] = { total: 0, n: 0 };
      mttrByProd[d.product].total += parseOutageHrs(d.downtime);
      mttrByProd[d.product].n++;
    });
    const entries = Object.entries(mttrByProd)
      .map(([p, v]) => [p, v.total / v.n] as [string, number])
      .sort((a, b) => b[1] - a[1]);
    return {
      data: [{
        type: 'bar',
        x: entries.map((e) => e[0]),
        y: entries.map((e) => +e[1].toFixed(1)),
        marker: { color: entries.map((_, i) => MTTR_COLORS[i] || '#94a3b8') },
        hovertemplate: '%{x}: %{y}h avg<extra></extra>',
      }],
      layout: {
        ...chartBase({ l: 50, r: 10, t: 10, b: 90 }),
        xaxis: { gridcolor: 'var(--id-border)', tickfont: { color: 'var(--id-muted)', size: 11 }, zeroline: false, tickangle: -35 },
        yaxis: { gridcolor: 'var(--id-border)', tickfont: { color: 'var(--id-muted)' }, zeroline: false, ticksuffix: 'h' },
      },
    };
  }, [filtered]);


  return (
    <div>
      {/* Process KPIs */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="id-kpi-card" data-accent="green">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-3" style={{ background: 'var(--id-green-soft)' }}>
            <svg className="w-4 h-4" style={{ color: 'var(--id-green)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 20V10" /><path d="M12 20V4" /><path d="M6 20v-6" />
            </svg>
          </div>
          <div className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: 'var(--id-muted)' }}>Alert Coverage</div>
          <div className="text-4xl font-bold tabular-nums leading-none" style={{ color: 'var(--id-text)' }}>{alertPct}%</div>
          <div className="mt-2 text-xs" style={{ color: 'var(--id-muted)' }}>{alertedCount} of {total} alerted</div>
        </div>

        <div className="id-kpi-card" data-accent="warn">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-3" style={{ background: 'var(--id-warn-soft)' }}>
            <svg className="w-4 h-4" style={{ color: 'var(--id-warn)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 .49-3.5" />
            </svg>
          </div>
          <div className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: 'var(--id-muted)' }}>Reoccurring Issues</div>
          <div className="text-4xl font-bold tabular-nums leading-none" style={{ color: 'var(--id-text)' }}>{reoccurN}</div>
          <div className="mt-2 text-xs" style={{ color: 'var(--id-muted)' }}>Repeat incidents</div>
        </div>

        <div className="id-kpi-card" data-accent="accent">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-3" style={{ background: 'var(--id-accent-bg)' }}>
            <svg className="w-4 h-4" style={{ color: 'var(--id-accent)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            </svg>
          </div>
          <div className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: 'var(--id-muted)' }}>DAS Caused</div>
          <div className="text-4xl font-bold tabular-nums leading-none" style={{ color: 'var(--id-text)' }}>{dasCausedN}</div>
          <div className="mt-2 text-xs" style={{ color: 'var(--id-muted)' }}>{Math.round((dasCausedN / Math.max(total, 1)) * 100)}% of incidents</div>
        </div>

        <div className="id-kpi-card" data-accent="blue">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-3" style={{ background: 'var(--id-blue-soft)' }}>
            <svg className="w-4 h-4" style={{ color: 'var(--id-blue)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
            </svg>
          </div>
          <div className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: 'var(--id-muted)' }}>Postmortem Rate</div>
          <div className="text-4xl font-bold tabular-nums leading-none" style={{ color: 'var(--id-text)' }}>{postPct}%</div>
          <div className="mt-2 text-xs" style={{ color: 'var(--id-muted)' }}>{postYes} completed</div>
        </div>
      </div>

      {/* Alert charts row */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="border rounded-2xl overflow-hidden" style={{ background: 'var(--id-surface)', borderColor: 'var(--id-border)', boxShadow: 'var(--id-shadow-sm)' }}>
          <div className="id-card-head">
            <div>
              <div className="text-sm font-bold" style={{ color: 'var(--id-text)' }}>How Were We Alerted?</div>
              <div className="text-xs mt-0.5" style={{ color: 'var(--id-muted)' }}>Detection channel breakdown</div>
            </div>
            <span className="id-card-badge">Detection</span>
          </div>
          <PlotlyChart data={alertSourceChart.data} layout={alertSourceChart.layout} className="id-plot-area tall" />
        </div>
        <div className="border rounded-2xl overflow-hidden" style={{ background: 'var(--id-surface)', borderColor: 'var(--id-border)', boxShadow: 'var(--id-shadow-sm)' }}>
          <div className="id-card-head">
            <div>
              <div className="text-sm font-bold" style={{ color: 'var(--id-text)' }}>Alert Coverage by Month</div>
              <div className="text-xs mt-0.5" style={{ color: 'var(--id-muted)' }}>% of incidents with triggered alerts</div>
            </div>
            <span className="id-card-badge">Coverage</span>
          </div>
          <PlotlyChart data={alertCoverageChart.data} layout={alertCoverageChart.layout} className="id-plot-area tall" />
        </div>
      </div>

      {/* MTTR + Postmortem row */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="border rounded-2xl overflow-hidden" style={{ background: 'var(--id-surface)', borderColor: 'var(--id-border)', boxShadow: 'var(--id-shadow-sm)' }}>
          <div className="id-card-head">
            <div>
              <div className="text-sm font-bold" style={{ color: 'var(--id-text)' }}>Avg Resolution Time by Product</div>
              <div className="text-xs mt-0.5" style={{ color: 'var(--id-muted)' }}>Mean time to resolve (hours)</div>
            </div>
            <span className="id-card-badge">MTTR</span>
          </div>
          <PlotlyChart data={mttrChart.data} layout={mttrChart.layout} className="id-plot-area" />
        </div>
      </div>
    </div>
  );
}
