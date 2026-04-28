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

export default function WeeklyBugReportPage() {
  return (
    <div className="flex flex-col">
      <div className="pt-6 pb-4 space-y-4">
        <PageHeader
          title="Weekly Bug Report"
          description="Monitor and manage weekly bug reports."
        />
        <DashboardToolbar />
      </div>
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
      <Toast />
      <PublishModal />
    </div>
  );
}
