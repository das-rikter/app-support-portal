"use client";

import { useMemo } from 'react';
import { useIncidentStore } from '@/store/useIncidentStore';
import { PlotlyChart } from '@/components/incident/PlotlyChart';
import { parseOutageHrs, isMultiApp, MONTH_ORDER, CHART_COLORS, chartBase, getMonthFromDate } from '@/lib/incidentUtils';
import type { Incident } from '@/types/incident';

const c = CHART_COLORS;
const ALERT_SRC_COLORS = [c.g, c.b, c.b2, c.o, c.o2, c.y, c.r, c.p, '#94a3b8', '#64748b', '#94a3b8', '#cbd5e1'];

const CARD_HEAD = 'flex justify-between items-start px-5 pt-[18px] pb-0';
const CARD_BADGE = 'px-[10px] py-[5px] rounded-full text-[10px] font-extrabold uppercase tracking-[0.08em] bg-[rgba(214,106,6,0.10)] dark:bg-[rgba(214,106,6,0.18)] text-[#d66a06] whitespace-nowrap shrink-0';

function truncateName(name: string, maxLen = 28): string {
  return name.length <= maxLen ? name : name.slice(0, maxLen - 1) + '…';
}

function calcLeftMargin(names: string[]): number {
  if (!names.length) return 50;
  return Math.max(Math.max(...names.map((n) => n.length)) * 10 + 20, 60);
}

function buildAlertSourceChart(data: Incident[]) {
  const bySrc: Record<string, number> = {};
  data.forEach((d) => { bySrc[d.alertSrc || 'Unknown'] = (bySrc[d.alertSrc || 'Unknown'] || 0) + 1; });
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
}

function buildAlertCoverageChart(data: Incident[], allMonths: string[]) {
  const alertByMonth: Record<string, number> = {};
  allMonths.forEach((m) => {
    const mData = data.filter((d) => getMonthFromDate(d.date) === m);
    alertByMonth[m] = mData.length
      ? Math.round((mData.filter((d) => d.alerted).length / mData.length) * 100)
      : 0;
  });
  const alertMonths = Object.keys(alertByMonth).sort((a, b) => MONTH_ORDER.indexOf(a) - MONTH_ORDER.indexOf(b));
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
      yaxis: { gridcolor: 'var(--id-border)', tickfont: { color: 'var(--id-text)' }, zeroline: false, ticksuffix: '%', range: [0, 110] },
      showlegend: true,
      legend: { x: 0.6, y: 1.1, font: { color: 'var(--id-muted)', size: 11 } },
    },
  };
}

function buildMttrChart(data: Incident[]) {
  const mttrByProd: Record<string, { total: number; n: number }> = {};
  data.forEach((d) => {
    if (!mttrByProd[d.product]) mttrByProd[d.product] = { total: 0, n: 0 };
    mttrByProd[d.product].total += parseOutageHrs(d.downtime);
    mttrByProd[d.product].n++;
  });
  const entries = Object.entries(mttrByProd)
    .map(([p, v]) => [p, +(v.total / v.n).toFixed(1)] as [string, number])
    .filter(([, v]) => v > 0)
    .sort((a, b) => a[1] - b[1]);
  const truncated = entries.map(([name]) => truncateName(name));
  const autoMargin = calcLeftMargin(truncated);
  return {
    data: [{
      type: 'bar',
      orientation: 'h',
      x: entries.map(([, v]) => v),
      y: truncated,
      customdata: entries.map(([name]) => name),
      text: entries.map(([, v]) => `${v}h`),
      textposition: 'outside',
      textfont: { size: 11, color: 'var(--id-muted)' },
      cliponaxis: false,
      marker: { color: entries.map((_, i) => i === entries.length - 1 ? 'var(--id-blue)' : 'var(--id-blue-soft)') },
      hovertemplate: '%{customdata}: %{x}h avg resolution<extra></extra>',
    }],
    layout: {
      ...chartBase({ l: autoMargin, r: 80, t: 10, b: 40 }),
      xaxis: { type: 'log', gridcolor: 'var(--id-border)', tickfont: { color: 'var(--id-text)' }, zeroline: false, ticksuffix: 'h', automargin: true },
      yaxis: { gridcolor: 'var(--id-border)', tickfont: { color: 'var(--id-text)' }, zeroline: false, automargin: true },
    },
  };
}

