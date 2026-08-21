"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@moja/ui/components/ui/dialog";
import { Button } from "@moja/ui/components/ui/button";
import { Input } from "@moja/ui/components/ui/input";
import { Label } from "@moja/ui/components/ui/label";
import { Textarea } from "@moja/ui/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@moja/ui/components/ui/select";
import { createDriverSchema, type CreateDriverInput } from "@moja/schemas";
import { useTRPC } from "@/trpc/client";

interface AddDriverModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddDriverModal({ open, onOpenChange }: AddDriverModalProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<CreateDriverInput>({
    resolver: zodResolver(createDriverSchema) as any,
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      licenseNumber: "",
      licenseCategory: "D",
      licenseExpiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      yearsOfExperience: 3,
      employmentType: "EXCLUSIVE_INTERCITY",
      badgeNumber: "",
      notes: "",
    },
  });

  const createDriverMutation = useMutation({
    ...trpc.drivers.createDriver.mutationOptions(),
    onSuccess: () => {
      toast.success("Driver added to company fleet successfully");
      queryClient.invalidateQueries(trpc.drivers.listDrivers.pathFilter());
      reset();
      onOpenChange(false);
    },
    onError: (err) => {
      toast.error(err.message || "Failed to onboard driver");
    },
  });

  const onSubmit = (data: CreateDriverInput) => {
    createDriverMutation.mutate(data);
  };

  const selectedCategory = watch("licenseCategory");
  const selectedEmployment = watch("employmentType");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Onboard New Driver</DialogTitle>
          <DialogDescription>
            Register a commercial driver into your fleet roster and assign initial operational permissions.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="fullName">Full Legal Name *</Label>
              <Input
                id="fullName"
                placeholder="e.g. Ibrahim Touré"
                {...register("fullName")}
              />
              {errors.fullName && (
                <p className="text-xs text-destructive">{errors.fullName.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                placeholder="e.g. +225 07 12 34 56 78"
                {...register("phone")}
              />
              {errors.phone && (
                <p className="text-xs text-destructive">{errors.phone.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                placeholder="e.g. ibrahim.toure@example.com"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="badgeNumber">Company Badge ID (Optional)</Label>
              <Input
                id="badgeNumber"
                placeholder="e.g. DRV-084"
                {...register("badgeNumber")}
              />
            </div>
          </div>

          <div className="border-t border-border pt-4 space-y-4">
            <h4 className="text-sm font-semibold text-foreground">Driving License & Credentials</h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="licenseNumber">License Number *</Label>
                <Input
                  id="licenseNumber"
                  placeholder="e.g. CI-2024-88492"
                  {...register("licenseNumber")}
                />
                {errors.licenseNumber && (
                  <p className="text-xs text-destructive">{errors.licenseNumber.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label>License Class *</Label>
                <Select
                  value={selectedCategory}
                  onValueChange={(val: any) => setValue("licenseCategory", val)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="B">Class B (Van / Light)</SelectItem>
                    <SelectItem value="C">Class C (Heavy Truck)</SelectItem>
                    <SelectItem value="D">Class D (Passenger Bus)</SelectItem>
                    <SelectItem value="E">Class E (Articulated Coach)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="yearsOfExperience">Years Exp.</Label>
                <Input
                  id="yearsOfExperience"
                  type="number"
                  min={0}
                  max={50}
                  {...register("yearsOfExperience", { valueAsNumber: true })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="licenseExpiryDate">License Expiry Date *</Label>
                <Input
                  id="licenseExpiryDate"
                  type="date"
                  defaultValue={new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]}
                  onChange={(e) => setValue("licenseExpiryDate", new Date(e.target.value))}
                />
              </div>

              <div className="space-y-1.5">
                <Label>Operational Model *</Label>
                <Select
                  value={selectedEmployment}
                  onValueChange={(val: any) => setValue("employmentType", val)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Employment Model" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EXCLUSIVE_INTERCITY">Intercity Exclusive (Full-Time)</SelectItem>
                    <SelectItem value="CONTRACTOR_URBAN">Urban Contractor (Shared Pool)</SelectItem>
                    <SelectItem value="HYBRID">Hybrid (Multi-Mode)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="notes">Internal Operational Notes</Label>
              <Textarea
                id="notes"
                placeholder="Add shift preferences, specialized route expertise, or assigned depots..."
                rows={2}
                {...register("notes")}
              />
            </div>
          </div>

          <DialogFooter className="pt-4 border-t border-border flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={createDriverMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createDriverMutation.isPending}>
              {createDriverMutation.isPending ? "Onboarding..." : "Register Driver"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
