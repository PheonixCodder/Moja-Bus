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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@moja/ui/components/ui/card";
import { PhoneInput } from "@moja/ui/components/ui/phone-input";
import { User, Phone, Mail, Calendar, IdCard, ShieldCheck, Contact, Image as ImageIcon } from "lucide-react";

type StaffRole = "OWNER" | "ADMIN" | "MANAGER" | "OPERATIONS" | "FINANCE" | "SUPPORT" | "DRIVER";

const staffRoles: { value: StaffRole; label: string }[] = [
  { value: "OWNER", label: "Owner" },
  { value: "ADMIN", label: "Administrator" },
  { value: "MANAGER", label: "Manager" },
  { value: "OPERATIONS", label: "Operations" },
  { value: "FINANCE", label: "Finance" },
  { value: "SUPPORT", label: "Customer Support" },
  { value: "DRIVER", label: "Driver" },
];

const idTypes = [
  { value: "passport", label: "Passport" },
  { value: "national_id", label: "National ID Card" },
  { value: "driver_license", label: "Driver's License" },
];

export function OperatorProfileForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  
  // Form state
  const [fullName, setFullName] = useState("");
  const [workEmail, setWorkEmail] = useState("");
  const [workPhone, setWorkPhone] = useState("");
  const [personalPhone, setPersonalPhone] = useState("");
  const [role, setRole] = useState<StaffRole>("OWNER");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [nationalIdNumber, setNationalIdNumber] = useState("");
  const [nationalIdType, setNationalIdType] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [profilePhotoUrl, setProfilePhotoUrl] = useState("");
  const [emergencyContactName, setEmergencyContactName] = useState("");
  const [emergencyContactPhone, setEmergencyContactPhone] = useState("");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setIsLoading(true);
    
    try {
      // TODO: Save operator profile data
      console.log("Operator profile data:", {
        fullName,
        workEmail,
        workPhone,
        personalPhone,
        role,
        dateOfBirth,
        nationalIdNumber,
        nationalIdType,
        jobTitle,
        profilePhotoUrl,
        emergencyContactName,
        emergencyContactPhone,
      });
      
      toast.success("Profile saved!");
      router.push("/dashboard/operator/onboarding/terms");
    } catch (error) {
      toast.error("Failed to save profile. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  const canSubmit = fullName && workEmail && role;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Personal Information Card */}
      <Card className="border-slate-200">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500 rounded-lg">
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">Personal Information</CardTitle>
              <CardDescription>
                Your basic personal details
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fullName" className="flex items-center gap-2">
                <span>Full Name</span>
                <span className="text-destructive">*</span>
              </Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your legal name"
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateOfBirth" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>Date of Birth</span>
              </Label>
              <Input
                id="dateOfBirth"
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="profilePhotoUrl" className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4" />
              <span>Profile Photo URL</span>
            </Label>
            <Input
              id="profilePhotoUrl"
              type="url"
              value={profilePhotoUrl}
              onChange={(e) => setProfilePhotoUrl(e.target.value)}
              placeholder="https://example.com/photo.jpg"
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              Provide a URL to your profile photo (200x200px recommended)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Contact Information Card */}
      <Card className="border-slate-200">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500 rounded-lg">
              <Phone className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">Contact Information</CardTitle>
              <CardDescription>
                How we can reach you
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="workEmail" className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                <span>Work Email</span>
                <span className="text-destructive">*</span>
              </Label>
              <Input
                id="workEmail"
                type="email"
                value={workEmail}
                onChange={(e) => setWorkEmail(e.target.value)}
                placeholder="you@company.com"
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="workPhone" className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                <span>Work Phone</span>
              </Label>
              <PhoneInput
                id="workPhone"
                value={workPhone}
                onChange={(value) => setWorkPhone(value ?? "")}
                placeholder="+225 XX XX XX XX"
                country="CI"
                defaultCountry="CI"
                international={false}
                disabled={isLoading}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="personalPhone" className="flex items-center gap-2">
              <Contact className="w-4 h-4" />
              <span>Personal Phone</span>
            </Label>
            <PhoneInput
              id="personalPhone"
              value={personalPhone}
              onChange={(value) => setPersonalPhone(value ?? "")}
              placeholder="+225 XX XX XX XX"
              country="CI"
              defaultCountry="CI"
              international={false}
              disabled={isLoading}
            />
          </div>
        </CardContent>
      </Card>

      {/* Professional Information Card */}
      <Card className="border-slate-200">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500 rounded-lg">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">Professional Information</CardTitle>
              <CardDescription>
                Your role and credentials
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="role" className="flex items-center gap-2">
                <span>Role in Company</span>
                <span className="text-destructive">*</span>
              </Label>
              <Select
                value={role}
                onValueChange={(value) => setRole(value as StaffRole)}
                required
                disabled={isLoading}
              >
                <SelectTrigger id="role">
                  <SelectValue placeholder="Select your role" />
                </SelectTrigger>
                <SelectContent>
                  {staffRoles.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="jobTitle">Job Title</Label>
              <Input
                id="jobTitle"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="e.g., Operations Manager, CEO"
                disabled={isLoading}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nationalIdType">ID Type</Label>
              <Select
                value={nationalIdType}
                onValueChange={(value) => setNationalIdType(value || "")}
                disabled={isLoading}
              >
                <SelectTrigger id="nationalIdType">
                  <SelectValue placeholder="Select ID type" />
                </SelectTrigger>
                <SelectContent>
                  {idTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="nationalIdNumber">ID Number</Label>
              <Input
                id="nationalIdNumber"
                value={nationalIdNumber}
                onChange={(e) => setNationalIdNumber(e.target.value)}
                placeholder="Your national ID number"
                disabled={isLoading}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Emergency Contact Card */}
      <Card className="border-slate-200 bg-slate-50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-500 rounded-lg">
              <IdCard className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">National Identification</CardTitle>
              <CardDescription>
                For verification purposes (optional)
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-4 p-4 bg-white rounded-lg border border-slate-200">
            <ShieldCheck className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-slate-900 mb-1">Important Note</h4>
              <p className="text-sm text-slate-600">
                Your ID information is securely stored and used only for verification purposes. 
                It will not be shared with third parties.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Emergency Contact Card */}
      <Card className="border-slate-200">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-500 rounded-lg">
              <Contact className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">Emergency Contact</CardTitle>
              <CardDescription>
                In case of emergencies
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="emergencyContactName">Contact Name</Label>
              <Input
                id="emergencyContactName"
                value={emergencyContactName}
                onChange={(e) => setEmergencyContactName(e.target.value)}
                placeholder="Emergency contact person"
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emergencyContactPhone">Contact Phone</Label>
              <Input
                id="emergencyContactPhone"
                type="tel"
                value={emergencyContactPhone}
                onChange={(e) => setEmergencyContactPhone(e.target.value)}
                placeholder="+225 XX XX XX XX"
                disabled={isLoading}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Submit */}
      <div className="flex justify-between items-center">
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push("/dashboard/operator/onboarding/bank")}
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
          {isLoading ? "Saving..." : "Continue to Terms"}
        </Button>
      </div>
    </form>
  );
}
