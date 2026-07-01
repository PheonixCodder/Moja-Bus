import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@moja/ui/components/ui/card";
import { PageHeader } from "@/features/dashboard/components/page-header";

export default function TicketsPage() {
  return (
    <div className="flex flex-1 flex-col">
      <PageHeader title="Tickets" className="lg:hidden" />
      <div className="flex flex-1 flex-col gap-8 p-4 lg:p-8">
        <Card className="border-border bg-bg-surface">
          <CardHeader>
            <CardTitle>Tickets</CardTitle>
            <CardDescription>
              QR tickets and offline access will live here.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-text-secondary">
            This route is ready for the digital ticket wallet UI.
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
