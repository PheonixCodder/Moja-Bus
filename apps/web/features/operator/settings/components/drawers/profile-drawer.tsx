"use client";

import { ActionDrawer } from "@moja/ui/components/ui/action-drawer";
import { useProfileForm } from "../../hooks/use-profile-form";
import { useCompanySettings } from "../../api/use-company-settings";
import { Button } from "@moja/ui/components/ui/button";
import { Input } from "@moja/ui/components/ui/input";
import { Textarea } from "@moja/ui/components/ui/textarea";
import { Field, FieldLabel, FieldError } from "@moja/ui/components/ui/field";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { toast } from "sonner";
import { Building2, UploadCloud, AlertTriangle } from "lucide-react";
import { ImageUploadField } from "@/components/image-upload-field";
import { useState } from "react";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@moja/ui/components/ui/alert-dialog";

interface ProfileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProfileDrawer({ isOpen, onClose }: ProfileDrawerProps) {
  const { data: settings } = useCompanySettings();
  const form = useProfileForm(settings?.company || {});
  
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [showDiscardWarning, setShowDiscardWarning] = useState(false);

  const mutation = useMutation(
    trpc.operator.updateCompany.mutationOptions({
      onMutate: async (variables) => {
        toast.loading("Saving profile...", { id: "save-profile" });
        const queryKey = trpc.operator.getSettings.queryKey();
        await queryClient.cancelQueries({ queryKey });

        const previousSettings = queryClient.getQueryData(queryKey);

        queryClient.setQueryData(queryKey, (old: any) => {
          if (!old || !old.company) return old;
          return {
            ...old,
            company: {
              ...old.company,
              ...variables
            }
          };
        });

        return { previousSettings };
      },
      onSuccess: () => {
        toast.success("Profile saved successfully", { id: "save-profile" });
        onClose();
      },
      onError: (err, variables, context) => {
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

  const handleClose = () => {
    if (form.formState.isDirty) {
      setShowDiscardWarning(true);
    } else {
      onClose();
    }
  };

  const confirmDiscard = () => {
    setShowDiscardWarning(false);
    form.reset();
    onClose();
  };

  return (
    <>
      <ActionDrawer
        isOpen={isOpen}
        onClose={handleClose}
      title={
        <div className="flex items-center gap-2">
          <Building2 className="w-5 h-5" />
          Edit Company Profile
        </div>
      }
      description="Update your business details. This information is visible on invoices and digital tickets."
      footer={
        <div className="flex gap-2 w-full">
          <Button variant="outline" className="flex-1" onClick={handleClose} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button className="flex-1" onClick={onSubmit} disabled={mutation.isPending}>
            {mutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      }
    >
      <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
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
            <Input type="tel" placeholder="+225 00000000" {...form.register("phone")} />
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
          <div className="grid grid-cols-2 gap-4">
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

          <Field>
            <FieldLabel>Year Established</FieldLabel>
            <Input type="number" placeholder="YYYY" {...form.register("yearEstablished", { valueAsNumber: true })} />
            <FieldError errors={[form.formState.errors.yearEstablished]} />
          </Field>

          <Field>
            <FieldLabel>Estimated Staff Size</FieldLabel>
            <Input type="number" placeholder="Number of employees" {...form.register("estimatedStaffSize", { valueAsNumber: true })} />
            <FieldError errors={[form.formState.errors.estimatedStaffSize]} />
          </Field>

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
      </form>
    </ActionDrawer>

      <AlertDialog open={showDiscardWarning} onOpenChange={setShowDiscardWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-amber-100 mb-4">
              <AlertTriangle className="size-6 text-amber-600" />
            </div>
            <AlertDialogTitle>Discard unsaved changes?</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes in your company profile. Are you sure you want to discard them?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep editing</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={confirmDiscard}>
              Yes, discard changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
