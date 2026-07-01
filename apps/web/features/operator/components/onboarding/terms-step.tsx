"use client";

import { useState } from "react";
import { Button } from "@moja/ui/components/ui/button";
import { Checkbox } from "@moja/ui/components/ui/checkbox";
import { Label } from "@moja/ui/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@moja/ui/components/ui/card";
import { FileText, ShieldCheck, Percent, CheckCircle2 } from "lucide-react";
import { type TermsStepInput } from "@moja/schemas";

interface TermsStepProps {
  onSave: (data: TermsStepInput) => Promise<boolean>;
  onComplete: () => Promise<boolean>;
  onBack: () => void;
  isSaving: boolean;
}

export function TermsStep({
  onSave,
  onComplete,
  onBack,
  isSaving,
}: TermsStepProps) {
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptCommission, setAcceptCommission] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptTerms || !acceptCommission || !acceptPrivacy) {
      return;
    }

    // Save step draft
    const stepSaved = await onSave({
      acceptTerms,
      acceptCommission,
      acceptPrivacy,
    });

    if (stepSaved) {
      // Trigger finalize onboarding
      await onComplete();
    }
  };

  const canSubmit = acceptTerms && acceptCommission && acceptPrivacy;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Ready Banner */}
      <Card className="border-green-200 bg-green-50/10 rounded-md">
        <CardHeader className="pb-3 pt-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500 text-white rounded">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-base font-bold">
                Almost Finished!
              </CardTitle>
              <CardDescription className="text-xs">
                You've completed all details. Review and accept the operational
                terms to launch.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card className="border-border rounded-md shadow-sm">
        <CardHeader className="border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 text-primary rounded">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold">
                Terms & Conditions
              </CardTitle>
              <CardDescription>
                Review and accept our platform service agreement policies.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-5">
          {/* Terms checkbox */}
          <div className="flex items-start gap-3 p-3 border border-border rounded-md bg-slate-50/50 hover:bg-slate-50 transition-colors">
            <Checkbox
              id="terms-accept"
              checked={acceptTerms}
              onCheckedChange={(checked) => setAcceptTerms(!!checked)}
              className="mt-0.5"
            />
            <div
              className="flex flex-col gap-1 cursor-pointer"
              onClick={() => setAcceptTerms(!acceptTerms)}
            >
              <Label
                htmlFor="terms-accept"
                className="text-sm font-bold text-foreground cursor-pointer flex items-center gap-1.5"
              >
                Operator Service Agreement *
              </Label>
              <p className="text-xs text-muted-foreground leading-relaxed">
                I agree to the Moja Ride Operator Terms of Service. I certify
                that my bus company possesses all valid operating permits and
                complies with Côte d'Ivoire transit regulations.
              </p>
            </div>
          </div>

          {/* Commission checkbox */}
          <div className="flex items-start gap-3 p-3 border border-border rounded-md bg-slate-50/50 hover:bg-slate-50 transition-colors">
            <Checkbox
              id="commission-accept"
              checked={acceptCommission}
              onCheckedChange={(checked) => setAcceptCommission(!!checked)}
              className="mt-0.5"
            />
            <div
              className="flex flex-col gap-1 cursor-pointer"
              onClick={() => setAcceptCommission(!acceptCommission)}
            >
              <Label
                htmlFor="commission-accept"
                className="text-sm font-bold text-foreground cursor-pointer flex items-center gap-1.5"
              >
                Platform Payout & Commission Rates *
              </Label>
              <p className="text-xs text-muted-foreground leading-relaxed">
                I understand and accept that Moja Ride deducts a standard
                platform commission (e.g. 5%) on all online passenger bookings.
                Payouts are generated on a bi-weekly cycle.
              </p>
            </div>
          </div>

          {/* Privacy checkbox */}
          <div className="flex items-start gap-3 p-3 border border-border rounded-md bg-slate-50/50 hover:bg-slate-50 transition-colors">
            <Checkbox
              id="privacy-accept"
              checked={acceptPrivacy}
              onCheckedChange={(checked) => setAcceptPrivacy(!!checked)}
              className="mt-0.5"
            />
            <div
              className="flex flex-col gap-1 cursor-pointer"
              onClick={() => setAcceptPrivacy(!acceptPrivacy)}
            >
              <Label
                htmlFor="privacy-accept"
                className="text-sm font-bold text-foreground cursor-pointer flex items-center gap-1.5"
              >
                Privacy Policy & Data Sharing *
              </Label>
              <p className="text-xs text-muted-foreground leading-relaxed">
                I authorize Moja Ride to process my company details, vehicle
                information, and routing details to list ticket bookings for
                passengers and verify account legitimacy.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sticky Bottom Action Bar container placeholder */}
      <div className="flex justify-between pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          disabled={isSaving}
          className="border-border hover:bg-slate-100 rounded-md px-6 py-2"
        >
          Back
        </Button>
        <Button
          type="submit"
          disabled={isSaving || !canSubmit}
          className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold rounded-md px-6 py-2"
        >
          {isSaving ? "Completing..." : "Complete & Finalize Onboarding"}
        </Button>
      </div>
    </form>
  );
}
