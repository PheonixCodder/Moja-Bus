"use client";

import { Building, User, Mail, Phone, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@moja/ui/components/ui/card";
import { Separator } from "@moja/ui/components/ui/separator";

interface VerificationDetailsHeaderProps {
  company: any;
}

export function VerificationDetailsHeader({ company }: VerificationDetailsHeaderProps) {
  const rep = company.operators?.[0]?.user;

  return (
    <Card className="bg-white border-border shadow-sm overflow-hidden">
      <CardHeader className="bg-slate-50 border-b border-border/60 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="size-14 rounded-xl border border-slate-200 bg-white flex items-center justify-center text-slate-600 font-bold text-xl shadow-sm select-none shrink-0">
              {company.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <CardTitle className="text-xl font-bold text-slate-900 leading-none">
                {company.name}
              </CardTitle>
              <p className="text-xs text-slate-400 font-mono mt-1 uppercase tracking-wider">
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
              Visit Website
              <ExternalLink className="size-3.5" />
            </a>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {company.description && (
          <div className="space-y-1.5">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              About the Company
            </h4>
            <p className="text-sm text-slate-600 leading-relaxed">
              {company.description}
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <div className="text-xs text-slate-400 font-medium">Business Type</div>
            <div className="font-semibold text-slate-800 text-sm mt-0.5">
              {company.businessType.replace(/_/g, " ")}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Reg Number</div>
            <div className="font-semibold text-slate-800 text-sm mt-0.5">
              {company.registrationNumber}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Tax ID</div>
            <div className="font-semibold text-slate-800 text-sm mt-0.5">
              {company.taxId}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Established</div>
            <div className="font-semibold text-slate-800 text-sm mt-0.5">
              {company.yearEstablished || "N/A"}
            </div>
          </div>
        </div>

        <Separator className="bg-border/60" />

        <div className="space-y-3">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <User className="size-4 text-slate-400" />
            Owner Representative Details
          </h4>
          {rep ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-600 border border-slate-100 rounded-lg p-4 bg-slate-50/50">
              <div className="space-y-1">
                <span className="font-medium text-slate-400">Full Name</span>
                <div className="font-semibold text-slate-800 text-sm">{rep.fullName}</div>
              </div>
              <div className="space-y-1">
                <span className="font-medium text-slate-400">Email Address</span>
                <div className="font-semibold text-slate-800 text-sm flex items-center gap-1.5">
                  <Mail className="size-3 text-slate-400 shrink-0" />
                  {rep.email}
                </div>
              </div>
              <div className="space-y-1">
                <span className="font-medium text-slate-400">Phone Contact</span>
                <div className="font-semibold text-slate-800 text-sm flex items-center gap-1.5">
                  <Phone className="size-3 text-slate-400 shrink-0" />
                  {rep.phone || "N/A"}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic">No representative contact details registered.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
