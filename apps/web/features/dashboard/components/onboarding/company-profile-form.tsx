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
import { Textarea } from "@moja/ui/components/ui/textarea";
import { PhoneInput } from "@moja/ui/components/ui/phone-input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@moja/ui/components/ui/card";
import { Building2, Mail, Phone, Globe, FileText, Users, Calendar, Image as ImageIcon } from "lucide-react";

export function CompanyProfileForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  
  // Form state
  const [companyName, setCompanyName] = useState("");
  const [slug, setSlug] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [description, setDescription] = useState("");
  const [businessType, setBusinessType] = useState("");
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

  const staffSizes = [
    { value: "1-5", label: "1-5 employees" },
    { value: "6-20", label: "6-20 employees" },
    { value: "21-50", label: "21-50 employees" },
    { value: "51-100", label: "51-100 employees" },
    { value: "100+", label: "100+ employees" },
  ];

  // Generate slug from company name
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  const handleNameChange = (value: string) => {
    setCompanyName(value);
    if (!slug) {
      setSlug(generateSlug(value));
    }
  };

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setIsLoading(true);
    
    try {
      // TODO: Save company profile data
      // This will call your API to create/update the company record
      console.log("Company profile data:", {
        companyName,
        slug,
        email,
        phone,
        website,
        description,
        businessType,
        registrationNumber,
        taxId,
        yearEstablished,
        estimatedStaffSize,
        logoUrl,
      });
      
      toast.success("Company profile saved!");
      router.push("/dashboard/operator/onboarding/locations");
    } catch (error) {
      toast.error("Failed to save company profile. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  const canSubmit = companyName && email && phone && businessType && registrationNumber;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Company Identity Card */}
      <Card className="border-amber-100 bg-amber-50/50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500 rounded-lg">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">Company Identity</CardTitle>
              <CardDescription>
                Basic information about your transport business
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="companyName" className="flex items-center gap-2">
                <span>Company Name</span>
                <span className="text-destructive">*</span>
              </Label>
              <Input
                id="companyName"
                value={companyName}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g., Moja Transport Ltd"
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug" className="flex items-center gap-2">
                <span>Website URL</span>
                <span className="text-muted-foreground text-xs">mojaride.com/</span>
              </Label>
              <div className="flex gap-2">
                <span className="px-3 py-2 bg-slate-100 rounded-md text-slate-500 text-sm">
                  mojaride.com/
                </span>
                <Input
                  id="slug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="your-company"
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                <span>Company Email</span>
                <span className="text-destructive">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="business@company.com"
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                <span>Phone Number</span>
                <span className="text-destructive">*</span>
              </Label>
              <PhoneInput
                id="phone"
                value={phone}
                onChange={(value) => setPhone(value ?? "")}
                placeholder="+225 XX XX XX XX"
                country="CI"
                defaultCountry="CI"
                international={false}
                required
                disabled={isLoading}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="website" className="flex items-center gap-2">
              <Globe className="w-4 h-4" />
              <span>Website URL</span>
            </Label>
            <Input
              id="website"
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://yourcompany.com"
              disabled={isLoading}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              <span>About Your Company</span>
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell passengers about your transport business, routes, and services..."
              rows={3}
              disabled={isLoading}
            />
          </div>
        </CardContent>
      </Card>

      {/* Business Details Card */}
      <Card className="border-slate-200">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-100 rounded-lg">
              <FileText className="w-5 h-5 text-slate-600" />
            </div>
            <div>
              <CardTitle className="text-lg">Business Details</CardTitle>
              <CardDescription>
                Legal and operational information
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="businessType" className="flex items-center gap-2">
                <span>Business Type</span>
                <span className="text-destructive">*</span>
              </Label>
              <Select
                value={businessType}
                onValueChange={(value) => setBusinessType(value || "")}
                disabled={isLoading}
                required
              >
                <SelectTrigger id="businessType">
                  <SelectValue placeholder="Select business type" />
                </SelectTrigger>
                <SelectContent>
                  {businessTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="registrationNumber" className="flex items-center gap-2">
                <span>Registration Number</span>
                <span className="text-destructive">*</span>
              </Label>
              <Input
                id="registrationNumber"
                value={registrationNumber}
                onChange={(e) => setRegistrationNumber(e.target.value)}
                placeholder="CC-2024-000123"
                required
                disabled={isLoading}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="taxId">Tax Identification Number</Label>
              <Input
                id="taxId"
                value={taxId}
                onChange={(e) => setTaxId(e.target.value)}
                placeholder="TIN-123456789"
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="yearEstablished" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>Year Established</span>
              </Label>
              <Select
                value={yearEstablished}
                onValueChange={(value) => setYearEstablished(value || "")}
                disabled={isLoading}
              >
                <SelectTrigger id="yearEstablished">
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 50 }, (_, i) => {
                    const year = new Date().getFullYear() - i;
                    return (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    );
                  })
                  }
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="estimatedStaffSize" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span>Team Size</span>
            </Label>
            <Select
              value={estimatedStaffSize}
              onValueChange={(value) => setEstimatedStaffSize(value || "")}
              disabled={isLoading}
            >
              <SelectTrigger id="estimatedStaffSize">
                <SelectValue placeholder="Select team size" />
              </SelectTrigger>
              <SelectContent>
                {staffSizes.map((size) => (
                  <SelectItem key={size.value} value={size.value}>
                    {size.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="logoUrl" className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4" />
              <span>Company Logo URL</span>
            </Label>
            <Input
              id="logoUrl"
              type="url"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="https://example.com/logo.png"
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              Provide a URL to your company logo image (200x200px recommended)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Submit */}
      <div className="flex justify-end">
        <Button
          type="submit"
          size="lg"
          className="bg-amber-600 hover:bg-amber-700 text-white min-w-48"
          disabled={isLoading || !canSubmit}
        >
          {isLoading ? "Saving..." : "Continue to Locations"}
        </Button>
      </div>
    </form>
  );
}
