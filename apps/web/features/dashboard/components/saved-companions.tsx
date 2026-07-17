import { Users, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@moja/ui/components/ui/card";
import { Badge } from "@moja/ui/components/ui/badge";
import { cn } from "@moja/ui/lib/utils";
import { buttonVariants } from "@moja/ui/components/ui/button";

interface Companion {
  id: string;
  fullName: string;
  phone: string;
  label: string | null;
}

interface SavedCompanionsProps {
  companions: Companion[];
}

export function SavedCompanions({ companions }: SavedCompanionsProps) {
  return (
    <Card className="border-border bg-card shadow-xs">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div className="space-y-1">
          <CardTitle className="text-sm font-bold text-foreground">Saved Passengers</CardTitle>
          <CardDescription className="text-[10px] text-muted-foreground">
            Quick access contacts for travel booking checkout.
          </CardDescription>
        </div>
        <Link
          href="/dashboard/passengers"
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "text-primary hover:text-primary/90 font-semibold text-[10px] p-0 h-auto"
          )}
        >
          <ArrowRight className="size-3.5" />
        </Link>
      </CardHeader>
      <CardContent className="space-y-3">
        {companions.length === 0 ? (
          <div className="text-center py-4 border border-dashed rounded-lg border-muted">
            <Users className="size-5 mx-auto text-muted-foreground/60 mb-1" />
            <p className="text-[10px] text-muted-foreground">No contacts saved yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {companions.slice(0, 4).map((companion) => (
              <div key={companion.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/30 border border-border/40">
                <div className="flex items-center gap-2">
                  <div className="flex size-7 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs shrink-0">
                    {companion.fullName[0]?.toUpperCase() || "P"}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold text-foreground truncate max-w-[120px]">
                      {companion.fullName}
                    </span>
                    <span className="text-[9px] text-muted-foreground font-mono">
                      {companion.phone}
                    </span>
                  </div>
                </div>
                {companion.label && (
                  <Badge variant="outline" className="text-[8px] px-1.5 py-0.5 capitalize shrink-0">
                    {companion.label.toLowerCase()}
                  </Badge>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
