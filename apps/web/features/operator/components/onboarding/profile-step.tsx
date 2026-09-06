"use client";

import type { ProfileStepInput, StaffRole } from "@moja/schemas";
import { Button } from "@moja/ui/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@moja/ui/components/ui/card";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@moja/ui/components/ui/combobox";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@moja/ui/components/ui/field";
import { Input } from "@moja/ui/components/ui/input";
import { PhoneInput } from "@moja/ui/components/ui/phone-input";
import { IdCard, User } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { ImageUploadField } from "@/components/image-upload-field";

function formatDisplayDob(iso: string) {
  if (!iso) return "";
  const parts = iso.split("-");
  if (parts.length !== 3) return iso;
  return `${parts[1]}/${parts[2]}/${parts[0]}`;
}

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
  const t = useTranslations("onboarding.profile");
  const tRoot = useTranslations("onboarding");
  const [fullName, setFullName] = useState("");
  const [personalPhone, setPersonalPhone] = useState("");
  const role: StaffRole = "OWNER";
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [dobInput, setDobInput] = useState("");
  const [dobError, setDobError] = useState("");
  const [nationalIdNumber, setNationalIdNumber] = useState("");
  const [nationalIdType, setNationalIdType] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [profilePhotoUrl, setProfilePhotoUrl] = useState("");

  const idTypes = [
    { value: "passport", label: t("passport") },
    { value: "national_id", label: t("nationalIdCard") },
    { value: "driver_license", label: t("driversLicense") },
  ];

  // Pre-fill form if initialData exists
  useEffect(() => {
    if (initialData?.operator) {
      const op = initialData.operator;
      setFullName(initialData.user?.fullName || op.user?.fullName || "");
      setPersonalPhone(op.personalPhone || "");
      const dobIso = op.dateOfBirth ? op.dateOfBirth.split("T")[0] : "";
      setDateOfBirth(dobIso);
      setDobInput(dobIso ? formatDisplayDob(dobIso) : "");
      setNationalIdNumber(op.nationalIdNumber || "");
      setNationalIdType(op.nationalIdType || "");
      setJobTitle(op.jobTitle || "");
      setProfilePhotoUrl(op.profilePhotoUrl || "");
    } else if (initialData?.user) {
      // Fallback to logged-in user profile full name
      setFullName(initialData.user.fullName || "");
    }
  }, [initialData]);

  // Parse MM/DD/YYYY input to ISO YYYY-MM-DD with validation
  const parseDobInput = (value: string): string => {
    const cleaned = value.replace(/[^\d/]/g, "");
    const parts = cleaned.split("/");
    if (parts.length !== 3) return "";

    const month = parseInt(parts[0] ?? "", 10);
    const day = parseInt(parts[1] ?? "", 10);
    const year = parseInt(parts[2] ?? "", 10);

    if (Number.isNaN(month) || Number.isNaN(day) || Number.isNaN(year))
      return "";
    if (
      month < 1 ||
      month > 12 ||
      day < 1 ||
      day > 31 ||
      year < 1900 ||
      year > 2100
    ) {
      return "";
    }

    // Basic day-of-month validation
    const daysInMonth = [
      31,
      year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0) ? 29 : 28,
      31,
      30,
      31,
      30,
      31,
      31,
      30,
      31,
      30,
      31,
    ];
    if (day > (daysInMonth[month - 1] ?? 31)) return "";

    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !role || !dateOfBirth) {
      return;
    }

    const payload: ProfileStepInput = {
      fullName,
      personalPhone: personalPhone || undefined,
      role,
      dateOfBirth,
      nationalIdNumber: nationalIdNumber || undefined,
      nationalIdType: nationalIdType || undefined,
      jobTitle: jobTitle || undefined,
      profilePhotoUrl: profilePhotoUrl || undefined,
    };

    await onSave(payload);
  };

  const canContinue = fullName && role && dateOfBirth;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <Card className="border-border rounded-md shadow-sm">
        <CardHeader className="border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 text-primary rounded">
              <User className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold">{t("title")}</CardTitle>
              <CardDescription>{t("description")}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <FieldGroup className="gap-4">
            <div className="flex items-center gap-4">
              <ImageUploadField
                purpose="operator-profile-photo"
                value={profilePhotoUrl || null}
                onUploaded={(r) => setProfilePhotoUrl(r.fileUrl)}
                label={t("uploadPhoto")}
                hint={t("photoHint")}
                shape="circle"
                previewClassName="h-20 w-20"
              />
              <p className="text-xs text-muted-foreground">{t("photoDesc")}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field>
                <FieldLabel
                  htmlFor="fullname"
                  className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                >
                  {t("fullName")}
                </FieldLabel>
                <Input
                  id="fullname"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={t("fullNamePlaceholder")}
                  required
                  className="rounded-md border-border focus-visible:ring-primary focus-visible:border-primary"
                />
              </Field>

              <Field>
                <FieldLabel
                  htmlFor="personal-phone"
                  className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                >
                  {t("phone")}
                </FieldLabel>
                <PhoneInput
                  id="personal-phone"
                  value={personalPhone}
                  onChange={(val: string | undefined) =>
                    setPersonalPhone(val || "")
                  }
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field>
                <FieldLabel
                  htmlFor="job-title"
                  className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                >
                  {t("jobTitle")}
                </FieldLabel>
                <Input
                  id="job-title"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder={t("jobTitlePlaceholder")}
                  className="rounded-md border-border focus-visible:ring-primary focus-visible:border-primary"
                />
              </Field>

              <Field data-invalid={dobError ? true : undefined}>
                <FieldLabel
                  htmlFor="dob"
                  className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                >
                  {t("dateOfBirth")}
                </FieldLabel>
                <Input
                  id="dob"
                  value={dobInput}
                  onChange={(e) => {
                    const raw = e.target.value;
                    setDobInput(raw);
                    setDateOfBirth(parseDobInput(raw));
                    setDobError("");
                  }}
                  onBlur={() => {
                    if (dobInput && !dateOfBirth) {
                      setDobError(t("dateOfBirthInvalid"));
                    }
                  }}
                  placeholder={t("dateOfBirthPlaceholder")}
                  required
                  aria-invalid={dobError ? true : undefined}
                  className={`rounded-md border-border focus-visible:ring-primary focus-visible:border-primary ${dobError ? "border-destructive text-destructive" : ""}`}
                />
                {dobError ? <FieldError>{dobError}</FieldError> : null}
              </Field>
            </div>

            {/* Identification Details */}
            <div className="pt-2 border-t border-border mt-4">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-1.5">
                <IdCard className="w-4 h-4" /> {t("identityVerification")}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Field>
                  <FieldLabel
                    htmlFor="id-type"
                    className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                  >
                    {t("idDocumentType")}
                  </FieldLabel>
                  <Combobox
                    items={idTypes}
                    value={nationalIdType}
                    onValueChange={(val) => setNationalIdType(val || "")}
                  >
                    <ComboboxInput
                      id="id-type"
                      placeholder={t("idDocumentPlaceholder")}
                      className="w-full text-sm"
                      value={
                        nationalIdType
                          ? idTypes.find((t) => t.value === nationalIdType)
                              ?.label || ""
                          : ""
                      }
                    />
                    <ComboboxContent>
                      <ComboboxEmpty>{t("noDocumentType")}</ComboboxEmpty>
                      <ComboboxList>
                        {idTypes.map((type) => (
                          <ComboboxItem key={type.value} value={type.value}>
                            {type.label}
                          </ComboboxItem>
                        ))}
                      </ComboboxList>
                    </ComboboxContent>
                  </Combobox>
                </Field>

                <Field className="md:col-span-2">
                  <FieldLabel
                    htmlFor="id-number"
                    className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                  >
                    {t("idNumber")}
                  </FieldLabel>
                  <Input
                    id="id-number"
                    value={nationalIdNumber}
                    onChange={(e) => setNationalIdNumber(e.target.value)}
                    placeholder={t("idNumberPlaceholder")}
                    className="rounded-md border-border focus-visible:ring-primary focus-visible:border-primary"
                  />
                </Field>
              </div>
            </div>
          </FieldGroup>
        </CardContent>
      </Card>

      {/* Sticky Bottom Action Bar container placeholder */}
      <div className="flex justify-between pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          disabled={isSaving}
          className="border-border hover:bg-muted rounded-md px-6 py-2"
        >
          {tRoot("back")}
        </Button>
        <Button
          type="submit"
          disabled={isSaving || !canContinue}
          className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold rounded-md px-6 py-2"
        >
          {isSaving ? tRoot("saving") : tRoot("saveAndContinue")}
        </Button>
      </div>
    </form>
  );
}
