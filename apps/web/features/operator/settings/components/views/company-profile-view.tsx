"use client";

import { useProfileForm } from "../../hooks/use-profile-form";
import { useCompanySettings } from "../../api/use-company-settings";
import { Controller } from "react-hook-form";
import { Button } from "@moja/ui/components/ui/button";
import { Input } from "@moja/ui/components/ui/input";
import { PhoneInput } from "@moja/ui/components/ui/phone-input";
import { Textarea } from "@moja/ui/components/ui/textarea";
import { Field, FieldLabel, FieldError } from "@moja/ui/components/ui/field";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { toast } from "sonner";
import { Building2, Save } from "lucide-react";
import { ImageUploadField } from "@/components/image-upload-field";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@moja/ui/components/ui/card";

export function CompanyProfileView() {
  const { data: settings } = useCompanySettings();
  const form = useProfileForm(settings?.company || {});
  
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const mutation = useMutation(
    trpc.operator.updateCompany.mutationOptions({
      onMutate: async (variables) => {
        toast.loading("Saving profile...", { id: "save-profile" });
        const queryKey = trpc.operator.getSettings.queryKey();
        await queryClient.cancelQueries({ queryKey });

        const previousSettings = queryClient.getQueryData(queryKey);

        queryClient.setQueryData(queryKey, (old) => {
          if (!old || !old.company) return old;
          // Strip undefined values — partial input has `field | undefined` but
          // the cached type only permits `field | null`. Undefined keys must be
          // excluded so the cache shape stays compatible.
          const definedUpdates = Object.fromEntries(
            Object.entries(variables).filter(([, v]) => v !== undefined),
          ) as Partial<typeof old.company>;
          return {
            ...old,
            company: { ...old.company, ...definedUpdates },
          };
        });

        return { previousSettings };
      },
      onSuccess: () => {
        toast.success("Profile saved successfully", { id: "save-profile" });
        form.reset(form.getValues());
      },
      onError: (err, _variables, context) => {
        toast.error(err.message || "Failed to save profile", { id: "save-profile" });
        if (context?.previousSettings) {
          queryClient.setQueryData(trpc.operator.getSettings.queryKey(), context.previousSettings);
        }
      },
      onSettled: () => {
        queryClient.invalidateQueries(trpc.operator.getSettings.queryFilter());
      }
    })
  );

  const onSubmit = form.handleSubmit((data) => {
    mutation.mutate(data);
  });

  if (!settings) return null; // Let the skeleton in layout handle loading

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h3 className="text-lg font-medium">Company Profile</h3>
        <p className="text-sm text-muted-foreground">
          Update your business details. This information is visible on invoices and digital tickets.
        </p>
      </div>

      <form onSubmit={onSubmit}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="w-5 h-5 text-muted-foreground" />
              General Information
            </CardTitle>
            <CardDescription>
              Basic contact and identification details.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <Field>
                <FieldLabel>Company Name</FieldLabel>
                <Input placeholder="Enter registered business name" {...form.register("name")} />
                <FieldError errors={[form.formState.errors.name]} />
              </Field>

              <Field>
                <FieldLabel>Support Email</FieldLabel>
                <Input type="email" placeholder="support@company.com" {...form.register("email")} />
                <FieldError errors={[form.formState.errors.email]} />
              </Field>

              <Field>
                <FieldLabel>Contact Phone</FieldLabel>
                <Controller
                  name="phone"
                  control={form.control}
                  render={({ field }) => (
                    <PhoneInput
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      disabled={field.disabled ?? false}
                    />
                  )}
                />
                <FieldError errors={[form.formState.errors.phone]} />
              </Field>

              <Field>
                <FieldLabel>Company Logo</FieldLabel>
                <ImageUploadField
                  purpose="operator-logo"
                  value={form.watch("logoUrl") ?? null}
                  onUploaded={(res) => form.setValue("logoUrl", res.fileUrl, { shouldValidate: true, shouldDirty: true })}
                  label="Upload Logo"
                  hint="Recommended 512x512px, JPG or PNG."
                  shape="square"
                  previewClassName="h-16 w-16 rounded-xl"
                />
                <FieldError errors={[form.formState.errors.logoUrl]} />
              </Field>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field>
                  <FieldLabel>Tax ID (NIF)</FieldLabel>
                  <Input placeholder="Tax ID" {...form.register("taxId")} />
                  <FieldError errors={[form.formState.errors.taxId]} />
                </Field>
                
                <Field>
                  <FieldLabel>Reg. Number (RCCM)</FieldLabel>
                  <Input placeholder="Registration #" {...form.register("registrationNumber")} />
                  <FieldError errors={[form.formState.errors.registrationNumber]} />
                </Field>
              </div>

              <Field>
                <FieldLabel>Business Type</FieldLabel>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  {...form.register("businessType")}
                >
                  <option value="SOLE_PROPRIETORSHIP">Sole Proprietorship</option>
                  <option value="LLC">LLC</option>
                  <option value="CORPORATION">Corporation</option>
                  <option value="PARTNERSHIP">Partnership</option>
                  <option value="COOPERATIVE">Cooperative</option>
                  <option value="OTHER">Other</option>
                </select>
                <FieldError errors={[form.formState.errors.businessType]} />
              </Field>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field>
                  <FieldLabel>Year Established</FieldLabel>
                  <Input type="number" placeholder="YYYY" {...form.register("yearEstablished", { valueAsNumber: true })} />
                  <FieldError errors={[form.formState.errors.yearEstablished]} />
                </Field>

                <Field>
                  <FieldLabel>Staff Size</FieldLabel>
                  <Input type="number" placeholder="Count" {...form.register("estimatedStaffSize", { valueAsNumber: true })} />
                  <FieldError errors={[form.formState.errors.estimatedStaffSize]} />
                </Field>
              </div>

              <Field>
                <FieldLabel>Website URL</FieldLabel>
                <Input type="url" placeholder="https://example.com" {...form.register("website")} />
                <FieldError errors={[form.formState.errors.website]} />
              </Field>

              <Field>
                <FieldLabel>Business Description</FieldLabel>
                <Textarea 
                  placeholder="Tell us about your transport business..." 
                  className="resize-none" 
                  rows={4}
                  {...form.register("description")} 
                />
                <FieldError errors={[form.formState.errors.description]} />
              </Field>
            </div>
          </CardContent>
          <CardFooter className="border-t border-border bg-muted/20 px-6 py-4 flex justify-end">
            <Button 
              type="submit" 
              disabled={!form.formState.isDirty || mutation.isPending}
              className="w-full sm:w-auto"
            >
              <Save className="w-4 h-4 mr-2" />
              {mutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
