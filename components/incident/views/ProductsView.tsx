"use client";

import { useMemo } from 'react';
import { useIncidentStore } from '@/store/useIncidentStore';
import { PlotlyChart } from '@/components/incident/PlotlyChart';
import { parseOutageHrs, isMultiApp, chartBase } from '@/lib/incidentUtils';
import type { Incident } from '@/types/incident';

const CARD_HEAD = 'flex justify-between items-start px-5 pt-[18px] pb-0';
const CARD_BADGE = 'px-[10px] py-[5px] rounded-full text-[10px] font-extrabold uppercase tracking-[0.08em] bg-[rgba(214,106,6,0.10)] dark:bg-[rgba(214,106,6,0.18)] text-[#d66a06] whitespace-nowrap shrink-0';
const MINI_BAR_WRAP = 'flex-1 mx-[10px] h-[5px] bg-border rounded-full overflow-hidden';
const MINI_BAR = 'h-full rounded-full';
const MINI_VAL = 'font-bold text-xs tabular-nums min-w-9 text-right text-foreground';

function calcLeftMargin(names: string[]): number {
  if (!names.length) return 50;
  return Math.min(Math.max(Math.max(...names.map((n) => n.length)) * 7 + 20, 80), 320);
}

function truncateName(name: string, maxLen = 42): string {
  return name.length <= maxLen ? name : name.slice(0, maxLen - 1) + '…';
}

function buildOutageHoursChart(data: Incident[]) {
  const byProdHrs: Record<string, number> = {};
  data.forEach((d) => {
    byProdHrs[d.product] = (byProdHrs[d.product] || 0) + parseOutageHrs(d.downtime);
  });
  const ph = Object.entries(byProdHrs)
    .filter(([, v]) => v > 0)
    .sort((a, b) => a[1] - b[1]);
  const truncatedNames = ph.map(([name]) => truncateName(name));
  const autoMargin = calcLeftMargin(truncatedNames);
  return {
    data: [{
      type: 'bar',
      orientation: 'h',
      x: ph.map(([, v]) => +v.toFixed(1)),
      y: truncatedNames,
      customdata: ph.map(([name]) => name),
      text: ph.map(([, v]) => `${v.toFixed(1)}h`),
      textposition: 'outside',
      textfont: { size: 11, color: 'var(--id-muted)' },
      cliponaxis: false,
      marker: { color: ph.map((_, i) => (i === ph.length - 1 ? 'var(--id-blue)' : 'var(--id-blue-soft)')) },
      hovertemplate: '%{customdata}: %{x}h<extra></extra>',
    }],
    layout: {
      ...chartBase({ l: autoMargin, r: 80, t: 10, b: 40 }),
      xaxis: { type: 'log', dtick: 1, gridcolor: 'var(--id-border)', tickfont: { family: 'inherit', color: 'var(--id-text)', size: 12, weight: 600 }, zeroline: false, automargin: true },
      yaxis: { gridcolor: 'var(--id-border)', tickfont: { family: 'inherit', color: 'var(--id-text)', size: 12, weight: 600 }, zeroline: false, automargin: true },
    },
  };
}

function buildOwnershipChart(data: Incident[]) {
  const sorted = [...new Set(data.map((d) => d.product))]
    .map((p) => ({
      name: p,
      internal: data.filter((d) => d.product === p && d.dasCaused === 1).length,
      external: data.filter((d) => d.product === p && d.dasCaused === 0).length,
    }))
    .sort((a, b) => (a.internal + a.external) - (b.internal + b.external));
  const prodList = sorted.map((p) => truncateName(p.name));
  const prodListFull = sorted.map((p) => p.name);
  const autoMargin = calcLeftMargin(prodList);
  return {
    data: [
      { type: 'bar', name: 'DAS Caused', orientation: 'h', y: prodList, x: sorted.map((p) => p.internal), customdata: prodListFull, marker: { color: 'var(--id-accent)' }, hovertemplate: '%{customdata}: %{x} DAS-caused<extra></extra>' },
      { type: 'bar', name: 'External/Partner', orientation: 'h', y: prodList, x: sorted.map((p) => p.external), customdata: prodListFull, marker: { color: 'var(--id-blue)' }, hovertemplate: '%{customdata}: %{x} external<extra></extra>' },
    ],
    layout: {
      ...chartBase({ l: autoMargin, r: 160, t: 10, b: 40 }),
      barmode: 'stack',
      showlegend: true,
      legend: { orientation: 'v', x: 1.03, y: 0.5, font: { family: 'inherit', color: 'var(--id-text)', size: 12, weight: 600 } },
      xaxis: { gridcolor: 'var(--id-border)', tickfont: { family: 'inherit', color: 'var(--id-text)', size: 12, weight: 600 }, zeroline: false, automargin: true },
      yaxis: { gridcolor: 'var(--id-border)', tickfont: { family: 'inherit', color: 'var(--id-text)', size: 12, weight: 600 }, zeroline: false, automargin: true },
    },
  };
}

