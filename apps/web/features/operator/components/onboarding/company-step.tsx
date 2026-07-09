"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { Button } from "@moja/ui/components/ui/button";
import { Input } from "@moja/ui/components/ui/input";
import { Label } from "@moja/ui/components/ui/label";
import { Textarea } from "@moja/ui/components/ui/textarea";
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
import {
  Building2,
  Mail,
  Globe,
  FileText,
  Users,
  Calendar,
} from "lucide-react";
import { type CompanyStepInput } from "@moja/schemas";

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
    { value: "SOLE_PROPRIETORSHIP", label: "Sole Proprietorship" },
    { value: "LLC", label: "LLC (Limited Liability Company)" },
    { value: "CORPORATION", label: "Corporation" },
    { value: "PARTNERSHIP", label: "Partnership" },
    { value: "COOPERATIVE", label: "Cooperative" },
    { value: "OTHER", label: "Other" },
  ];

  // Pre-fill form if initialData exists
  useEffect(() => {
    if (initialData?.company) {
      const company = initialData.company;
      setName(company.name || "");
      setSlug(company.slug || "");
      setEmail(company.email || "");
      setPhone(company.phone || "");
      setWebsite(company.website || "");
      setDescription(company.description || "");
      setBusinessType(company.businessType || "");
      setRegistrationNumber(company.registrationNumber || "");
      setTaxId(company.taxId || "");
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
    enabled: debouncedSlug.length > 0 && debouncedSlug !== initialData?.company?.slug,
  });

  const isSlugTaken = slugValidation?.isAvailable === false;

  // Automatically generate slug
  const generateSlug = (nameVal: string) => {
    return nameVal
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

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
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card className="border-border rounded-md shadow-sm">
        <CardHeader className="border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 text-primary rounded">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold">
                Company Profile
              </CardTitle>
              <CardDescription>
                Provide official information about your transportation company.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label
                htmlFor="company-name"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Company Name *
              </Label>
              <Input
                id="company-name"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. UTB Transport"
                required
                className="rounded-md border-border focus-visible:ring-primary focus-visible:border-primary"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label
                htmlFor="slug"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Slug / Web Identifier *
              </Label>
              <Input
                id="slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="e.g. utb-transport"
                required
                className={`rounded-md focus-visible:ring-primary focus-visible:border-primary ${isSlugTaken ? 'border-destructive focus-visible:border-destructive focus-visible:ring-destructive' : 'border-border'}`}
              />
              {isSlugTaken && (
                <p className="text-xs text-destructive mt-1 font-semibold">
                  This slug is already taken. Please choose another.
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label
                htmlFor="company-email"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Company Email *
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="company-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contact@company.com"
                  required
                  className="pl-10 rounded-md border-border focus-visible:ring-primary focus-visible:border-primary"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label
                htmlFor="company-phone"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Company Phone *
              </Label>
              <PhoneInput
                id="company-phone"
                value={phone}
                onChange={(val: string | undefined) => setPhone(val || "")}
                placeholder="Enter phone number"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label
                htmlFor="business-type"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Business Type *
              </Label>
              <Combobox
                items={businessTypes}
                value={businessType}
                onValueChange={(val) => setBusinessType(val || "")}
              >
                <ComboboxInput
                  id="business-type"
                  placeholder="Select Business Type"
                  className="w-full text-sm"
                  value={
                    businessType
                      ? businessTypes.find((t) => t.value === businessType)
                          ?.label || ""
                      : ""
                  }
                />
                <ComboboxContent>
                  <ComboboxEmpty>No business type found.</ComboboxEmpty>
                  <ComboboxList>
                    {businessTypes.map((type) => (
                      <ComboboxItem key={type.value} value={type.value}>
                        {type.label}
                      </ComboboxItem>
                    ))}
                  </ComboboxList>
                </ComboboxContent>
              </Combobox>
            </div>

            <div className="flex flex-col gap-2">
              <Label
                htmlFor="registration-number"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Business Registration Number *
              </Label>
              <div className="relative">
                <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="registration-number"
                  value={registrationNumber}
                  onChange={(e) => setRegistrationNumber(e.target.value)}
                  placeholder="e.g. CI-ABJ-2026-B-1234"
                  required
                  className="pl-10 rounded-md border-border focus-visible:ring-primary focus-visible:border-primary"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex flex-col gap-2">
              <Label
                htmlFor="tax-id"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Tax ID / NUI *
              </Label>
              <Input
                id="tax-id"
                value={taxId}
                onChange={(e) => setTaxId(e.target.value)}
                placeholder="e.g. 1234567 A"
                required
                className="rounded-md border-border focus-visible:ring-primary focus-visible:border-primary"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label
                htmlFor="year-established"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Year Established
              </Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="year-established"
                  type="number"
                  value={yearEstablished}
                  onChange={(e) => setYearEstablished(e.target.value)}
                  placeholder="e.g. 2018"
                  className="pl-10 rounded-md border-border focus-visible:ring-primary focus-visible:border-primary"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label
                htmlFor="staff-size"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Estimated Staff Size *
              </Label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="staff-size"
                  type="number"
                  value={estimatedStaffSize}
                  onChange={(e) => setEstimatedStaffSize(e.target.value)}
                  placeholder="e.g. 15"
                  required
                  className="pl-10 rounded-md border-border focus-visible:ring-primary focus-visible:border-primary"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label
                htmlFor="website"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Website URL
              </Label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="website"
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://company.com"
                  className="pl-10 rounded-md border-border focus-visible:ring-primary focus-visible:border-primary"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label
                htmlFor="logo-url"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Company Logo URL
              </Label>
              <Input
                id="logo-url"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://image-bucket.com/logo.png"
                className="rounded-md border-border focus-visible:ring-primary focus-visible:border-primary"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label
              htmlFor="description"
              className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              Company Description
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell passengers and admins about your fleet and services..."
              className="rounded-md border-border min-h-[100px] focus-visible:ring-primary focus-visible:border-primary"
            />
          </div>
        </CardContent>
      </Card>

      {/* Sticky Bottom Action Bar container placeholder */}
      <div className="flex justify-end pt-4">
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
