"use client";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@moja/ui/components/ui/card";
import { Button } from "@moja/ui/components/ui/button";
import { AlertCircle } from "lucide-react";
import { FallbackProps } from "react-error-boundary";

export function SettingsSectionError({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <Card className="flex flex-col h-full border-destructive/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-destructive">
          <AlertCircle className="w-5 h-5" />
          Failed to load
        </CardTitle>
        <CardDescription>
          {error instanceof Error ? error.message : "An unexpected error occurred while loading this section."}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex items-end">
        <Button variant="outline" onClick={resetErrorBoundary}>
          Retry
        </Button>
      </CardContent>
    </Card>
  );
}
