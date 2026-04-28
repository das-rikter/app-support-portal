'use client';

import { cn } from '@/lib/utils';
import { useMemo, useState } from 'react';
import { useBugReportStore } from '@/store/useBugReportStore';
import type { Bug } from '@/types/bug-report';

const SECTION_LABEL = "flex items-center gap-2 text-[0.68rem] font-bold uppercase tracking-[0.08em] text-primary-clementine-900 pb-1 border-b-2 border-border before:content-[''] before:block before:w-0.75 before:h-3.5 before:bg-primary-clementine-900 before:rounded-sm before:shrink-0";
const TH = 'px-4 py-3 text-left font-bold text-muted-foreground uppercase tracking-[0.05em] text-[0.68rem] border-b border-border whitespace-nowrap bg-muted';
const TD = 'px-4 py-3 border-b border-border text-foreground whitespace-nowrap text-[0.72rem]';

const PAGE_SIZE = 25;
const PRIORITY_ORDER: Record<string, number> = { Highest: 0, High: 1, Medium: 2, Low: 3, Lowest: 4 };
const PRIORITY_BADGE: Record<string, string> = {
  Highest: 'bg-[#fee2e2] text-[#991b1b] dark:bg-[#450a0a] dark:text-[#fca5a5]',
  High:    'bg-[#ffedd5] text-[#9a3412] dark:bg-[#431407] dark:text-[#fdba74]',
  Medium:  'bg-[#fef9c3] text-[#854d0e] dark:bg-[#1c1100] dark:text-[#fde68a]',
  Low:     'bg-[#dbeafe] text-[#1e40af] dark:bg-[#1e3a5f] dark:text-[#93c5fd]',
  Lowest:  'bg-[#f0fdf4] text-[#166534] dark:bg-[#052e16] dark:text-[#86efac]',
};

function getAge(bug: Bug): number {
  const d = new Date(bug.created);
  return isNaN(d.getTime()) ? 0 : Math.floor((Date.now() - d.getTime()) / 86400000);
}

type SortDir = 1 | -1;
type SortCol = keyof Bug | 'age';

function SortIcon({ col, sortCol, sortDir }: { col: SortCol; sortCol: SortCol; sortDir: SortDir }) {
  if (sortCol !== col) return <span className="opacity-40 text-[0.75em] ml-1">⇅</span>;
  return <span className="text-primary-clementine-900 text-[0.75em] ml-1">{sortDir === 1 ? '▲' : '▼'}</span>;
}

