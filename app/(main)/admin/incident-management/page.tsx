"use client";

import { IncidentManagementTable } from "@/components/incident/IncidentManagementTable";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent } from "@/components/ui/card";

export default function IncidentManagementPage() {
  return (
    <div className="space-y-6 pt-6">
      <PageHeader
        title="Incident Management"
        description="Create, edit, and delete incident records."
      />
      <Card>
        <CardContent>
          <IncidentManagementTable />
        </CardContent>
      </Card>
    </div>
  );
}
