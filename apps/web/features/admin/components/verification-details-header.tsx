"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@moja/ui/components/ui/card";
import { Separator } from "@moja/ui/components/ui/separator";
import { Building, ExternalLink, Mail, Phone, User } from "lucide-react";
import { useTranslations } from "next-intl";

interface VerificationDetailsHeaderProps {
  company: any;
}

export function VerificationDetailsHeader({
  company,
}: VerificationDetailsHeaderProps) {
  const t = useTranslations("adminDashboard.verificationDetailsHeader");
  const rep = company.operators?.[0]?.user;

  return (
    <Card className="bg-card border-border shadow-sm overflow-hidden">
      <CardHeader className="bg-muted/40 border-b border-border/60 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="size-14 rounded-xl border border-border bg-card flex items-center justify-center text-foreground font-bold text-xl shadow-sm select-none shrink-0">
              {company.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <CardTitle className="text-xl font-bold text-foreground leading-none">
                {company.name}
              </CardTitle>
              <p className="text-xs text-muted-foreground font-mono mt-1 uppercase tracking-wider">
                Slug: {company.slug}
              </p>
            </div>
          </div>
          {company.website && (
            <a
              href={company.website}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary font-semibold hover:underline"
            >
              {t("visitWebsite")}
              <ExternalLink className="size-3.5" />
            </a>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {company.description && (
          <div className="space-y-1.5">
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              {t("aboutTheCompany")}
            </h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {company.description}
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <div className="text-xs text-muted-foreground font-medium">
              {t("businessType")}
            </div>
            <div className="font-semibold text-foreground text-sm mt-0.5">
              {company.businessType.replace(/_/g, " ")}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground font-medium">
              {t("regNumber")}
            </div>
            <div className="font-semibold text-foreground text-sm mt-0.5">
              {company.registrationNumber}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground font-medium">
              {t("taxId")}
            </div>
            <div className="font-semibold text-foreground text-sm mt-0.5">
              {company.taxId}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground font-medium">
              {t("established")}
            </div>
            <div className="font-semibold text-foreground text-sm mt-0.5">
              {company.yearEstablished || t("na")}
            </div>
          </div>
        </div>

        <Separator className="bg-border/60" />

        <div className="space-y-3">
          <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
            <User className="size-4 text-muted-foreground" />
            {t("ownerRepresentativeDetails")}
          </h4>
          {rep ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-muted-foreground border border-border rounded-lg p-4 bg-muted/30">
              <div className="space-y-1">
                <span className="font-medium text-muted-foreground">
                  {t("fullName")}
                </span>
                <div className="font-semibold text-foreground text-sm">
                  {rep.fullName}
                </div>
              </div>
              <div className="space-y-1">
                <span className="font-medium text-muted-foreground">
                  {t("emailAddress")}
                </span>
                <div className="font-semibold text-foreground text-sm flex items-center gap-1.5">
                  <Mail className="size-3 text-muted-foreground shrink-0" />
                  {rep.email}
                </div>
              </div>
              <div className="space-y-1">
                <span className="font-medium text-muted-foreground">
                  {t("phoneContact")}
                </span>
                <div className="font-semibold text-foreground text-sm flex items-center gap-1.5">
                  <Phone className="size-3 text-muted-foreground shrink-0" />
                  {rep.phone || t("na")}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic">
              {t("noRepresentativeDetails")}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