export function OpenBugsTable() {
  const bugs = useBugReportStore((s) => s.bugs);
  const [search, setSearch]               = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [statusFilter, setStatusFilter]     = useState('');
  const [projectFilter, setProjectFilter]   = useState('');
  const [sortCol, setSortCol]               = useState<SortCol>('priority');
  const [sortDir, setSortDir]               = useState<SortDir>(1);
  const [page, setPage]                     = useState(1);

  const statuses = useMemo(() => [...new Set(bugs.map((b) => b.status))].sort(), [bugs]);
  const projects = useMemo(() => [...new Set(bugs.map((b) => b.project))].sort(), [bugs]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return bugs.filter((b) => {
      if (priorityFilter && b.priority !== priorityFilter) return false;
      if (statusFilter  && b.status   !== statusFilter)   return false;
      if (projectFilter && b.project  !== projectFilter)  return false;
      if (q && !`${b.key} ${b.summary} ${b.project} ${b.lead} ${b.status}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [bugs, search, priorityFilter, statusFilter, projectFilter]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let av: number | string, bv: number | string;
      if (sortCol === 'priority') {
        av = PRIORITY_ORDER[a.priority] ?? 99;
        bv = PRIORITY_ORDER[b.priority] ?? 99;
      } else if (sortCol === 'age') {
        av = getAge(a); bv = getAge(b);
      } else if (sortCol === 'created') {
        av = new Date(a.created).getTime();
        bv = new Date(b.created).getTime();
      } else {
        av = ((a[sortCol as keyof Bug] as string) || '').toLowerCase();
        bv = ((b[sortCol as keyof Bug] as string) || '').toLowerCase();
      }
      if (av < bv) return -1 * sortDir;
      if (av > bv) return  1 * sortDir;
      return 0;
    });
  }, [filtered, sortCol, sortDir]);

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const pageData   = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function handleSort(col: SortCol) {
    if (sortCol === col) setSortDir((d) => (d === 1 ? -1 : 1));
    else { setSortCol(col); setSortDir(1); }
    setPage(1);
  }

  const pageRange: number[] = [];
  for (let i = Math.max(1, page - 3); i <= Math.min(totalPages, page + 3); i++) pageRange.push(i);

  const inputCls = 'px-3 py-2 border border-border rounded-md bg-secondary text-foreground text-xs outline-none transition-colors focus:border-primary-clementine-900';

  return (
    <section id="section-open-bugs" className="scroll-mt-14 flex flex-col gap-4">
      <div className={SECTION_LABEL}>All Open Bugs</div>
      <div className="bg-card rounded-xl border border-border shadow-xs p-6 flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h2 className="font-sans text-base font-bold">Current Open Bug List</h2>
              <span className="text-xs text-muted-foreground">
                All open bugs from your Jira export - excludes Won&rsquo;t Do
              </span>
            </div>
            <div className="flex items-baseline gap-2 shrink-0">
              <span className="font-sans text-[clamp(1.75rem,2.8vw,2.5rem)] font-extrabold text-primary-clementine-900 tabular-nums leading-none">
                {filtered.length}
              </span>
              <span className="text-xs text-muted-foreground font-medium leading-[1.3]">total<br />open</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            <input
              type="text"
              className={cn(inputCls, 'flex-1 basis-55 min-w-45')}
              placeholder="Search by key, summary, project, lead…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
            <select className={inputCls} value={priorityFilter} onChange={(e) => { setPriorityFilter(e.target.value); setPage(1); }}>
              <option value="">All Priorities</option>
              {['Highest', 'High', 'Medium', 'Low', 'Lowest'].map((p) => <option key={p}>{p}</option>)}
            </select>
            <select className={inputCls} value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
              <option value="">All Statuses</option>
              {statuses.map((s) => <option key={s}>{s}</option>)}
            </select>
            <select className={inputCls} value={projectFilter} onChange={(e) => { setProjectFilter(e.target.value); setPage(1); }}>
              <option value="">All Projects</option>
              {projects.map((p) => <option key={p}>{p}</option>)}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="text-[0.72rem] w-full border-collapse">
            <thead>
              <tr>
                {([['key', 'Issue Key'], ['summary', 'Summary'], ['project', 'Project'], ['lead', 'Lead'], ['priority', 'Priority'], ['status', 'Status']] as [SortCol, string][]).map(([col, label]) => (
                  <th key={col} className={cn(TH, 'cursor-pointer select-none')} onClick={() => handleSort(col)}>
                    {label}<SortIcon col={col} sortCol={sortCol} sortDir={sortDir} />
                  </th>
                ))}
                <th className={cn(TH, 'cursor-pointer select-none')} onClick={() => handleSort('created')}>
                  Created<SortIcon col="created" sortCol={sortCol} sortDir={sortDir} />
                </th>
                <th className={cn(TH, 'cursor-pointer select-none text-right')} onClick={() => handleSort('age')}>
                  Age (days)<SortIcon col="age" sortCol={sortCol} sortDir={sortDir} />
                </th>
              </tr>
            </thead>
            <tbody>
              {pageData.map((b) => {
                const age = getAge(b);
                const ageCls = age > 365 ? 'text-[#dc2626]! font-bold' : age > 180 ? 'text-[#d97706]! font-semibold' : '';
                const badgeCls = PRIORITY_BADGE[b.priority] || PRIORITY_BADGE.Medium;
                const created = b.created
                  ? new Date(b.created).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                  : '-';
                return (
                  <tr key={b.key} className="hover:bg-secondary/50">
                    <td className={TD}>
                      <span className="font-mono font-semibold text-primary-clementine-900 whitespace-nowrap">{b.key}</span>
                    </td>
                    <td className={cn(TD, 'max-w-70 overflow-hidden text-ellipsis text-muted-foreground italic')} title={b.summary || ''}>
                      {b.summary || '-'}
                    </td>
                    <td className={TD}>{b.project.replace(/^New /, '')}</td>
                    <td className={TD}>{b.lead}</td>
                    <td className={TD}>
                      <span className={cn('inline-block px-2 py-0.5 rounded-full text-[0.65rem] font-bold tracking-[0.04em] uppercase whitespace-nowrap', badgeCls)}>
                        {b.priority}
                      </span>
                    </td>
                    <td className={TD}>
                      <span className="inline-block px-2 py-0.5 rounded-full text-[0.65rem] font-semibold bg-muted text-muted-foreground whitespace-nowrap">
                        {b.status}
                      </span>
                    </td>
                    <td className={TD}>{created}</td>
                    <td className={cn(TD, 'text-right text-muted-foreground tabular-nums', ageCls)}>{age.toLocaleString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between flex-wrap gap-2 pt-3 pb-1 border-t border-border mt-3">
            <span className="text-xs text-muted-foreground">
              Page {page} of {totalPages} &nbsp;·&nbsp; {filtered.length} bugs
            </span>
            <div className="flex gap-1 flex-wrap">
              <button
                className="px-2 py-0.5 border border-border rounded-sm bg-card text-muted-foreground text-xs cursor-pointer transition-all hover:border-primary-clementine-900 hover:text-primary-clementine-900 disabled:opacity-35 disabled:cursor-default"
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
              >← Prev</button>
              {pageRange.map((i) => (
                <button
                  key={i}
                  className={cn(
                    'px-2 py-0.5 border rounded-sm text-xs cursor-pointer transition-all',
                    i === page
                      ? 'bg-primary-clementine-900 text-white border-primary-clementine-900 font-semibold'
                      : 'border-border bg-card text-muted-foreground hover:border-primary-clementine-900 hover:text-primary-clementine-900'
                  )}
                  onClick={() => setPage(i)}
                >{i}</button>
              ))}
              <button
                className="px-2 py-0.5 border border-border rounded-sm bg-card text-muted-foreground text-xs cursor-pointer transition-all hover:border-primary-clementine-900 hover:text-primary-clementine-900 disabled:opacity-35 disabled:cursor-default"
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
              >Next →</button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
