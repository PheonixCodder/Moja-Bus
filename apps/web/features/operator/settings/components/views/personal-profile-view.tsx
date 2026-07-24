"use client";

import { useCompanySettings } from "../../api/use-company-settings";
import { Button } from "@moja/ui/components/ui/button";
import { Input } from "@moja/ui/components/ui/input";
import { Field, FieldLabel, FieldError } from "@moja/ui/components/ui/field";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { toast } from "sonner";
import { UserCircle, Save } from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import { PhoneInput } from "@moja/ui/components/ui/phone-input";
import { zodResolver } from "@hookform/resolvers/zod";
import { profileStepSchema } from "@moja/schemas";
import { ImageUploadField } from "@/components/image-upload-field";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@moja/ui/components/ui/card";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@moja/ui/components/ui/select";

export function PersonalProfileView() {
  const { data: settings } = useCompanySettings();
  
  const form = useForm({
    resolver: zodResolver(profileStepSchema.partial()),
    defaultValues: {
      profilePhotoUrl: settings?.operator?.profilePhotoUrl || "",
      jobTitle: settings?.operator?.jobTitle || "",
      personalPhone: settings?.operator?.personalPhone || "",
      nationalIdNumber: settings?.operator?.nationalIdNumber || "",
      nationalIdType: settings?.operator?.nationalIdType || "PASSPORT",
      emergencyContactName: settings?.operator?.emergencyContactName || "",
      emergencyContactPhone: settings?.operator?.emergencyContactPhone || "",
    },
  });
  
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const mutation = useMutation(
    trpc.operator.updateProfile.mutationOptions({
      onMutate: async (variables) => {
        toast.loading("Saving personal profile...", { id: "save-personal-profile" });
        const queryKey = trpc.operator.getSettings.queryKey();
        await queryClient.cancelQueries({ queryKey });

        const previousSettings = queryClient.getQueryData(queryKey);

        queryClient.setQueryData(queryKey, (old: any) => {
          if (!old || !old.operator) return old;
          return {
            ...old,
            operator: {
              ...old.operator,
              ...variables
            }
          };
        });

        return { previousSettings };
      },
      onSuccess: () => {
        toast.success("Profile saved successfully", { id: "save-personal-profile" });
        form.reset(form.getValues());
      },
      onError: (err, variables, context) => {
        toast.error(err.message || "Failed to save profile", { id: "save-personal-profile" });
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

  if (!settings) return null;

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h3 className="text-lg font-medium">Personal Profile</h3>
        <p className="text-sm text-muted-foreground">
          Update your personal details. This information is required for KYC compliance.
        </p>
      </div>

      <form onSubmit={onSubmit}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <UserCircle className="w-5 h-5 text-muted-foreground" />
              Your Identity
            </CardTitle>
            <CardDescription>
              Basic contact and identification details.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <Field>
                <FieldLabel>Profile Photo</FieldLabel>
                <ImageUploadField
                  purpose="operator-profile-photo"
                  value={form.watch("profilePhotoUrl") || ""}
                  onUploaded={(res) => form.setValue("profilePhotoUrl", res.fileUrl, { shouldValidate: true, shouldDirty: true })}
                  label="Upload Avatar"
                  hint="Recommended 256x256px, JPG or PNG."
                  shape="circle"
                  previewClassName="h-16 w-16"
                />
              </Field>

              <Field>
                <FieldLabel>Job Title</FieldLabel>
                <Input placeholder="e.g. Operations Manager" {...form.register("jobTitle")} />
                <FieldError errors={[form.formState.errors.jobTitle]} />
              </Field>

              <Field>
                <FieldLabel>Personal Phone</FieldLabel>
                <Controller
                  name="personalPhone"
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
                <FieldError errors={[form.formState.errors.personalPhone]} />
              </Field>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field>
                  <FieldLabel>ID Type</FieldLabel>
                  <select
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    {...form.register("nationalIdType")}
                  >
                    <option value="PASSPORT">Passport</option>
                    <option value="NATIONAL_ID">National ID</option>
                    <option value="DRIVERS_LICENSE">Driver's License</option>
                  </select>
                  <FieldError errors={[form.formState.errors.nationalIdType]} />
                </Field>
                
                <Field>
                  <FieldLabel>ID Number</FieldLabel>
                  <Input placeholder="Document Number" {...form.register("nationalIdNumber")} />
                  <FieldError errors={[form.formState.errors.nationalIdNumber]} />
                </Field>
              </div>

              <Field>
                <FieldLabel>Emergency Contact Name</FieldLabel>
                <Input placeholder="Full Name" {...form.register("emergencyContactName")} />
                <FieldError errors={[form.formState.errors.emergencyContactName]} />
              </Field>

              <Field>
                <FieldLabel>Emergency Contact Phone</FieldLabel>
                <Controller
                  name="emergencyContactPhone"
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
                <FieldError errors={[form.formState.errors.emergencyContactPhone]} />
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
