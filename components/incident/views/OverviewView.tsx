"use client";

import { PlotlyChart } from '@/components/incident/PlotlyChart';
import { CHART_COLORS, chartBase, formatMinutes, getMonthFromDate, isMultiApp, parseOutageHrs } from '@/lib/incidentUtils';
import { useIncidentStore } from '@/store/useIncidentStore';
import type { Incident } from '@/types/incident';
import { useMemo, useState } from 'react';

const c = CHART_COLORS;
const CAUSE_COLORS = [c.o, c.o2, c.o3, c.b, c.b2, c.b3, c.g, c.y, c.r, c.p, '#94a3b8', '#64748b'];

const MONTH_NAMES: Record<string, string> = {
  Jan: 'January', Feb: 'February', Mar: 'March', Apr: 'April',
  May: 'May', Jun: 'June', Jul: 'July', Aug: 'August',
  Sep: 'September', Oct: 'October', Nov: 'November', Dec: 'December',
  January: 'January', February: 'February', March: 'March', April: 'April',
  June: 'June', July: 'July', August: 'August',
  September: 'September', October: 'October', November: 'November', December: 'December',
};

const ALL_12_MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function calcLeftMargin(names: string[]): number {
  if (!names.length) return 50;
  return Math.max(Math.max(...names.map((n) => n.length)) * 8 + 20, 60);
}

function buildMonthlyChart(data: Incident[]) {
  const byMonth: Record<string, number> = {};
  data.forEach((d) => {
    const short = getMonthFromDate(d.date);
    const full = MONTH_NAMES[short] || short;
    byMonth[full] = (byMonth[full] || 0) + 1;
  });
  const counts = ALL_12_MONTHS.map((m) => byMonth[m] || 0);
  const maxVal = Math.max(...counts, 0);
  return {
    data: [{
      type: 'bar',
      x: ALL_12_MONTHS,
      y: counts,
      text: counts.map(String),
      textposition: 'outside',
      textfont: { size: 12, color: 'var(--id-text)' },
      marker: { color: counts.map((v) => (v === maxVal && maxVal > 0 ? 'var(--id-accent)' : 'var(--id-accent2)')), line: { width: 0 } },
      hovertemplate: '%{x}: %{y} incidents<extra></extra>',
    }],
    layout: { ...chartBase({ l: 40, r: 10, t: 30, b: 40 }) },
  };
}

function buildDowntimeChart(data: Incident[]) {
  const dtByProd: Record<string, number> = {};
  data.forEach((d) => { dtByProd[d.product] = (dtByProd[d.product] || 0) + parseOutageHrs(d.downtime); });
  const entries = Object.entries(dtByProd).sort((a, b) => b[1] - a[1]);
  const autoMargin = calcLeftMargin(entries.map((e) => e[0]));
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
      marker: { color: entries.map((_, i) => (i === 0 ? 'var(--id-blue)' : 'var(--id-blue-soft)')) },
      hovertemplate: '%{y}: %{x}h downtime<extra></extra>',
    }],
    layout: {
      ...chartBase({ l: autoMargin, r: 80, t: 10, b: 40 }),
      xaxis: { gridcolor: 'var(--id-border)', tickfont: { color: 'var(--id-text)' }, zeroline: false, ticksuffix: 'h', automargin: true },
      yaxis: { gridcolor: 'var(--id-border)', tickfont: { color: 'var(--id-text)' }, zeroline: false, automargin: true },
    },
  };
}

function buildProductVolChart(data: Incident[]) {
  const byProd: Record<string, number> = {};
  data.forEach((d) => { byProd[d.product] = (byProd[d.product] || 0) + 1; });
  const prods = Object.entries(byProd).sort((a, b) => b[1] - a[1]);
  const autoMargin = calcLeftMargin(prods.map((p) => p[0]));
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
}

