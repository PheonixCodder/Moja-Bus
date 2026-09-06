"use client";

import type { CompanyStepInput } from "@moja/schemas";
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
import { Textarea } from "@moja/ui/components/ui/textarea";
import { useQuery } from "@tanstack/react-query";
import {
  Building2,
  Calendar,
  FileText,
  Globe,
  Mail,
  Users,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { ImageUploadField } from "@/components/image-upload-field";
import { useTRPC } from "@/trpc/client";

function generateSlug(nameVal: string) {
  return nameVal
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

interface CompanyStepProps {
  initialData?: any;
  onSave: (data: CompanyStepInput) => Promise<boolean>;
  isSaving: boolean;
}

export function CompanyStep({
  initialData,
  onSave,
  isSaving,
}: CompanyStepProps) {
  const t = useTranslations("onboarding.company");
  const tRoot = useTranslations("onboarding");
  const trpc = useTRPC();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [debouncedSlug, setDebouncedSlug] = useState("");

  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [description, setDescription] = useState("");
  const [businessType, setBusinessType] = useState<any>("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [taxId, setTaxId] = useState("");
  const [yearEstablished, setYearEstablished] = useState("");
  const [estimatedStaffSize, setEstimatedStaffSize] = useState("");
  const [logoUrl, setLogoUrl] = useState("");

  const businessTypes = [
    { value: "SOLE_PROPRIETORSHIP", label: t("soleProprietorship") },
    { value: "LLC", label: t("llc") },
    { value: "CORPORATION", label: t("corporation") },
    { value: "PARTNERSHIP", label: t("partnership") },
    { value: "COOPERATIVE", label: t("cooperative") },
    { value: "OTHER", label: t("other") },
  ];

  // Pre-fill form if initialData exists
  useEffect(() => {
    if (initialData?.company) {
      const company = initialData.company;
      setName(company.name || "");
      setSlug(
        company.slug && !company.slug.startsWith("draft-")
          ? company.slug
          : generateSlug(company.name || ""),
      );
      setEmail(company.email || "");
      setPhone(company.phone || "");
      setWebsite(company.website || "");
      setDescription(company.description || "");
      setBusinessType(company.businessType || "");
      setRegistrationNumber(
        company.registrationNumber?.startsWith("DRAFT-")
          ? ""
          : company.registrationNumber || "",
      );
      setTaxId(company.taxId?.startsWith("DRAFT-") ? "" : company.taxId || "");
      setYearEstablished(
        company.yearEstablished ? String(company.yearEstablished) : "",
      );
      setEstimatedStaffSize(
        company.estimatedStaffSize ? String(company.estimatedStaffSize) : "",
      );
      setLogoUrl(company.logoUrl || "");
    }
  }, [initialData]);

  // Debounce slug for validation
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSlug(slug);
    }, 500);
    return () => clearTimeout(handler);
  }, [slug]);

  const { data: slugValidation, isLoading: isCheckingSlug } = useQuery({
    ...trpc.operator.validateSlug.queryOptions({ slug: debouncedSlug }),
    enabled:
      debouncedSlug.length > 0 && debouncedSlug !== initialData?.company?.slug,
  });

  const isSlugTaken = slugValidation?.isAvailable === false;

  const handleNameChange = (val: string) => {
    setName(val);
    setSlug(generateSlug(val));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !name ||
      !slug ||
      !email ||
      !phone ||
      !businessType ||
      !registrationNumber ||
      !taxId ||
      !estimatedStaffSize
    ) {
      return;
    }

    const payload: CompanyStepInput = {
      name,
      slug,
      email,
      phone,
      website: website || undefined,
      description: description || undefined,
      businessType,
      registrationNumber,
      taxId,
      yearEstablished: yearEstablished ? Number(yearEstablished) : null,
      estimatedStaffSize: Number(estimatedStaffSize),
      logoUrl: logoUrl || undefined,
    };

    await onSave(payload);
  };

  const canContinue =
    name &&
    slug &&
    email &&
    phone &&
    businessType &&
    registrationNumber &&
    taxId &&
    estimatedStaffSize &&
    !isSlugTaken;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <Card className="border-border rounded-md shadow-sm">
        <CardHeader className="border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 text-primary rounded">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold">{t("title")}</CardTitle>
              <CardDescription>{t("description")}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <FieldGroup className="gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field>
                <FieldLabel
                  htmlFor="company-name"
                  className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                >
                  {t("name")}
                </FieldLabel>
                <Input
                  id="company-name"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder={t("namePlaceholder")}
                  required
                  className="rounded-md border-border focus-visible:ring-primary focus-visible:border-primary"
                />
              </Field>

              <Field data-invalid={isSlugTaken ? true : undefined}>
                <FieldLabel
                  htmlFor="slug"
                  className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                >
                  {t("slug")}
                </FieldLabel>
                <Input
                  id="slug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder={t("slugPlaceholder")}
                  required
                  aria-invalid={isSlugTaken ? true : undefined}
                  className={`rounded-md focus-visible:ring-primary focus-visible:border-primary ${isSlugTaken ? "border-destructive focus-visible:border-destructive focus-visible:ring-destructive" : "border-border"}`}
                />
                {isSlugTaken ? <FieldError>{t("slugTaken")}</FieldError> : null}
              </Field>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field>
                <FieldLabel
                  htmlFor="company-email"
                  className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                >
                  {t("email")}
                </FieldLabel>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="company-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t("emailPlaceholder")}
                    required
                    className="pl-10 rounded-md border-border focus-visible:ring-primary focus-visible:border-primary"
                  />
                </div>
              </Field>

              <Field>
                <FieldLabel
                  htmlFor="company-phone"
                  className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                >
                  {t("phone")}
                </FieldLabel>
                <PhoneInput
                  id="company-phone"
                  value={phone}
                  onChange={(val: string | undefined) => setPhone(val || "")}
                  required
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field>
                <FieldLabel
                  htmlFor="business-type"
                  className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                >
                  {t("businessType")}
                </FieldLabel>
                <Combobox
                  items={businessTypes}
                  value={businessType}
                  onValueChange={(val) => setBusinessType(val || "")}
                >
                  <ComboboxInput
                    id="business-type"
                    placeholder={t("businessTypePlaceholder")}
                    className="w-full text-sm"
                    value={
                      businessType
                        ? businessTypes.find((bt) => bt.value === businessType)
                            ?.label || ""
                        : ""
                    }
                  />
                  <ComboboxContent>
                    <ComboboxEmpty>{t("noBusinessType")}</ComboboxEmpty>
                    <ComboboxList>
                      {businessTypes.map((type) => (
                        <ComboboxItem key={type.value} value={type.value}>
                          {type.label}
                        </ComboboxItem>
                      ))}
                    </ComboboxList>
                  </ComboboxContent>
                </Combobox>
              </Field>

              <Field>
                <FieldLabel
                  htmlFor="registration-number"
                  className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                >
                  {t("registrationNumber")}
                </FieldLabel>
                <div className="relative">
                  <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="registration-number"
                    value={registrationNumber}
                    onChange={(e) => setRegistrationNumber(e.target.value)}
                    placeholder={t("registrationPlaceholder")}
                    required
                    className="pl-10 rounded-md border-border focus-visible:ring-primary focus-visible:border-primary"
                  />
                </div>
              </Field>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Field>
                <FieldLabel
                  htmlFor="tax-id"
                  className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                >
                  {t("taxId")}
                </FieldLabel>
                <Input
                  id="tax-id"
                  value={taxId}
                  onChange={(e) => setTaxId(e.target.value)}
                  placeholder={t("taxIdPlaceholder")}
                  required
                  className="rounded-md border-border focus-visible:ring-primary focus-visible:border-primary"
                />
              </Field>

              <Field>
                <FieldLabel
                  htmlFor="year-established"
                  className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                >
                  {t("yearEstablished")}
                </FieldLabel>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="year-established"
                    type="number"
                    value={yearEstablished}
                    onChange={(e) => setYearEstablished(e.target.value)}
                    placeholder={t("yearPlaceholder")}
                    className="pl-10 rounded-md border-border focus-visible:ring-primary focus-visible:border-primary"
                  />
                </div>
              </Field>

              <Field>
                <FieldLabel
                  htmlFor="staff-size"
                  className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                >
                  {t("estimatedStaff")}
                </FieldLabel>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="staff-size"
                    type="number"
                    value={estimatedStaffSize}
                    onChange={(e) => setEstimatedStaffSize(e.target.value)}
                    placeholder={t("staffPlaceholder")}
                    required
                    className="pl-10 rounded-md border-border focus-visible:ring-primary focus-visible:border-primary"
                  />
                </div>
              </Field>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field>
                <FieldLabel
                  htmlFor="website"
                  className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                >
                  {t("website")}
                </FieldLabel>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="website"
                    type="url"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder={t("websitePlaceholder")}
                    className="pl-10 rounded-md border-border focus-visible:ring-primary focus-visible:border-primary"
                  />
                </div>
              </Field>

              <Field>
                <FieldLabel
                  htmlFor="logo-url"
                  className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                >
                  {t("logo")}
                </FieldLabel>
                <ImageUploadField
                  purpose="operator-logo"
                  value={logoUrl || null}
                  onUploaded={(r) => setLogoUrl(r.fileUrl)}
                  label={t("logoLabel")}
                  hint={t("logoHint")}
                  shape="square"
                  previewClassName="h-20 w-20"
                />
              </Field>
            </div>

            <Field>
              <FieldLabel
                htmlFor="description"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                {t("description")}
              </FieldLabel>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t("descriptionPlaceholder")}
                className="rounded-md border-border min-h-[100px] focus-visible:ring-primary focus-visible:border-primary"
              />
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      {/* Sticky Bottom Action Bar container placeholder */}
      <div className="flex justify-end pt-4">
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