function kpis(data: Incident[]) {
  const total = data.length;
  const alertedCount = data.filter((d) => d.alerted).length;
  return {
    total,
    alertedCount,
    alertPct: Math.round((alertedCount / Math.max(total, 1)) * 100),
    dasCausedN: data.filter((d) => d.dasCaused).length,
  };
}

function MultiAppDivider() {
  return (
    <div className="flex items-center gap-4 my-8">
      <div className="flex-1 h-px bg-border" />
      <span className="text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full text-muted-foreground border border-border">
        Multi-Application Incidents
      </span>
      <div className="flex-1 h-px bg-border" />
    </div>
  );
}

function KpiCard({ accent, children }: { accent: 'accent' | 'blue' | 'green' | 'warn'; children: React.ReactNode }) {
  const bar: Record<string, string> = {
    accent: 'bg-gradient-to-r from-[#d66a06] to-[#f1a24b]',
    blue:   'bg-[#3b82f6]',
    green:  'bg-[#16a34a]',
    warn:   'bg-[#d97706]',
  };
  return (
    <div className="relative overflow-hidden bg-card rounded-2xl border border-border p-5 shadow-xs">
      <div className={`absolute top-0 left-0 right-0 h-0.75 rounded-t-2xl ${bar[accent]}`} />
      {children}
    </div>
  );
}

function KpiSection({ sa }: { sa: ReturnType<typeof kpis> }) {
  return (
    <div className="grid grid-cols-2 gap-4 mb-6">
      <KpiCard accent="green">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-3 bg-[rgba(22,163,74,0.12)] dark:bg-[rgba(22,163,74,0.18)]">
          <svg className="w-4 h-4 text-[#16a34a]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 20V10" /><path d="M12 20V4" /><path d="M6 20v-6" />
          </svg>
        </div>
        <div className="text-xs font-bold uppercase tracking-wide mb-1 text-muted-foreground">Alert Coverage</div>
        <div className="text-4xl font-bold tabular-nums leading-none text-foreground">{sa.alertPct}%</div>
        <div className="mt-2 text-xs text-muted-foreground">{sa.alertedCount} of {sa.total} alerted</div>
      </KpiCard>
      <KpiCard accent="accent">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-3 bg-[rgba(214,106,6,0.10)] dark:bg-[rgba(214,106,6,0.18)]">
          <svg className="w-4 h-4 text-[#d66a06]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          </svg>
        </div>
        <div className="text-xs font-bold uppercase tracking-wide mb-1 text-muted-foreground">DAS Caused</div>
        <div className="text-4xl font-bold tabular-nums leading-none text-foreground">{sa.dasCausedN}</div>
        <div className="mt-2 text-xs text-muted-foreground">{Math.round((sa.dasCausedN / Math.max(sa.total, 1)) * 100)}% of incidents</div>
      </KpiCard>
    </div>
  );
}

