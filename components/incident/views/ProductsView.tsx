"use client";

import { useMemo } from 'react';
import { useIncidentStore } from '@/store/useIncidentStore';
import { PlotlyChart } from '@/components/incident/PlotlyChart';
import { parseOutageHrs, isMultiApp, chartBase } from '@/lib/incidentUtils';
import type { Incident } from '@/types/incident';

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
    sevByProd[d.product][d.sev]++;
  });
  const maxP1 = Math.max(...Object.values(sevByProd).map((x) => x.P1 || 0), 1);
  const p1List = Object.entries(sevByProd).sort((a, b) => (b[1].P1 || 0) - (a[1].P1 || 0));

  return { topCnt, maxCnt, ph, maxHrs, p1List, maxP1 };
}

function MultiAppDivider() {
  return (
    <div className="flex items-center gap-4 my-8">
      <div className="flex-1 h-px" style={{ background: 'var(--id-border)' }} />
      <span className="text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full"
        style={{ color: 'var(--id-muted)', border: '1px solid var(--id-border)' }}>
        Multi-Application Incidents
      </span>
      <div className="flex-1 h-px" style={{ background: 'var(--id-border)' }} />
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
        <div className="border rounded-2xl overflow-hidden" style={{ background: 'var(--id-surface)', borderColor: 'var(--id-border)', boxShadow: 'var(--id-shadow-sm)' }}>
          <div className="id-card-head">
            <div>
              <div className="text-sm font-bold" style={{ color: 'var(--id-text)' }}>Outage Hours by Product</div>
              <div className="text-xs mt-0.5" style={{ color: 'var(--id-muted)' }}>Total outage duration · log scale</div>
            </div>
            <span className="id-card-badge">Impact</span>
          </div>
          <PlotlyChart data={outageHoursChart.data} layout={outageHoursChart.layout} className="id-plot-area tall" />
        </div>
        <div className="border rounded-2xl overflow-hidden" style={{ background: 'var(--id-surface)', borderColor: 'var(--id-border)', boxShadow: 'var(--id-shadow-sm)' }}>
          <div className="id-card-head">
            <div>
              <div className="text-sm font-bold" style={{ color: 'var(--id-text)' }}>Internal vs External Ownership</div>
              <div className="text-xs mt-0.5" style={{ color: 'var(--id-muted)' }}>DAS-caused vs partner/vendor by product</div>
            </div>
            <span className="id-card-badge">Ownership</span>
          </div>
          <PlotlyChart data={ownershipChart.data} layout={ownershipChart.layout} className="id-plot-area tall" />
        </div>
      </div>

      <div className="id-summary-grid">
        <div className="border rounded-2xl p-5" style={{ background: 'var(--id-surface)', borderColor: 'var(--id-border)', boxShadow: 'var(--id-shadow-sm)' }}>
          <div className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: 'var(--id-muted)' }}>Incidents by Product</div>
          <div className="id-mini-list">
            {summaryData.topCnt.map(([p, v]) => (
              <div key={p} className="id-mini-row">
                <span style={{ fontSize: 12, fontWeight: 600, minWidth: 100 }}>{p}</span>
                <div className="id-mini-bar-wrap"><div className="id-mini-bar" style={{ width: `${Math.round((v / summaryData.maxCnt) * 100)}%` }} /></div>
                <span className="id-mini-val">{v}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="border rounded-2xl p-5" style={{ background: 'var(--id-surface)', borderColor: 'var(--id-border)', boxShadow: 'var(--id-shadow-sm)' }}>
          <div className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: 'var(--id-muted)' }}>Outage Hours by Product</div>
          <div className="id-mini-list">
            {summaryData.ph.map(([p, v]) => (
              <div key={p} className="id-mini-row">
                <span style={{ fontSize: 12, fontWeight: 600, minWidth: 100 }}>{p}</span>
                <div className="id-mini-bar-wrap"><div className="id-mini-bar" style={{ width: `${Math.round((v / summaryData.maxHrs) * 100)}%`, background: 'var(--id-blue)' }} /></div>
                <span className="id-mini-val">{v.toFixed(0)}h</span>
              </div>
            ))}
          </div>
        </div>
        <div className="border rounded-2xl p-5" style={{ background: 'var(--id-surface)', borderColor: 'var(--id-border)', boxShadow: 'var(--id-shadow-sm)' }}>
          <div className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: 'var(--id-muted)' }}>P1 Incidents by Product</div>
          <div className="id-mini-list">
            {summaryData.p1List.map(([p, s]) => (
              <div key={p} className="id-mini-row">
                <span style={{ fontSize: 12, fontWeight: 600, minWidth: 100 }}>{p}</span>
                <div className="id-mini-bar-wrap"><div className="id-mini-bar" style={{ width: `${Math.round(((s.P1 || 0) / summaryData.maxP1) * 100)}%`, background: 'var(--id-danger)' }} /></div>
                <span className="id-mini-val" style={{ color: 'var(--id-danger)' }}>{s.P1 || 0}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Multi-Application ── */}
      {multiApp.length > 0 && (
        <>
          <MultiAppDivider />

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="border rounded-2xl overflow-hidden" style={{ background: 'var(--id-surface)', borderColor: 'var(--id-border)', boxShadow: 'var(--id-shadow-sm)' }}>
              <div className="id-card-head">
                <div>
                  <div className="text-sm font-bold" style={{ color: 'var(--id-text)' }}>Outage Hours by Product Pairing</div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--id-muted)' }}>Total outage duration · log scale</div>
                </div>
                <span className="id-card-badge">Impact</span>
              </div>
              <PlotlyChart data={maOutageHoursChart.data} layout={maOutageHoursChart.layout} className="id-plot-area tall" />
            </div>
            <div className="border rounded-2xl overflow-hidden" style={{ background: 'var(--id-surface)', borderColor: 'var(--id-border)', boxShadow: 'var(--id-shadow-sm)' }}>
              <div className="id-card-head">
                <div>
                  <div className="text-sm font-bold" style={{ color: 'var(--id-text)' }}>Internal vs External Ownership</div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--id-muted)' }}>DAS-caused vs partner/vendor by pairing</div>
                </div>
                <span className="id-card-badge">Ownership</span>
              </div>
              <PlotlyChart data={maOwnershipChart.data} layout={maOwnershipChart.layout} className="id-plot-area tall" />
            </div>
          </div>

          <div className="id-summary-grid">
            <div className="border rounded-2xl p-5" style={{ background: 'var(--id-surface)', borderColor: 'var(--id-border)', boxShadow: 'var(--id-shadow-sm)' }}>
              <div className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: 'var(--id-muted)' }}>Incidents by Product Pairing</div>
              <div className="id-mini-list">
                {maSummaryData.topCnt.map(([p, v]) => (
                  <div key={p} className="id-mini-row">
                    <span style={{ fontSize: 12, fontWeight: 600, minWidth: 100 }}>{p}</span>
                    <div className="id-mini-bar-wrap"><div className="id-mini-bar" style={{ width: `${Math.round((v / maSummaryData.maxCnt) * 100)}%` }} /></div>
                    <span className="id-mini-val">{v}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="border rounded-2xl p-5" style={{ background: 'var(--id-surface)', borderColor: 'var(--id-border)', boxShadow: 'var(--id-shadow-sm)' }}>
              <div className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: 'var(--id-muted)' }}>Outage Hours by Product Pairing</div>
              <div className="id-mini-list">
                {maSummaryData.ph.map(([p, v]) => (
                  <div key={p} className="id-mini-row">
                    <span style={{ fontSize: 12, fontWeight: 600, minWidth: 100 }}>{p}</span>
                    <div className="id-mini-bar-wrap"><div className="id-mini-bar" style={{ width: `${Math.round((v / maSummaryData.maxHrs) * 100)}%`, background: 'var(--id-blue)' }} /></div>
                    <span className="id-mini-val">{v.toFixed(0)}h</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="border rounded-2xl p-5" style={{ background: 'var(--id-surface)', borderColor: 'var(--id-border)', boxShadow: 'var(--id-shadow-sm)' }}>
              <div className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: 'var(--id-muted)' }}>P1 Incidents by Product Pairing</div>
              <div className="id-mini-list">
                {maSummaryData.p1List.map(([p, s]) => (
                  <div key={p} className="id-mini-row">
                    <span style={{ fontSize: 12, fontWeight: 600, minWidth: 100 }}>{p}</span>
                    <div className="id-mini-bar-wrap"><div className="id-mini-bar" style={{ width: `${Math.round(((s.P1 || 0) / maSummaryData.maxP1) * 100)}%`, background: 'var(--id-danger)' }} /></div>
                    <span className="id-mini-val" style={{ color: 'var(--id-danger)' }}>{s.P1 || 0}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
