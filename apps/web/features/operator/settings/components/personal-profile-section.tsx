"use client";

import { useTranslations } from "next-intl";
import { useCompanySettings } from "../api/use-company-settings";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@moja/ui/components/ui/card";
import { Button } from "@moja/ui/components/ui/button";
import { UserCircle, Pencil } from "lucide-react";
import { UserAvatar } from "@moja/ui/components/ui/user-avatar";

interface PersonalProfileSectionProps {
  onManage: () => void;
}

export function PersonalProfileSection({
  onManage,
}: PersonalProfileSectionProps) {
  const t = useTranslations("operatorDashboard.settings.personal");
  const { data: settings } = useCompanySettings();
  const operator = settings?.operator;

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="flex flex-row items-start justify-between pb-2">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2">
            <UserCircle className="w-5 h-5 text-muted-foreground" />
            {t("title")}
          </CardTitle>
          <CardDescription>{t("personalDetails")}</CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={onManage}>
          <Pencil className="w-4 h-4 mr-2" />
          {t("edit")}
        </Button>
      </CardHeader>
      <CardContent className="flex-1 mt-4">
        <div className="flex items-start gap-4">
          <UserAvatar
            name={operator?.user?.fullName}
            src={operator?.profilePhotoUrl || operator?.user?.image}
            seed={operator?.user?.id || operator?.id}
            size="xl"
            className="w-16 h-16 border"
          />
          <div className="space-y-1 overflow-hidden">
            <h3 className="font-semibold text-lg truncate">
              {operator?.user?.fullName || t("noName")}
            </h3>
            <p className="text-sm text-muted-foreground truncate">
              {operator?.jobTitle || t("noTitleSet")}
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          <div className="grid grid-cols-2 text-sm gap-2">
            <div className="text-muted-foreground">{t("role")}</div>
            <div className="font-medium capitalize">
              {operator?.role?.toLowerCase() || t("notSet")}
            </div>

            <div className="text-muted-foreground">{t("joined")}</div>
            <div className="font-medium">
              {operator?.joinedAt
                ? new Date(operator.joinedAt).toLocaleDateString()
                : t("unknown")}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
