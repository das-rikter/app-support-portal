import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function IncidentTrackingPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Incident Tracking Dashboard"
        description="Monitor and manage active incidents."
      />
      <Card>
        <CardHeader>
          <CardTitle>Incidents</CardTitle>
          <CardDescription>
            Active incident data will appear here.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Content to be implemented */}
        </CardContent>
      </Card>
    </div>
  );
}
