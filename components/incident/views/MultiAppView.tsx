"use client";

import { useMemo, useState } from 'react';
import { useIncidentStore } from '@/store/useIncidentStore';
import { PlotlyChart } from '@/components/incident/PlotlyChart';
import { parseOutageHrs, isMultiApp, CHART_COLORS, chartBase } from '@/lib/incidentUtils';

const c = CHART_COLORS;

function calcLeftMargin(names: string[]): number {
  if (!names.length) return 50;
  return Math.max(Math.max(...names.map((n) => n.length)) * 10 + 20, 60);
}

export function MultiAppView() {
  const filtered = useIncidentStore((s) => s.filtered);
  const [search, setSearch] = useState('');
  const [sortCol, setSortCol] = useState<'date' | 'product' | 'severity' | 'downtime'>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const multiApp = useMemo(
    () => filtered.filter((d) => isMultiApp(d.product)),
    [filtered]
  );

  // KPIs
  const total = multiApp.length;
  const p1Count = multiApp.filter((d) => d.sev === 'P1').length;
  const totalHrs = multiApp.reduce((s, d) => s + parseOutageHrs(d.downtime), 0);
  const uniqueCombos = new Set(multiApp.map((d) => d.product)).size;
  const dasCausedN = multiApp.filter((d) => d.dasCaused === 1).length;

  // Widget 1: Product combination frequency chart
  const combosChart = useMemo(() => {
    const byCombo: Record<string, number> = {};
    multiApp.forEach((d) => {
      byCombo[d.product] = (byCombo[d.product] || 0) + 1;
    });
    const entries = Object.entries(byCombo).sort((a, b) => a[1] - b[1]);
    const autoMargin = calcLeftMargin(entries.map(([name]) => name));
    return {
      data: [{
        type: 'bar',
        orientation: 'h',
        x: entries.map(([, v]) => v),
        y: entries.map(([name]) => name),
        text: entries.map(([, v]) => String(v)),
        textposition: 'outside',
        textfont: { size: 11, color: 'var(--id-muted)' },
        cliponaxis: false,
        marker: {
          color: entries.map((_, i) =>
            i === entries.length - 1 ? 'var(--id-accent)' : 'var(--id-accent2)'
          ),
        },
        hovertemplate: '%{y}: %{x} incidents<extra></extra>',
      }],
      layout: {
        ...chartBase({ l: autoMargin, r: 60, t: 10, b: 40 }),
        xaxis: {
          gridcolor: 'var(--id-border)',
          tickfont: { color: 'var(--id-muted)' },
          zeroline: false,
          dtick: 1,
          automargin: true,
        },
        yaxis: {
          gridcolor: 'var(--id-border)',
          tickfont: { color: 'var(--id-muted)' },
          zeroline: false,
          automargin: true,
        },
      },
    };
  }, [multiApp]);

  // Widget 1b: Severity breakdown chart
  const severityChart = useMemo(() => {
    const sevCounts = { P1: 0, P2: 0, P3: 0, P4: 0 };
    multiApp.forEach((d) => { sevCounts[d.sev]++; });
    const entries = Object.entries(sevCounts) as [string, number][];
    const SEV_COLORS: Record<string, string> = {
      P1: c.r, P2: c.o, P3: c.y, P4: '#6b7280',
    };
    return {
      data: [{
        type: 'bar',
        x: entries.map(([sev]) => sev),
        y: entries.map(([, v]) => v),
        text: entries.map(([, v]) => String(v)),
        textposition: 'outside',
        textfont: { size: 12, color: 'var(--id-muted)' },
        cliponaxis: false,
        marker: { color: entries.map(([sev]) => SEV_COLORS[sev]) },
        hovertemplate: '%{x}: %{y} incidents<extra></extra>',
      }],
      layout: {
        ...chartBase({ l: 40, r: 20, t: 30, b: 40 }),
        xaxis: { tickfont: { color: 'var(--id-muted)' }, zeroline: false },
        yaxis: { gridcolor: 'var(--id-border)', tickfont: { color: 'var(--id-muted)' }, zeroline: false },
      },
    };
  }, [multiApp]);

  // Table rows
  const tableRows = useMemo(() => {
    const q = search.toLowerCase();
    let rows = multiApp.filter(
      (d) =>
        !q ||
        d.title.toLowerCase().includes(q) ||
        d.product.toLowerCase().includes(q) ||
        d.fn.toLowerCase().includes(q) ||
        (d.cause || '').toLowerCase().includes(q)
    );
    rows = [...rows].sort((a, b) => {
      let va: number | string | Date, vb: number | string | Date;
      if (sortCol === 'date') { va = new Date(a.date); vb = new Date(b.date); }
      else if (sortCol === 'product') { va = a.product; vb = b.product; }
      else if (sortCol === 'severity') { va = ['P1', 'P2', 'P3', 'P4'].indexOf(a.sev); vb = ['P1', 'P2', 'P3', 'P4'].indexOf(b.sev); }
      else { va = parseOutageHrs(a.downtime); vb = parseOutageHrs(b.downtime); }
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return rows;
  }, [multiApp, search, sortCol, sortDir]);

  const sevClass: Record<string, string> = {
    P1: 'id-sev id-sev-p1', P2: 'id-sev id-sev-p2', P3: 'id-sev id-sev-p3', P4: 'id-sev id-sev-p4',
  };

  if (total === 0) {
    return (
      <div className="border border-dashed rounded-2xl p-12 mt-4 text-center" style={{ borderColor: 'var(--id-border)', background: 'var(--id-surface)' }}>
        <div className="text-sm font-semibold mb-1" style={{ color: 'var(--id-text)' }}>No multi-application incidents found</div>
        <div className="text-xs" style={{ color: 'var(--id-muted)' }}>Multi-app incidents are identified by product names containing &amp; (e.g. &ldquo;Social Logix &amp; Media Logix&rdquo;)</div>
      </div>
    );
  }

  return (
    <div>
      {/* KPI Row */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="id-kpi-card" data-accent="accent">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-3" style={{ background: 'var(--id-accent-bg)' }}>
            <svg className="w-4 h-4" style={{ color: 'var(--id-accent)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
          </div>
          <div className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: 'var(--id-muted)' }}>Multi-App Incidents</div>
          <div className="text-4xl font-bold tabular-nums leading-none" style={{ color: 'var(--id-text)' }}>{total}</div>
          <div className="mt-2 text-xs" style={{ color: 'var(--id-muted)' }}>
            <span className="font-bold" style={{ color: 'var(--id-danger)' }}>{p1Count} P1</span> critical
          </div>
        </div>

        <div className="id-kpi-card" data-accent="blue">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-3" style={{ background: 'var(--id-blue-soft)' }}>
            <svg className="w-4 h-4" style={{ color: 'var(--id-blue)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
            </svg>
          </div>
          <div className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: 'var(--id-muted)' }}>Unique Pairings</div>
          <div className="text-4xl font-bold tabular-nums leading-none" style={{ color: 'var(--id-text)' }}>{uniqueCombos}</div>
          <div className="mt-2 text-xs" style={{ color: 'var(--id-muted)' }}>Product combinations</div>
        </div>

        <div className="id-kpi-card" data-accent="blue">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-3" style={{ background: 'var(--id-blue-soft)' }}>
            <svg className="w-4 h-4" style={{ color: 'var(--id-blue)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <div className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: 'var(--id-muted)' }}>Total Outage Hours</div>
          <div className="text-4xl font-bold tabular-nums leading-none" style={{ color: 'var(--id-text)' }}>{totalHrs.toFixed(0)}</div>
          <div className="mt-2 text-xs" style={{ color: 'var(--id-muted)' }}>Cumulative duration</div>
        </div>

        <div className="id-kpi-card" data-accent="accent">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-3" style={{ background: 'var(--id-accent-bg)' }}>
            <svg className="w-4 h-4" style={{ color: 'var(--id-accent)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            </svg>
          </div>
          <div className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: 'var(--id-muted)' }}>DAS Caused</div>
          <div className="text-4xl font-bold tabular-nums leading-none" style={{ color: 'var(--id-text)' }}>{dasCausedN}</div>
          <div className="mt-2 text-xs" style={{ color: 'var(--id-muted)' }}>{Math.round((dasCausedN / Math.max(total, 1)) * 100)}% of multi-app</div>
        </div>
      </div>

      {/* Widget 1: Charts row */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="border rounded-2xl overflow-hidden" style={{ background: 'var(--id-surface)', borderColor: 'var(--id-border)', boxShadow: 'var(--id-shadow-sm)' }}>
          <div className="id-card-head">
            <div>
              <div className="text-sm font-bold" style={{ color: 'var(--id-text)' }}>Product Combination Frequency</div>
              <div className="text-xs mt-0.5" style={{ color: 'var(--id-muted)' }}>Incidents per product pairing</div>
            </div>
            <span className="id-card-badge">Combinations</span>
          </div>
          <PlotlyChart data={combosChart.data} layout={combosChart.layout} className="id-plot-area tall" />
        </div>

        <div className="border rounded-2xl overflow-hidden" style={{ background: 'var(--id-surface)', borderColor: 'var(--id-border)', boxShadow: 'var(--id-shadow-sm)' }}>
          <div className="id-card-head">
            <div>
              <div className="text-sm font-bold" style={{ color: 'var(--id-text)' }}>Severity Breakdown</div>
              <div className="text-xs mt-0.5" style={{ color: 'var(--id-muted)' }}>Multi-app incidents by severity level</div>
            </div>
            <span className="id-card-badge">Severity</span>
          </div>
          <PlotlyChart data={severityChart.data} layout={severityChart.layout} className="id-plot-area tall" />
        </div>
      </div>

      {/* Widget 2: Incident table */}
      <div className="border rounded-2xl overflow-hidden" style={{ background: 'var(--id-surface)', borderColor: 'var(--id-border)', boxShadow: 'var(--id-shadow-sm)' }}>
        <div className="flex justify-between items-center px-5 pt-4 pb-3 gap-3">
          <div>
            <div className="text-sm font-bold" style={{ color: 'var(--id-text)' }}>Multi-App Incident Log</div>
            <div className="text-xs mt-0.5" style={{ color: 'var(--id-muted)' }}>All incidents spanning multiple products</div>
          </div>
          <div className="flex gap-2 items-center">
            <input
              type="text"
              placeholder="Search incidents…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border rounded-lg px-3 py-1.5 text-sm w-56 focus:outline-none focus:border-[#d66a06]"
              style={{ borderColor: 'var(--id-border)', background: 'var(--id-surface2)', color: 'var(--id-text)' }}
            />
            <select
              value={sortCol}
              onChange={(e) => setSortCol(e.target.value as typeof sortCol)}
              className="border rounded-lg px-2 py-1.5 text-xs cursor-pointer focus:outline-none"
              style={{ borderColor: 'var(--id-border)', background: 'var(--id-surface)', color: 'var(--id-text)' }}
            >
              <option value="date">Sort: Date</option>
              <option value="product">Sort: Product</option>
              <option value="severity">Sort: Severity</option>
              <option value="downtime">Sort: Downtime</option>
            </select>
            <select
              value={sortDir}
              onChange={(e) => setSortDir(e.target.value as 'asc' | 'desc')}
              className="border rounded-lg px-2 py-1.5 text-xs cursor-pointer focus:outline-none"
              style={{ borderColor: 'var(--id-border)', background: 'var(--id-surface)', color: 'var(--id-text)' }}
            >
              <option value="desc">Desc</option>
              <option value="asc">Asc</option>
            </select>
          </div>
        </div>

        <div className="id-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Products Affected</th>
                <th>Function</th>
                <th>Sev</th>
                <th>Incident</th>
                <th>Downtime</th>
                <th>Cause</th>
                <th>Ownership</th>
                <th>Alert</th>
                <th>Reoccurring</th>
                <th>Postmortem</th>
              </tr>
            </thead>
            <tbody>
              {tableRows.map((d, i) => (
                <tr key={i}>
                  <td className="id-outage-dur" style={{ whiteSpace: 'nowrap', color: 'var(--id-muted)' }}>{d.date}</td>
                  <td style={{ fontWeight: 600, fontSize: 13 }}>{d.product}</td>
                  <td style={{ color: 'var(--id-muted)', fontSize: 12 }}>{d.fn}</td>
                  <td><span className={sevClass[d.sev]}>{d.sev}</span></td>
                  <td style={{ maxWidth: 240, fontSize: 13 }}>{d.title}</td>
                  <td className="id-outage-dur" style={{ color: 'var(--id-blue)' }}>{d.downtime || '—'}</td>
                  <td style={{ color: 'var(--id-muted)', fontSize: 12 }}>{d.cause || '—'}</td>
                  <td><span className={d.dasCaused ? 'id-chip id-chip-internal' : 'id-chip id-chip-external'}>{d.dasCaused ? 'Internal' : 'External'}</span></td>
                  <td><span className={d.alerted ? 'id-chip id-chip-yes' : 'id-chip id-chip-no'}>{d.alerted ? 'Yes' : 'No'}</span></td>
                  <td><span className={d.reoccurring ? 'id-chip id-chip-yes' : 'id-chip id-chip-no'}>{d.reoccurring ? 'Yes' : 'No'}</span></td>
                  <td><span className={d.postmortem === 'Yes' ? 'id-chip id-chip-yes' : d.postmortem === 'N/A' ? 'id-chip id-chip-na' : 'id-chip id-chip-no'}>{d.postmortem || '—'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-between px-5 py-2.5 text-xs border-t" style={{ borderColor: 'var(--id-border)', color: 'var(--id-muted)' }}>
          <span>{tableRows.length} incident{tableRows.length !== 1 ? 's' : ''} shown</span>
          <span>DAS Incident Log · 2025</span>
        </div>
      </div>
    </div>
  );
}
