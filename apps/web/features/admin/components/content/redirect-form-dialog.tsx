"use client";

import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { z } from "zod";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useTRPC } from "@/trpc/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@moja/ui/components/ui/dialog";
import { Input } from "@moja/ui/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@moja/ui/components/ui/select";
import { Button } from "@moja/ui/components/ui/button";

type Redirect = {
  id: string;
  source: string;
  destination: string;
  type: number;
  createdAt: Date;
};

interface RedirectFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  redirect?: Redirect | null;
}

const formSchema = z.object({
  source: z.string().min(1, "Source path is required").startsWith("/", "Must start with a /"),
  destination: z.string().min(1, "Destination path is required").startsWith("/", "Must start with a /"),
  type: z.number(),
});

type FormValues = z.infer<typeof formSchema>;

export function RedirectFormDialog({ open, onOpenChange, redirect }: RedirectFormDialogProps) {
  const t = useTranslations("adminDashboard.redirectFormDialog");
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const isEditing = !!redirect;

  const { register, control, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      source: "",
      destination: "",
      type: 301,
    },
  });

  // Reset form when dialog opens/closes or when redirect prop changes
  useEffect(() => {
    if (open) {
      if (redirect) {
        reset({
          source: redirect.source,
          destination: redirect.destination,
          type: redirect.type,
        });
      } else {
        reset({
          source: "",
          destination: "",
          type: 301,
        });
      }
    }
  }, [open, redirect, reset]);

  const createMutation = useMutation(
    trpc.admin.createBlogRedirect.mutationOptions({
      onSuccess: () => {
        toast.success(t("createSuccess"));
        queryClient.invalidateQueries(trpc.admin.listBlogRedirects.pathFilter());
        onOpenChange(false);
      },
      onError: (error: any) => {
        toast.error(error.message || t("createError"));
      },
    })
  );

  const updateMutation = useMutation(
    trpc.admin.updateBlogRedirect.mutationOptions({
      onSuccess: () => {
        toast.success(t("updateSuccess"));
        queryClient.invalidateQueries(trpc.admin.listBlogRedirects.pathFilter());
        onOpenChange(false);
      },
      onError: (error: any) => {
        toast.error(error.message || t("updateError"));
      },
    })
  );

  const isPending = createMutation.isPending || updateMutation.isPending;

  function onSubmit(values: FormValues) {
    if (isEditing && redirect) {
      updateMutation.mutate({ id: redirect.id, ...values });
    } else {
      createMutation.mutate(values);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? t("editTitle") : t("createTitle")}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? t("editDescription")
              : t("createDescription")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none">{t("sourceLabel")}</label>
            <Input placeholder={t("sourcePlaceholder")} className="font-mono text-sm" {...register("source")} />
            {errors.source && <p className="text-[0.8rem] font-medium text-destructive">{errors.source.message}</p>}
            <p className="text-[0.8rem] text-muted-foreground">{t("sourceHint")}</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium leading-none">{t("destinationLabel")}</label>
            <Input placeholder={t("destinationPlaceholder")} className="font-mono text-sm" {...register("destination")} />
            {errors.destination && <p className="text-[0.8rem] font-medium text-destructive">{errors.destination.message}</p>}
            <p className="text-[0.8rem] text-muted-foreground">{t("destinationHint")}</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium leading-none">{t("typeLabel")}</label>
            <Controller
              control={control}
              name="type"
              render={({ field }) => (
                <Select
                  onValueChange={(val) => field.onChange(parseInt(val as string, 10))}
                  value={field.value.toString()}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("typePlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="301">{t("type301")}</SelectItem>
                    <SelectItem value="302">{t("type302")}</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.type && <p className="text-[0.8rem] font-medium text-destructive">{errors.type.message}</p>}
            <p className="text-[0.8rem] text-muted-foreground">{t("typeHint")}</p>
          </div>

          <div className="flex justify-end pt-4 space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t("cancel")}
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? t("saving") : isEditing ? t("saveChanges") : t("createRedirect")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
