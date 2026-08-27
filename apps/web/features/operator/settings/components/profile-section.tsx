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
import { Building2, Pencil } from "lucide-react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@moja/ui/components/ui/avatar";
import { useStaffPermissions } from "@/features/operator/hooks/use-staff-permissions";

interface ProfileSectionProps {
  onManage: () => void;
}

export function ProfileSection({ onManage }: ProfileSectionProps) {
  const t = useTranslations("operatorDashboard.settings.company");
  const { data: settings } = useCompanySettings();
  const { can } = useStaffPermissions();
  const company = settings?.company;
  const operator = settings?.operator;

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="flex flex-row items-start justify-between pb-2">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-muted-foreground" />
            {t("title")}
          </CardTitle>
          <CardDescription>{t("publicDetails")}</CardDescription>
        </div>
        {can("company:profile:update") ? (
          <Button variant="outline" size="sm" onClick={onManage}>
            <Pencil className="w-4 h-4 mr-2" />
            {t("edit")}
          </Button>
        ) : null}
      </CardHeader>
      <CardContent className="flex-1 mt-4">
        <div className="flex items-start gap-4">
          <Avatar className="w-16 h-16 border">
            <AvatarImage
              src={company?.logoUrl || undefined}
              alt={company?.name}
            />
            <AvatarFallback className="bg-muted text-muted-foreground text-lg">
              {company?.name?.charAt(0).toUpperCase() || "C"}
            </AvatarFallback>
          </Avatar>
          <div className="space-y-1 overflow-hidden">
            <h3 className="font-semibold text-lg truncate">
              {company?.name || t("noCompanyName")}
            </h3>
            <p className="text-sm text-muted-foreground truncate">
              {company?.email || t("noEmailSet")}
            </p>
            <p className="text-sm text-muted-foreground truncate">
              {company?.phone || t("noPhoneSet")}
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          <div className="grid grid-cols-2 text-sm gap-2">
            <div className="text-muted-foreground">{t("type")}</div>
            <div className="font-medium capitalize">
              {company?.businessType
                ? t(`types.${company.businessType}` as any) ||
                  company.businessType
                : t("notSet")}
            </div>

            <div className="text-muted-foreground">{t("regNumber")}</div>
            <div
              className="font-medium truncate"
              title={company?.registrationNumber || ""}
            >
              {company?.registrationNumber || t("notSet")}
            </div>

            <div className="text-muted-foreground">{t("taxId")}</div>
            <div className="font-medium truncate" title={company?.taxId || ""}>
              {company?.taxId || t("notSet")}
            </div>

            <div className="text-muted-foreground">{t("manager")}</div>
            <div className="font-medium truncate">
              {operator?.user?.fullName}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
