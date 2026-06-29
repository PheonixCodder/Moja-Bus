"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@moja/ui/components/ui/button";
import { Input } from "@moja/ui/components/ui/input";
import { Label } from "@moja/ui/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@moja/ui/components/ui/select";
import { Checkbox } from "@moja/ui/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@moja/ui/components/ui/card";
import { Banknote, ShieldCheck, CreditCard, Building2, CheckCircle2, AlertCircle } from "lucide-react";

export function BankAccountForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  
  // Form state
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [branch, setBranch] = useState("");
  const [swiftCode, setSwiftCode] = useState("");
  const [iban, setIban] = useState("");
  const [isVerified, setIsVerified] = useState(false);
  const [isActive, setIsActive] = useState(true);

  // Common banks in Cote d'Ivoire
  const commonBanks = [
    "BICICI",
    "Banque de l'Union",
    "Ecobank",
    "Banque Atlantique",
    "SGBCI",
    "Standard Chartered",
    "CBAO",
    "Banque Internationale pour l'Afrique de l'Ouest (BIAO)",
    "Orabank",
    "Versus Bank",
    "Other",
  ];

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setIsLoading(true);
    
    try {
      // TODO: Save bank account data
      console.log("Bank account data:", {
        bankName,
        accountNumber,
        accountName,
        branch,
        swiftCode,
        iban,
        isVerified,
        isActive,
      });
      
      toast.success("Bank account saved!");
      router.push("/dashboard/operator/onboarding/profile");
    } catch (error) {
      toast.error("Failed to save bank account. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  const canSubmit = bankName && accountNumber && accountName;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Security Notice */}
      <Card className="border-amber-100 bg-amber-50/50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <ShieldCheck className="w-6 h-6 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-slate-900 mb-1">Secure Payment Processing</h4>
              <p className="text-sm text-slate-600">
                Your bank information is encrypted and securely stored. 
                We only use it to process payouts to your account.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bank Information Card */}
      <Card className="border-slate-200">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500 rounded-lg">
              <Banknote className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">Bank Information</CardTitle>
              <CardDescription>
                Enter your bank details for receiving payments
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="bankName" className="flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              <span>Bank Name</span>
              <span className="text-destructive">*</span>
            </Label>
            <Select
              value={bankName}
              onValueChange={(value) => setBankName(value || "")}
              required
              disabled={isLoading}
            >
              <SelectTrigger id="bankName">
                <SelectValue placeholder="Select your bank" />
              </SelectTrigger>
              <SelectContent>
                {commonBanks.map((bank) => (
                  <SelectItem key={bank} value={bank}>
                    {bank}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="accountNumber" className="flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              <span>Account Number</span>
              <span className="text-destructive">*</span>
            </Label>
            <Input
              id="accountNumber"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              placeholder="000123456789"
              type="text"
              inputMode="numeric"
              required
              disabled={isLoading}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="accountName" className="flex items-center gap-2">
              <span>Account Name</span>
              <span className="text-destructive">*</span>
            </Label>
            <Input
              id="accountName"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              placeholder="Must match your registered business name"
              required
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              This must exactly match the name on your bank account
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="branch">Branch Name</Label>
              <Input
                id="branch"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                placeholder="Main Branch, Downtown, etc."
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="swiftCode">SWIFT Code</Label>
              <Input
                id="swiftCode"
                value={swiftCode}
                onChange={(e) => setSwiftCode(e.target.value.toUpperCase())}
                placeholder="BICICICIXXX"
                disabled={isLoading}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="iban">IBAN (International Bank Account Number)</Label>
            <Input
              id="iban"
              value={iban}
              onChange={(e) => setIban(e.target.value.toUpperCase())}
              placeholder="CI000010000100000000000012345"
              disabled={isLoading}
            />
          </div>
        </CardContent>
      </Card>

      {/* Verification Card */}
      <Card className="border-slate-200 bg-slate-50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-100 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-slate-600" />
            </div>
            <div>
              <CardTitle className="text-lg">Account Verification</CardTitle>
              <CardDescription>
                Verify your bank account details
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-4 p-4 bg-white rounded-lg border border-slate-200">
            <AlertCircle className="w-6 h-6 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-slate-900 mb-1">Important Note</h4>
              <p className="text-sm text-slate-600">
                To verify your bank account, we will make a small deposit (less than 1000 FCFA) 
                to your account. You will need to confirm the exact amount in your dashboard 
                to complete verification.
              </p>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="isVerified" className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>Bank Account Verified</span>
            </Label>
            <Checkbox
              id="isVerified"
              checked={isVerified}
              onCheckedChange={(checked) => setIsVerified(checked as boolean)}
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              Check this box once you have verified the deposit amount
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="isActive" className="flex items-center gap-2">
              <span>Active Account</span>
            </Label>
            <Checkbox
              id="isActive"
              checked={isActive}
              onCheckedChange={(checked) => setIsActive(checked as boolean)}
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              Enable to receive payouts to this account
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Submit */}
      <div className="flex justify-between items-center">
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push("/dashboard/operator/onboarding/documents")}
          disabled={isLoading}
        >
          Back
        </Button>
        <Button
          type="submit"
          size="lg"
          className="bg-amber-600 hover:bg-amber-700 text-white min-w-48"
          disabled={isLoading || !canSubmit}
        >
          {isLoading ? "Saving..." : "Continue to Profile"}
        </Button>
      </div>
    </form>
  );
}
