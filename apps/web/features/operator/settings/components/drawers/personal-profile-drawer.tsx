"use client";

import { useTranslations } from "next-intl";
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
  const t = useTranslations("operatorDashboard.settings.personal");
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
        toast.loading(t("toastSaving"), { id: "save-personal-profile" });
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
        toast.success(t("toastSaved"), { id: "save-personal-profile" });
        onClose();
      },
      onError: (err, variables, context) => {
        toast.error(err.message || t("toastFailed"), { id: "save-personal-profile" });
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
          {t("editPersonalProfile")}
        </div>
      }
      description={t("personalDrawerDesc")}
      footer={
        <div className="flex gap-2 w-full">
          <Button variant="outline" className="flex-1" onClick={onClose} disabled={mutation.isPending}>
            {t("cancel")}
          </Button>
          <Button className="flex-1" onClick={onSubmit} disabled={mutation.isPending}>
            {mutation.isPending ? t("saving") : t("saveChanges")}
          </Button>
        </div>
      }
    >
      <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
        <div className="space-y-4">
          <Field>
            <FieldLabel>{t("jobTitle")}</FieldLabel>
            <Input placeholder={t("jobTitlePlaceholder")} {...form.register("jobTitle")} />
          </Field>
        </div>
        <div className="space-y-4">
          <Field>
            <FieldLabel>{t("photo")}</FieldLabel>
            <ImageUploadField
              purpose="operator-profile-photo"
              value={form.watch("profilePhotoUrl") ?? null}
              onUploaded={(res) => form.setValue("profilePhotoUrl", res.fileUrl, { shouldValidate: true, shouldDirty: true })}
              label={t("uploadAvatar")}
              hint={t("avatarHint")}
              shape="circle"
              previewClassName="h-16 w-16"
            />
          </Field>
        </div>
      </form>
    </ActionDrawer>
  );
}
