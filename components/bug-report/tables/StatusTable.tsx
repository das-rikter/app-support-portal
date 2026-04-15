'use client';

import { useMemo, useState } from 'react';
import { useBugReportStore } from '@/store/useBugReportStore';
import type { Bug } from '@/types/bug-report';

const PROJ_MAP: Record<string, string> = {
  'Engage To Sell': 'Engage To Sell',
  'New Response Path': 'Response Path',
  'New BestRide': 'BestRide',
  CDXP: 'CDXP',
  'New Central APIs': "Central API's",
  'New Credit Logix': 'Credit Logix',
  'New Lot Vantage': 'Lot Vantage',
  'New Media Logix': 'Media Logix',
  'New Response Logix': 'Response Logix',
  'New Social Logix': 'Social Logix',
};

const WBR_ORDER = [
  'Engage To Sell',
  'Response Path',
  'BestRide',
  'CDXP',
  "Central API's",
  'Credit Logix',
  'Lot Vantage',
  'Media Logix',
  'Response Logix',
  'Social Logix',
];

const BADGE_MAP: Record<string, string> = {
  'Engage To Sell': 'badge-ets',
  'Response Path': 'badge-nrp',
  BestRide: 'badge-nb',
  CDXP: 'badge-cdxp',
  "Central API's": 'badge-api',
  'Credit Logix': 'badge-ncl',
  'Lot Vantage': 'badge-nlv',
  'Media Logix': 'badge-nml',
  'Response Logix': 'badge-nrl',
  'Social Logix': 'badge-nsl',
};

const ABBR_MAP: Record<string, string> = {
  'Engage To Sell': 'ETS',
  'Response Path': 'NRP',
  BestRide: 'NB',
  CDXP: 'CDXP',
  "Central API's": 'API',
  'Credit Logix': 'NCL',
  'Lot Vantage': 'NLV',
  'Media Logix': 'NML',
  'Response Logix': 'NRL',
  'Social Logix': 'NSL',
};

const PRIOS = ['Highest', 'High', 'Medium', 'Low', 'Lowest'] as const;
type Prio = (typeof PRIOS)[number];

interface GridRow {
  total: number;
  Highest: number;
  High: number;
  Medium: number;
  Low: number;
  Lowest: number;
}

function buildGrid(bugs: Bug[]): Record<string, GridRow> {
  const grid: Record<string, GridRow> = {};
  WBR_ORDER.forEach((p) => {
    grid[p] = { Highest: 0, High: 0, Medium: 0, Low: 0, Lowest: 0, total: 0 };
  });
  bugs.forEach((b) => {
    const wbr = PROJ_MAP[b.project];
    if (!wbr || !grid[wbr]) return;
    if (PRIOS.includes(b.priority as Prio)) grid[wbr][b.priority as Prio]++;
    grid[wbr].total++;
  });
  return grid;
}

function Cell({ n, cls }: { n: number; cls?: string }) {
  return <td className={`text-center num-td${cls ? ` ${cls}` : ''}`}>{n > 0 ? n : '-'}</td>;
}

