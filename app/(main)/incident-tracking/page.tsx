"use client";

import { FilterBar } from "@/components/incident/FilterBar";
import { QuickStats } from "@/components/incident/QuickStats";
import { ViewTabs } from "@/components/incident/ViewTabs";
import { IncidentsView } from "@/components/incident/views/IncidentsView";
import { OverviewView } from "@/components/incident/views/OverviewView";
import { ProcessView } from "@/components/incident/views/ProcessView";
import { ProductsView } from "@/components/incident/views/ProductsView";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { useIncidents } from "@/hooks/useIncidents";
import { useIncidentStore } from "@/store/useIncidentStore";
import type { Incident } from "@/types/incident";
import { useEffect } from "react";

export default function IncidentTrackingPage() {
  const activeView = useIncidentStore((s) => s.activeView);
  const setIncidents = useIncidentStore((s) => s.setIncidents);

  const { data: incidents, isLoading, error } = useIncidents();

  useEffect(() => {
    if (incidents) {
      setIncidents(incidents as Incident[]);
    }
  }, [incidents, setIncidents]);

  const hasData = (incidents?.length ?? 0) > 0;

  return (
    <div className="space-y-6 pt-6">
      <PageHeader
        title="Incident Tracking"
        description="View and analyze incident history across all products."
      />
      <Card>
        <CardContent>
          <FilterBar />
          <ViewTabs />

          {isLoading ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
              Loading incidents…
            </div>
          ) : error ? (
            <div className="border border-destructive/30 bg-destructive/10 rounded-2xl p-8 mt-6 text-center">
              <p className="text-sm text-destructive font-medium">
                {error instanceof Error ? error.message : "Failed to load incidents"}
              </p>
            </div>
          ) : !hasData ? (
            <div className="border border-dashed border-border bg-card rounded-2xl p-12 mt-6 text-center">
              <h2 className="text-xl font-semibold text-foreground">No incidents yet.</h2>
              <p className="mt-2 text-sm text-muted-foreground">No incidents have been recorded yet.</p>
            </div>
          ) : (
            <>
              <QuickStats />
              <div className="py-4">
                {activeView === "overview" && <OverviewView />}
                {activeView === "products" && <ProductsView />}
                {activeView === "process" && <ProcessView />}
                {activeView === "incidents" && <IncidentsView />}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
