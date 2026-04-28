'use client';

import { cn } from '@/lib/utils';
import { useMemo, useState } from 'react';
import { useBugReportStore } from '@/store/useBugReportStore';
import type { Bug } from '@/types/bug-report';

const SECTION_LABEL = "flex items-center gap-2 text-[0.68rem] font-bold uppercase tracking-[0.08em] text-primary-clementine-900 pb-1 border-b-2 border-border before:content-[''] before:block before:w-0.75 before:h-3.5 before:bg-primary-clementine-900 before:rounded-sm before:shrink-0";
const TH = 'px-4 py-3 font-bold text-muted-foreground uppercase tracking-[0.05em] text-[0.68rem] border-b border-border whitespace-nowrap bg-muted text-center';
const TD = 'px-4 py-3 border-b border-border text-[0.72rem] whitespace-nowrap';
const BADGE_BASE = 'inline-block px-1.5 py-0 rounded-[0.25rem] text-[0.63rem] font-bold tracking-[0.04em] mr-2 align-middle';

const PROJ_MAP: Record<string, string> = {
  'Engage To Sell': 'Engage To Sell', 'New Response Path': 'Response Path',
  'New BestRide': 'BestRide', CDXP: 'CDXP', 'New Central APIs': "Central API's",
  'New Credit Logix': 'Credit Logix', 'New Lot Vantage': 'Lot Vantage',
  'New Media Logix': 'Media Logix', 'New Response Logix': 'Response Logix',
  'New Social Logix': 'Social Logix',
};

const WBR_ORDER = [
  'Engage To Sell', 'Response Path', 'BestRide', 'CDXP', "Central API's",
  'Credit Logix', 'Lot Vantage', 'Media Logix', 'Response Logix', 'Social Logix',
];

const BADGE_MAP: Record<string, string> = {
  'Engage To Sell': 'bg-[#2c972c] text-white',
  'Response Path':  'bg-[#7c589e] text-white',
  BestRide:         'bg-[#1b6392] text-white',
  CDXP:             'bg-[#8ea3c0] text-white',
  "Central API's":  'bg-[#755f5f] text-white',
  'Credit Logix':   'bg-[#884408] text-white',
  'Lot Vantage':    'bg-[#6da164] text-white',
  'Media Logix':    'bg-[#971d1d] text-white',
  'Response Logix': 'bg-[#8a5252] text-white',
  'Social Logix':   'bg-[#7e7188] text-white',
};

const ABBR_MAP: Record<string, string> = {
  'Engage To Sell': 'ETS', 'Response Path': 'NRP', BestRide: 'NB', CDXP: 'CDXP',
  "Central API's": 'API', 'Credit Logix': 'NCL', 'Lot Vantage': 'NLV',
  'Media Logix': 'NML', 'Response Logix': 'NRL', 'Social Logix': 'NSL',
};

const PRIOS = ['Highest', 'High', 'Medium', 'Low', 'Lowest'] as const;
type Prio = (typeof PRIOS)[number];

interface GridRow { total: number; Highest: number; High: number; Medium: number; Low: number; Lowest: number; }

function buildGrid(bugs: Bug[]): Record<string, GridRow> {
  const grid: Record<string, GridRow> = {};
  WBR_ORDER.forEach((p) => { grid[p] = { Highest: 0, High: 0, Medium: 0, Low: 0, Lowest: 0, total: 0 }; });
  bugs.forEach((b) => {
    const wbr = PROJ_MAP[b.project];
    if (!wbr || !grid[wbr]) return;
    if (PRIOS.includes(b.priority as Prio)) grid[wbr][b.priority as Prio]++;
    grid[wbr].total++;
  });
  return grid;
}