function buildCausesChart(data: Incident[]) {
  const byCause: Record<string, number> = {};
  data.forEach((d) => { if (d.cause) byCause[d.cause] = (byCause[d.cause] || 0) + 1; });
  const causes = Object.entries(byCause).sort((a, b) => b[1] - a[1]).slice(0, 12);
  return {
    data: [{
      type: 'pie',
      labels: causes.map((ca) => ca[0]),
      values: causes.map((ca) => ca[1]),
      marker: { colors: causes.map((_, i) => CAUSE_COLORS[i] || '#94a3b8') },
      textinfo: 'label+percent',
      textposition: 'outside',
      automargin: true,
      hovertemplate: '%{label}: %{value}<extra></extra>',
    }],
    layout: {
      ...chartBase({ l: 10, r: 10, t: 10, b: 10 }),
      showlegend: false,
    },
  };
}

function sortRows(rows: Incident[], col: string, dir: 'asc' | 'desc') {
  return [...rows].sort((a, b) => {
    let va: number | string | Date, vb: number | string | Date;
    if (col === 'date') { va = new Date(a.date); vb = new Date(b.date); }
    else if (col === 'product') { va = a.product; vb = b.product; }
    else if (col === 'severity') { va = ['P1', 'P2', 'P3', 'P4'].indexOf(a.severity); vb = ['P1', 'P2', 'P3', 'P4'].indexOf(b.severity); }
    else { va = parseOutageHrs(a.downtime); vb = parseOutageHrs(b.downtime); }
    if (va < vb) return dir === 'asc' ? -1 : 1;
    if (va > vb) return dir === 'asc' ? 1 : -1;
    return 0;
  });
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

const SEV_CLASS: Record<string, string> = {
  P1: 'inline-flex px-[9px] py-[3px] rounded-full text-[11px] font-extrabold tracking-[0.04em] bg-[rgba(220,38,38,0.12)] text-[#dc2626] dark:bg-[rgba(220,38,38,0.18)]',
  P2: 'inline-flex px-[9px] py-[3px] rounded-full text-[11px] font-extrabold tracking-[0.04em] bg-[rgba(217,119,6,0.12)] text-[#d97706] dark:bg-[rgba(217,119,6,0.18)]',
  P3: 'inline-flex px-[9px] py-[3px] rounded-full text-[11px] font-extrabold tracking-[0.04em] bg-[rgba(59,130,246,0.12)] text-[#3b82f6] dark:bg-[rgba(59,130,246,0.18)]',
  P4: 'inline-flex px-[9px] py-[3px] rounded-full text-[11px] font-extrabold tracking-[0.04em] bg-[rgba(22,163,74,0.12)] text-[#16a34a] dark:bg-[rgba(22,163,74,0.18)]',
};

const CHIP: Record<string, string> = {
  internal: 'inline-flex px-[9px] py-[3px] rounded-full text-[11px] font-bold bg-[rgba(214,106,6,0.10)] text-[#d66a06] dark:bg-[rgba(214,106,6,0.18)]',
  external: 'inline-flex px-[9px] py-[3px] rounded-full text-[11px] font-bold bg-[rgba(59,130,246,0.12)] text-[#3b82f6] dark:bg-[rgba(59,130,246,0.18)]',
  yes: 'inline-flex px-[9px] py-[3px] rounded-full text-[11px] font-bold bg-[rgba(22,163,74,0.12)] text-[#16a34a] dark:bg-[rgba(22,163,74,0.18)]',
  no: 'inline-flex px-[9px] py-[3px] rounded-full text-[11px] font-bold bg-[rgba(107,114,128,0.12)] text-muted-foreground',
  na: 'inline-flex px-[9px] py-[3px] rounded-full text-[11px] font-bold bg-[rgba(107,114,128,0.08)] text-muted-foreground',
};

const CARD_HEAD = 'flex justify-between items-start px-5 pt-[18px] pb-0';
const CARD_BADGE = 'px-[10px] py-[5px] rounded-full text-[10px] font-extrabold uppercase tracking-[0.08em] bg-[rgba(214,106,6,0.10)] dark:bg-[rgba(214,106,6,0.18)] text-[#d66a06] whitespace-nowrap shrink-0';
const TH = 'sticky top-0 z-[2] px-[14px] py-[10px] text-[11px] uppercase tracking-[0.08em] text-muted-foreground font-bold text-left border-b border-border whitespace-nowrap select-none bg-secondary';
const TD = 'px-[14px] py-3 border-b border-border text-[13px] align-middle';
const controlCls = 'border border-border rounded-lg px-2 py-1.5 text-xs cursor-pointer focus:outline-none bg-secondary text-foreground';

function KpiCard({ accent, children }: { accent: 'accent' | 'blue' | 'green' | 'warn'; children: React.ReactNode }) {
  const bar: Record<string, string> = {
    accent: 'bg-gradient-to-r from-[#d66a06] to-[#f1a24b]',
    blue: 'bg-[#3b82f6]',
    green: 'bg-[#16a34a]',
    warn: 'bg-[#d97706]',
  };
  return (
    <div className="relative overflow-hidden bg-card rounded-2xl border border-border p-5 shadow-xs">
      <div className={`absolute top-0 left-0 right-0 h-0.75 rounded-t-2xl ${bar[accent]}`} />
      {children}
    </div>
  );
}

export function OverviewView() {
  const filtered = useIncidentStore((s) => s.filtered);
  const singleApp = useMemo(() => filtered.filter((d) => !isMultiApp(d.product)), [filtered]);
  const multiApp = useMemo(() => filtered.filter((d) => isMultiApp(d.product)), [filtered]);

  const [search, setSearch] = useState('');
  const [sortCol, setSortCol] = useState<'date' | 'product' | 'severity' | 'outage'>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [maSearch, setMaSearch] = useState('');
  const [maSortCol, setMaSortCol] = useState<'date' | 'product' | 'severity' | 'outage'>('date');
  const [maSortDir, setMaSortDir] = useState<'asc' | 'desc'>('desc');

  const total = singleApp.length;
  const p1Count = singleApp.filter((d) => d.severity === 'P1').length;
  const totalHrs = singleApp.reduce((s, d) => s + parseOutageHrs(d.downtime), 0);
  const alertPct = Math.round((singleApp.filter((d) => d.alerted === 1).length / Math.max(total, 1)) * 100);
  const dasCausedPct = Math.round((singleApp.filter((d) => d.dasCaused === 1).length / Math.max(total, 1)) * 100);

  const maTotal = multiApp.length;
  const maP1Count = multiApp.filter((d) => d.severity === 'P1').length;
  const maTotalHrs = multiApp.reduce((s, d) => s + parseOutageHrs(d.downtime), 0);
  const maAlertPct = Math.round((multiApp.filter((d) => d.alerted === 1).length / Math.max(maTotal, 1)) * 100);
  const maDasCausedPct = Math.round((multiApp.filter((d) => d.dasCaused === 1).length / Math.max(maTotal, 1)) * 100);

  const monthlyChart = useMemo(() => buildMonthlyChart(filtered), [filtered]);
  const downtimeChart = useMemo(() => buildDowntimeChart(singleApp), [singleApp]);
  const productVolChart = useMemo(() => buildProductVolChart(singleApp), [singleApp]);
  const causesChart = useMemo(() => buildCausesChart(singleApp), [singleApp]);

  const maMonthlyChart = useMemo(() => buildMonthlyChart(multiApp), [multiApp]);
  const maDowntimeChart = useMemo(() => buildDowntimeChart(multiApp), [multiApp]);
  const maProductVolChart = useMemo(() => buildProductVolChart(multiApp), [multiApp]);
  const maCausesChart = useMemo(() => buildCausesChart(multiApp), [multiApp]);

  const tableRows = useMemo(() => {
    const q = search.toLowerCase();
    const rows = singleApp.filter((d) =>
      !q || d.title.toLowerCase().includes(q) || d.product.toLowerCase().includes(q) ||
      d.function.toLowerCase().includes(q) || (d.cause || '').toLowerCase().includes(q) || (d.alertSrc || '').toLowerCase().includes(q)
    );
    return sortRows(rows, sortCol, sortDir);
  }, [singleApp, search, sortCol, sortDir]);

  const maTableRows = useMemo(() => {
    const q = maSearch.toLowerCase();
    const rows = multiApp.filter((d) =>
      !q || d.title.toLowerCase().includes(q) || d.product.toLowerCase().includes(q) ||
      d.function.toLowerCase().includes(q) || (d.cause || '').toLowerCase().includes(q) || (d.alertSrc || '').toLowerCase().includes(q)
    );
    return sortRows(rows, maSortCol, maSortDir);
  }, [multiApp, maSearch, maSortCol, maSortDir]);

  return (
    <div>
      {/* ── Single-Application KPIs ── */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <KpiCard accent="accent">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-3 bg-[rgba(214,106,6,0.10)] dark:bg-[rgba(214,106,6,0.18)]">
            <svg className="w-4 h-4 text-[#d66a06]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
          </div>
          <div className="text-xs font-bold uppercase tracking-wide mb-1 text-muted-foreground">Total Incidents</div>
          <div className="text-4xl font-bold tabular-nums leading-none text-foreground">{total}</div>
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span>Jan–Oct 2025</span>
            <span className="font-bold text-[#dc2626]">{p1Count} P1s</span>
          </div>
        </KpiCard>
        <KpiCard accent="blue">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-3 bg-[rgba(59,130,246,0.12)] dark:bg-[rgba(59,130,246,0.18)]">
            <svg className="w-4 h-4 text-[#3b82f6]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <div className="text-xs font-bold uppercase tracking-wide mb-1 text-muted-foreground">Total Outage Hours</div>
          <div className="text-4xl font-bold tabular-nums leading-none text-foreground">{totalHrs.toFixed(0)}</div>
          <div className="mt-2 text-xs text-muted-foreground">Cumulative duration</div>
        </KpiCard>
        <KpiCard accent="green">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-3 bg-[rgba(22,163,74,0.12)] dark:bg-[rgba(22,163,74,0.18)]">
            <svg className="w-4 h-4 text-[#16a34a]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <div className="text-xs font-bold uppercase tracking-wide mb-1 text-muted-foreground">Alert Coverage</div>
          <div className="text-4xl font-bold tabular-nums leading-none text-foreground">{alertPct}%</div>
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span>Alerts triggered</span>
            <span className={`font-bold ${alertPct >= 70 ? 'text-[#16a34a]' : 'text-[#d97706]'}`}>
              {alertPct >= 70 ? 'Good' : 'Needs work'}
            </span>
          </div>
        </KpiCard>
        <KpiCard accent="warn">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-3 bg-[rgba(217,119,6,0.12)] dark:bg-[rgba(217,119,6,0.18)]">
            <svg className="w-4 h-4 text-[#d97706]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            </svg>
          </div>
          <div className="text-xs font-bold uppercase tracking-wide mb-1 text-muted-foreground">Internal (DAS)</div>
          <div className="text-4xl font-bold tabular-nums leading-none text-foreground">{dasCausedPct}%</div>
          <div className="mt-2 text-xs text-muted-foreground">DAS-caused incidents</div>
        </KpiCard>
      </div>

      {/* Chart Row 1 */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="border border-border rounded-2xl overflow-hidden bg-card shadow-xs">
          <div className={CARD_HEAD}>
            <div>
              <div className="text-sm font-bold text-foreground">Incidents by Month</div>
              <div className="text-xs mt-0.5 text-muted-foreground">All incidents · volume trend across the year</div>
            </div>
            <span className={CARD_BADGE}>Trend</span>
          </div>
          <PlotlyChart data={monthlyChart.data} layout={monthlyChart.layout} className="h-70" />
        </div>
        <div className="border border-border rounded-2xl overflow-hidden bg-card shadow-xs">
          <div className={CARD_HEAD}>
            <div>
              <div className="text-sm font-bold text-foreground">Downtime by Product</div>
              <div className="text-xs mt-0.5 text-muted-foreground">Total downtime hours per product</div>
            </div>
            <span className={CARD_BADGE}>Downtime</span>
          </div>
          <PlotlyChart data={downtimeChart.data} layout={downtimeChart.layout} className="h-70" />
        </div>
      </div>

      {/* Chart Row 2 */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="border border-border rounded-2xl overflow-hidden bg-card shadow-xs">
          <div className={CARD_HEAD}>
            <div>
              <div className="text-sm font-bold text-foreground">Incidents by Product</div>
              <div className="text-xs mt-0.5 text-muted-foreground">Volume concentration by product area</div>
            </div>
            <span className={CARD_BADGE}>Volume</span>
          </div>
          <PlotlyChart data={productVolChart.data} layout={productVolChart.layout} className="h-80" />
        </div>
        <div className="border border-border rounded-2xl overflow-hidden bg-card shadow-xs">
          <div className={CARD_HEAD}>
            <div>
              <div className="text-sm font-bold text-foreground">Root Cause Categories</div>
              <div className="text-xs mt-0.5 text-muted-foreground">{"What's driving incidents"}</div>
            </div>
            <span className={CARD_BADGE}>Root Cause</span>
          </div>
          <PlotlyChart data={causesChart.data} layout={causesChart.layout} className="h-80" />
        </div>
      </div>

      {/* Incident Log */}
      <div className="border border-border rounded-2xl overflow-hidden mb-4 bg-card shadow-xs">
        <div className="flex justify-between items-center px-5 pt-4 pb-3 gap-3">
          <div>
            <div className="text-sm font-bold text-foreground">Incident Log</div>
            <div className="text-xs mt-0.5 text-muted-foreground">All incidents matching current filters</div>
          </div>
          <div className="flex gap-2 items-center">
            <input type="text" placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)}
              className="border border-border rounded-lg px-3 py-1.5 text-sm w-48 focus:outline-none focus:border-[#d66a06] bg-secondary text-foreground" />
            <select value={sortCol} onChange={(e) => setSortCol(e.target.value as typeof sortCol)} className={controlCls}>
              <option value="date">Date</option>
              <option value="product">Product</option>
              <option value="severity">Severity</option>
              <option value="downtime">Downtime hrs</option>
            </select>
            <select value={sortDir} onChange={(e) => setSortDir(e.target.value as 'asc' | 'desc')} className={controlCls}>
              <option value="desc">Desc</option>
              <option value="asc">Asc</option>
            </select>
          </div>
        </div>
        <div className="max-h-120 overflow-auto">
          <table className="w-full border-collapse">
            <thead><tr>
              {['Date', 'Product', 'Function', 'Sev', 'Incident Title', 'Outage', 'Downtime', 'Root Cause', 'Ownership', 'Alert', 'Alerted Via', 'DAS Caused'].map((h) => (
                <th key={h} className={TH}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {tableRows.map((d, i) => (
                <tr key={i} className="hover:bg-secondary/50">
                  <td className={TD + ' tabular-nums text-xs font-medium text-muted-foreground whitespace-nowrap'}>{d.date}</td>
                  <td className={TD + ' font-bold text-[13px]'}>{d.product}</td>
                  <td className={TD + ' text-muted-foreground text-xs'}>{d.function}</td>
                  <td className={TD}><span className={SEV_CLASS[d.severity]}>{d.severity}</span></td>
                  <td className={TD + ' text-[13px] max-w-55'}>{d.title}</td>
                  <td className={TD + ' tabular-nums text-xs font-medium'}>{formatMinutes(d.outage)}</td>
                  <td className={TD + ' tabular-nums text-xs font-medium text-[#3b82f6]'}>{formatMinutes(d.downtime)}</td>
                  <td className={TD + ' text-muted-foreground text-xs'}>{d.cause || '-'}</td>
                  <td className={TD}><span className={d.dasCaused ? CHIP.internal : CHIP.external}>{d.dasCaused ? 'Internal' : 'External'}</span></td>
                  <td className={TD}><span className={d.alerted ? CHIP.yes : CHIP.no}>{d.alerted ? 'Yes' : 'No'}</span></td>
                  <td className={TD + ' text-muted-foreground text-xs'}>{d.alertSrc || '-'}</td>
                  <td className={TD}><span className={d.dasCaused ? CHIP.internal : CHIP.no}>{d.dasCaused ? 'Yes' : 'No'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex justify-between px-5 py-2.5 text-xs border-t border-border text-muted-foreground">
          <span>{tableRows.length} incident{tableRows.length !== 1 ? 's' : ''}</span>
          <span>DAS Incident Log · 2025</span>
        </div>
      </div>

      {/* ── Multi-Application ── */}
      {multiApp.length > 0 && (
        <>
          <MultiAppDivider />

          <div className="grid grid-cols-4 gap-4 mb-6">
            <KpiCard accent="accent">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-3 bg-[rgba(214,106,6,0.10)] dark:bg-[rgba(214,106,6,0.18)]">
                <svg className="w-4 h-4 text-[#d66a06]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                </svg>
              </div>
              <div className="text-xs font-bold uppercase tracking-wide mb-1 text-muted-foreground">Total Incidents</div>
              <div className="text-4xl font-bold tabular-nums leading-none text-foreground">{maTotal}</div>
              <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                <span>Multi-app</span>
                <span className="font-bold text-[#dc2626]">{maP1Count} P1s</span>
              </div>
            </KpiCard>
            <KpiCard accent="blue">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-3 bg-[rgba(59,130,246,0.12)] dark:bg-[rgba(59,130,246,0.18)]">
                <svg className="w-4 h-4 text-[#3b82f6]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <div className="text-xs font-bold uppercase tracking-wide mb-1 text-muted-foreground">Total Outage Hours</div>
              <div className="text-4xl font-bold tabular-nums leading-none text-foreground">{maTotalHrs.toFixed(0)}</div>
              <div className="mt-2 text-xs text-muted-foreground">Cumulative duration</div>
            </KpiCard>
            <KpiCard accent="green">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-3 bg-[rgba(22,163,74,0.12)] dark:bg-[rgba(22,163,74,0.18)]">
                <svg className="w-4 h-4 text-[#16a34a]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <div className="text-xs font-bold uppercase tracking-wide mb-1 text-muted-foreground">Alert Coverage</div>
              <div className="text-4xl font-bold tabular-nums leading-none text-foreground">{maAlertPct}%</div>
              <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                <span>Alerts triggered</span>
                <span className={`font-bold ${maAlertPct >= 70 ? 'text-[#16a34a]' : 'text-[#d97706]'}`}>
                  {maAlertPct >= 70 ? 'Good' : 'Needs work'}
                </span>
              </div>
            </KpiCard>
            <KpiCard accent="warn">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-3 bg-[rgba(217,119,6,0.12)] dark:bg-[rgba(217,119,6,0.18)]">
                <svg className="w-4 h-4 text-[#d97706]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
              <div className="text-xs font-bold uppercase tracking-wide mb-1 text-muted-foreground">Internal (DAS)</div>
              <div className="text-4xl font-bold tabular-nums leading-none text-foreground">{maDasCausedPct}%</div>
              <div className="mt-2 text-xs text-muted-foreground">DAS-caused incidents</div>
            </KpiCard>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="border border-border rounded-2xl overflow-hidden bg-card shadow-xs">
              <div className={CARD_HEAD}>
                <div>
                  <div className="text-sm font-bold text-foreground">Incidents by Month</div>
                  <div className="text-xs mt-0.5 text-muted-foreground">Multi-app volume trend</div>
                </div>
                <span className={CARD_BADGE}>Trend</span>
              </div>
              <PlotlyChart data={maMonthlyChart.data} layout={maMonthlyChart.layout} className="h-70" />
            </div>
            <div className="border border-border rounded-2xl overflow-hidden bg-card shadow-xs">
              <div className={CARD_HEAD}>
                <div>
                  <div className="text-sm font-bold text-foreground">Downtime by Product Pairing</div>
                  <div className="text-xs mt-0.5 text-muted-foreground">Total downtime hours per pairing</div>
                </div>
                <span className={CARD_BADGE}>Downtime</span>
              </div>
              <PlotlyChart data={maDowntimeChart.data} layout={maDowntimeChart.layout} className="h-70" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="border border-border rounded-2xl overflow-hidden bg-card shadow-xs">
              <div className={CARD_HEAD}>
                <div>
                  <div className="text-sm font-bold text-foreground">Incidents by Product Pairing</div>
                  <div className="text-xs mt-0.5 text-muted-foreground">Volume by product combination</div>
                </div>
                <span className={CARD_BADGE}>Volume</span>
              </div>
              <PlotlyChart data={maProductVolChart.data} layout={maProductVolChart.layout} className="h-80" />
            </div>
            <div className="border border-border rounded-2xl overflow-hidden bg-card shadow-xs">
              <div className={CARD_HEAD}>
                <div>
                  <div className="text-sm font-bold text-foreground">Root Cause Categories</div>
                  <div className="text-xs mt-0.5 text-muted-foreground">{"What's driving multi-app incidents"}</div>
                </div>
                <span className={CARD_BADGE}>Root Cause</span>
              </div>
              <PlotlyChart data={maCausesChart.data} layout={maCausesChart.layout} className="h-80" />
            </div>
          </div>

          <div className="border border-border rounded-2xl overflow-hidden mb-4 bg-card shadow-xs">
            <div className="flex justify-between items-center px-5 pt-4 pb-3 gap-3">
              <div>
                <div className="text-sm font-bold text-foreground">Multi-App Incident Log</div>
                <div className="text-xs mt-0.5 text-muted-foreground">All multi-application incidents matching current filters</div>
              </div>
              <div className="flex gap-2 items-center">
                <input type="text" placeholder="Search…" value={maSearch} onChange={(e) => setMaSearch(e.target.value)}
                  className="border border-border rounded-lg px-3 py-1.5 text-sm w-48 focus:outline-none focus:border-[#d66a06] bg-secondary text-foreground" />
                <select value={maSortCol} onChange={(e) => setMaSortCol(e.target.value as typeof maSortCol)} className={controlCls}>
                  <option value="date">Date</option>
                  <option value="product">Product</option>
                  <option value="severity">Severity</option>
                  <option value="downtime">Downtime hrs</option>
                </select>
                <select value={maSortDir} onChange={(e) => setMaSortDir(e.target.value as 'asc' | 'desc')} className={controlCls}>
                  <option value="desc">Desc</option>
                  <option value="asc">Asc</option>
                </select>
              </div>
            </div>
            <div className="max-h-120 overflow-auto">
              <table className="w-full border-collapse">
                <thead><tr>
                  {['Date', 'Products Affected', 'Function', 'Sev', 'Incident Title', 'Outage', 'Downtime', 'Root Cause', 'Ownership', 'Alert', 'Alerted Via', 'DAS Caused'].map((h) => (
                    <th key={h} className={TH}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {maTableRows.map((d, i) => (
                    <tr key={i} className="hover:bg-secondary/50">
                      <td className={TD + ' tabular-nums text-xs font-medium text-muted-foreground whitespace-nowrap'}>{d.date}</td>
                      <td className={TD + ' font-bold text-[13px]'}>{d.product}</td>
                      <td className={TD + ' text-muted-foreground text-xs'}>{d.function}</td>
                      <td className={TD}><span className={SEV_CLASS[d.severity]}>{d.severity}</span></td>
                      <td className={TD + ' text-[13px] max-w-55'}>{d.title}</td>
                      <td className={TD + ' tabular-nums text-xs font-medium'}>{formatMinutes(d.outage)}</td>
                      <td className={TD + ' tabular-nums text-xs font-medium text-[#3b82f6]'}>{formatMinutes(d.downtime)}</td>
                      <td className={TD + ' text-muted-foreground text-xs'}>{d.cause || '-'}</td>
                      <td className={TD}><span className={d.dasCaused ? CHIP.internal : CHIP.external}>{d.dasCaused ? 'Internal' : 'External'}</span></td>
                      <td className={TD}><span className={d.alerted ? CHIP.yes : CHIP.no}>{d.alerted ? 'Yes' : 'No'}</span></td>
                      <td className={TD + ' text-muted-foreground text-xs'}>{d.alertSrc || '-'}</td>
                      <td className={TD}><span className={d.dasCaused ? CHIP.internal : CHIP.no}>{d.dasCaused ? 'Yes' : 'No'}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-between px-5 py-2.5 text-xs border-t border-border text-muted-foreground">
              <span>{maTableRows.length} incident{maTableRows.length !== 1 ? 's' : ''}</span>
              <span>DAS Incident Log · 2025</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
