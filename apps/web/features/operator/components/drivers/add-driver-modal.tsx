"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { type CreateDriverInput, createDriverSchema } from "@moja/schemas";
import { Button } from "@moja/ui/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@moja/ui/components/ui/dialog";
import { Input } from "@moja/ui/components/ui/input";
import { Label } from "@moja/ui/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@moja/ui/components/ui/select";
import { Textarea } from "@moja/ui/components/ui/textarea";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useTRPC } from "@/trpc/client";

interface AddDriverModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Parsed from EXISTING_USER_BINDING_REQUIRED::<name>|<phone>|<email>|<0|1>. */
type BindingConflict = {
  maskedName: string;
  maskedPhone: string;
  maskedEmail: string;
  hasDriverProfile: boolean;
};

/** Parsed from AMBIGUOUS_BINDING::<maskedEmail>::<maskedPhone> (Phase 26 F-OP-12). */
type AmbiguousBinding = {
  maskedEmail: string;
  maskedPhone: string;
};

export function AddDriverModal({ open, onOpenChange }: AddDriverModalProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  // P1-7 — set when the server refuses a silent account binding.
  const [bindingConflict, setBindingConflict] =
    useState<BindingConflict | null>(null);
  // Phase 26 (F-OP-12) — email and phone resolved to TWO different accounts.
  const [ambiguousBinding, setAmbiguousBinding] =
    useState<AmbiguousBinding | null>(null);
  // Phase 26 (F-OP-16) — licence uploads through the Phase 15 private
  // storage pipeline; keys land under the uploading operator's namespace
  // (dossier rendering presigns server-side, reader-agnostic by design).
  const [licenseDocs, setLicenseDocs] = useState<{
    front?: { key: string; name: string };
    back?: { key: string; name: string };
  }>({});
  const [uploadingDoc, setUploadingDoc] = useState<"front" | "back" | null>(
    null,
  );

  const presignMutation = useMutation(
    trpc.storage.presignUpload.mutationOptions(),
  );

  const uploadLicenseDoc = async (side: "front" | "back", file: File) => {
    setUploadingDoc(side);
    try {
      const contentType = file.type || "application/octet-stream";
      const { uploadUrl, objectKey } = await presignMutation.mutateAsync({
        purpose:
          side === "front" ? "driver-license-front" : "driver-license-back",
        fileName: file.name,
        contentType,
        fileSize: file.size,
      });
      const put = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": contentType },
      });
      if (!put.ok) {
        throw new Error(`Storage rejected the upload (${put.status})`);
      }
      setLicenseDocs((prev) => ({
        ...prev,
        [side]: { key: objectKey, name: file.name },
      }));
      setValue(
        side === "front" ? "licenseFrontUrl" : "licenseBackUrl",
        objectKey,
      );
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Document upload failed",
      );
    } finally {
      setUploadingDoc(null);
    }
  };
  // P1-7 — after success, show the credential-handoff step instead of closing.
  const [handoff, setHandoff] = useState<{
    phone: string;
    accountCreated: boolean;
  } | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
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
    onSuccess: (result, variables) => {
      toast.success("Driver added to company fleet successfully");
      queryClient.invalidateQueries(trpc.drivers.listDrivers.pathFilter());
      setBindingConflict(null);
      setAmbiguousBinding(null);
      setLicenseDocs({});
      setHandoff({
        phone: variables.phone,
        accountCreated: result.accountCreated,
      });
      reset();
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : String(err);
      if (message.startsWith("AMBIGUOUS_BINDING::")) {
        const [, maskedEmail, maskedPhone] = message.split("::");
        setBindingConflict(null);
        setAmbiguousBinding({
          maskedEmail: maskedEmail ?? "—",
          maskedPhone: maskedPhone ?? "—",
        });
        return;
      }
      if (message.startsWith("EXISTING_USER_BINDING_REQUIRED::")) {
        const fields = message.split("::")[1]?.split("|") ?? [];
        setBindingConflict({
          maskedName: fields[0] ?? "—",
          maskedPhone: fields[1] ?? "—",
          maskedEmail: fields[2] ?? "—",
          hasDriverProfile: fields[3] === "1",
        });
        return;
      }
      toast.error(message || "Failed to onboard driver");
    },
  });

  const onSubmit = (data: CreateDriverInput) => {
    createDriverMutation.mutate(data);
  };

  const confirmBinding = () => {
    if (!bindingConflict) return;
    setBindingConflict(null);
    createDriverMutation.mutate({
      ...getValues(),
      confirmBinding: true,
    });
  };

  const handoffText = handoff
    ? [
        "Moja Ride — Driver onboarding",
        "",
        "You have been added to your company's fleet on Moja Ride.",
        "1. Install the “Moja Ride Driver” app.",
        `2. Log in with your phone number ${handoff.phone} using the SMS verification code.`,
        "",
        "No password needed. See you on the road!",
      ].join("\n")
    : "";

  const shareHandoff = async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({
          title: "Moja Ride — Driver onboarding",
          text: handoffText,
        });
      } else {
        await navigator.clipboard.writeText(handoffText);
        toast.success("Instructions copied to clipboard");
      }
    } catch {
      // user dismissed the share sheet — nothing to do
    }
  };

  const closeAll = () => {
    setBindingConflict(null);
    setAmbiguousBinding(null);
    setLicenseDocs({});
    setHandoff(null);
    onOpenChange(false);
  };

  const selectedCategory = watch("licenseCategory");
  const selectedEmployment = watch("employmentType");

  return (
    <>
      <Dialog open={open} onOpenChange={(o) => !o && closeAll()}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          {handoff ? (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl font-bold">
                  Driver Added to Fleet
                </DialogTitle>
                <DialogDescription>
                  {handoff.accountCreated
                    ? "A driver account was created for this phone number."
                    : "This driver was linked to their existing Moja account."}{" "}
                  Share these login instructions with them — they sign in with
                  their phone number and an SMS code; no password is needed.
                </DialogDescription>
              </DialogHeader>

              <div className="rounded-xl border border-border bg-slate-50/70 p-4 text-sm leading-relaxed whitespace-pre-line text-slate-700">
                {handoffText}
              </div>

              <div className="grid grid-cols-2 gap-2 rounded-xl border border-border bg-white p-3 text-xs text-slate-600">
                <span className="font-semibold">Phone</span>
                <span className="font-mono">{handoff.phone}</span>
              </div>

              <DialogFooter className="pt-4 border-t border-border flex items-center justify-end gap-2">
                <Button type="button" variant="outline" onClick={shareHandoff}>
                  Share / Copy Instructions
                </Button>
                <Button type="button" onClick={closeAll}>
                  Done
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl font-bold">
                  Onboard New Driver
                </DialogTitle>
                <DialogDescription>
                  Register a commercial driver into your fleet roster and assign
                  initial operational permissions.
                </DialogDescription>
              </DialogHeader>

              <form
                onSubmit={handleSubmit(onSubmit)}
                className="space-y-4 py-2"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="fullName">Full Legal Name *</Label>
                    <Input
                      id="fullName"
                      placeholder="e.g. Ibrahim Touré"
                      {...register("fullName")}
                    />
                    {errors.fullName && (
                      <p className="text-xs text-destructive">
                        {errors.fullName.message}
                      </p>
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
                      <p className="text-xs text-destructive">
                        {errors.phone.message}
                      </p>
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
                      <p className="text-xs text-destructive">
                        {errors.email.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="badgeNumber">
                      Company Badge ID (Optional)
                    </Label>
                    <Input
                      id="badgeNumber"
                      placeholder="e.g. DRV-084"
                      {...register("badgeNumber")}
                    />
                  </div>
                </div>

                <div className="border-t border-border pt-4 space-y-4">
                  <h4 className="text-sm font-semibold text-foreground">
                    Driving License & Credentials
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="licenseNumber">License Number *</Label>
                      <Input
                        id="licenseNumber"
                        placeholder="e.g. CI-2024-88492"
                        {...register("licenseNumber")}
                      />
                      {errors.licenseNumber && (
                        <p className="text-xs text-destructive">
                          {errors.licenseNumber.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <Label>License Class *</Label>
                      <Select
                        value={selectedCategory}
                        onValueChange={(val: any) =>
                          setValue("licenseCategory", val)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="B">
                            Class B (Van / Light)
                          </SelectItem>
                          <SelectItem value="C">
                            Class C (Heavy Truck)
                          </SelectItem>
                          <SelectItem value="D">
                            Class D (Passenger Bus)
                          </SelectItem>
                          <SelectItem value="E">
                            Class E (Articulated Coach)
                          </SelectItem>
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
                        {...register("yearsOfExperience", {
                          valueAsNumber: true,
                        })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="licenseExpiryDate">
                        License Expiry Date *
                      </Label>
                      <Input
                        id="licenseExpiryDate"
                        type="date"
                        defaultValue={
                          new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
                            .toISOString()
                            .split("T")[0]
                        }
                        onChange={(e) =>
                          setValue(
                            "licenseExpiryDate",
                            new Date(e.target.value),
                          )
                        }
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label>Operational Model *</Label>
                      <Select
                        value={selectedEmployment}
                        onValueChange={(val: any) =>
                          setValue("employmentType", val)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Employment Model" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="EXCLUSIVE_INTERCITY">
                            Intercity Exclusive (Full-Time)
                          </SelectItem>
                          <SelectItem value="CONTRACTOR_URBAN">
                            Urban Contractor (Shared Pool)
                          </SelectItem>
                          <SelectItem value="HYBRID">
                            Hybrid (Multi-Mode)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Phase 26 (F-OP-16) — compliance documents through the Phase 15
                private storage pipeline. Server-side verification refuses to
                approve a driver with zero documents, so collecting them here
                is what makes the dossier verifiable at all. */}
                  <div className="space-y-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {(["front", "back"] as const).map((side) => (
                        <div key={side} className="space-y-1.5">
                          <Label htmlFor={`license-${side}-input`}>
                            Licence Photo ({side === "front" ? "Front" : "Back"}
                            )
                          </Label>
                          <input
                            id={`license-${side}-input`}
                            type="file"
                            accept="image/*,.pdf"
                            className="hidden"
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) void uploadLicenseDoc(side, f);
                              e.target.value = "";
                            }}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            className="w-full justify-start font-normal"
                            disabled={uploadingDoc !== null}
                            onClick={() =>
                              document
                                .getElementById(`license-${side}-input`)
                                ?.click()
                            }
                          >
                            {uploadingDoc === side
                              ? "Uploading…"
                              : licenseDocs[side]
                                ? `✓ ${licenseDocs[side]!.name}`
                                : "Upload image or PDF"}
                          </Button>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      At least one compliance document is required before this
                      driver can be verified.
                    </p>
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
                  <Button
                    type="submit"
                    disabled={createDriverMutation.isPending}
                  >
                    {createDriverMutation.isPending
                      ? "Onboarding..."
                      : "Register Driver"}
                  </Button>
                </DialogFooter>
              </form>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* P1-7 — explicit confirmation before binding to an existing account. */}
      <Dialog
        open={bindingConflict !== null}
        onOpenChange={(o) => !o && setBindingConflict(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900">
              {bindingConflict?.hasDriverProfile
                ? "This person is already a driver on Moja"
                : "This contact matches an existing account"}
            </DialogTitle>
            <DialogDescription className="text-sm leading-relaxed">
              {bindingConflict?.hasDriverProfile
                ? "The details you entered belong to an existing driver profile. Continue to add them to your roster as well?"
                : "The phone or email you entered belongs to an existing Moja user. Continuing will attach a driver profile to that account. Only proceed if you are sure this is the same person."}
            </DialogDescription>
          </DialogHeader>

          {bindingConflict && (
            <div className="rounded-xl border border-border bg-slate-50/70 p-3 text-xs space-y-1 text-slate-600">
              <div className="flex justify-between">
                <span className="font-semibold">Account name</span>
                <span>{bindingConflict.maskedName}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">Phone</span>
                <span className="font-mono">{bindingConflict.maskedPhone}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">Email</span>
                <span>{bindingConflict.maskedEmail}</span>
              </div>
            </div>
          )}

          <DialogFooter className="pt-2 flex items-center justify-end gap-2">
            <Button variant="outline" onClick={() => setBindingConflict(null)}>
              Go Back
            </Button>
            <Button
              onClick={confirmBinding}
              disabled={createDriverMutation.isPending}
            >
              {createDriverMutation.isPending
                ? "Linking..."
                : "Yes, Use This Account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Phase 26 (F-OP-12) — the email and the phone matched TWO different
        accounts. Moja never merges accounts automatically, so there is no
        confirm path here: the operator corrects one of the fields instead. */}
      <Dialog
        open={ambiguousBinding !== null}
        onOpenChange={(o) => !o && setAmbiguousBinding(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900">
              Two different accounts match these details
            </DialogTitle>
            <DialogDescription className="text-sm leading-relaxed">
              The email and phone you entered belong to two separate Moja
              accounts. Correct the email or the phone number so both point at
              the same person, then try again.
            </DialogDescription>
          </DialogHeader>

          {ambiguousBinding && (
            <div className="rounded-xl border border-border bg-slate-50/70 p-3 text-xs space-y-1 text-slate-600">
              <div className="flex justify-between">
                <span className="font-semibold">Email matches account</span>
                <span>{ambiguousBinding.maskedEmail}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">Phone matches account</span>
                <span className="font-mono">
                  {ambiguousBinding.maskedPhone}
                </span>
              </div>
            </div>
          )}

          <DialogFooter className="pt-2 flex items-center justify-end gap-2">
            <Button variant="outline" onClick={() => setAmbiguousBinding(null)}>
              Go Back &amp; Fix Details
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