function Cell({ n, critical, high }: { n: number; critical?: boolean; high?: boolean }) {
  return (
    <td className={cn(TD, 'text-center text-muted-foreground tabular-nums', critical && 'text-red-600! font-bold', high && 'text-orange-600! font-bold')}>
      {n > 0 ? n : '-'}
    </td>
  );
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
    <section id="section-status-table" className="scroll-mt-14 flex flex-col gap-4">
      <div className={SECTION_LABEL}>Status Table</div>
      <div className="bg-card rounded-xl border border-border shadow-xs p-6 flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="font-sans text-base font-bold">Bugs by Product &amp; Priority</h2>
          <span className="text-xs text-muted-foreground">
            All open bugs grouped by product - excludes Won&rsquo;t Do
          </span>
        </div>
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="text-[0.72rem] w-full border-collapse">
            <thead>
              <tr>
                <th className={cn(TH, 'text-left')}>Product</th>
                <th className={TH}>Total</th>
                <th className={TH}>Highest</th>
                <th className={TH}>High</th>
                <th className={TH}>Medium</th>
                <th className={TH}>Low</th>
                <th className={TH}>Lowest</th>
              </tr>
            </thead>
            <tbody>
              {/* AI Engage group header */}
              <tr className="bg-muted border-t-2 border-t-primary-clementine-900">
                <td className={cn(TD, 'font-semibold')}>
                  <span
                    className={cn('cursor-pointer text-[0.7em] inline-block transition-transform duration-200 mr-1 text-primary-clementine-900', collapsed && '-rotate-90')}
                    onClick={() => setCollapsed((c) => !c)}
                  >&#9660;</span>
                  <strong>AI Engage Messaging</strong>
                </td>
                <td className={cn(TD, 'text-center font-bold text-foreground tabular-nums')}>{ai.total}</td>
                <Cell n={ai.Highest} critical />
                <Cell n={ai.High} high />
                <Cell n={ai.Medium} />
                <Cell n={ai.Low} />
                <Cell n={ai.Lowest} />
              </tr>
              {/* AI Engage children */}
              {['Engage To Sell', 'Response Path'].map((p) => (
                <tr key={p} className="bg-card" style={{ display: collapsed ? 'none' : undefined }}>
                  <td className={cn(TD, 'text-muted-foreground pl-8')}>
                    <span className={cn(BADGE_BASE, BADGE_MAP[p])}>{ABBR_MAP[p]}</span>{p}
                  </td>
                  <td className={cn(TD, 'text-center text-muted-foreground tabular-nums')}>{grid[p]?.total ?? 0}</td>
                  <Cell n={grid[p]?.Highest ?? 0} critical />
                  <Cell n={grid[p]?.High    ?? 0} high />
                  <Cell n={grid[p]?.Medium  ?? 0} />
                  <Cell n={grid[p]?.Low     ?? 0} />
                  <Cell n={grid[p]?.Lowest  ?? 0} />
                </tr>
              ))}
              {/* Remaining products */}
              {WBR_ORDER.filter((p) => !['Engage To Sell', 'Response Path'].includes(p)).map((p) => (
                <tr key={p} className="hover:bg-secondary/50">
                  <td className={TD}>
                    <span className={cn(BADGE_BASE, BADGE_MAP[p])}>{ABBR_MAP[p]}</span>{p}
                  </td>
                  <td className={cn(TD, 'text-center font-bold text-foreground tabular-nums')}>{grid[p]?.total ?? 0}</td>
                  <Cell n={grid[p]?.Highest ?? 0} critical />
                  <Cell n={grid[p]?.High    ?? 0} high />
                  <Cell n={grid[p]?.Medium  ?? 0} />
                  <Cell n={grid[p]?.Low     ?? 0} />
                  <Cell n={grid[p]?.Lowest  ?? 0} />
                </tr>
              ))}
              {/* Totals row */}
              <tr className="bg-muted border-t-2 border-t-border">
                <td className={cn(TD, 'font-bold text-foreground')}><strong>TOTALS</strong></td>
                <td className={cn(TD, 'text-center font-bold text-foreground tabular-nums')}>{tots.total}</td>
                <td className={cn(TD, 'text-center font-bold text-red-600 tabular-nums')}>{tots.Highest || '-'}</td>
                <td className={cn(TD, 'text-center font-bold text-orange-600 tabular-nums')}>{tots.High || '-'}</td>
                <td className={cn(TD, 'text-center font-bold text-muted-foreground tabular-nums')}>{tots.Medium || '-'}</td>
                <td className={cn(TD, 'text-center font-bold text-muted-foreground tabular-nums')}>{tots.Low || '-'}</td>
                <td className={cn(TD, 'text-center font-bold text-muted-foreground tabular-nums')}>{tots.Lowest || '-'}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
