'use client';

import { useMemo, useState } from 'react';
import { useBugReportStore } from '@/store/useBugReportStore';
import type { Bug } from '@/types/bug-report';

const PAGE_SIZE = 25;
const PRIORITY_ORDER: Record<string, number> = { Highest: 0, High: 1, Medium: 2, Low: 3, Lowest: 4 };
const PRIORITY_BADGE: Record<string, string> = {
  Highest: 'badge-critical',
  High: 'badge-high',
  Medium: 'badge-medium',
  Low: 'badge-low',
  Lowest: 'badge-lowest',
};

function getAge(bug: Bug): number {
  const d = new Date(bug.created);
  return isNaN(d.getTime()) ? 0 : Math.floor((Date.now() - d.getTime()) / 86400000);
}

type SortDir = 1 | -1;
type SortCol = keyof Bug | 'age';

export function OpenBugsTable() {
  const bugs = useBugReportStore((s) => s.bugs);
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [projectFilter, setProjectFilter] = useState('');
  const [sortCol, setSortCol] = useState<SortCol>('priority');
  const [sortDir, setSortDir] = useState<SortDir>(1);
  const [page, setPage] = useState(1);

  const statuses = useMemo(() => [...new Set(bugs.map((b) => b.status))].sort(), [bugs]);
  const projects = useMemo(() => [...new Set(bugs.map((b) => b.project))].sort(), [bugs]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return bugs.filter((b) => {
      if (priorityFilter && b.priority !== priorityFilter) return false;
      if (statusFilter && b.status !== statusFilter) return false;
      if (projectFilter && b.project !== projectFilter) return false;
      if (
        q &&
        !`${b.key} ${b.summary} ${b.project} ${b.lead} ${b.status}`
          .toLowerCase()
          .includes(q)
      )
        return false;
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
        av = getAge(a);
        bv = getAge(b);
      } else if (sortCol === 'created') {
        av = new Date(a.created).getTime();
        bv = new Date(b.created).getTime();
      } else {
        av = ((a[sortCol as keyof Bug] as string) || '').toLowerCase();
        bv = ((b[sortCol as keyof Bug] as string) || '').toLowerCase();
      }
      if (av < bv) return -1 * sortDir;
      if (av > bv) return 1 * sortDir;
      return 0;
    });
  }, [filtered, sortCol, sortDir]);

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const pageData = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function handleSort(col: SortCol) {
    if (sortCol === col) setSortDir((d) => (d === 1 ? -1 : 1));
    else {
      setSortCol(col);
      setSortDir(1);
    }
    setPage(1);
  }

  function handleFilterChange() {
    setPage(1);
  }

  function sortClass(col: SortCol) {
    if (sortCol !== col) return 'sortable';
    return `sortable ${sortDir === 1 ? 'sort-asc' : 'sort-desc'}`;
  }

  const pageRange: number[] = [];
  for (let i = Math.max(1, page - 3); i <= Math.min(totalPages, page + 3); i++) pageRange.push(i);

  return (
    <section id="section-open-bugs" className="report-section flex flex-col gap-4">
      <div className="section-label">All Open Bugs</div>
      <div className="bg-white rounded-xl border border-[var(--br-border)] shadow-sm p-6 flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h2 className="font-sans text-base font-bold">Current Open Bug List</h2>
              <span className="text-xs text-[var(--br-text-muted)]">
                All open bugs from your Jira export - excludes Won&rsquo;t Do
              </span>
            </div>
            <div className="flex items-baseline gap-2 shrink-0">
              <span className="font-sans text-[clamp(1.75rem,2.8vw,2.5rem)] font-extrabold text-[var(--br-primary)] tabular-nums leading-none">
                {filtered.length}
              </span>
              <span className="text-xs text-[var(--br-text-muted)] font-medium leading-[1.3]">
                total
                <br />
                open
              </span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            <input
              type="text"
              className="open-bugs-search"
              placeholder="Search by key, summary, project, lead…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                handleFilterChange();
              }}
            />
            <select
              className="open-bugs-filter"
              value={priorityFilter}
              onChange={(e) => {
                setPriorityFilter(e.target.value);
                handleFilterChange();
              }}
            >
              <option value="">All Priorities</option>
              {['Highest', 'High', 'Medium', 'Low', 'Lowest'].map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
            <select
              className="open-bugs-filter"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                handleFilterChange();
              }}
            >
              <option value="">All Statuses</option>
              {statuses.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
            <select
              className="open-bugs-filter"
              value={projectFilter}
              onChange={(e) => {
                setProjectFilter(e.target.value);
                handleFilterChange();
              }}
            >
              <option value="">All Projects</option>
              {projects.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto rounded-lg border border-[var(--br-border)]">
          <table className="data-table">
            <thead>
              <tr>
                {(
                  [
                    ['key', 'Issue Key'],
                    ['summary', 'Summary'],
                    ['project', 'Project'],
                    ['lead', 'Lead'],
                    ['priority', 'Priority'],
                    ['status', 'Status'],
                  ] as [SortCol, string][]
                ).map(([col, label]) => (
                  <th key={col} className={sortClass(col)} onClick={() => handleSort(col)}>
                    {label} <span className="sort-icon">⇅</span>
                  </th>
                ))}
                <th
                  className={`${sortClass('created')} num-th text-left`}
                  onClick={() => handleSort('created')}
                >
                  Created <span className="sort-icon">⇅</span>
                </th>
                <th
                  className={`${sortClass('age')} num-th`}
                  onClick={() => handleSort('age')}
                >
                  Age (days) <span className="sort-icon">⇅</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {pageData.map((b) => {
                const age = getAge(b);
                const ageClass = age > 365 ? 'age-old' : age > 180 ? 'age-mid' : '';
                const badgeClass = PRIORITY_BADGE[b.priority] || 'badge-medium';
                const created = b.created
                  ? new Date(b.created).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })
                  : '-';
                return (
                  <tr key={b.key}>
                    <td>
                      <span className="issue-key">{b.key}</span>
                    </td>
                    <td className="summary-cell" title={b.summary || ''}>
                      {b.summary || '-'}
                    </td>
                    <td>{b.project.replace(/^New /, '')}</td>
                    <td>{b.lead}</td>
                    <td>
                      <span className={`priority-badge ${badgeClass}`}>{b.priority}</span>
                    </td>
                    <td>
                      <span className="status-pill">{b.status}</span>
                    </td>
                    <td className="num-td text-left">{created}</td>
                    <td className={`num-td ${ageClass}`}>{age.toLocaleString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between flex-wrap gap-2 pt-3 pb-1 border-t border-[var(--br-border)] mt-3">
            <span className="text-xs text-[var(--br-text-muted)]">
              Page {page} of {totalPages} &nbsp;·&nbsp; {filtered.length} bugs
            </span>
            <div className="flex gap-1 flex-wrap">
              <button
                className="page-btn"
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
              >
                ← Prev
              </button>
              {pageRange.map((i) => (
                <button
                  key={i}
                  className={`page-btn${i === page ? ' active' : ''}`}
                  onClick={() => setPage(i)}
                >
                  {i}
                </button>
              ))}
              <button
                className="page-btn"
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
