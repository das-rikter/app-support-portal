"use client";

import { useMemo, useState } from 'react';
import { useIncidentStore } from '@/store/useIncidentStore';
import { PlotlyChart } from '@/components/incident/PlotlyChart';
import { parseOutageHrs, isMultiApp, MONTH_ORDER, CHART_COLORS, chartBase } from '@/lib/incidentUtils';

const c = CHART_COLORS;
const CAUSE_COLORS = [c.o, c.o2, c.o3, c.b, c.b2, c.b3, c.g, c.y, c.r, c.p, '#94a3b8', '#64748b'];

function fmtDowntime(hhmm: string): string {
  return hhmm || '—';
}

function calculateLeftMargin(names: string[]): number {
  if (!names.length) return 50;
  const maxLength = Math.max(...names.map((n) => n.length));
  // ~8 pixels per character, plus 20px padding
  return Math.max(maxLength * 8 + 20, 60);
}

export function OverviewView() {
  const filtered = useIncidentStore((s) => s.filtered);
  const incidents = useIncidentStore((s) => s.incidents);

  const singleApp = useMemo(() => filtered.filter((d) => !isMultiApp(d.product)), [filtered]);

  const ALL_MONTHS = useMemo(() =>
    [...new Set(incidents.filter((d) => !isMultiApp(d.product)).map((d) => d.month))].sort(
      (a, b) => MONTH_ORDER.indexOf(a) - MONTH_ORDER.indexOf(b)
    ),
    [incidents]
  );
  const [search, setSearch] = useState('');
  const [sortCol, setSortCol] = useState<'date' | 'product' | 'severity' | 'outage'>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  // KPIs
  const total = singleApp.length;
  const p1Count = singleApp.filter((d) => d.sev === 'P1').length;
  const totalHrs = singleApp.reduce((s, d) => s + parseOutageHrs(d.downtime), 0);
  const alertPct = Math.round((singleApp.filter((d) => d.alerted === 1).length / Math.max(total, 1)) * 100);
  const reoccurPct = Math.round((singleApp.filter((d) => d.reoccurring === 1).length / Math.max(total, 1)) * 100);

  // Monthly trend chart
  const monthlyChart = useMemo(() => {
    const monthNames: Record<string, string> = {
      'Jan': 'January', 'Feb': 'February', 'Mar': 'March', 'Apr': 'April',
      'May': 'May', 'Jun': 'June', 'Jul': 'July', 'Aug': 'August',
      'Sep': 'September', 'Oct': 'October', 'Nov': 'November', 'Dec': 'December',
      'January': 'January', 'February': 'February', 'March': 'March', 'April': 'April',
      'June': 'June', 'July': 'July', 'August': 'August',
      'September': 'September', 'October': 'October', 'November': 'November', 'December': 'December'
    };
    const monthSort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthToSort: Record<string, number> = {
      'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5, 'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11,
      'January': 0, 'February': 1, 'March': 2, 'April': 3, 'June': 5, 'July': 6, 'August': 7,
      'September': 8, 'October': 9, 'November': 10, 'December': 11
    };

    // Count all incidents by month (single-app + multi-app)
    const byMonth: Record<string, number> = {};
    filtered.forEach((d) => {
      const month = d.month;
      byMonth[month] = (byMonth[month] || 0) + 1;
    });
    
    // Get unique months and sort by calendar order
    const monthsInData = Object.keys(byMonth).sort((a, b) => {
      const aSort = monthToSort[a] ?? -1;
      const bSort = monthToSort[b] ?? -1;
      return aSort - bSort;
    });
    
    const months = monthsInData.map(m => monthNames[m] || m);
    const counts = monthsInData.map(m => byMonth[m] || 0);
    const maxVal = Math.max(...counts, 0);
    
    return {
      data: [{
        type: 'bar',
        x: months,
        y: counts,
        text: counts.map(String),
        textposition: 'outside',
        textfont: { size: 12, color: 'var(--id-text)' },
        marker: { color: counts.map((v) => (v === maxVal && maxVal > 0 ? 'var(--id-accent)' : 'var(--id-accent2)')), line: { width: 0 } },
        hovertemplate: '%{x}: %{y} incidents<extra></extra>',
      }],
      layout: { ...chartBase({ l: 40, r: 10, t: 30, b: 40 }) },
    };
  }, [filtered]);

  // Downtime by product chart
  const downtimeChart = useMemo(() => {
    const dtByProd: Record<string, number> = {};
    singleApp.forEach((d) => {
      dtByProd[d.product] = (dtByProd[d.product] || 0) + parseOutageHrs(d.downtime);
    });
    const entries = Object.entries(dtByProd).sort((a, b) => b[1] - a[1]);
    const autoMargin = calculateLeftMargin(entries.map((e) => e[0]));
    return {
      data: [{
        type: 'bar',
        x: entries.map((e) => +e[1].toFixed(1)),
        y: entries.map((e) => e[0]),
        orientation: 'h',
        text: entries.map((e) => `${e[1].toFixed(1)}h`),
        texttemplate: '%{text}',
        textposition: 'outside',
        textfont: { size: 11, color: 'var(--id-text)' },
        cliponaxis: false,
        marker: { color: entries.map((_, i) => (i === 0 ? 'var(--id-blue)' : i === 1 ? 'var(--id-blue-soft)' : 'var(--id-blue-soft)')) },
        hovertemplate: '%{y}: %{x}h downtime<extra></extra>',
      }],
      layout: {
        ...chartBase({ l: autoMargin, r: 80, t: 10, b: 40 }),
        xaxis: { gridcolor: 'var(--id-border)', tickfont: { color: 'var(--id-muted)' }, zeroline: false, ticksuffix: 'h', automargin: true },
        yaxis: { gridcolor: 'var(--id-border)', tickfont: { color: 'var(--id-muted)' }, zeroline: false, automargin: true },
      },
    };
  }, [singleApp]);

  // Product volume chart
  const productVolChart = useMemo(() => {
    const byProd: Record<string, number> = {};
    singleApp.forEach((d) => { byProd[d.product] = (byProd[d.product] || 0) + 1; });
    const prods = Object.entries(byProd).sort((a, b) => b[1] - a[1]);
    const autoMargin = calculateLeftMargin(prods.map((p) => p[0]));
    return {
      data: [{
        type: 'bar',
        orientation: 'h',
        x: prods.map((p) => p[1]),
        y: prods.map((p) => p[0]),
        text: prods.map((p) => String(p[1])),
        texttemplate: '%{text}',
        textposition: 'outside',
        textfont: { size: 11, color: 'var(--id-text)' },
        cliponaxis: false,
        marker: { color: prods.map((_, i) => (i === 0 ? 'var(--id-accent)' : i === 1 ? 'var(--id-accent2)' : 'var(--id-accent-bg)')) },
        hovertemplate: '%{y}: %{x} incidents<extra></extra>',
      }],
      layout: {
        ...chartBase({ l: autoMargin, r: 80, t: 10, b: 40 }),
        xaxis: { automargin: true },
        yaxis: { automargin: true },
      },
    };
  }, [singleApp]);

  // Root causes chart
  const causesChart = useMemo(() => {
    const byCause: Record<string, number> = {};
    singleApp.forEach((d) => {
      if (d.cause) byCause[d.cause] = (byCause[d.cause] || 0) + 1;
    });
    const causes = Object.entries(byCause).sort((a, b) => b[1] - a[1]).slice(0, 12);
    return {
      data: [{
        type: 'bar',
        x: causes.map((ca) => ca[0]),
        y: causes.map((ca) => ca[1]),
        marker: { color: causes.map((_, i) => CAUSE_COLORS[i] || '#94a3b8') },
        hovertemplate: '%{x}: %{y}<extra></extra>',
      }],
      layout: {
        ...chartBase({ l: 40, r: 10, t: 10, b: 90 }),
        xaxis: { gridcolor: 'var(--id-border)', tickfont: { color: 'var(--id-muted)', size: 11 }, zeroline: false, tickangle: -35 },
        yaxis: { gridcolor: 'var(--id-border)', tickfont: { color: 'var(--id-muted)' }, zeroline: false },
      },
    };
  }, [singleApp]);

  // Table rows
  const tableRows = useMemo(() => {
    const q = search.toLowerCase();
    let rows = singleApp.filter(
      (d) =>
        !q ||
        d.title.toLowerCase().includes(q) ||
        d.product.toLowerCase().includes(q) ||
        d.fn.toLowerCase().includes(q) ||
        (d.cause || '').toLowerCase().includes(q) ||
        (d.alertSrc || '').toLowerCase().includes(q)
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
  }, [singleApp, search, sortCol, sortDir]);

  const sevClass: Record<string, string> = {
    P1: 'id-sev id-sev-p1', P2: 'id-sev id-sev-p2', P3: 'id-sev id-sev-p3', P4: 'id-sev id-sev-p4',
  };

  return (
    <div>
      {/* KPI Grid */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="id-kpi-card" data-accent="accent">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-3" style={{ background: 'var(--id-accent-bg)' }}>
            <svg className="w-4 h-4" style={{ color: 'var(--id-accent)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
          </div>
          <div className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: 'var(--id-muted)' }}>Total Incidents</div>
          <div className="text-4xl font-bold tabular-nums leading-none" style={{ color: 'var(--id-text)' }}>{total}</div>
          <div className="flex justify-between mt-2 text-xs" style={{ color: 'var(--id-muted)' }}>
            <span>Jan–Oct 2025</span>
            <span className="font-bold" style={{ color: 'var(--id-danger)' }}>{p1Count} P1s</span>
          </div>
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

        <div className="id-kpi-card" data-accent="green">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-3" style={{ background: 'var(--id-green-soft)' }}>
            <svg className="w-4 h-4" style={{ color: 'var(--id-green)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <div className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: 'var(--id-muted)' }}>Alert Coverage</div>
          <div className="text-4xl font-bold tabular-nums leading-none" style={{ color: 'var(--id-text)' }}>{alertPct}%</div>
          <div className="flex justify-between mt-2 text-xs" style={{ color: 'var(--id-muted)' }}>
            <span>Alerts triggered</span>
            <span className="font-bold" style={{ color: alertPct >= 70 ? 'var(--id-green)' : 'var(--id-warn)' }}>
              {alertPct >= 70 ? 'Good' : 'Needs work'}
            </span>
          </div>
        </div>

        <div className="id-kpi-card" data-accent="warn">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-3" style={{ background: 'var(--id-warn-soft)' }}>
            <svg className="w-4 h-4" style={{ color: 'var(--id-warn)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <div className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: 'var(--id-muted)' }}>Reoccurring Issues</div>
          <div className="text-4xl font-bold tabular-nums leading-none" style={{ color: 'var(--id-text)' }}>{reoccurPct}%</div>
          <div className="mt-2 text-xs" style={{ color: 'var(--id-muted)' }}>Flagged repeat incidents</div>
        </div>
      </div>

      {/* Chart Row 1 */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="border rounded-2xl overflow-hidden" style={{ background: 'var(--id-surface)', borderColor: 'var(--id-border)', boxShadow: 'var(--id-shadow-sm)' }}>
          <div className="id-card-head">
            <div>
              <div className="text-sm font-bold" style={{ color: 'var(--id-text)' }}>Incidents by Month</div>
              <div className="text-xs mt-0.5" style={{ color: 'var(--id-muted)' }}>Volume trend across the year</div>
            </div>
            <span className="id-card-badge">Trend</span>
          </div>
          <PlotlyChart data={monthlyChart.data} layout={monthlyChart.layout} className="id-plot-area" />
        </div>
        <div className="border rounded-2xl overflow-hidden" style={{ background: 'var(--id-surface)', borderColor: 'var(--id-border)', boxShadow: 'var(--id-shadow-sm)' }}>
          <div className="id-card-head">
            <div>
              <div className="text-sm font-bold" style={{ color: 'var(--id-text)' }}>Downtime by Product</div>
              <div className="text-xs mt-0.5" style={{ color: 'var(--id-muted)' }}>Total downtime hours per product</div>
            </div>
            <span className="id-card-badge">Downtime</span>
          </div>
          <PlotlyChart data={downtimeChart.data} layout={downtimeChart.layout} className="id-plot-area" />
        </div>
      </div>

      {/* Chart Row 2 */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="border rounded-2xl overflow-hidden" style={{ background: 'var(--id-surface)', borderColor: 'var(--id-border)', boxShadow: 'var(--id-shadow-sm)' }}>
          <div className="id-card-head">
            <div>
              <div className="text-sm font-bold" style={{ color: 'var(--id-text)' }}>Incidents by Product</div>
              <div className="text-xs mt-0.5" style={{ color: 'var(--id-muted)' }}>Volume concentration by product area</div>
            </div>
            <span className="id-card-badge">Volume</span>
          </div>
          <PlotlyChart data={productVolChart.data} layout={productVolChart.layout} className="id-plot-area tall" />
        </div>
        <div className="border rounded-2xl overflow-hidden" style={{ background: 'var(--id-surface)', borderColor: 'var(--id-border)', boxShadow: 'var(--id-shadow-sm)' }}>
          <div className="id-card-head">
            <div>
              <div className="text-sm font-bold" style={{ color: 'var(--id-text)' }}>Root Cause Categories</div>
              <div className="text-xs mt-0.5" style={{ color: 'var(--id-muted)' }}>{"What's driving incidents"}</div>
            </div>
            <span className="id-card-badge">Root Cause</span>
          </div>
          <PlotlyChart data={causesChart.data} layout={causesChart.layout} className="id-plot-area tall" />
        </div>
      </div>

      {/* Incident Log Table */}
      <div className="border rounded-2xl overflow-hidden mb-4" style={{ background: 'var(--id-surface)', borderColor: 'var(--id-border)', boxShadow: 'var(--id-shadow-sm)' }}>
        <div className="flex justify-between items-center px-5 pt-4 pb-3 gap-3">
          <div>
            <div className="text-sm font-bold" style={{ color: 'var(--id-text)' }}>Incident Log</div>
            <div className="text-xs mt-0.5" style={{ color: 'var(--id-muted)' }}>All incidents matching current filters</div>
          </div>
          <div className="flex gap-2 items-center">
            <input
              type="text"
              placeholder="Search…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border rounded-lg px-3 py-1.5 text-sm w-48 focus:outline-none focus:border-[#d66a06]"
              style={{ borderColor: 'var(--id-border)', background: 'var(--id-surface2)', color: 'var(--id-text)' }}
            />
            <select
              value={sortCol}
              onChange={(e) => setSortCol(e.target.value as typeof sortCol)}
              className="border rounded-lg px-2 py-1.5 text-xs cursor-pointer focus:outline-none"
              style={{ borderColor: 'var(--id-border)', background: 'var(--id-surface)', color: 'var(--id-text)' }}
            >
              <option value="date">Date</option>
              <option value="product">Product</option>
              <option value="severity">Severity</option>
              <option value="downtime">Downtime hrs</option>
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
                <th>Month</th>
                <th>Product</th>
                <th>Function</th>
                <th>Sev</th>
                <th>Incident Title</th>
                <th>Outage</th>
                <th>Downtime</th>
                <th>Root Cause</th>
                <th>Ownership</th>
                <th>Alert</th>
                <th>Alerted Via</th>
                <th>Reoccurring</th>
                <th>DAS Caused</th>
                <th>Postmortem</th>
              </tr>
            </thead>
            <tbody>
              {tableRows.map((d, i) => (
                <tr key={i}>
                  <td className="id-outage-dur" style={{ color: 'var(--id-muted)', whiteSpace: 'nowrap' }}>{d.date}</td>
                  <td style={{ fontSize: 12, color: 'var(--id-muted)' }}>{d.month}</td>
                  <td style={{ fontWeight: 700, fontSize: 13 }}>{d.product}</td>
                  <td style={{ color: 'var(--id-muted)', fontSize: 12 }}>{d.fn}</td>
                  <td><span className={sevClass[d.sev]}>{d.sev}</span></td>
                  <td style={{ fontSize: 13, maxWidth: 220 }}>{d.title}</td>
                  <td className="id-outage-dur">{d.incidentLength || '—'}</td>
                  <td className="id-outage-dur" style={{ color: 'var(--id-blue)' }}>{fmtDowntime(d.downtime)}</td>
                  <td style={{ fontSize: 12, color: 'var(--id-muted)' }}>{d.cause || '—'}</td>
                  <td><span className={d.dasCaused ? 'id-chip id-chip-internal' : 'id-chip id-chip-external'}>{d.dasCaused ? 'Internal' : 'External'}</span></td>
                  <td><span className={d.alerted ? 'id-chip id-chip-yes' : 'id-chip id-chip-no'}>{d.alerted ? 'Yes' : 'No'}</span></td>
                  <td style={{ fontSize: 12, color: 'var(--id-muted)' }}>{d.alertSrc || '—'}</td>
                  <td><span className={d.reoccurring ? 'id-chip id-chip-yes' : 'id-chip id-chip-no'}>{d.reoccurring ? 'Yes' : 'No'}</span></td>
                  <td><span className={d.dasCaused ? 'id-chip id-chip-internal' : 'id-chip id-chip-no'}>{d.dasCaused ? 'Yes' : 'No'}</span></td>
                  <td><span className={d.postmortem === 'Yes' ? 'id-chip id-chip-yes' : d.postmortem === 'N/A' ? 'id-chip id-chip-na' : 'id-chip id-chip-no'}>{d.postmortem || '—'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-between px-5 py-2.5 text-xs border-t" style={{ borderColor: 'var(--id-border)', color: 'var(--id-muted)' }}>
          <span>{tableRows.length} incident{tableRows.length !== 1 ? 's' : ''}</span>
          <span>DAS Incident Log · 2025</span>
        </div>
      </div>
    </div>
  );
}
