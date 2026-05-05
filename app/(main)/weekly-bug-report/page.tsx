'use client';

import { NavTabs } from '@/components/bug-report/NavTabs';
import { AgeCharts } from '@/components/bug-report/charts/AgeCharts';
import { BugsByProjectChart } from '@/components/bug-report/charts/BugsByProjectChart';
import { PriorityCharts } from '@/components/bug-report/charts/PriorityCharts';
import { TimelineChart } from '@/components/bug-report/charts/TimelineChart';
import { KpiSection } from '@/components/bug-report/kpis/KpiSection';
import { LeadSection } from '@/components/bug-report/leads/LeadSection';
import { OpenBugsTable } from '@/components/bug-report/tables/OpenBugsTable';
import { StatusTable } from '@/components/bug-report/tables/StatusTable';
import { WeeklyTable } from '@/components/bug-report/tables/WeeklyTable';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useJiraHistoricalIssues, useJiraWeeklyIssues } from '@/hooks/useJiraIssues';
import { useBugReportStore } from '@/store/useBugReportStore';
import { useEffect, useMemo, useState } from 'react';

const JIRA_WEEKLY_STATUSES = [
  'Backlog',
  'Blocked',
  'Code Review',
  'Feasibility Study',
  'Grooming',
  'In Development',
  'In QA',
  'On Hold',
  'QA Completed',
  'Ready for Deployment',
  'Ready for Development',
  'Ready for QA',
  'Selected for Development',
  'Testing Execution',
  'Verify Test Status',
  'Waiting for dependencies',
  'In Progress',
  'Done',
  'Rolled out to Production',
];

const JIRA_HISTORICAL_STATUSES = [
  'Backlog',
  'Blocked',
  'Code Review',
  'Feasibility Study',
  'Grooming',
  'In Development',
  'In QA',
  'On Hold',
  'QA Completed',
  'Ready for Deployment',
  'Ready for Development',
  'Ready for QA',
  'Selected for Development',
  'Testing Execution',
  'Verify Test Status',
  'Waiting for dependencies',
  'In Progress',
];

interface WeekOption {
  start: string;
  end: string;
  label: string;
}

const fmtIso = (d: Date) => d.toISOString().split('T')[0];

const fmtLabel = (d: Date) =>
  d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

const generateWeeksOfYear = (): WeekOption[] => {
  const today = new Date();
  today.setHours(23, 59, 59, 999);

  const year = today.getFullYear();
  const jan1 = new Date(year, 0, 1);

  // Walk back to the Sunday on or before Jan 1
  const firstSunday = new Date(jan1);
  firstSunday.setDate(jan1.getDate() - jan1.getDay());
  firstSunday.setHours(0, 0, 0, 0);

  const weeks: WeekOption[] = [];
  let sunday = new Date(firstSunday);

  while (sunday <= today) {
    const saturday = new Date(sunday);
    saturday.setDate(sunday.getDate() + 6);

    weeks.push({
      start: fmtIso(sunday),
      end: fmtIso(saturday),
      label: `${fmtLabel(sunday)} – ${fmtLabel(saturday)}, ${sunday.getFullYear()}`,
    });

    const next = new Date(sunday);
    next.setDate(sunday.getDate() + 7);
    sunday = next;
  }

  return weeks;
};

// All weeks are computed once at module level so they don't shift on re-render.
const WEEKS = generateWeeksOfYear();

// Default to previous week; fall back to current week when there is only one.
const DEFAULT_INDEX = WEEKS.length <= 1 ? 0 : WEEKS.length - 2;

const printPage = (customName: string) => {
  const originalTitle = document.title;
  document.title = customName;
  window.print();
  document.title = originalTitle;
};

const LoadingSkeleton = () => (
  <div className="space-y-6 pt-6">
    <PageHeader
      title="Weekly Bug Report"
      description="Monitor and manage weekly bug reports."
    />
    <Card>
      <CardContent className="p-6 space-y-6">
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-64 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
        <Skeleton className="h-48 rounded-2xl" />
        <div className="space-y-2">
          <Skeleton className="h-10 rounded-lg" />
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-12 rounded-lg" />
          ))}
        </div>
      </CardContent>
    </Card>
  </div>
);

const WeeklyBugReportPage = () => {
  const setBugs = useBugReportStore((s) => s.setBugs);
  const setWeeklyBugs = useBugReportStore((s) => s.setWeeklyBugs);

  const [selectedIndex, setSelectedIndex] = useState(DEFAULT_INDEX);
  const selectedWeek = useMemo(() => WEEKS[selectedIndex], [selectedIndex]);
  const { start, end } = selectedWeek;

  const { data: weeklyIssues, isLoading: weeklyLoading } = useJiraWeeklyIssues({
    updatedAfter: start,
    updatedBefore: end,
    statuses: JIRA_WEEKLY_STATUSES,
  });

  const { data: historicalIssues, isLoading: historicalLoading } = useJiraHistoricalIssues({
    statuses: JIRA_HISTORICAL_STATUSES,
  });

  const isLoading = weeklyLoading || historicalLoading;

  useEffect(() => {
    if (weeklyIssues) {
      setWeeklyBugs(weeklyIssues, { start, end });
    }
  }, [weeklyIssues, setWeeklyBugs, start, end]);

  useEffect(() => {
    if (historicalIssues) {
      setBugs(historicalIssues);
    }
  }, [historicalIssues, setBugs]);

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="space-y-6 pt-6">
      <div className="flex items-start justify-between gap-4">
        <PageHeader
          title="Weekly Bug Report"
          description="Monitor and manage weekly bug reports."
        />
        <div className="no-print mt-1 flex items-center gap-2 shrink-0">
          <select
            value={selectedIndex}
            onChange={(e) => setSelectedIndex(Number(e.target.value))}
            className="border border-border rounded-lg px-3 py-2 text-xs font-medium bg-secondary text-foreground focus:outline-none cursor-pointer"
          >
            {WEEKS.map((w, i) => (
              <option key={w.start} value={i}>
                {w.label}
              </option>
            ))}
          </select>
          <button
            onClick={() => printPage(`Weekly Bug Report - Week of ${start} to ${end}`)}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-secondary px-3 py-2 text-xs font-medium text-foreground hover:bg-secondary/70 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 6 2 18 2 18 9" />
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
              <rect width="12" height="8" x="6" y="14" />
            </svg>
            Export PDF
          </button>
        </div>
      </div>

      {/* Only visible when printing */}
      <div className="print-report-header hidden">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <div style={{ fontSize: '18pt', fontWeight: 700, color: '#111827' }}>Weekly Bug Report</div>
            <div style={{ fontSize: '11pt', color: '#6b7280', marginTop: 4 }}>Week of {start} — {end}</div>
          </div>
          <div style={{ fontSize: '9pt', color: '#9ca3af' }}>
            Digital Air Strike · Printed {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </div>
        </div>
      </div>

      <Card>
        <CardContent>
          <NavTabs />
          <div className="px-1 flex flex-col gap-8 pb-16 pt-8">
            <KpiSection />
            <BugsByProjectChart />
            <div className="print:break-before-page">
              <PriorityCharts />
            </div>
            <AgeCharts />
            <TimelineChart />
            <StatusTable />
            <WeeklyTable />
            <OpenBugsTable />
            <LeadSection />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WeeklyBugReportPage;
