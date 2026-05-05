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
import { useEffect } from 'react';

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

const getDayFromLastWeek = () => {
  // Today
  const date = new Date();

  // Go back 7 days to ensure we capture the full last week, even if today is not Sunday
  // NOTE: Change this to change the date to determine what week to load
  date.setDate(date.getDate() - 7);

  return date;
}

const getWeekRange = (date: Date): { start: string; end: string } => {
  const day = date.getDay();
  const sunday = new Date(date);
  sunday.setDate(date.getDate() - day);
  const saturday = new Date(sunday);
  saturday.setDate(sunday.getDate() + 6);
  const fmt = (d: Date) => d.toISOString().split('T')[0];
  return { start: fmt(sunday), end: fmt(saturday) };
}

const { start, end } = getWeekRange(getDayFromLastWeek());

const LoadingSkeleton = () => (
  <div className="space-y-6 pt-6">
    <PageHeader
      title="Weekly Bug Report"
      description="Monitor and manage weekly bug reports."
    />
    <Card>
      <CardContent className="p-6 space-y-6">
        {/* KPI row */}
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
        {/* Chart row */}
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-64 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
        {/* Wide chart */}
        <Skeleton className="h-48 rounded-2xl" />
        {/* Table */}
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

export default function WeeklyBugReportPage() {
  const setBugs = useBugReportStore((s) => s.setBugs);
  const setWeeklyBugs = useBugReportStore((s) => s.setWeeklyBugs);

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
  }, [weeklyIssues, setWeeklyBugs]);

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
      <PageHeader
        title="Weekly Bug Report"
        description="Monitor and manage weekly bug reports."
      />
      <Card>
        <CardContent>
          <NavTabs />
          <div className="px-1 flex flex-col gap-8 pb-16 pt-8">
            <KpiSection />
            <BugsByProjectChart />
            <PriorityCharts />
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
}
