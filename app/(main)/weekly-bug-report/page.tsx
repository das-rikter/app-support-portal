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
import './bug-report.css';

export default function WeeklyBugReportPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Weekly Bug Report"
        description="Monitor and manage weekly bug reports."
      />
      <Card>
        <CardContent>
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
        </CardContent>
      </Card>
    </div>
  );
}
