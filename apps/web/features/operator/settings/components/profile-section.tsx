"use client";

import { useCompanySettings } from "../api/use-company-settings";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@moja/ui/components/ui/card";
import { Button } from "@moja/ui/components/ui/button";
import { Building2, Pencil } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@moja/ui/components/ui/avatar";

interface ProfileSectionProps {
  onManage: () => void;
}

export function ProfileSection({ onManage }: ProfileSectionProps) {
  const { data: settings } = useCompanySettings();
  const company = settings?.company;
  const operator = settings?.operator;

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="flex flex-row items-start justify-between pb-2">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-muted-foreground" />
            Company Profile
          </CardTitle>
          <CardDescription>Your public business details</CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={onManage}>
          <Pencil className="w-4 h-4 mr-2" />
          Edit
        </Button>
      </CardHeader>
      <CardContent className="flex-1 mt-4">
        <div className="flex items-start gap-4">
          <Avatar className="w-16 h-16 border">
            <AvatarImage src={company?.logoUrl || undefined} alt={company?.name} />
            <AvatarFallback className="bg-muted text-muted-foreground text-lg">
              {company?.name?.charAt(0).toUpperCase() || "C"}
            </AvatarFallback>
          </Avatar>
          <div className="space-y-1 overflow-hidden">
            <h3 className="font-semibold text-lg truncate">{company?.name || "No Company Name"}</h3>
            <p className="text-sm text-muted-foreground truncate">{company?.email || "No email set"}</p>
            <p className="text-sm text-muted-foreground truncate">{company?.phone || "No phone set"}</p>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          <div className="grid grid-cols-2 text-sm gap-2">
            <div className="text-muted-foreground">Type</div>
            <div className="font-medium capitalize">{company?.businessType?.toLowerCase().replace(/_/g, ' ') || "Not set"}</div>
            
            <div className="text-muted-foreground">Reg. Number</div>
            <div className="font-medium truncate" title={company?.registrationNumber || ""}>{company?.registrationNumber || "Not set"}</div>
            
            <div className="text-muted-foreground">Tax ID</div>
            <div className="font-medium truncate" title={company?.taxId || ""}>{company?.taxId || "Not set"}</div>

            <div className="text-muted-foreground">Manager</div>
            <div className="font-medium truncate">{operator?.user?.fullName}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
