'use client';

import './bug-report.css';
import { DashboardToolbar } from '@/components/bug-report/DashboardToolbar';
import { NavTabs } from '@/components/bug-report/NavTabs';
import { Toast } from '@/components/bug-report/Toast';
import { PublishModal } from '@/components/bug-report/PublishModal';
import { KpiSection } from '@/components/bug-report/kpis/KpiSection';
import { BugsByProjectChart } from '@/components/bug-report/charts/BugsByProjectChart';
import { PriorityCharts } from '@/components/bug-report/charts/PriorityCharts';
import { AgeCharts } from '@/components/bug-report/charts/AgeCharts';
import { TimelineChart } from '@/components/bug-report/charts/TimelineChart';
import { StatusTable } from '@/components/bug-report/tables/StatusTable';
import { WeeklyTable } from '@/components/bug-report/tables/WeeklyTable';
import { OpenBugsTable } from '@/components/bug-report/tables/OpenBugsTable';
import { LeadSection } from '@/components/bug-report/leads/LeadSection';

export default function WeeklyBugReportPage() {
  return (
    <>
      <DashboardToolbar />
      <NavTabs />
      <div className="max-w-360 mx-auto px-6 flex flex-col gap-8 pb-16 pt-8">
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
    </>
  );
}
