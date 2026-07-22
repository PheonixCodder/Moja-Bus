import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { companyStepSchema } from "@moja/schemas";
import type { z } from "zod";

// Settings page sends a partial update — not all fields are required at once
const settingsCompanySchema = companyStepSchema.partial();
type SettingsCompanyFormValues = z.infer<typeof settingsCompanySchema>;

interface CompanyInitialData {
  name?: string | null;
  slug?: string | null;
  description?: string | null;
  website?: string | null;
  taxId?: string | null;
  registrationNumber?: string | null;
  businessType?: string | null;
  estimatedStaffSize?: number | null;
  yearEstablished?: number | null;
  email?: string | null;
  phone?: string | null;
  logoUrl?: string | null;
}

export function useProfileForm(initialData: CompanyInitialData) {
  return useForm<SettingsCompanyFormValues>({
    // TS2719: zodResolver and react-hook-form ship duplicate Resolver types in
    // this pnpm layout. Casting to the same concrete type is the correct fix.
    resolver: zodResolver(settingsCompanySchema) as Resolver<SettingsCompanyFormValues>,
    defaultValues: {
      name: initialData.name ?? "",
      slug: initialData.slug ?? "",
      description: initialData.description ?? "",
      website: initialData.website ?? "",
      taxId: initialData.taxId ?? "",
      registrationNumber: initialData.registrationNumber ?? "",
      businessType: (initialData.businessType as SettingsCompanyFormValues["businessType"]) ?? "OTHER",
      estimatedStaffSize: initialData.estimatedStaffSize ?? undefined,
      yearEstablished: initialData.yearEstablished ?? undefined,
      email: initialData.email ?? "",
      phone: initialData.phone ?? "",
      logoUrl: initialData.logoUrl ?? "",
    },
  });
}
