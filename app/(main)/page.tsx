import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function HomePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Home"
        description="Welcome to the App Support Portal."
      />
      <Card>
        <CardHeader>
          <CardTitle>Support Tools</CardTitle>
          <CardDescription>
            Use the navigation above to access support tools and reports.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Content to be implemented */}
        </CardContent>
      </Card>
    </div>
  );
}
