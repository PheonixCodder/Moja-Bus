"use client";

import { useCompanySettings } from "../api/use-company-settings";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@moja/ui/components/ui/card";
import { Button } from "@moja/ui/components/ui/button";
import { UserCircle, Pencil } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@moja/ui/components/ui/avatar";

interface PersonalProfileSectionProps {
  onManage: () => void;
}

export function PersonalProfileSection({ onManage }: PersonalProfileSectionProps) {
  const { data: settings } = useCompanySettings();
  const operator = settings?.operator;

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="flex flex-row items-start justify-between pb-2">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2">
            <UserCircle className="w-5 h-5 text-muted-foreground" />
            Personal Profile
          </CardTitle>
          <CardDescription>Your personal account details</CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={onManage}>
          <Pencil className="w-4 h-4 mr-2" />
          Edit
        </Button>
      </CardHeader>
      <CardContent className="flex-1 mt-4">
        <div className="flex items-start gap-4">
          <Avatar className="w-16 h-16 border">
            <AvatarImage src={operator?.profilePhotoUrl || operator?.user?.image || undefined} alt={operator?.user?.fullName || ""} />
            <AvatarFallback className="bg-muted text-muted-foreground text-lg">
              {operator?.user?.fullName?.charAt(0).toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="space-y-1 overflow-hidden">
            <h3 className="font-semibold text-lg truncate">{operator?.user?.fullName || "No Name"}</h3>
            <p className="text-sm text-muted-foreground truncate">{operator?.jobTitle || "No title set"}</p>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          <div className="grid grid-cols-2 text-sm gap-2">
            <div className="text-muted-foreground">Role</div>
            <div className="font-medium capitalize">{operator?.role?.toLowerCase() || "Not set"}</div>
            
            <div className="text-muted-foreground">Joined</div>
            <div className="font-medium">{operator?.joinedAt ? new Date(operator.joinedAt).toLocaleDateString() : "Unknown"}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
