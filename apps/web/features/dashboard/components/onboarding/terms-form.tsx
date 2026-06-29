"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@moja/ui/components/ui/button";
import { Checkbox } from "@moja/ui/components/ui/checkbox";
import { Label } from "@moja/ui/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@moja/ui/components/ui/card";
import { FileText, ShieldCheck, Percent, Calendar, CheckCircle2 } from "lucide-react";

export function TermsForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  
  // Form state
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptCommission, setAcceptCommission] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setIsLoading(true);
    
    if (!acceptTerms || !acceptCommission || !acceptPrivacy) {
      toast.error("Please accept all terms and conditions");
      setIsLoading(false);
      return;
    }
    
    try {
      // TODO: Save terms acceptance and mark onboarding as complete
      console.log("Terms accepted:", { acceptTerms, acceptCommission, acceptPrivacy });
      
      toast.success("Onboarding complete! Welcome to Moja Ride!");
      router.push("/dashboard/operator");
    } catch (error) {
      toast.error("Failed to complete onboarding. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  const canSubmit = acceptTerms && acceptCommission && acceptPrivacy;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Completion Status */}
      <Card className="border-green-100 bg-green-50/50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">Almost There!</CardTitle>
              <CardDescription>
                You're one step away from completing your onboarding
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 p-4 bg-white rounded-lg border border-green-200">
            <div className="relative w-24 h-24">
              <svg className="w-24 h-24" viewBox="0 0 36 36">
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#E5E7EB"
                  strokeWidth="3"
                  strokeDasharray="100 100"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#10B981"
                  strokeWidth="3"
                  strokeDasharray="100 100"
                  strokeDashoffset={0}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">All Steps Complete!</h3>
              <p className="text-sm text-slate-500">
                Company profile, locations, documents, bank account, and personal profile are all set up.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Terms and Conditions Card */}
      <Card className="border-slate-200">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-100 rounded-lg">
              <FileText className="w-5 h-5 text-slate-600" />
            </div>
            <div>
              <CardTitle className="text-lg">Terms and Conditions</CardTitle>
              <CardDescription>
                Our platform terms and policies
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
              <FileText className="w-5 h-5 text-slate-500 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-slate-900 mb-1">Platform Terms</h4>
                <p className="text-sm text-slate-600">
                  By using Moja Ride, you agree to our terms of service, including but not limited to:
                  <ul className="text-sm text-slate-600 mt-2 ml-4 list-disc list-inside space-y-0.5">
                    <li>Providing accurate and truthful information</li>
                    <li>Maintaining valid licenses and insurance</li>
                    <li>Following all local laws and regulations</li>
                    <li>Providing quality service to passengers</li>
                    <li>Not engaging in discriminatory practices</li>
                  </ul>
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Checkbox
                id="acceptTerms"
                checked={acceptTerms}
                onCheckedChange={(checked) => setAcceptTerms(checked as boolean)}
                disabled={isLoading}
              />
              <Label htmlFor="acceptTerms" className="font-medium cursor-pointer">
                I accept the Moja Ride Platform Terms and Conditions
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Commission Structure Card */}
      <Card className="border-slate-200">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Percent className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <CardTitle className="text-lg">Commission Structure</CardTitle>
              <CardDescription>
                How we make money - transparent pricing
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3 p-3 bg-amber-50/50 rounded-lg">
            <Percent className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-slate-900 mb-1">Our Fees</h4>
              <p className="text-sm text-slate-600">
                We operate on a simple, transparent commission model:
              </p>
              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between p-2 bg-white rounded border border-slate-200">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-700">Booking Commission</span>
                  </div>
                  <span className="font-bold text-amber-600">10%</span>
                </div>
                <p className="text-xs text-slate-500 text-center">per completed booking</p>
                
                <div className="flex items-center justify-between p-2 bg-white rounded border border-slate-200">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-700">Payment Processing</span>
                  </div>
                  <span className="font-bold text-amber-600">3%</span>
                </div>
                <p className="text-xs text-slate-500 text-center">per transaction</p>
                
                <div className="flex items-center justify-between p-2 bg-white rounded border border-slate-200">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-700">Payout Schedule</span>
                  </div>
                  <span className="font-bold text-amber-600">Weekly</span>
                </div>
                <p className="text-xs text-slate-500 text-center">every Friday</p>
              </div>
              <p className="text-sm text-slate-600 mt-3">
                No hidden fees. No monthly subscriptions. Pay only when you earn.
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Checkbox
              id="acceptCommission"
              checked={acceptCommission}
              onCheckedChange={(checked) => setAcceptCommission(checked as boolean)}
              disabled={isLoading}
            />
            <Label htmlFor="acceptCommission" className="font-medium cursor-pointer">
              I accept the Commission Structure and Pricing Terms
            </Label>
          </div>
        </CardContent>
      </Card>

      {/* Privacy Policy Card */}
      <Card className="border-slate-200">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <ShieldCheck className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-lg">Privacy Policy</CardTitle>
              <CardDescription>
                How we handle your data
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3 p-3 bg-blue-50/50 rounded-lg">
            <ShieldCheck className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-slate-900 mb-1">Data Protection</h4>
              <p className="text-sm text-slate-600">
                We take your privacy seriously. Your data is:
                <ul className="text-sm text-slate-600 mt-2 ml-4 list-disc list-inside space-y-0.5">
                  <li>Encrypted in transit and at rest</li>
                  <li>Never sold to third parties</li>
                  <li>Used only for platform operations</li>
                  <li>Accessible only to authorized personnel</li>
                  <li>Deletable upon account closure</li>
                </ul>
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Checkbox
              id="acceptPrivacy"
              checked={acceptPrivacy}
              onCheckedChange={(checked) => setAcceptPrivacy(checked as boolean)}
              disabled={isLoading}
            />
            <Label htmlFor="acceptPrivacy" className="font-medium cursor-pointer">
              I accept the Moja Ride Privacy Policy
            </Label>
          </div>
        </CardContent>
      </Card>

      {/* Final Confirmation */}
      <Card className="border-green-200 bg-green-50/50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <CheckCircle2 className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-slate-900 mb-1">Ready to Launch!</h4>
              <p className="text-sm text-slate-600">
                By clicking "Complete Onboarding", you confirm that:
                <ul className="text-sm text-slate-600 mt-2 ml-4 list-disc list-inside space-y-0.5">
                  <li>All information provided is accurate and truthful</li>
                  <li>You have the legal right to operate a transport business</li>
                  <li>All uploaded documents are valid and authentic</li>
                  <li>You will comply with all Moja Ride policies</li>
                  <li>You understand and accept the commission structure</li>
                </ul>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Submit */}
      <div className="flex justify-between items-center">
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push("/dashboard/operator/onboarding/profile")}
          disabled={isLoading}
        >
          Back
        </Button>
        <Button
          type="submit"
          size="lg"
          className="bg-green-600 hover:bg-green-700 text-white min-w-48"
          disabled={isLoading || !canSubmit}
        >
          {isLoading ? "Completing..." : "Complete Onboarding"}
        </Button>
      </div>
    </form>
  );
}
