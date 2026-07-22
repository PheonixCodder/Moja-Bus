import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { companyStepSchema } from "@moja/schemas";
import type { z } from "zod";

type ProfileFormValues = z.infer<typeof companyStepSchema>;

export function useProfileForm(initialData: any) {
  return useForm<ProfileFormValues>({
    resolver: zodResolver(companyStepSchema) as any,
    defaultValues: {
      name: initialData.name || "",
      description: initialData.description || "",
      website: initialData.website || "",
      taxId: initialData.taxId || "",
      registrationNumber: initialData.registrationNumber || "",
      businessType: initialData.businessType || "OTHER",
      estimatedStaffSize: initialData.estimatedStaffSize || "1-10",
      yearEstablished: initialData.yearEstablished || new Date().getFullYear(),
      email: initialData.email || "",
      phone: initialData.phone || "",
      logoUrl: initialData.logoUrl || "",
    },
  });
}
