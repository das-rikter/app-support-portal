"use client";

import { FilterBar } from '@/components/incident/FilterBar';
import { QuickStats } from '@/components/incident/QuickStats';
import { IncidentsView } from '@/components/incident/views/IncidentsView';
import { MultiAppView } from '@/components/incident/views/MultiAppView';
import { OverviewView } from '@/components/incident/views/OverviewView';
import { ProcessView } from '@/components/incident/views/ProcessView';
import { ProductsView } from '@/components/incident/views/ProductsView';
import { ViewTabs } from '@/components/incident/ViewTabs';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { useIncidentStore } from '@/store/useIncidentStore';

export default function IncidentTrackingPage() {
  const activeView = useIncidentStore((s) => s.activeView);
  const incidents = useIncidentStore((s) => s.incidents);
  const hasData = incidents.length > 0;

  return (
    <>
      <div className="space-y-6 pt-6">
        <PageHeader
          title="Incident Tracking"
          description="Monitor and manage active incidents."
        />
        <Card>
          <CardContent>
            <FilterBar />
            <ViewTabs />
            {!hasData ? (
              <div className="border border-dashed border-border bg-card rounded-2xl p-12 mt-6 text-center">
                <h2 className="text-xl font-semibold text-foreground">
                  No incident data loaded.
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Upload a CSV file in the filter bar to populate the dashboard. No sample data will be shown until then.
                </p>
              </div>
            ) : (
              <>
                <QuickStats />
                <div className="py-4">
                  {activeView === 'overview' && <OverviewView />}
                  {activeView === 'products' && <ProductsView />}
                  {activeView === 'process' && <ProcessView />}
                  {activeView === 'incidents' && <IncidentsView />}
                  {activeView === 'multi-app' && <MultiAppView />}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
