'use client';

import { cn } from '@/lib/utils';
import { useMemo } from 'react';
import { useBugReportStore } from '@/store/useBugReportStore';
import type { Bug } from '@/types/bug-report';
import { getPrioClass, getProjBadgeClass, getStatClass } from '@/lib/bugUtils';
import { fmtDate, fmtDateStr, fmtShort, getPriorWeekWindow, parseBugDate } from '@/lib/dateUtils';

const SECTION_LABEL = "flex items-center gap-2 text-[0.68rem] font-bold uppercase tracking-[0.08em] text-primary-clementine-900 pb-1 border-b-2 border-border before:content-[''] before:block before:w-0.75 before:h-3.5 before:bg-primary-clementine-900 before:rounded-sm before:shrink-0";
const TH = 'px-4 py-3 text-left font-bold text-muted-foreground uppercase tracking-[0.05em] text-[0.68rem] border-b border-border whitespace-nowrap bg-muted';
const TD = 'px-4 py-3 border-b border-border text-foreground whitespace-nowrap text-[0.72rem]';
const BADGE_BASE = 'inline-block px-1.5 py-0 rounded-[0.25rem] text-[0.63rem] font-bold tracking-[0.04em] mr-1 align-middle';
const PRIO_PILL = 'inline-block px-2 py-0.5 rounded-full text-[0.68rem] font-bold tracking-[0.02em] whitespace-nowrap';
const STAT_PILL = 'inline-block px-2 py-0.5 rounded-full text-[0.68rem] font-semibold whitespace-nowrap';

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
  const bugs        = useBugReportStore((s) => s.bugs);
  const weeklyBugs  = useBugReportStore((s) => s.weeklyBugs);
  const weeklyRange = useBugReportStore((s) => s.weeklyRange);

  const { matches, start, end, isDemo } = useMemo(() => {
    if (weeklyBugs.length > 0) {
      let start: Date, end: Date;
      if (weeklyRange) {
        start = new Date(weeklyRange.start); start.setHours(0, 0, 0, 0);
        end   = new Date(weeklyRange.end);   end.setHours(23, 59, 59, 999);
      } else {
        const w = getPriorWeekWindow(); start = w.start; end = w.end;
      }
      return {
        matches: [...weeklyBugs].sort((a, b) => parseBugDate(b.updated).getTime() - parseBugDate(a.updated).getTime()),
        start, end, isDemo: false,
      };
    }

    const { start, end } = getPriorWeekWindow();
    const liveMatches = bugs.filter((b) => bugMatchesWeek(b, start, end));
    if (liveMatches.length > 0) {
      return {
        matches: liveMatches.sort((a, b) => parseBugDate(b.updated).getTime() - parseBugDate(a.updated).getTime()),
        start, end, isDemo: false,
      };
    }

    const weekGroups: Record<string, { start: Date; end: Date; bugs: Bug[] }> = {};
    bugs.forEach((b) => {
      const u = parseBugDate(b.updated);
      if (!u || isNaN(u.getTime())) return;
      const dow = u.getDay();
      const sun = new Date(u); sun.setDate(u.getDate() - dow); sun.setHours(0, 0, 0, 0);
      const wEnd = new Date(sun); wEnd.setDate(sun.getDate() + 6); wEnd.setHours(23, 59, 59, 999);
      const key = sun.toISOString().slice(0, 10);
      if (!weekGroups[key]) weekGroups[key] = { start: sun, end: wEnd, bugs: [] };
      if (bugMatchesWeek(b, sun, wEnd)) weekGroups[key].bugs.push(b);
    });

    const sortedWeeks = Object.values(weekGroups)
      .filter((w) => w.bugs.length > 0)
      .sort((a, b) => b.start.getTime() - a.start.getTime());

    if (sortedWeeks.length === 0) return { matches: [], start, end, isDemo: false };

    const demo = sortedWeeks[0];
    return {
      matches: demo.bugs.sort((a, b) => parseBugDate(b.updated).getTime() - parseBugDate(a.updated).getTime()),
      start: demo.start, end: demo.end, isDemo: true,
    };
  }, [bugs, weeklyBugs, weeklyRange]);

  const hasExtra = matches.some((b) => b.sprints || b.linked);
  const isEmpty  = matches.length === 0;

  const titleLabel = `Bugs Updated ${fmtShort(start)} - ${fmtShort(end)}`;
  const subtitle = isDemo
    ? `Showing most recent week in dataset - upload this week's Jira weekly export for live data`
    : `${matches.length} bug${matches.length !== 1 ? 's' : ''} with activity during ${fmtDate(start)} - ${fmtDate(end)}`;

  return (
    <section id="section-weekly" className="scroll-mt-14 flex flex-col gap-4">
      <div className={SECTION_LABEL}>Weekly Updates</div>
      <div className="bg-card rounded-xl border border-border shadow-xs p-6 flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h2 className="font-sans text-base font-bold">{titleLabel}</h2>
              <span className="text-xs text-muted-foreground">{subtitle}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="font-sans text-[clamp(1.75rem,2.8vw,2.5rem)] font-extrabold text-primary-clementine-900 tabular-nums leading-none">
                {matches.length}
              </span>
              <span className="text-xs text-muted-foreground font-medium leading-[1.3]">bugs<br />updated</span>
            </div>
          </div>

          {/* Info bar */}
          <div className="flex items-start gap-2 text-xs text-muted-foreground rounded-md px-3 py-2 leading-normal bg-primary-clementine-50 border border-primary-clementine-100 border-l-[3px] border-l-primary-clementine-900 dark:bg-[rgba(221,96,0,0.12)] dark:border-[rgba(221,96,0,0.25)] dark:border-l-primary-clementine-900">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 mt-px text-primary-clementine-900">
              <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" />
            </svg>
            Bugs whose <strong className="text-foreground font-semibold mx-0.5">Updated</strong> date falls in the prior Sun-Sat week. Reflects any Jira field change, including status transitions. For full status history, export Jira changelog data.
          </div>
        </div>

        {/* Demo banner */}
        {isDemo && (
          <div className="flex items-start gap-2 text-xs text-[#92400e] bg-[#fffbeb] border border-bdr-alert-warning border-l-[3px] border-l-[#d97706] rounded-md px-3 py-2 leading-normal dark:text-bdr-alert-warning dark:bg-[#1c1400] dark:border-[#78350f] dark:border-l-[#d97706]">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 mt-px">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            Demo mode - showing most recent week from your Jira export. Upload the current week&apos;s JQL export on Monday for live data.
          </div>
        )}

        {!isEmpty && (
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="text-[0.72rem] w-full border-collapse">
              <thead>
                <tr>
                  <th className={TH}>Issue Key</th>
                  <th className={TH}>Summary</th>
                  {hasExtra && <th className={TH}>Sprint</th>}
                  <th className={TH}>Project</th>
                  <th className={TH}>Lead</th>
                  <th className={TH}>Priority</th>
                  <th className={TH}>Status</th>
                  <th className={TH}>Created</th>
                  <th className={cn(TH, 'text-right')}>Last Updated</th>
                </tr>
              </thead>
              <tbody>
                {matches.map((bug) => {
                  const prefix = bug.key.split('-')[0];
                  const badgeCls = getProjBadgeClass(bug.key);
                  return (
                    <tr key={bug.key} className="hover:bg-secondary/50">
                      <td className={TD}>
                        <span className={cn(BADGE_BASE, badgeCls)}>{prefix}</span>
                        {bug.key}
                      </td>
                      <td className={cn(TD, 'max-w-70 overflow-hidden text-ellipsis text-muted-foreground italic')} title={bug.summary || ''}>
                        {bug.summary || <em style={{ opacity: 0.4 }}>No summary</em>}
                      </td>
                      {hasExtra && (
                        <td className={cn(TD, 'text-[0.7rem] max-w-25 overflow-hidden text-ellipsis')} title={bug.sprints || ''}>
                          {bug.sprints || '-'}
                        </td>
                      )}
                      <td className={TD}>{bug.project.replace('New ', '')}</td>
                      <td className={TD}>{bug.lead}</td>
                      <td className={TD}>
                        <span className={cn(PRIO_PILL, getPrioClass(bug.priority))}>{bug.priority}</span>
                      </td>
                      <td className={TD}>
                        <span className={cn(STAT_PILL, getStatClass(bug.status))}>{bug.status}</span>
                      </td>
                      <td className={TD}>{fmtDateStr(bug.created)}</td>
                      <td className={cn(TD, 'text-right font-bold tabular-nums')}>{fmtDateStr(bug.updated)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {isEmpty && (
          <div className="flex flex-col items-center justify-center gap-3 py-12 px-8 text-center text-muted-foreground">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" opacity={0.25}>
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <path d="M16 2v4M8 2v4M3 10h18" />
              <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01" />
            </svg>
            <p className="text-base font-semibold text-foreground">No activity this week</p>
            <p className="text-xs text-muted-foreground/70 max-w-[48ch] leading-[1.6]">
              No bugs found matching the prior week window.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
