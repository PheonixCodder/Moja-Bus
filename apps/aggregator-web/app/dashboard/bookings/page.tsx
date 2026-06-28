import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@moja/ui/components/ui/card";
import { PageHeader } from "@/features/dashboard/components/page-header";

export default function BookingsPage() {
  return (
    <div className="flex flex-1 flex-col">
      <PageHeader title="Bookings" className="lg:hidden" />
      <div className="flex flex-1 flex-col gap-8 p-4 lg:p-8">
        <Card className="border-border bg-bg-surface">
          <CardHeader>
            <CardTitle>Bookings</CardTitle>
            <CardDescription>
              Confirmed trips, pending payments, and ticket changes will show here.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-text-secondary">
            Your booking history shell is in place for the travel flow.
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