export function ProcessView() {
  const filtered = useIncidentStore((s) => s.filtered);
  const incidents = useIncidentStore((s) => s.incidents);

  const singleApp = useMemo(() => filtered.filter((d) => !isMultiApp(d.product)), [filtered]);
  const multiApp = useMemo(() => filtered.filter((d) => isMultiApp(d.product)), [filtered]);

  const ALL_MONTHS = useMemo(() =>
    [...new Set(incidents.filter((d) => !isMultiApp(d.product)).map((d) => getMonthFromDate(d.date)).filter(Boolean))].sort(
      (a, b) => MONTH_ORDER.indexOf(a) - MONTH_ORDER.indexOf(b)
    ), [incidents]);

  const ALL_MONTHS_MA = useMemo(() =>
    [...new Set(incidents.filter((d) => isMultiApp(d.product)).map((d) => getMonthFromDate(d.date)).filter(Boolean))].sort(
      (a, b) => MONTH_ORDER.indexOf(a) - MONTH_ORDER.indexOf(b)
    ), [incidents]);

  const sa = kpis(singleApp);
  const ma = kpis(multiApp);

  const alertSourceChart = useMemo(() => buildAlertSourceChart(singleApp), [singleApp]);
  const alertCoverageChart = useMemo(() => buildAlertCoverageChart(singleApp, ALL_MONTHS), [singleApp, ALL_MONTHS]);
  const mttrChart = useMemo(() => buildMttrChart(singleApp), [singleApp]);

  const maAlertSourceChart = useMemo(() => buildAlertSourceChart(multiApp), [multiApp]);
  const maAlertCoverageChart = useMemo(() => buildAlertCoverageChart(multiApp, ALL_MONTHS_MA), [multiApp, ALL_MONTHS_MA]);
  const maMttrChart = useMemo(() => buildMttrChart(multiApp), [multiApp]);

  return (
    <div>
      {/* ── Single-Application KPIs ── */}
      <KpiSection sa={sa} />

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="border border-border rounded-2xl overflow-hidden bg-card shadow-xs">
          <div className={CARD_HEAD}>
            <div>
              <div className="text-sm font-bold text-foreground">How Were We Alerted?</div>
              <div className="text-xs mt-0.5 text-muted-foreground">Detection channel breakdown</div>
            </div>
            <span className={CARD_BADGE}>Detection</span>
          </div>
          <PlotlyChart data={alertSourceChart.data} layout={alertSourceChart.layout} className="h-80" />
        </div>
        <div className="border border-border rounded-2xl overflow-hidden bg-card shadow-xs">
          <div className={CARD_HEAD}>
            <div>
              <div className="text-sm font-bold text-foreground">Alert Coverage by Month</div>
              <div className="text-xs mt-0.5 text-muted-foreground">% of incidents with triggered alerts</div>
            </div>
            <span className={CARD_BADGE}>Coverage</span>
          </div>
          <PlotlyChart data={alertCoverageChart.data} layout={alertCoverageChart.layout} className="h-80" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="border border-border rounded-2xl overflow-hidden bg-card shadow-xs">
          <div className={CARD_HEAD}>
            <div>
              <div className="text-sm font-bold text-foreground">Avg Resolution Time by Product</div>
              <div className="text-xs mt-0.5 text-muted-foreground">Mean time to resolve · log scale</div>
            </div>
            <span className={CARD_BADGE}>MTTR</span>
          </div>
          <PlotlyChart data={mttrChart.data} layout={mttrChart.layout} className="h-80" />
        </div>
      </div>

      {/* ── Multi-Application ── */}
      {multiApp.length > 0 && (
        <>
          <MultiAppDivider />

          <KpiSection sa={ma} />

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="border border-border rounded-2xl overflow-hidden bg-card shadow-xs">
              <div className={CARD_HEAD}>
                <div>
                  <div className="text-sm font-bold text-foreground">How Were We Alerted?</div>
                  <div className="text-xs mt-0.5 text-muted-foreground">Detection channel breakdown</div>
                </div>
                <span className={CARD_BADGE}>Detection</span>
              </div>
              <PlotlyChart data={maAlertSourceChart.data} layout={maAlertSourceChart.layout} className="h-80" />
            </div>
            <div className="border border-border rounded-2xl overflow-hidden bg-card shadow-xs">
              <div className={CARD_HEAD}>
                <div>
                  <div className="text-sm font-bold text-foreground">Alert Coverage by Month</div>
                  <div className="text-xs mt-0.5 text-muted-foreground">% of incidents with triggered alerts</div>
                </div>
                <span className={CARD_BADGE}>Coverage</span>
              </div>
              <PlotlyChart data={maAlertCoverageChart.data} layout={maAlertCoverageChart.layout} className="h-80" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="border border-border rounded-2xl overflow-hidden bg-card shadow-xs">
              <div className={CARD_HEAD}>
                <div>
                  <div className="text-sm font-bold text-foreground">Avg Resolution Time by Product Pairing</div>
                  <div className="text-xs mt-0.5 text-muted-foreground">Mean time to resolve · log scale</div>
                </div>
                <span className={CARD_BADGE}>MTTR</span>
              </div>
              <PlotlyChart data={maMttrChart.data} layout={maMttrChart.layout} className="h-80" />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
