"use client";

import { useMemo } from 'react';
import { useIncidentStore } from '@/store/useIncidentStore';
import { PlotlyChart } from '@/components/incident/PlotlyChart';
import { parseOutageHrs, chartBase } from '@/lib/incidentUtils';

function calculateLeftMargin(names: string[]): number {
  if (!names.length) return 50;
  const maxLength = Math.max(...names.map((n) => n.length));
  return Math.max(maxLength * 8 + 20, 60);
}

export function ProductsView() {
  const filtered = useIncidentStore((s) => s.filtered);

  // Outage hours by product chart
  const outageHoursChart = useMemo(() => {
    const byProdHrs: Record<string, number> = {};
    filtered.forEach((d) => {
      byProdHrs[d.product] = (byProdHrs[d.product] || 0) + parseOutageHrs(d.downtime);
    });
    const ph = Object.entries(byProdHrs).sort((a, b) => b[1] - a[1]);
    const autoMargin = calculateLeftMargin(ph.map((p) => p[0]));
    return {
      data: [{
        type: 'bar',
        orientation: 'h',
        x: ph.map((p) => +p[1].toFixed(1)),
        y: ph.map((p) => p[0]),
        text: ph.map((p) => `${p[1].toFixed(1)}h`),
        textposition: 'outside',
        texttemplate: '%{text}',
        textfont: { size: 11, color: 'var(--id-text)' },
        cliponaxis: false,
        marker: { color: ph.map((_, i) => (i === 0 ? 'var(--id-blue)' : i === 1 ? 'var(--id-blue-soft)' : 'var(--id-blue-soft)')) },
        hovertemplate: '%{y}: %{x} hrs<extra></extra>',
      }],
      layout: {
        ...chartBase({ l: autoMargin, r: 80, t: 10, b: 40 }),
        xaxis: { automargin: true },
        yaxis: { automargin: true },
      },
      ph,
    };
  }, [filtered]);

  // Ownership stacked chart
  const ownershipChart = useMemo(() => {
    const prodList = [...new Set(filtered.map((d) => d.product))];
    const internal = prodList.map((p) => filtered.filter((d) => d.product === p && d.dasCaused === 1).length);
    const external = prodList.map((p) => filtered.filter((d) => d.product === p && d.dasCaused === 0).length);
    const autoMargin = calculateLeftMargin(prodList);

    return {
      data: [
        { type: 'bar', name: 'DAS Caused', orientation: 'h', y: prodList, x: internal, marker: { color: 'var(--id-accent)' }, hovertemplate: '%{y}: %{x} DAS-caused<extra></extra>' },
        { type: 'bar', name: 'External/Partner', orientation: 'h', y: prodList, x: external, marker: { color: 'var(--id-blue)' }, hovertemplate: '%{y}: %{x} external<extra></extra>' },
      ],
      layout: {
        ...chartBase({ l: autoMargin, r: 160, t: 10, b: 40 }),
        barmode: 'stack',
        showlegend: true,
        legend: { orientation: 'v', x: 1.03, y: 0.5, font: { color: 'var(--id-muted)', size: 11 } },
        xaxis: { gridcolor: 'var(--id-border)', tickfont: { color: 'var(--id-muted)', size: 11 }, zeroline: false, automargin: true },
        yaxis: { gridcolor: 'var(--id-border)', tickfont: { color: 'var(--id-muted)', size: 11 }, zeroline: false, automargin: true },
      },
    };
  }, [filtered]);

  // Summary data
  const summaryData = useMemo(() => {
    const byProdCnt: Record<string, number> = {};
    filtered.forEach((d) => { byProdCnt[d.product] = (byProdCnt[d.product] || 0) + 1; });
    const topCnt = Object.entries(byProdCnt).sort((a, b) => b[1] - a[1]);
    const maxCnt = topCnt[0]?.[1] || 1;

    const byProdHrs: Record<string, number> = {};
    filtered.forEach((d) => {
      byProdHrs[d.product] = (byProdHrs[d.product] || 0) + parseOutageHrs(d.downtime);
    });
    const ph = Object.entries(byProdHrs).sort((a, b) => b[1] - a[1]);
    const maxHrs = ph[0]?.[1] || 1;

    const sevByProd: Record<string, { P1: number; P2: number; P3: number; P4: number }> = {};
    filtered.forEach((d) => {
      if (!sevByProd[d.product]) sevByProd[d.product] = { P1: 0, P2: 0, P3: 0, P4: 0 };
      sevByProd[d.product][d.sev]++;
    });
    const maxP1 = Math.max(...Object.values(sevByProd).map((x) => x.P1 || 0), 1);
    const p1List = Object.entries(sevByProd).sort((a, b) => (b[1].P1 || 0) - (a[1].P1 || 0));

    return { topCnt, maxCnt, ph, maxHrs, p1List, maxP1 };
  }, [filtered]);

  return (
    <div>
      {/* Charts row */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="border rounded-2xl overflow-hidden" style={{ background: 'var(--id-surface)', borderColor: 'var(--id-border)', boxShadow: 'var(--id-shadow-sm)' }}>
          <div className="id-card-head">
            <div>
              <div className="text-sm font-bold" style={{ color: 'var(--id-text)' }}>Outage Hours by Product</div>
              <div className="text-xs mt-0.5" style={{ color: 'var(--id-muted)' }}>Total outage duration concentration</div>
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

      {/* Summary Grid */}
      <div className="id-summary-grid">
        {/* Incidents by product */}
        <div className="border rounded-2xl p-5" style={{ background: 'var(--id-surface)', borderColor: 'var(--id-border)', boxShadow: 'var(--id-shadow-sm)' }}>
          <div className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: 'var(--id-muted)' }}>Incidents by Product</div>
          <div className="id-mini-list">
            {summaryData.topCnt.map(([p, v]) => (
              <div key={p} className="id-mini-row">
                <span style={{ fontSize: 12, fontWeight: 600, minWidth: 100 }}>{p}</span>
                <div className="id-mini-bar-wrap">
                  <div className="id-mini-bar" style={{ width: `${Math.round((v / summaryData.maxCnt) * 100)}%` }} />
                </div>
                <span className="id-mini-val">{v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Outage hours by product */}
        <div className="border rounded-2xl p-5" style={{ background: 'var(--id-surface)', borderColor: 'var(--id-border)', boxShadow: 'var(--id-shadow-sm)' }}>
          <div className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: 'var(--id-muted)' }}>Outage Hours by Product</div>
          <div className="id-mini-list">
            {summaryData.ph.map(([p, v]) => (
              <div key={p} className="id-mini-row">
                <span style={{ fontSize: 12, fontWeight: 600, minWidth: 100 }}>{p}</span>
                <div className="id-mini-bar-wrap">
                  <div className="id-mini-bar" style={{ width: `${Math.round((v / summaryData.maxHrs) * 100)}%`, background: 'var(--id-blue)' }} />
                </div>
                <span className="id-mini-val">{v.toFixed(0)}h</span>
              </div>
            ))}
          </div>
        </div>

        {/* P1 incidents by product */}
        <div className="border rounded-2xl p-5" style={{ background: 'var(--id-surface)', borderColor: 'var(--id-border)', boxShadow: 'var(--id-shadow-sm)' }}>
          <div className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: 'var(--id-muted)' }}>P1 Incidents by Product</div>
          <div className="id-mini-list">
            {summaryData.p1List.map(([p, s]) => (
              <div key={p} className="id-mini-row">
                <span style={{ fontSize: 12, fontWeight: 600, minWidth: 100 }}>{p}</span>
                <div className="id-mini-bar-wrap">
                  <div className="id-mini-bar" style={{ width: `${Math.round(((s.P1 || 0) / summaryData.maxP1) * 100)}%`, background: 'var(--id-danger)' }} />
                </div>
                <span className="id-mini-val" style={{ color: 'var(--id-danger)' }}>{s.P1 || 0}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
