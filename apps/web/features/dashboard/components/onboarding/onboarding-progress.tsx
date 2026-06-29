"use client";

import { usePathname } from "next/navigation";
import { CheckCircle2, Bus, Flag, Building2, FileText, Banknote, UserCircle, BookOpen } from "lucide-react";
import { cn } from "@moja/ui/lib/utils";

const steps = [
  { 
    id: "company", 
    name: "Company", 
    icon: Building2,
    path: "/dashboard/operator/onboarding/company"
  },
  { 
    id: "locations", 
    name: "Locations", 
    icon: Flag,
    path: "/dashboard/operator/onboarding/locations"
  },
  { 
    id: "documents", 
    name: "Documents", 
    icon: FileText,
    path: "/dashboard/operator/onboarding/documents"
  },
  { 
    id: "bank", 
    name: "Bank Account", 
    icon: Banknote,
    path: "/dashboard/operator/onboarding/bank"
  },
  { 
    id: "profile", 
    name: "Your Profile", 
    icon: UserCircle,
    path: "/dashboard/operator/onboarding/profile"
  },
  { 
    id: "terms", 
    name: "Terms", 
    icon: BookOpen,
    path: "/dashboard/operator/onboarding/terms"
  },
];

export function OnboardingProgress() {
  const pathname = usePathname();
  
  // Find current step index
  const currentStepIndex = steps.findIndex(step => 
    pathname?.startsWith(step.path) || 
    pathname?.includes(`/onboarding/${step.id}`)
  );
  
  // All steps before current are completed
  const completedSteps = currentStepIndex >= 0 ? steps.slice(0, currentStepIndex) : [];
  
  return (
    <div className="w-full bg-slate-50 rounded-2xl p-6 shadow-sm border border-slate-200">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Get Your Business Ready</h3>
          <p className="text-sm text-slate-500">Complete these steps to start accepting bookings</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-amber-600 bg-amber-50 px-3 py-1 rounded-full">
            {currentStepIndex + 1} of {steps.length}
          </span>
        </div>
      </div>
      
      {/* Road tracker */}
      <div className="relative">
        {/* Road line */}
        <div className="absolute top-1/2 left-4 right-4 h-2 bg-slate-200 rounded-full -translate-y-1/2" />
        
        {/* Steps */}
        <div className="flex justify-between items-center relative z-10">
          {steps.map((step, index) => {
            const isCompleted = index < currentStepIndex;
            const isCurrent = index === currentStepIndex;
            const isUpcoming = index > currentStepIndex;
            
            return (
              <div 
                key={step.id} 
                className="flex flex-col items-center gap-2 relative z-20"
              >
                {/* Step marker */}
                <div 
                  className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center border-4 border-slate-50 shadow-md transition-all duration-300",
                    isCompleted && "bg-green-500 border-green-500",
                    isCurrent && "bg-amber-500 border-amber-500 ring-4 ring-amber-100",
                    isUpcoming && "bg-slate-100 border-slate-200"
                  )}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-6 h-6 text-white" />
                  ) : (
                    <step.icon className={cn(
                      "w-6 h-6",
                      isCurrent ? "text-white" : "text-slate-400"
                    )} />
                  )}
                </div>
                
                {/* Step label */}
                <span 
                  className={cn(
                    "text-xs font-medium whitespace-nowrap",
                    isCompleted && "text-green-600",
                    isCurrent && "text-amber-600",
                    isUpcoming && "text-slate-400"
                  )}
                >
                  {step.name}
                </span>
              </div>
            );
          })}
        </div>
        
        {/* Animated bus indicator (optional enhancement) */}
        {currentStepIndex >= 0 && currentStepIndex < steps.length && (
          <div 
            className="absolute top-1/2 h-8 w-8 bg-amber-500 rounded-full -translate-y-1/2 transition-all duration-500 ease-in-out"
            style={{
              left: `calc(${currentStepIndex * (100 / (steps.length - 1))}% + 24px)`,
              transform: "translate(-50%, -50%)"
            }}
          >
            <Bus className="w-5 h-5 text-white" />
          </div>
        )}
      </div>
      
      {/* Progress bar */}
      <div className="mt-4">
        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-amber-500 rounded-full transition-all duration-300"
            style={{ width: `${((currentStepIndex + 1) / steps.length) * 100}%` }}
          />
        </div>
        <div className="flex justify-between mt-2 text-xs text-slate-400">
          <span>Start</span>
          <span>Finish</span>
        </div>
      </div>
    </div>
  );
}