export function StatusTable() {
  const bugs = useBugReportStore((s) => s.bugs);
  const [collapsed, setCollapsed] = useState(false);

  const grid = useMemo(() => buildGrid(bugs), [bugs]);

  const ai = useMemo(() => {
    const r: GridRow = { total: 0, Highest: 0, High: 0, Medium: 0, Low: 0, Lowest: 0 };
    ['Engage To Sell', 'Response Path'].forEach((p) => {
      PRIOS.forEach((pr) => { r[pr] += grid[p]?.[pr] ?? 0; });
      r.total += grid[p]?.total ?? 0;
    });
    return r;
  }, [grid]);

  const tots = useMemo(() => {
    const r: GridRow = { total: 0, Highest: 0, High: 0, Medium: 0, Low: 0, Lowest: 0 };
    WBR_ORDER.forEach((p) => {
      PRIOS.forEach((pr) => { r[pr] += grid[p]?.[pr] ?? 0; });
      r.total += grid[p]?.total ?? 0;
    });
    return r;
  }, [grid]);

  return (
    <section id="section-status-table" className="report-section flex flex-col gap-4">
      <div className="section-label">Status Table</div>
      <div className="bg-white rounded-xl border border-[var(--br-border)] shadow-sm p-6 flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="font-sans text-base font-bold">Bugs by Product &amp; Priority</h2>
          <span className="text-xs text-[var(--br-text-muted)]">
            All open bugs grouped by product - excludes Won&rsquo;t Do
          </span>
        </div>
        <div className="overflow-x-auto rounded-lg border border-[var(--br-border)]">
          <table className="data-table status-table">
            <thead>
              <tr>
                <th>Product</th>
                <th className="num-th text-center">Total</th>
                <th className="num-th text-center">Highest</th>
                <th className="num-th text-center">High</th>
                <th className="num-th text-center">Medium</th>
                <th className="num-th text-center">Low</th>
                <th className="num-th text-center">Lowest</th>
              </tr>
            </thead>
            <tbody>
              <tr className="group-header-row">
                <td>
                  <span
                    className={`group-toggle${collapsed ? ' collapsed' : ''}`}
                    onClick={() => setCollapsed((c) => !c)}
                  >
                    &#9660;
                  </span>{' '}
                  <strong>AI Engage Messaging</strong>
                </td>
                <td className="num-td bold text-center">{ai.total}</td>
                <Cell n={ai.Highest} cls="critical-val" />
                <Cell n={ai.High} cls="high-val" />
                <Cell n={ai.Medium} />
                <Cell n={ai.Low} />
                <Cell n={ai.Lowest} />
              </tr>
              {['Engage To Sell', 'Response Path'].map((p) => (
                <tr
                  key={p}
                  className="group-child"
                  style={{ display: collapsed ? 'none' : undefined }}
                >
                  <td className="child-row">
                    <span className={`proj-badge ${BADGE_MAP[p]}`}>{ABBR_MAP[p]}</span> {p}
                  </td>
                  <td className="num-td text-center">{grid[p]?.total ?? 0}</td>
                  <Cell n={grid[p]?.Highest ?? 0} cls="critical-val" />
                  <Cell n={grid[p]?.High ?? 0} cls="high-val" />
                  <Cell n={grid[p]?.Medium ?? 0} />
                  <Cell n={grid[p]?.Low ?? 0} />
                  <Cell n={grid[p]?.Lowest ?? 0} />
                </tr>
              ))}
              {WBR_ORDER.filter((p) => !['Engage To Sell', 'Response Path'].includes(p)).map(
                (p) => (
                  <tr key={p}>
                    <td>
                      <span className={`proj-badge ${BADGE_MAP[p]}`}>{ABBR_MAP[p]}</span> {p}
                    </td>
                    <td className="num-td bold text-center">{grid[p]?.total ?? 0}</td>
                    <Cell n={grid[p]?.Highest ?? 0} cls="critical-val" />
                    <Cell n={grid[p]?.High ?? 0} cls="high-val" />
                    <Cell n={grid[p]?.Medium ?? 0} />
                    <Cell n={grid[p]?.Low ?? 0} />
                    <Cell n={grid[p]?.Lowest ?? 0} />
                  </tr>
                )
              )}
              <tr className="total-row">
                <td><strong>TOTALS</strong></td>
                <td className="num-td bold text-center">{tots.total}</td>
                <td className="num-td bold critical-val text-center">{tots.Highest || '-'}</td>
                <td className="num-td bold high-val text-center">{tots.High || '-'}</td>
                <td className="num-td bold text-center">{tots.Medium || '-'}</td>
                <td className="num-td bold text-center">{tots.Low || '-'}</td>
                <td className="num-td bold text-center">{tots.Lowest || '-'}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
