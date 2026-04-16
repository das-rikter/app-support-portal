"use client";

import { FilterBar } from '@/components/incident/FilterBar';
import { QuickStats } from '@/components/incident/QuickStats';
import { IncidentsView } from '@/components/incident/views/IncidentsView';
import { OverviewView } from '@/components/incident/views/OverviewView';
import { ProcessView } from '@/components/incident/views/ProcessView';
import { ProductsView } from '@/components/incident/views/ProductsView';
import { ViewTabs } from '@/components/incident/ViewTabs';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { useIncidentStore } from '@/store/useIncidentStore';
import './incident-tracking.css';

export default function IncidentTrackingPage() {
  const activeView = useIncidentStore((s) => s.activeView);
  return (
    <>
      <div className="space-y-6">
        <PageHeader
          title="Incident Report"
          description="Monitor and manage incident reports."
        />
        <Card>
          <CardContent>
            <FilterBar />
            <ViewTabs />
            <QuickStats />
            <div className="py-4">
              {activeView === 'overview' && <OverviewView />}
              {activeView === 'products' && <ProductsView />}
              {activeView === 'process' && <ProcessView />}
              {activeView === 'incidents' && <IncidentsView />}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
