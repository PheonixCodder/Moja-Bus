import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@moja/ui/components/ui/card";
import { PageHeader } from "@/features/dashboard/components/page-header";

export default function SearchPage() {
  return (
    <div className="flex flex-1 flex-col">
      <PageHeader title="Search trips" className="lg:hidden" />
      <div className="flex flex-1 flex-col gap-8 p-4 lg:p-8">
        <Card className="border-border bg-bg-surface">
          <CardHeader>
            <CardTitle>Search trips</CardTitle>
            <CardDescription>
              Route discovery and departure search will live here.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-text-secondary">
            This section is wired into the dashboard shell and ready for trip search UI.
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
