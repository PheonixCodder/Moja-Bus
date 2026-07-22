import { Skeleton } from "@moja/ui/components/ui/skeleton";
import { Card, CardHeader, CardContent } from "@moja/ui/components/ui/card";

export function SettingsSectionSkeleton() {
  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="space-y-2 pb-4">
        <Skeleton className="h-5 w-1/3" />
        <Skeleton className="h-4 w-2/3" />
      </CardHeader>
      <CardContent className="space-y-4 flex-1">
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      </CardContent>
    </Card>
  );
}
