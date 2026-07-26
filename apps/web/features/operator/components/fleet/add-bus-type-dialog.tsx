"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { BusFront, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@moja/ui/components/ui/button";
import { Input } from "@moja/ui/components/ui/input";
import { Label } from "@moja/ui/components/ui/label";
import { Spinner } from "@moja/ui/components/ui/spinner";
import { Textarea } from "@moja/ui/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@moja/ui/components/ui/dialog";
import { useTRPC } from "@/trpc/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface AddBusTypeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function AddBusTypeDialog({
  open,
  onOpenChange,
  onSuccess,
}: AddBusTypeDialogProps) {
  const t = useTranslations("operatorDashboard.fleet");
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const createMutation = useMutation(
    trpc.fleet.createBusType.mutationOptions({
      onSuccess: () => {
        toast.success(t("addBusTypeDialog.created"));
        queryClient.invalidateQueries(trpc.fleet.getBusTypes.pathFilter());
        queryClient.invalidateQueries(trpc.fleet.getLayoutTemplates.pathFilter());
        onSuccess();
        onOpenChange(false);
        resetForm();
      },
      onError: (err) => {
        toast.error(err.message || t("addBusTypeDialog.error"));
      },
    }),
  );

  function resetForm() {
    setName("");
    setDescription("");
    setErrors({});
  }

  function handleOpenChange(v: boolean) {
    if (!v) {
      resetForm();
    }
    onOpenChange(v);
  }

  function validate(): boolean {
    const newErrors: Record<string, string> = {};
    const trimmed = name.trim();
    if (!trimmed) {
      newErrors["name"] = t("addBusTypeDialog.errors.required");
    } else if (trimmed.length < 2) {
      newErrors["name"] = t("addBusTypeDialog.errors.tooShort");
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    createMutation.mutate({
      name: name.trim(),
      description: description.trim() || undefined,
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-sm bg-background border-border">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 border border-primary/20">
              <BusFront className="size-4 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold text-foreground">
                {t("addBusTypeDialog.title")}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                {t("addBusTypeDialog.description")}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form id="add-bus-type-form" onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label
              htmlFor="bus-type-name"
              className="text-xs font-semibold text-foreground/80"
            >
              {t("addBusTypeDialog.nameLabel")}
            </Label>
            <Input
              id="bus-type-name"
              placeholder={t("addBusTypeDialog.namePlaceholder")}
              className="h-9 text-sm bg-card border-border"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            {errors["name"] && (
              <p className="text-xs text-destructive">{errors["name"]}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="bus-type-desc"
              className="text-xs font-semibold text-foreground/80"
            >
              {t("addBusTypeDialog.descLabel")}
            </Label>
            <Textarea
              id="bus-type-desc"
              placeholder={t("addBusTypeDialog.descPlaceholder")}
              className="text-sm bg-card border-border resize-none min-h-[60px]"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </form>

        <DialogFooter className="flex-row gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 h-8 text-muted-foreground"
            onClick={() => handleOpenChange(false)}
            disabled={createMutation.isPending}
          >
            {t("addBusTypeDialog.cancelBtn")}
          </Button>
          <Button
            type="submit"
            form="add-bus-type-form"
            size="sm"
            className="flex-1 h-8 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
            disabled={createMutation.isPending}
          >
            {createMutation.isPending ? (
              <Spinner className="size-3.5 mr-1.5" />
            ) : null}
            {t("addBusTypeDialog.submitBtn")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