function buildSummaryData(data: Incident[]) {
  const byProdCnt: Record<string, number> = {};
  data.forEach((d) => { byProdCnt[d.product] = (byProdCnt[d.product] || 0) + 1; });
  const topCnt = Object.entries(byProdCnt).sort((a, b) => b[1] - a[1]);
  const maxCnt = topCnt[0]?.[1] || 1;

  const byProdHrs: Record<string, number> = {};
  data.forEach((d) => { byProdHrs[d.product] = (byProdHrs[d.product] || 0) + parseOutageHrs(d.downtime); });
  const ph = Object.entries(byProdHrs).sort((a, b) => b[1] - a[1]);
  const maxHrs = ph[0]?.[1] || 1;

  const sevByProd: Record<string, { P1: number; P2: number; P3: number; P4: number }> = {};
  data.forEach((d) => {
    if (!sevByProd[d.product]) sevByProd[d.product] = { P1: 0, P2: 0, P3: 0, P4: 0 };
    sevByProd[d.product][d.severity]++;
  });
  const maxP1 = Math.max(...Object.values(sevByProd).map((x) => x.P1 || 0), 1);
  const p1List = Object.entries(sevByProd).sort((a, b) => (b[1].P1 || 0) - (a[1].P1 || 0));

  return { topCnt, maxCnt, ph, maxHrs, p1List, maxP1 };
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

function SummaryGrid({ data, label }: { data: ReturnType<typeof buildSummaryData>; label: string }) {
  return (
    <div className="grid grid-cols-3 gap-4 mb-4">
      <div className="border border-border rounded-2xl p-5 bg-card shadow-xs">
        <div className="text-xs font-bold uppercase tracking-wide mb-3 text-muted-foreground">Incidents by {label}</div>
        <div className="flex flex-col gap-2">
          {data.topCnt.map(([p, v]) => (
            <div key={p} className="flex justify-between items-center text-[13px]">
              <span className="font-semibold" style={{ fontSize: 12, minWidth: 100 }}>{p}</span>
              <div className={MINI_BAR_WRAP}><div className={MINI_BAR + ' bg-[#d66a06]'} style={{ width: `${Math.round((v / data.maxCnt) * 100)}%` }} /></div>
              <span className={MINI_VAL}>{v}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="border border-border rounded-2xl p-5 bg-card shadow-xs">
        <div className="text-xs font-bold uppercase tracking-wide mb-3 text-muted-foreground">Outage Hours by {label}</div>
        <div className="flex flex-col gap-2">
          {data.ph.map(([p, v]) => (
            <div key={p} className="flex justify-between items-center text-[13px]">
              <span className="font-semibold" style={{ fontSize: 12, minWidth: 100 }}>{p}</span>
              <div className={MINI_BAR_WRAP}><div className={MINI_BAR + ' bg-[#3b82f6]'} style={{ width: `${Math.round((v / data.maxHrs) * 100)}%` }} /></div>
              <span className={MINI_VAL}>{v.toFixed(0)}h</span>
            </div>
          ))}
        </div>
      </div>
      <div className="border border-border rounded-2xl p-5 bg-card shadow-xs">
        <div className="text-xs font-bold uppercase tracking-wide mb-3 text-muted-foreground">P1 Incidents by {label}</div>
        <div className="flex flex-col gap-2">
          {data.p1List.map(([p, s]) => (
            <div key={p} className="flex justify-between items-center text-[13px]">
              <span className="font-semibold" style={{ fontSize: 12, minWidth: 100 }}>{p}</span>
              <div className={MINI_BAR_WRAP}><div className={MINI_BAR + ' bg-[#dc2626]'} style={{ width: `${Math.round(((s.P1 || 0) / data.maxP1) * 100)}%` }} /></div>
              <span className={MINI_VAL + ' text-[#dc2626]'}>{s.P1 || 0}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ProductsView() {
  const filtered = useIncidentStore((s) => s.filtered);
  const singleApp = useMemo(() => filtered.filter((d) => !isMultiApp(d.product)), [filtered]);
  const multiApp = useMemo(() => filtered.filter((d) => isMultiApp(d.product)), [filtered]);

  const outageHoursChart = useMemo(() => buildOutageHoursChart(singleApp), [singleApp]);
  const ownershipChart = useMemo(() => buildOwnershipChart(singleApp), [singleApp]);
  const summaryData = useMemo(() => buildSummaryData(singleApp), [singleApp]);

  const maOutageHoursChart = useMemo(() => buildOutageHoursChart(multiApp), [multiApp]);
  const maOwnershipChart = useMemo(() => buildOwnershipChart(multiApp), [multiApp]);
  const maSummaryData = useMemo(() => buildSummaryData(multiApp), [multiApp]);

  return (
    <div>
      {/* ── Single-Application ── */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="border border-border rounded-2xl overflow-hidden bg-card shadow-xs">
          <div className={CARD_HEAD}>
            <div>
              <div className="text-sm font-bold text-foreground">Outage Hours by Product</div>
              <div className="text-xs mt-0.5 text-muted-foreground">Total outage duration · log scale</div>
            </div>
            <span className={CARD_BADGE}>Impact</span>
          </div>
          <PlotlyChart data={outageHoursChart.data} layout={outageHoursChart.layout} className="h-80" />
        </div>
        <div className="border border-border rounded-2xl overflow-hidden bg-card shadow-xs">
          <div className={CARD_HEAD}>
            <div>
              <div className="text-sm font-bold text-foreground">Internal vs External Ownership</div>
              <div className="text-xs mt-0.5 text-muted-foreground">DAS-caused vs partner/vendor by product</div>
            </div>
            <span className={CARD_BADGE}>Ownership</span>
          </div>
          <PlotlyChart data={ownershipChart.data} layout={ownershipChart.layout} className="h-80" />
        </div>
      </div>

      <SummaryGrid data={summaryData} label="Product" />

      {/* ── Multi-Application ── */}
      {multiApp.length > 0 && (
        <>
          <MultiAppDivider />

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="border border-border rounded-2xl overflow-hidden bg-card shadow-xs">
              <div className={CARD_HEAD}>
                <div>
                  <div className="text-sm font-bold text-foreground">Outage Hours by Product Pairing</div>
                  <div className="text-xs mt-0.5 text-muted-foreground">Total outage duration · log scale</div>
                </div>
                <span className={CARD_BADGE}>Impact</span>
              </div>
              <PlotlyChart data={maOutageHoursChart.data} layout={maOutageHoursChart.layout} className="h-80" />
            </div>
            <div className="border border-border rounded-2xl overflow-hidden bg-card shadow-xs">
              <div className={CARD_HEAD}>
                <div>
                  <div className="text-sm font-bold text-foreground">Internal vs External Ownership</div>
                  <div className="text-xs mt-0.5 text-muted-foreground">DAS-caused vs partner/vendor by pairing</div>
                </div>
                <span className={CARD_BADGE}>Ownership</span>
              </div>
              <PlotlyChart data={maOwnershipChart.data} layout={maOwnershipChart.layout} className="h-80" />
            </div>
          </div>

          <SummaryGrid data={maSummaryData} label="Product Pairing" />
        </>
      )}
    </div>
  );
}
