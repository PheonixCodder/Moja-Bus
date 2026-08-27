"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  useSuspenseQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { toast } from "sonner";
import {
  User,
  Settings2,
  ShieldCheck,
  Lock,
  CheckCircle,
  Smartphone,
  Mail,
  Sparkles,
} from "lucide-react";
import { Button } from "@moja/ui/components/ui/button";
import { Input } from "@moja/ui/components/ui/input";
import { Label } from "@moja/ui/components/ui/label";
import { PhoneInput } from "@moja/ui/components/ui/phone-input";
import { getCountries } from "react-phone-number-input";
import type { CountryCode } from "libphonenumber-js/max";
import {
  getParsedCountry,
  resolvePhoneForSave,
} from "@/lib/phone/phone-number";
import { phoneErrorMessage } from "@/lib/phone/phone-error-message";
import { Switch } from "@moja/ui/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@moja/ui/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@moja/ui/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@moja/ui/components/ui/tabs";
import { authClient } from "@/lib/auth-client";
import { Spinner } from "@moja/ui/components/ui/spinner";
import { useStorageUpload } from "@/lib/storage-client";
import { ImageUploadField } from "@/components/image-upload-field";

export function PassengerSettingsView({
  detectedCountry,
}: {
  detectedCountry?: string | undefined;
}) {
  const t = useTranslations("passengerDashboard.settings");
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  // Load preferences (profile data + PassengerProfile + user links)
  const { data: profile } = useSuspenseQuery(
    trpc.passenger.getPreferences.queryOptions(),
  );

  const preferences = (profile?.preferencesJson as any) || {};

  // Form State
  const [fullName, setFullName] = useState(profile?.user?.fullName || "");
  const [phone, setPhone] = useState(profile?.user?.phoneNumber || "");
  const [phoneError, setPhoneError] = useState("");
  const [preferredSeat, setPreferredSeat] = useState(
    preferences.preferredSeat || "NONE",
  );
  const [preferredClass, setPreferredClass] = useState(
    preferences.preferredClass || "ECONOMY",
  );
  const [marketingOptIn, setMarketingOptIn] = useState(
    profile?.marketingOptIn ?? false,
  );

  // Country-selectable picker: default to the geo-detected country, falling
  // back to the previously stored phone's country (or CI).
  const phoneCountry = (detectedCountry ||
    getParsedCountry(profile?.user?.phoneNumber) ||
    "CI") as CountryCode;

  // Mutation to save settings
  const saveSettingsMutation = useMutation(
    trpc.passenger.updatePreferences.mutationOptions({
      onSuccess: () => {
        toast.success(t("toastUpdated"));
        queryClient.invalidateQueries(
          trpc.passenger.getPreferences.pathFilter(),
        );
      },
      onError: (err) => {
        toast.error(err.message || t("toastFailed"));
      },
    }),
  );

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      toast.error(t("validationName"));
      return;
    }

    const result = resolvePhoneForSave(phone, phoneCountry);
    if (!result.ok) {
      setPhoneError(phoneErrorMessage(t, result.error));
      return;
    }

    setPhoneError("");
    saveSettingsMutation.mutate({
      fullName,
      phone: result.phone,
    });
  };

  const { upload: uploadAvatar } = useStorageUpload("passenger-avatar");
  const updateAvatarMutation = useMutation(
    trpc.passenger.updateAvatar.mutationOptions({
      onSuccess: () => toast.success(t("toastPhotoUpdated")),
      onError: (err) => toast.error(err.message || t("toastPhotoFailed")),
    }),
  );

  const handleAvatarUploaded = async (result: { fileUrl: string }) => {
    await updateAvatarMutation.mutateAsync({ image: result.fileUrl });
  };

  const handleSavePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    saveSettingsMutation.mutate({
      preferredSeat,
      preferredClass,
      marketingOptIn,
    });
  };

  const isSaving = saveSettingsMutation.isPending;

  return (
    <Tabs
      defaultValue="profile"
      className="w-full flex flex-col md:flex-row gap-6 items-start"
    >
      <TabsList className="flex md:flex-col items-start gap-1 p-1 bg-bg-surface border border-border rounded-lg w-full md:w-60 shrink-0">
        <TabsTrigger
          value="profile"
          className="w-full justify-start text-xs font-semibold px-4 py-2.5 rounded-md text-left gap-2 text-text-secondary data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
        >
          <User className="w-4 h-4" />
          {t("tabProfile")}
        </TabsTrigger>
        <TabsTrigger
          value="preferences"
          className="w-full justify-start text-xs font-semibold px-4 py-2.5 rounded-md text-left gap-2 text-text-secondary data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
        >
          <Settings2 className="w-4 h-4" />
          {t("tabPreferences")}
        </TabsTrigger>
      </TabsList>

      <div className="flex-1 w-full space-y-6">
        <TabsContent value="profile" className="m-0 focus-visible:outline-none">
          <form onSubmit={handleSaveProfile}>
            <Card className="border-border bg-bg-surface shadow-sm">
              <CardHeader className="border-b border-border/50 pb-4">
                <CardTitle className="text-base font-bold text-text-primary">
                  {t("tabProfile")}
                </CardTitle>
                <CardDescription>{t("profileDescription")}</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-5">
                <div className="flex items-center gap-4 pb-2">
                  <ImageUploadField
                    purpose="passenger-avatar"
                    value={
                      (profile?.user as { image?: string | null } | undefined)
                        ?.image ?? null
                    }
                    onUploaded={handleAvatarUploaded}
                    label={t("uploadPhoto")}
                    hint={t("uploadHint")}
                    shape="circle"
                    previewClassName="h-20 w-20"
                  />
                  <p className="text-xs text-text-muted">
                    {t("photoDescription")}
                  </p>
                </div>

                <div className="flex flex-col gap-2">
                  <Label
                    htmlFor="fullName"
                    className="text-xs font-bold text-text-secondary uppercase tracking-wider"
                  >
                    {t("fullName")}
                  </Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder={t("namePlaceholder")}
                    required
                    className="h-10 rounded-lg border-border focus-visible:ring-primary"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <Label className="text-xs font-bold text-text-secondary uppercase tracking-wider flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5 text-text-muted" />{" "}
                      {t("emailLabel")}
                    </Label>
                    <Input
                      value={profile?.user?.email || ""}
                      disabled
                      className="h-10 rounded-lg border-border bg-bg-elevated/50 text-text-muted cursor-not-allowed"
                    />
                    <p className="text-[10px] text-text-muted">
                      {t("emailDisabledHint")}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label
                      htmlFor="phone"
                      className="text-xs font-bold text-text-secondary uppercase tracking-wider flex items-center gap-1"
                    >
                      <Smartphone className="w-3.5 h-3.5 text-text-muted" />{" "}
                      {t("phoneLabel")}
                    </Label>
                    <PhoneInput
                      id="phone"
                      value={phone}
                      countries={getCountries()}
                      defaultCountry={phoneCountry}
                      onChange={(value) => {
                        setPhone(value || "");
                        if (phoneError) setPhoneError("");
                      }}
                      className="h-10 rounded-lg border-border"
                    />
                    {phoneError ? (
                      <p role="alert" className="text-xs text-destructive">
                        {phoneError}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="pt-4 border-t border-border flex justify-end">
                  <Button
                    type="submit"
                    disabled={isSaving}
                    className="bg-primary text-white hover:bg-primary/95 font-semibold h-10 px-6 rounded-lg gap-2"
                  >
                    {isSaving && <Spinner className="w-4 h-4 text-white" />}
                    {t("saveProfile")}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </form>
        </TabsContent>

        <TabsContent
          value="preferences"
          className="m-0 focus-visible:outline-none"
        >
          <form onSubmit={handleSavePreferences}>
            <Card className="border-border bg-bg-surface shadow-sm">
              <CardHeader className="border-b border-border/50 pb-4">
                <CardTitle className="text-base font-bold text-text-primary">
                  {t("tabPreferences")}
                </CardTitle>
                <CardDescription>{t("preferencesDescription")}</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex flex-col gap-2">
                    <Label
                      htmlFor="preferredSeat"
                      className="text-xs font-bold text-text-secondary uppercase tracking-wider"
                    >
                      {t("seatingPreference")}
                    </Label>
                    <Select
                      value={preferredSeat}
                      onValueChange={setPreferredSeat}
                    >
                      <SelectTrigger className="h-10 rounded-lg border border-border bg-bg-surface px-3 py-2 text-sm text-text-primary focus:ring-primary focus:border-primary">
                        <SelectValue placeholder={t("seatingNone")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NONE">{t("seatingNone")}</SelectItem>
                        <SelectItem value="WINDOW">
                          {t("seatingWindow")}
                        </SelectItem>
                        <SelectItem value="AISLE">
                          {t("seatingAisle")}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label
                      htmlFor="preferredClass"
                      className="text-xs font-bold text-text-secondary uppercase tracking-wider"
                    >
                      {t("seatingClass")}
                    </Label>
                    <Select
                      value={preferredClass}
                      onValueChange={setPreferredClass}
                    >
                      <SelectTrigger className="h-10 rounded-lg border border-border bg-bg-surface px-3 py-2 text-sm text-text-primary focus:ring-primary focus:border-primary">
                        <SelectValue placeholder={t("classEconomy")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ECONOMY">
                          {t("classEconomy")}
                        </SelectItem>
                        <SelectItem value="STANDARD">
                          {t("classStandard")}
                        </SelectItem>
                        <SelectItem value="VIP">{t("classVip")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="border-t border-border pt-5 space-y-4">
                  <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-primary" />{" "}
                    {t("notificationTitle")}
                  </h4>

                  <div className="flex items-center justify-between p-4 border border-border/60 rounded-lg">
                    <div className="space-y-0.5 max-w-md">
                      <Label
                        htmlFor="marketing"
                        className="text-sm font-semibold text-text-primary"
                      >
                        {t("marketingLabel")}
                      </Label>
                      <p className="text-xs text-text-muted">
                        {t("marketingDescription")}
                      </p>
                    </div>
                    <Switch
                      id="marketing"
                      checked={marketingOptIn}
                      onCheckedChange={setMarketingOptIn}
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-border flex justify-end">
                  <Button
                    type="submit"
                    disabled={isSaving}
                    className="bg-primary text-white hover:bg-primary/95 font-semibold h-10 px-6 rounded-lg gap-2"
                  >
                    {isSaving && <Spinner className="w-4 h-4 text-white" />}
                    {t("savePreferences")}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </form>
        </TabsContent>
      </div>
    </Tabs>
  );
}
