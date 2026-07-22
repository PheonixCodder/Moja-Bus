"use client";

import { useCompanySettings } from "../api/use-company-settings";
import { Progress } from "@moja/ui/components/ui/progress";
import { getBankVerificationState, getDocumentsVerificationState } from "../../lib/company-status";

export function HealthScore() {
  const { data: settings } = useCompanySettings();
  
  const checklist = [
    { 
      label: "Profile details filled", 
      done: !!settings?.company.name && !!settings?.company.taxId && !!settings?.company.registrationNumber 
    },
    { 
      label: "Payout bank account verified", 
      done: settings?.company?.bankAccounts?.some(b => b.isVerified) || false
    },
    { 
      label: "Required documents approved", 
      done: getDocumentsVerificationState(settings?.company.documents || []) === "approved" 
    },
  ];

  const completed = checklist.filter((item) => item.done).length;
  const score = Math.round((completed / checklist.length) * 100);

  if (score === 100) return null; // Don't show if perfect

  return (
    <div className="bg-primary/5 border border-primary/10 rounded-xl p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 flex-1">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            Company Health Score
            <span className="text-primary">{score}%</span>
          </h3>
          <p className="text-sm text-muted-foreground">
            Complete these remaining steps to ensure your account is fully operational.
          </p>
          <Progress value={score} className="h-2 w-full md:max-w-md mt-4" />
        </div>
        
        <div className="flex-1 space-y-2">
          {checklist.map((item, idx) => (
            <div key={idx} className="flex items-center gap-3 text-sm">
              <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${item.done ? 'bg-primary text-primary-foreground' : 'bg-muted border border-input'}`}>
                {item.done && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="w-2.5 h-2.5"><polyline points="20 6 9 17 4 12" /></svg>}
              </div>
              <span className={item.done ? "text-muted-foreground line-through" : "font-medium"}>
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
