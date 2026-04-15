'use client';

import { useMemo } from 'react';
import { useBugReportStore } from '@/store/useBugReportStore';
import type { Bug } from '@/types/bug-report';
import { getPrioClass, getProjBadgeClass, getStatClass } from '@/lib/bugUtils';
import { fmtDate, fmtDateStr, fmtShort, getPriorWeekWindow, parseBugDate } from '@/lib/dateUtils';

const WEEKLY_STATUSES = new Set([
  'Backlog', 'Blocked', 'Code Review', 'Feasibility Study', 'Grooming',
  'In Development', 'In QA', 'On Hold', 'In Progress',
  'Ready for Deployment', 'Selected for Development', 'Waiting for dependencies',
]);

function bugMatchesWeek(b: Bug, start: Date, end: Date): boolean {
  if (!WEEKLY_STATUSES.has(b.status)) return false;
  const updated = parseBugDate(b.updated);
  const created = parseBugDate(b.created);
  return (updated >= start && updated <= end) || (created >= start && created <= end);
}

export function WeeklyTable() {
  const bugs = useBugReportStore((s) => s.bugs);
  const weeklyBugs = useBugReportStore((s) => s.weeklyBugs);
  const weeklyRange = useBugReportStore((s) => s.weeklyRange);

  const { matches, start, end, isDemo } = useMemo(() => {
    if (weeklyBugs.length > 0) {
      let start: Date, end: Date;
      if (weeklyRange) {
        start = new Date(weeklyRange.start);
        start.setHours(0, 0, 0, 0);
        end = new Date(weeklyRange.end);
        end.setHours(23, 59, 59, 999);
      } else {
        const w = getPriorWeekWindow();
        start = w.start;
        end = w.end;
      }
      return {
        matches: [...weeklyBugs].sort(
          (a, b) => parseBugDate(b.updated).getTime() - parseBugDate(a.updated).getTime()
        ),
        start,
        end,
        isDemo: false,
      };
    }

    const { start, end } = getPriorWeekWindow();
    const liveMatches = bugs.filter((b) => bugMatchesWeek(b, start, end));
    if (liveMatches.length > 0) {
      return {
        matches: liveMatches.sort(
          (a, b) => parseBugDate(b.updated).getTime() - parseBugDate(a.updated).getTime()
        ),
        start,
        end,
        isDemo: false,
      };
    }

    // Find most recent active week as demo
    const weekGroups: Record<string, { start: Date; end: Date; bugs: Bug[] }> = {};
    bugs.forEach((b) => {
      const u = parseBugDate(b.updated);
      if (!u || isNaN(u.getTime())) return;
      const dow = u.getDay();
      const sun = new Date(u);
      sun.setDate(u.getDate() - dow);
      sun.setHours(0, 0, 0, 0);
      const wEnd = new Date(sun);
      wEnd.setDate(sun.getDate() + 6);
      wEnd.setHours(23, 59, 59, 999);
      const key = sun.toISOString().slice(0, 10);
      if (!weekGroups[key]) weekGroups[key] = { start: sun, end: wEnd, bugs: [] };
      if (bugMatchesWeek(b, sun, wEnd)) weekGroups[key].bugs.push(b);
    });

    const sortedWeeks = Object.values(weekGroups)
      .filter((w) => w.bugs.length > 0)
      .sort((a, b) => b.start.getTime() - a.start.getTime());

    if (sortedWeeks.length === 0) {
      return { matches: [], start, end, isDemo: false };
    }

    const demo = sortedWeeks[0];
    return {
      matches: demo.bugs.sort(
        (a, b) => parseBugDate(b.updated).getTime() - parseBugDate(a.updated).getTime()
      ),
      start: demo.start,
      end: demo.end,
      isDemo: true,
    };
  }, [bugs, weeklyBugs, weeklyRange]);

  const hasExtra = matches.some((b) => b.sprints || b.linked);
  const isEmpty = matches.length === 0;

  const titleLabel = `Bugs Updated ${fmtShort(start)} - ${fmtShort(end)}`;
  const subtitle = isDemo
    ? `Showing most recent week in dataset - upload this week's Jira weekly export for live data`
    : `${matches.length} bug${matches.length !== 1 ? 's' : ''} with activity during ${fmtDate(start)} - ${fmtDate(end)}`;

  return (
    <section id="section-weekly" className="report-section flex flex-col gap-4">
      <div className="section-label">Weekly Updates</div>
      <div className="bg-white rounded-xl border border-[var(--br-border)] shadow-sm p-6 flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h2 className="font-sans text-base font-bold">{titleLabel}</h2>
              <span className="text-xs text-[var(--br-text-muted)]">{subtitle}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="font-sans text-[clamp(1.75rem,2.8vw,2.5rem)] font-extrabold text-[var(--br-primary)] tabular-nums leading-none">
                {matches.length}
              </span>
              <span className="text-xs text-[var(--br-text-muted)] font-medium leading-[1.3]">
                bugs
                <br />
                updated
              </span>
            </div>
          </div>
          <div className="weekly-info-bar">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4M12 16h.01" />
            </svg>
            Bugs whose <strong>Updated</strong> date falls in the prior Sun-Sat week. Reflects any
            Jira field change, including status transitions. For full status history, export Jira
            changelog data.
          </div>
        </div>

        {isDemo && (
          <div className="weekly-demo-banner">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            Demo mode - showing most recent week from your Jira export. Upload the current
            week&apos;s JQL export on Monday for live data.
          </div>
        )}

        {!isEmpty && (
          <div className="overflow-x-auto rounded-lg border border-[var(--br-border)]">
            <table className="data-table weekly-table">
              <thead>
                <tr>
                  <th>Issue Key</th>
                  <th>Summary</th>
                  {hasExtra && <th>Sprint</th>}
                  <th>Project</th>
                  <th>Lead</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th className="num-th text-left">Created</th>
                  <th className="num-th">Last Updated</th>
                </tr>
              </thead>
              <tbody>
                {matches.map((bug) => {
                  const prefix = bug.key.split('-')[0];
                  const badgeClass = getProjBadgeClass(bug.key);
                  return (
                    <tr key={bug.key}>
                      <td>
                        <span className={`proj-badge ${badgeClass}`}>{prefix}</span>
                        {bug.key}
                      </td>
                      <td className="summary-cell" title={bug.summary || ''}>
                        {bug.summary || <em style={{ opacity: 0.4 }}>No summary</em>}
                      </td>
                      {hasExtra && (
                        <td
                          style={{
                            fontSize: '0.7rem',
                            maxWidth: 100,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                          title={bug.sprints || ''}
                        >
                          {bug.sprints || '-'}
                        </td>
                      )}
                      <td>{bug.project.replace('New ', '')}</td>
                      <td>{bug.lead}</td>
                      <td>
                        <span className={`prio-pill ${getPrioClass(bug.priority)}`}>
                          {bug.priority}
                        </span>
                      </td>
                      <td>
                        <span className={`stat-pill ${getStatClass(bug.status)}`}>
                          {bug.status}
                        </span>
                      </td>
                      <td className="num-td text-left">{fmtDateStr(bug.created)}</td>
                      <td className="num-td bold">{fmtDateStr(bug.updated)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {isEmpty && (
          <div className="flex flex-col items-center justify-center gap-3 py-12 px-8 text-center text-[var(--br-text-muted)]">
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.2"
              opacity={0.25}
            >
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <path d="M16 2v4M8 2v4M3 10h18" />
              <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01" />
            </svg>
            <p className="text-base font-semibold text-[var(--br-text)]">No activity this week</p>
            <p className="text-xs text-[var(--br-text-faint)] max-w-[48ch] leading-[1.6]">
              No bugs found matching the prior week window.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
