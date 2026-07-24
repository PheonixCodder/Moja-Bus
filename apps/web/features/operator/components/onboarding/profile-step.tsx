"use client";

import { useEffect, useState } from "react";
import { Button } from "@moja/ui/components/ui/button";
import { DatePicker } from "@moja/ui/components/ui/date-picker";
import { Input } from "@moja/ui/components/ui/input";
import { Label } from "@moja/ui/components/ui/label";
import { PhoneInput } from "@moja/ui/components/ui/phone-input";
import {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxEmpty,
} from "@moja/ui/components/ui/combobox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@moja/ui/components/ui/card";
import { User, IdCard, Calendar, Contact } from "lucide-react";
import { ImageUploadField } from "@/components/image-upload-field";
import { type ProfileStepInput, type StaffRole } from "@moja/schemas";

interface ProfileStepProps {
  initialData?: any;
  onSave: (data: ProfileStepInput) => Promise<boolean>;
  onBack: () => void;
  isSaving: boolean;
}

export function ProfileStep({
  initialData,
  onSave,
  onBack,
  isSaving,
}: ProfileStepProps) {
  const [fullName, setFullName] = useState("");
  const [personalPhone, setPersonalPhone] = useState("");
  const [role, setRole] = useState<StaffRole>("OWNER");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [nationalIdNumber, setNationalIdNumber] = useState("");
  const [nationalIdType, setNationalIdType] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [profilePhotoUrl, setProfilePhotoUrl] = useState("");
  const [emergencyContactName, setEmergencyContactName] = useState("");
  const [emergencyContactPhone, setEmergencyContactPhone] = useState("");

  const staffRoles: { value: StaffRole; label: string }[] = [
    { value: "OWNER", label: "Owner" },
    { value: "ADMIN", label: "Administrator" },
    { value: "MANAGER", label: "Manager" },
    { value: "OPERATIONS", label: "Operations" },
    { value: "FINANCE", label: "Finance" },
    { value: "SUPPORT", label: "Customer Support" },
  ];

  const idTypes = [
    { value: "passport", label: "Passport" },
    { value: "national_id", label: "National ID Card" },
    { value: "driver_license", label: "Driver's License" },
  ];

  // Pre-fill form if initialData exists
  useEffect(() => {
    if (initialData?.operator) {
      const op = initialData.operator;
      setFullName(initialData.user?.fullName || op.user?.fullName || "");
      setPersonalPhone(op.personalPhone || "");
      setRole(op.role || "OWNER");
      setDateOfBirth(op.dateOfBirth ? op.dateOfBirth.split("T")[0] : "");
      setNationalIdNumber(op.nationalIdNumber || "");
      setNationalIdType(op.nationalIdType || "");
      setJobTitle(op.jobTitle || "");
      setProfilePhotoUrl(op.profilePhotoUrl || "");
      setEmergencyContactName(op.emergencyContactName || "");
      setEmergencyContactPhone(op.emergencyContactPhone || "");
    } else if (initialData?.user) {
      // Fallback to logged-in user profile full name
      setFullName(initialData.user.fullName || "");
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !role) {
      return;
    }

    const payload: ProfileStepInput = {
      fullName,
      personalPhone: personalPhone || undefined,
      role,
      dateOfBirth: dateOfBirth || undefined,
      nationalIdNumber: nationalIdNumber || undefined,
      nationalIdType: nationalIdType || undefined,
      jobTitle: jobTitle || undefined,
      profilePhotoUrl: profilePhotoUrl || undefined,
      emergencyContactName: emergencyContactName || undefined,
      emergencyContactPhone: emergencyContactPhone || undefined,
    };

    await onSave(payload);
  };

  const canContinue = fullName && role;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card className="border-border rounded-md shadow-sm">
        <CardHeader className="border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 text-primary rounded">
              <User className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold">
                Personal Profile
              </CardTitle>
              <CardDescription>
                Provide details about your personal profile and role within the
                company.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center gap-4">
            <ImageUploadField
              purpose="operator-profile-photo"
              value={profilePhotoUrl || null}
              onUploaded={(r) => setProfilePhotoUrl(r.fileUrl)}
              label="Upload photo"
              hint="PNG or JPG, up to 2MB"
              shape="circle"
              previewClassName="h-20 w-20"
            />
            <p className="text-xs text-muted-foreground">
              This is your personal avatar. It is visible in staff lists and
              activity logs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label
                htmlFor="fullname"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Your Full Name *
              </Label>
              <Input
                id="fullname"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Jean-Marc Kouassi"
                required
                className="rounded-md border-border focus-visible:ring-primary focus-visible:border-primary"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label
                htmlFor="personal-phone"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Personal Phone Number
              </Label>
              <PhoneInput
                id="personal-phone"
                value={personalPhone}
                onChange={(val: string | undefined) =>
                  setPersonalPhone(val || "")
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex flex-col gap-2">
              <Label
                htmlFor="staff-role"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Role in Company *
              </Label>
              <Combobox
                items={staffRoles}
                value={role}
                onValueChange={(val) => setRole((val as StaffRole) || "OWNER")}
              >
                <ComboboxInput
                  id="staff-role"
                  placeholder="Select role"
                  className="w-full text-sm"
                  value={
                    role
                      ? staffRoles.find((r) => r.value === role)?.label || ""
                      : ""
                  }
                />
                <ComboboxContent>
                  <ComboboxEmpty>No role found.</ComboboxEmpty>
                  <ComboboxList>
                    {staffRoles.map((r) => (
                      <ComboboxItem key={r.value} value={r.value}>
                        {r.label}
                      </ComboboxItem>
                    ))}
                  </ComboboxList>
                </ComboboxContent>
              </Combobox>
            </div>

            <div className="flex flex-col gap-2">
              <Label
                htmlFor="job-title"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Job Title
              </Label>
              <Input
                id="job-title"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="e.g. Operations Director"
                className="rounded-md border-border focus-visible:ring-primary focus-visible:border-primary"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label
                htmlFor="dob"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Date of Birth
              </Label>
              <DatePicker
                value={dateOfBirth}
                onChange={(date) => {
                  if (date) {
                    const yyyy = date.getFullYear();
                    const mm = String(date.getMonth() + 1).padStart(2, "0");
                    const dd = String(date.getDate()).padStart(2, "0");
                    setDateOfBirth(`${yyyy}-${mm}-${dd}`);
                  } else {
                    setDateOfBirth("");
                  }
                }}
                placeholder="Select date of birth"
                className="w-full"
              />
            </div>
          </div>

          {/* Identification Details */}
          <div className="pt-2 border-t border-border mt-4">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <IdCard className="w-4 h-4" /> Identity Verification (Optional)
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex flex-col gap-2">
                <Label
                  htmlFor="id-type"
                  className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                >
                  ID Document Type
                </Label>
                <Combobox
                  items={idTypes}
                  value={nationalIdType}
                  onValueChange={(val) => setNationalIdType(val || "")}
                >
                  <ComboboxInput
                    id="id-type"
                    placeholder="Select document type"
                    className="w-full text-sm"
                    value={
                      nationalIdType
                        ? idTypes.find((t) => t.value === nationalIdType)
                            ?.label || ""
                        : ""
                    }
                  />
                  <ComboboxContent>
                    <ComboboxEmpty>No document type found.</ComboboxEmpty>
                    <ComboboxList>
                      {idTypes.map((type) => (
                        <ComboboxItem key={type.value} value={type.value}>
                          {type.label}
                        </ComboboxItem>
                      ))}
                    </ComboboxList>
                  </ComboboxContent>
                </Combobox>
              </div>

              <div className="flex flex-col gap-2 md:col-span-2">
                <Label
                  htmlFor="id-number"
                  className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                >
                  ID Number
                </Label>
                <Input
                  id="id-number"
                  value={nationalIdNumber}
                  onChange={(e) => setNationalIdNumber(e.target.value)}
                  placeholder="Enter passport or national ID number"
                  className="rounded-md border-border focus-visible:ring-primary focus-visible:border-primary"
                />
              </div>
            </div>
          </div>

          {/* Emergency Contacts */}
          <div className="pt-2 border-t border-border mt-4">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <Contact className="w-4 h-4" /> Emergency Contact
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label
                  htmlFor="emergency-name"
                  className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                >
                  Contact Person Name
                </Label>
                <Input
                  id="emergency-name"
                  value={emergencyContactName}
                  onChange={(e) => setEmergencyContactName(e.target.value)}
                  placeholder="e.g. Marie Kouassi"
                  className="rounded-md border-border focus-visible:ring-primary focus-visible:border-primary"
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label
                  htmlFor="emergency-phone"
                  className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                >
                  Emergency Phone Number
                </Label>
                <PhoneInput
                  id="emergency-phone"
                  value={emergencyContactPhone}
                  onChange={(val: string | undefined) =>
                    setEmergencyContactPhone(val || "")
                  }
                />
              </div>
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
          disabled={isSaving || !canContinue}
          className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold rounded-md px-6 py-2"
        >
          {isSaving ? "Saving..." : "Save & Continue"}
        </Button>
      </div>
    </form>
  );
}
