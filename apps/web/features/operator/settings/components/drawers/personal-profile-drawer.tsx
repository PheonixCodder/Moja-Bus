"use client";

import { ActionDrawer } from "@moja/ui/components/ui/action-drawer";
import { useCompanySettings } from "../../api/use-company-settings";
import { Button } from "@moja/ui/components/ui/button";
import { Input } from "@moja/ui/components/ui/input";
import { Field, FieldLabel, FieldError } from "@moja/ui/components/ui/field";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { toast } from "sonner";
import { UserCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { ImageUploadField } from "@/components/image-upload-field";

interface PersonalProfileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const personalProfileSchema = z.object({
  profilePhotoUrl: z.string().url().optional().or(z.literal("")),
  jobTitle: z.string().optional().nullable(),
});

export function PersonalProfileDrawer({ isOpen, onClose }: PersonalProfileDrawerProps) {
  const { data: settings } = useCompanySettings();
  
  const form = useForm({
    resolver: zodResolver(personalProfileSchema),
    defaultValues: {
      profilePhotoUrl: settings?.operator?.profilePhotoUrl || "",
      jobTitle: settings?.operator?.jobTitle || "",
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
        onClose();
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

  return (
    <ActionDrawer
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <UserCircle className="w-5 h-5" />
          Edit Personal Profile
        </div>
      }
      description="Update your personal details within the company."
      footer={
        <div className="flex gap-2 w-full">
          <Button variant="outline" className="flex-1" onClick={onClose} disabled={mutation.isPending}>
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
            <FieldLabel>Job Title</FieldLabel>
            <Input placeholder="e.g. Operations Manager" {...form.register("jobTitle")} />
          </Field>
        </div>
        <div className="space-y-4">
          <Field>
            <FieldLabel>Profile Photo</FieldLabel>
            <ImageUploadField
              purpose="operator-profile-photo"
              value={form.watch("profilePhotoUrl")}
              onUploaded={(res) => form.setValue("profilePhotoUrl", res.fileUrl, { shouldValidate: true, shouldDirty: true })}
              label="Upload Avatar"
              hint="Recommended 256x256px, JPG or PNG."
              shape="circle"
              previewClassName="h-16 w-16"
            />
          </Field>
        </div>
      </form>
    </ActionDrawer>
  );
}
