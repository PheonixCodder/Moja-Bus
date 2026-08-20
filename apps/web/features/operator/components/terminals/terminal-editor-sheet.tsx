"use client";

import { useState, useEffect } from "react";
import { skipToken, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  MapPin,
  CheckCircle,
  Smartphone,
  Copy,
  Check,
  MessageCircle,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@moja/ui/components/ui/button";
import { Input } from "@moja/ui/components/ui/input";
import { PhoneInput } from "@moja/ui/components/ui/phone-input";
import { Label } from "@moja/ui/components/ui/label";
import { Switch } from "@moja/ui/components/ui/switch";
import { Spinner } from "@moja/ui/components/ui/spinner";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@moja/ui/components/ui/drawer";
import {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxEmpty,
} from "@moja/ui/components/ui/combobox";
import { useTRPC } from "@/trpc/client";
import { CAPTURE_ADDRESS_PLACEHOLDER } from "@/features/capture/services/capture-service";

const DAYS_OF_WEEK = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

const DEFAULT_OPERATING_HOURS = DAYS_OF_WEEK.reduce((acc, day) => {
  acc[day] = { open: "06:00", close: "20:00", closed: false };
  return acc;
}, {} as Record<string, { open: string; close: string; closed: boolean }>);

type CaptureMode = "standard" | "capture";

interface CaptureLinkResult {
  url: string;
  token: string;
  expiresAt: Date;
}

interface TerminalEditorSheetProps {
  isOpen: boolean;
  onClose: () => void;
  editingLocation?: any;
  cities?: any[];
}

export function TerminalEditorSheet({
  isOpen,
  onClose,
  editingLocation,
  cities = [],
}: TerminalEditorSheetProps) {
  const t = useTranslations("operatorDashboard.terminals");
  const tc = useTranslations("common");
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const createMutation = useMutation(
    trpc.terminals.create.mutationOptions({
      onSuccess: () =>
        queryClient.invalidateQueries(trpc.terminals.list.pathFilter()),
    }),
  );
  const updateMutation = useMutation(
    trpc.terminals.update.mutationOptions({
      onSuccess: () =>
        queryClient.invalidateQueries(trpc.terminals.list.pathFilter()),
    }),
  );
  const createCaptureMutation = useMutation(
    trpc.captures.createCapture.mutationOptions({
      onSuccess: () =>
        queryClient.invalidateQueries(trpc.terminals.list.pathFilter()),
    }),
  );

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // Capture link UI
  const [mode, setMode] = useState<CaptureMode>("standard");
  const [captureResult, setCaptureResult] = useState<CaptureLinkResult | null>(null);
  const [copied, setCopied] = useState(false);

  // Form inputs
  const [name, setName] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [stateValue, setStateValue] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [phone, setPhone] = useState("");
  const [cityId, setCityId] = useState("");
  const [municipalityId, setMunicipalityId] = useState("");
  const [quarterId, setQuarterId] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [isTerminal, setIsTerminal] = useState(false);
  const [isPrimary, setIsPrimary] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [managerName, setManagerName] = useState("");
  const [managerPhone, setManagerPhone] = useState("");
  const [managerEmail, setManagerEmail] = useState("");
  const [operatingHours, setOperatingHours] = useState(DEFAULT_OPERATING_HOURS);

  const isCapturePending =
    !!editingLocation &&
    editingLocation.geoCaptureStatus != null &&
    editingLocation.geoCaptureStatus !== "COMPLETE";

  const municipalitiesQuery = useQuery(
    trpc.locations.searchMunicipalities.queryOptions(
      cityId ? { cityId } : skipToken,
    ),
  );
  const municipalities = municipalitiesQuery.data ?? [];

  const quartersQuery = useQuery(
    trpc.locations.searchQuarters.queryOptions(
      municipalityId ? { municipalityId } : skipToken,
    ),
  );
  const quarters = quartersQuery.data ?? [];

  useEffect(() => {
    const firstMunicipality = municipalities[0];
    if (
      cityId &&
      municipalities.length === 1 &&
      firstMunicipality?.isPassThrough
    ) {
      setMunicipalityId(firstMunicipality.id);
    } else if (!editingLocation) {
      setMunicipalityId("");
    }
  }, [cityId, municipalities, editingLocation]);

  useEffect(() => {
    if (editingLocation) {
      setName(editingLocation.name ?? "");
      setAddressLine1(editingLocation.addressLine1 ?? "");
      setAddressLine2(editingLocation.addressLine2 ?? "");
      setStateValue(editingLocation.state ?? "");
      setPostalCode(editingLocation.postalCode ?? "");
      setPhone(editingLocation.phone ?? "");
      setCityId(editingLocation.cityId ?? "");
      setMunicipalityId(editingLocation.municipalityId ?? "");
      setQuarterId(editingLocation.quarterId ?? "");
      setLatitude(editingLocation.latitude ? String(editingLocation.latitude) : "");
      setLongitude(editingLocation.longitude ? String(editingLocation.longitude) : "");
      setIsTerminal(editingLocation.isTerminal ?? false);
      setIsPrimary(editingLocation.isPrimary ?? false);
      setIsActive(editingLocation.isActive ?? true);
      setManagerName(editingLocation.managerName ?? "");
      setManagerPhone(editingLocation.managerPhone ?? "");
      setManagerEmail(editingLocation.managerEmail ?? "");
      setOperatingHours(
        editingLocation.operatingHours
          ? typeof editingLocation.operatingHours === "string"
            ? JSON.parse(editingLocation.operatingHours)
            : editingLocation.operatingHours
          : DEFAULT_OPERATING_HOURS
      );
      setMode(isCapturePending ? "capture" : "standard");
      setCaptureResult(null);
      setFormErrors({});
      setIsDirty(false);
    } else {
      setName("");
      setAddressLine1("");
      setAddressLine2("");
      setStateValue("");
      setPostalCode("");
      setPhone("");
      setCityId("");
      setMunicipalityId("");
      setQuarterId("");
      setLatitude("");
      setLongitude("");
      setIsTerminal(false);
      setIsPrimary(false);
      setIsActive(true);
      setManagerName("");
      setManagerPhone("");
      setManagerEmail("");
      setOperatingHours(DEFAULT_OPERATING_HOURS);
      setMode("standard");
      setCaptureResult(null);
      setFormErrors({});
      setIsDirty(false);
    }
  }, [editingLocation, isOpen]);

  const handleGenerateCapture = async () => {
    setSubmitting(true);
    setFormErrors({});

    const errors: Record<string, string> = {};
    if (!name.trim()) errors["name"] = "Name is required";
    if (!phone.trim()) errors["phone"] = "Phone number is required";

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      setSubmitting(false);
      return;
    }

    try {
      let terminalId = editingLocation?.id as string | undefined;
      if (!terminalId) {
        const created = await createMutation.mutateAsync({
          name: name.trim(),
          addressLine1: CAPTURE_ADDRESS_PLACEHOLDER,
          phone: phone.trim(),
          isTerminal: true,
          isPrimary,
          isActive,
          geoCaptureStatus: "PENDING_CAPTURE",
        });
        terminalId = created.id;
        toast.success(t("capture.captureCreated"));
      } else {
        await updateMutation.mutateAsync({
          id: terminalId,
          data: {
            name: name.trim(),
            phone: phone.trim(),
            isPrimary,
            isActive,
            geoCaptureStatus:
              editingLocation.geoCaptureStatus ?? "PENDING_CAPTURE",
          },
        });
      }

      const result = await createCaptureMutation.mutateAsync({
        terminalId,
      });
      setCaptureResult(result);
      setCopied(false);
      setIsDirty(false);
      toast.success(t("capture.linkGenerated"));
    } catch (err: any) {
      toast.error(err.message || t("capture.linkGenerationFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyLink = async () => {
    if (!captureResult) return;
    try {
      await navigator.clipboard.writeText(captureResult.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success(t("capture.copied"));
    } catch {
      toast.error(t("capture.linkGenerationFailed"));
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormErrors({});

    const errors: Record<string, string> = {};
    if (!name.trim()) errors["name"] = "Name is required";
    if (!addressLine1.trim())
      errors["addressLine1"] = "Address line 1 is required";
    if (!phone.trim()) errors["phone"] = "Phone number is required";
    if (isTerminal && !cityId)
      errors["cityId"] = "City is required for passenger terminals";

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      setSubmitting(false);
      return;
    }

    try {
      const payload: any = {
        name: name.trim(),
        addressLine1: addressLine1.trim(),
        addressLine2: addressLine2.trim() || undefined,
        state: stateValue.trim() || undefined,
        postalCode: postalCode.trim() || undefined,
        phone: phone.trim(),
        cityId: cityId || undefined,
        municipalityId: municipalityId || undefined,
        quarterId: quarterId || undefined,
        latitude: latitude ? parseFloat(latitude) : undefined,
        longitude: longitude ? parseFloat(longitude) : undefined,
        isTerminal,
        isPrimary,
        isActive,
        managerName: managerName.trim() || undefined,
        managerPhone: managerPhone.trim() || undefined,
        managerEmail: managerEmail.trim() || undefined,
        operatingHours,
      };

      if (editingLocation) {
        await updateMutation.mutateAsync({
          id: editingLocation.id,
          data: payload,
        });
        toast.success("Location updated successfully");
      } else {
        await createMutation.mutateAsync(payload);
        toast.success("Location created successfully");
      }
      setIsDirty(false);
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to save location");
    } finally {
      setSubmitting(false);
    }
  };

  const captureStatusBadge = (() => {
    const status = editingLocation?.geoCaptureStatus;
    if (!status || status === "COMPLETE") return null;
    const submitted = status === "PENDING_CONFIRMATION";
    return (
      <span
        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
          submitted
            ? "bg-sky-500/10 text-sky-600 dark:text-sky-400"
            : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
        }`}
      >
        {submitted
          ? t("capture.statusSubmitted")
          : t("capture.statusAwaitingCapture")}
      </span>
    );
  })();

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent
        className="max-h-[90vh]"
        onPointerDownOutside={(e) => {
          if (
            isDirty &&
            !window.confirm("You have unsaved changes. Discard changes?")
          ) {
            e.preventDefault();
          }
        }}
      >
        <div className="mx-auto w-full max-w-3xl overflow-y-auto p-6 space-y-6">
          <DrawerHeader className="px-0">
            <DrawerTitle className="text-xl font-bold flex items-center gap-2">
              <MapPin className="size-5 text-primary" />
              {editingLocation ? `${tc("edit")} Location` : t("addLocation")}
            </DrawerTitle>
            <DrawerDescription className="flex items-center gap-2">
              {t("pageDescription")}
              {captureStatusBadge}
            </DrawerDescription>
          </DrawerHeader>

          {!editingLocation && (
            <div className="grid grid-cols-2 gap-2 rounded-lg border border-border bg-muted/30 p-1">
              <button
                type="button"
                onClick={() => {
                  setMode("standard");
                  setCaptureResult(null);
                }}
                className={`rounded-md px-3 py-1.5 text-sm font-semibold transition-colors ${
                  mode === "standard"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t("capture.standardMode")}
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("capture");
                  setCaptureResult(null);
                }}
                className={`rounded-md px-3 py-1.5 text-sm font-semibold transition-colors flex items-center justify-center gap-1.5 ${
                  mode === "capture"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Smartphone className="size-4" />
                {t("capture.captureMode")}
              </button>
            </div>
          )}

          {mode === "capture" ? (
            <div className="space-y-6">
              {!captureResult && (
                <>
                  <div className="rounded-lg border border-border bg-card p-4 space-y-4">
                    <div className="flex items-start gap-3">
                      <Smartphone className="size-5 text-primary mt-0.5" />
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-foreground">
                          {t("capture.captureMode")}
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          {t("capture.captureModeDescription")}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label
                          htmlFor="capture-name"
                          className="text-xs font-semibold uppercase tracking-wider"
                        >
                          {tc("name")} *
                        </Label>
                        <Input
                          id="capture-name"
                          placeholder="e.g. Bouaké North Terminal"
                          value={name}
                          onChange={(e) => {
                            setName(e.target.value);
                            setIsDirty(true);
                          }}
                          className={
                            formErrors["name"] ? "border-destructive" : ""
                          }
                        />
                        {formErrors["name"] && (
                          <p className="text-xs text-destructive">
                            {formErrors["name"]}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label
                          htmlFor="capture-phone"
                          className="text-xs font-semibold uppercase tracking-wider"
                        >
                          {tc("phone")} *
                        </Label>
                        <PhoneInput
                          id="capture-phone"
                          value={phone}
                          onChange={(val) => {
                            setPhone(val || "");
                            setIsDirty(true);
                          }}
                          className={
                            formErrors["phone"] ? "border-destructive" : ""
                          }
                        />
                        {formErrors["phone"] && (
                          <p className="text-xs text-destructive">
                            {formErrors["phone"]}
                          </p>
                        )}
                      </div>
                    </div>

                    <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                      <CheckCircle className="size-3.5 text-primary" />
                      {t("capture.captureOnlyNamePhone")}
                    </p>
                  </div>

                  <div className="rounded-lg border border-border p-4 space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                      {t("editor.locationRoleAndStatus")}
                    </h4>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-sm font-medium">
                          {t("editor.passengerTerminal")}
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          {t("editor.captureTerminalDesc")}
                        </p>
                      </div>
                      <Switch checked disabled />
                    </div>

                    <div className="flex items-center justify-between border-t border-border pt-3">
                      <div className="space-y-0.5">
                        <Label className="text-sm font-medium">{t("editor.primaryHub")}</Label>
                        <p className="text-xs text-muted-foreground">
                          {t("editor.primaryHubDesc")}
                        </p>
                      </div>
                      <Switch
                        checked={isPrimary}
                        onCheckedChange={(v) => {
                          setIsPrimary(v);
                          setIsDirty(true);
                        }}
                      />
                    </div>

                    <div className="flex items-center justify-between border-t border-border pt-3">
                      <div className="space-y-0.5">
                        <Label className="text-sm font-medium">{t("editor.activeStatus")}</Label>
                        <p className="text-xs text-muted-foreground">
                          {t("editor.activeStatusDesc")}
                        </p>
                      </div>
                      <Switch
                        checked={isActive}
                        onCheckedChange={(v) => {
                          setIsActive(v);
                          setIsDirty(true);
                        }}
                      />
                    </div>
                  </div>

                  {editingLocation?.geoCaptureStatus === "PENDING_CONFIRMATION" && (
                    <div className="rounded-lg border border-sky-500/20 bg-sky-500/5 p-4 text-sm text-foreground space-y-1">
                      <p className="font-semibold flex items-center gap-2">
                        <CheckCircle className="size-4 text-sky-600" />
                        {t("capture.statusSubmitted")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t("capture.submittedNote")}
                      </p>
                    </div>
                  )}
                </>
              )}

              {captureResult && (
                <div className="space-y-4">
                  <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4 space-y-3">
                    <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                      <CheckCircle className="size-4 text-emerald-600" />
                      {t("capture.linkGenerated")}
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {t("capture.linkTitle")}
                      </Label>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 truncate rounded-md border border-border bg-muted/40 px-3 py-2 font-mono text-xs text-foreground">
                          {captureResult.url}
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleCopyLink}
                          className="shrink-0"
                        >
                          {copied ? (
                            <Check className="mr-1.5 size-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="mr-1.5 size-3.5" />
                          )}
                          {copied ? t("capture.copied") : t("capture.copy")}
                        </Button>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {t("capture.linkHint")}
                    </p>
                    <div className="flex items-center justify-between gap-2 pt-1">
                      <span className="text-xs text-muted-foreground">
                        {t("capture.expiresOn", {
                          date: new Date(captureResult.expiresAt).toLocaleString(),
                        })}
                      </span>
                      <Button
                        type="button"
                        size="sm"
                        className="shrink-0 bg-[#25D366] hover:bg-[#1da851] text-white"
                        onClick={() =>
                          window.open(
                            `https://wa.me/?text=${encodeURIComponent(captureResult.url)}`,
                            "_blank",
                          )
                        }
                      >
                        <MessageCircle className="mr-1.5 size-3.5" />
                        {t("capture.shareWhatsApp")}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              <DrawerFooter className="px-0 pt-4 flex-row justify-end gap-3">
                {!captureResult ? (
                  <>
                    <DrawerClose asChild>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                        disabled={submitting}
                      >
                        {tc("cancel")}
                      </Button>
                    </DrawerClose>
                    <Button
                      type="button"
                      onClick={handleGenerateCapture}
                      disabled={submitting}
                    >
                      {submitting && <Spinner className="mr-2 size-4" />}
                      {editingLocation
                        ? t("capture.generateLink")
                        : t("capture.createAndGenerateLink")}
                    </Button>
                  </>
                ) : (
                  <DrawerClose asChild>
                    <Button type="button" onClick={onClose}>
                      <CheckCircle className="mr-2 size-4" />
                      {tc("save")} {t("editor.andClose")}
                    </Button>
                  </DrawerClose>
                )}
              </DrawerFooter>
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="name"
                    className="text-xs font-semibold uppercase tracking-wider"
                  >
                    {tc("name")} *
                  </Label>
                  <Input
                    id="name"
                    placeholder="e.g. Abidjan Central Terminal"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      setIsDirty(true);
                    }}
                    className={
                      formErrors["name"] ? "border-destructive" : ""
                    }
                  />
                  {formErrors["name"] && (
                    <p className="text-xs text-destructive">
                      {formErrors["name"]}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="phone"
                    className="text-xs font-semibold uppercase tracking-wider"
                  >
                    {tc("phone")} *
                  </Label>
                  <PhoneInput
                    id="phone"
                    value={phone}
                    onChange={(val) => {
                      setPhone(val || "");
                      setIsDirty(true);
                    }}
                    className={
                      formErrors["phone"] ? "border-destructive" : ""
                    }
                  />
                  {formErrors["phone"] && (
                    <p className="text-xs text-destructive">
                      {formErrors["phone"]}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="addressLine1"
                    className="text-xs font-semibold uppercase tracking-wider"
                  >
                    {tc("address")} *
                  </Label>
                  <Input
                    id="addressLine1"
                    placeholder={t("editor.addressDetails")}
                    value={addressLine1}
                    onChange={(e) => {
                      setAddressLine1(e.target.value);
                      setIsDirty(true);
                    }}
                    className={
                      formErrors["addressLine1"] ? "border-destructive" : ""
                    }
                  />
                  {formErrors["addressLine1"] && (
                    <p className="text-xs text-destructive">
                      {formErrors["addressLine1"]}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="cityId"
                    className="text-xs font-semibold uppercase tracking-wider"
                  >
                    {tc("city")}
                  </Label>
                  <Combobox
                    items={cities.map((city: any) => ({
                      value: city.id,
                      label: city.name,
                    }))}
                    value={cityId}
                    onValueChange={(val) => {
                      setCityId(val || "");
                      setMunicipalityId("");
                      setQuarterId("");
                      setIsDirty(true);
                    }}
                  >
                    <ComboboxInput
                      id="cityId"
                      placeholder={t("editor.selectCity")}
                      className="w-full text-sm"
                      value={
                        cityId
                          ? (cities.find((c: any) => c.id === cityId)?.name ?? "")
                          : ""
                      }
                    />
                    <ComboboxContent>
                      <ComboboxEmpty>{t("editor.noCityFound")}</ComboboxEmpty>
                      <ComboboxList>
                        {cities.map((city: any) => (
                          <ComboboxItem key={city.id} value={city.id}>
                            {city.name}
                          </ComboboxItem>
                        ))}
                      </ComboboxList>
                    </ComboboxContent>
                  </Combobox>
                  {formErrors["cityId"] && (
                    <p className="text-xs text-destructive">
                      {formErrors["cityId"]}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="municipalityId"
                    className="text-xs font-semibold uppercase tracking-wider"
                  >
                    {t("editor.municipality")}
                  </Label>
                  {cityId && municipalities.length > 0 ? (
                    <>
                      {municipalities.length === 1 &&
                      municipalities[0]?.isPassThrough ? (
                        <Input
                          id="municipalityId"
                          value={municipalities[0]?.name ?? ""}
                          readOnly
                          className="bg-muted"
                        />
                      ) : (
                        <Combobox
                          items={municipalities.map((m: any) => ({
                            value: m.id,
                            label: m.name,
                          }))}
                          value={municipalityId}
                          onValueChange={(val) => {
                            setMunicipalityId(val || "");
                            setQuarterId("");
                            setIsDirty(true);
                          }}
                        >
                          <ComboboxInput
                            id="municipalityId"
                            placeholder={t("editor.selectMunicipality")}
                            className="w-full text-sm"
                            value={
                              municipalityId
                                ? (municipalities.find(
                                    (m: any) => m.id === municipalityId,
                                  )?.name ?? "")
                                : ""
                            }
                          />
                          <ComboboxContent>
                            <ComboboxEmpty>
                              {t("editor.noMunicipalityFound")}
                            </ComboboxEmpty>
                            <ComboboxList>
                              {municipalities.map((m: any) => (
                                <ComboboxItem key={m.id} value={m.id}>
                                  {m.name}
                                </ComboboxItem>
                              ))}
                            </ComboboxList>
                          </ComboboxContent>
                        </Combobox>
                      )}
                    </>
                  ) : (
                    <Input
                      id="municipalityId"
                      value=""
                      readOnly
                      placeholder={
                        cityId ? t("editor.noMunicipalityFound") : t("editor.selectCity")
                      }
                      className="bg-muted"
                    />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="quarterId"
                    className="text-xs font-semibold uppercase tracking-wider"
                  >
                    {t("editor.quarter")}
                  </Label>
                  <Combobox
                    items={quarters.map((q: any) => ({
                      value: q.id,
                      label: q.name,
                    }))}
                    value={quarterId}
                    onValueChange={(val) => {
                      setQuarterId(val || "");
                      setIsDirty(true);
                    }}
                  >
                    <ComboboxInput
                      id="quarterId"
                      placeholder={
                        municipalityId
                          ? `${t("editor.quarter")}...`
                          : `${t("editor.selectMunicipality")}...`
                      }
                      className="w-full text-sm"
                      value={
                        quarterId
                          ? (quarters.find((q: any) => q.id === quarterId)?.name ??
                            "")
                          : ""
                      }
                    />
                    <ComboboxContent>
                      <ComboboxEmpty>{t("editor.noQuarterFound")}</ComboboxEmpty>
                      <ComboboxList>
                        {quarters.map((q: any) => (
                          <ComboboxItem key={q.id} value={q.id}>
                            {q.name}
                          </ComboboxItem>
                        ))}
                      </ComboboxList>
                    </ComboboxContent>
                  </Combobox>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="latitude"
                    className="text-xs font-semibold uppercase tracking-wider"
                  >
                    {t("editor.latitude")}
                  </Label>
                  <Input
                    id="latitude"
                    type="number"
                    step="any"
                    placeholder="e.g. 5.359952"
                    value={latitude}
                    onChange={(e) => {
                      setLatitude(e.target.value);
                      setIsDirty(true);
                    }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="longitude"
                    className="text-xs font-semibold uppercase tracking-wider"
                  >
                    {t("editor.longitude")}
                  </Label>
                  <Input
                    id="longitude"
                    type="number"
                    step="any"
                    placeholder="e.g. -4.008256"
                    value={longitude}
                    onChange={(e) => {
                      setLongitude(e.target.value);
                      setIsDirty(true);
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="state"
                    className="text-xs font-semibold uppercase tracking-wider"
                  >
                    {t("editor.stateRegion")}
                  </Label>
                  <Input
                    id="state"
                    placeholder="e.g. Lagunes"
                    value={stateValue}
                    onChange={(e) => {
                      setStateValue(e.target.value);
                      setIsDirty(true);
                    }}
                  />
                </div>
              </div>

              <div className="rounded-lg border border-border p-4 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                  {t("editor.locationRoleAndStatus")}
                </h4>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-medium">
                      {t("editor.passengerTerminal")}
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {t("editor.passengerTerminalDesc")}
                    </p>
                  </div>
                  <Switch
                    checked={isTerminal}
                    onCheckedChange={(v) => {
                      setIsTerminal(v);
                      setIsDirty(true);
                    }}
                  />
                </div>

                {isTerminal && !cityId && (
                  <p className="text-xs text-destructive border-t border-border pt-2">
                    {t("editor.selectCityWarning")}
                  </p>
                )}

                <div className="flex items-center justify-between border-t border-border pt-3">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-medium">{t("editor.primaryHub")}</Label>
                    <p className="text-xs text-muted-foreground">
                      {t("editor.primaryHubDesc")}
                    </p>
                  </div>
                  <Switch
                    checked={isPrimary}
                    onCheckedChange={(v) => {
                      setIsPrimary(v);
                      setIsDirty(true);
                    }}
                  />
                </div>

                <div className="flex items-center justify-between border-t border-border pt-3">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-medium">{t("editor.activeStatus")}</Label>
                    <p className="text-xs text-muted-foreground">
                      {t("editor.activeStatusDesc")}
                    </p>
                  </div>
                  <Switch
                    checked={isActive}
                    onCheckedChange={(v) => {
                      setIsActive(v);
                      setIsDirty(true);
                    }}
                  />
                </div>
              </div>

              <DrawerFooter className="px-0 pt-4 flex-row justify-end gap-3">
                <DrawerClose asChild>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    disabled={submitting}
                  >
                    {tc("cancel")}
                  </Button>
                </DrawerClose>
                <Button type="submit" disabled={submitting}>
                  {submitting && <Spinner className="mr-2 size-4" />}
                  {editingLocation ? `${tc("save")} Changes` : t("addLocation")}
                </Button>
              </DrawerFooter>
            </form>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
