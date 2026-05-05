'use client';

import { DashboardToolbar } from '@/components/bug-report/DashboardToolbar';
import { NavTabs } from '@/components/bug-report/NavTabs';
import { PublishModal } from '@/components/bug-report/PublishModal';
import { Toast } from '@/components/bug-report/Toast';
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
import { useJiraHistoricalIssues, useJiraWeeklyIssues } from '@/hooks/useJiraIssues';
import { useBugReportStore } from '@/store/useBugReportStore';
import { useMemo } from 'react';

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

function getSunday(d: Date) {
  // getDay() returns 0 for Sunday, 1 for Monday, etc.
  const first = d.getDate() - d.getDay();
  const sunday = new Date(d.setDate(first));
  return sunday;
}

function getSaturday(d: Date) {
  // Saturday is index 6 in JS
  const dayOfWeek = d.getDay();
  const diff = 6 - dayOfWeek;

  const saturday = new Date(d);
  saturday.setDate(d.getDate() + diff);
  return saturday;
}

function weekRange(): { start: string; end: string } {

  const date = new Date();
  date.setDate(date.getDate() - 7);

  const sunday = getSunday(date);
  const saturday = getSaturday(date);
  const fmt = (d: Date) => d.toISOString().split('T')[0];
  return { start: fmt(sunday), end: fmt(saturday) };
}

export default function WeeklyBugReportPage() {
  const weeklyRange = useBugReportStore((s) => s.weeklyRange);

  const { start, end } = useMemo(
    () => weeklyRange ?? weekRange(),
    [weeklyRange]
  );

  const { data: weeklyIssues } = useJiraWeeklyIssues({
    updatedAfter: start,
    updatedBefore: end,
    statuses: JIRA_WEEKLY_STATUSES,
  });

  const { data: historicalIssues } = useJiraHistoricalIssues({
    statuses: JIRA_HISTORICAL_STATUSES,
  });


  return (
    <div className="space-y-6 pt-6">
      <PageHeader
        title="Weekly Bug Report"
        description="Monitor and manage weekly bug reports."
      />
      <Card>
        <CardContent>
          <DashboardToolbar />
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
      <Toast />
      <PublishModal />
    </div>
  );
}
