"use client";

import { useState } from "react";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { toast } from "sonner";
import { User, Settings2, ShieldCheck, Lock, CheckCircle, Smartphone, Mail, Sparkles } from "lucide-react";
import { Button } from "@moja/ui/components/ui/button";
import { Input } from "@moja/ui/components/ui/input";
import { Label } from "@moja/ui/components/ui/label";
import { PhoneInput } from "@moja/ui/components/ui/phone-input";
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

export function PassengerSettingsView() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  // Load preferences (profile data + PassengerProfile + user links)
  const { data: profile } = useSuspenseQuery(
    trpc.passenger.getPreferences.queryOptions()
  );

  const preferences = (profile?.preferencesJson as any) || {};

  // Form State
  const [fullName, setFullName] = useState(profile?.user?.fullName || "");
  const [phone, setPhone] = useState(profile?.user?.phoneNumber || "");
  const [preferredSeat, setPreferredSeat] = useState(preferences.preferredSeat || "NONE");
  const [preferredClass, setPreferredClass] = useState(preferences.preferredClass || "ECONOMY");
  const [marketingOptIn, setMarketingOptIn] = useState(profile?.marketingOptIn ?? false);



  // Mutation to save settings
  const saveSettingsMutation = useMutation(
    trpc.passenger.updatePreferences.mutationOptions({
      onSuccess: () => {
        toast.success("Settings updated successfully!");
        queryClient.invalidateQueries(trpc.passenger.getPreferences.pathFilter());
      },
      onError: (err) => {
        toast.error(err.message || "Failed to save settings");
      },
    })
  );

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      toast.error("Full name is required");
      return;
    }
    saveSettingsMutation.mutate({
      fullName,
      phone: phone || undefined,
    });
  };

  const { upload: uploadAvatar } = useStorageUpload("passenger-avatar");
  const updateAvatarMutation = useMutation(
    trpc.passenger.updateAvatar.mutationOptions({
      onSuccess: () => toast.success("Profile photo updated"),
      onError: (err) => toast.error(err.message || "Failed to update photo"),
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
    <Tabs defaultValue="profile" className="w-full flex flex-col md:flex-row gap-6 items-start">
      <TabsList className="flex md:flex-col items-start gap-1 p-1 bg-bg-surface border border-border rounded-lg w-full md:w-60 shrink-0">
        <TabsTrigger
          value="profile"
          className="w-full justify-start text-xs font-semibold px-4 py-2.5 rounded-md text-left gap-2 text-text-secondary data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
        >
          <User className="w-4 h-4" />
          Profile Details
        </TabsTrigger>
        <TabsTrigger
          value="preferences"
          className="w-full justify-start text-xs font-semibold px-4 py-2.5 rounded-md text-left gap-2 text-text-secondary data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
        >
          <Settings2 className="w-4 h-4" />
          Travel Preferences
        </TabsTrigger>
      </TabsList>

      <div className="flex-1 w-full space-y-6">
        {/* Profile Tab */}
        <TabsContent value="profile" className="m-0 focus-visible:outline-none">
          <form onSubmit={handleSaveProfile}>
            <Card className="border-border bg-bg-surface shadow-sm">
              <CardHeader className="border-b border-border/50 pb-4">
                <CardTitle className="text-base font-bold text-text-primary">Profile Details</CardTitle>
                <CardDescription>Update your personal information used for passenger tickets.</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-5">
                <div className="flex items-center gap-4 pb-2">
                  <ImageUploadField
                    purpose="passenger-avatar"
                    value={(profile?.user as { image?: string | null } | undefined)?.image ?? null}
                    onUploaded={handleAvatarUploaded}
                    label="Upload photo"
                    hint="PNG or JPG, up to 2MB"
                    shape="circle"
                    previewClassName="h-20 w-20"
                  />
                  <p className="text-xs text-text-muted">
                    Your profile photo is shown on your tickets and account.
                  </p>
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="fullName" className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                    Full Name
                  </Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your full name"
                    required
                    className="h-10 rounded-lg border-border focus-visible:ring-primary"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <Label className="text-xs font-bold text-text-secondary uppercase tracking-wider flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5 text-text-muted" /> Email Address
                    </Label>
                    <Input
                      value={profile?.user?.email || ""}
                      disabled
                      className="h-10 rounded-lg border-border bg-bg-elevated/50 text-text-muted cursor-not-allowed"
                    />
                    <p className="text-[10px] text-text-muted">Registered email address cannot be changed.</p>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label htmlFor="phone" className="text-xs font-bold text-text-secondary uppercase tracking-wider flex items-center gap-1">
                      <Smartphone className="w-3.5 h-3.5 text-text-muted" /> Phone Number
                    </Label>
                    <PhoneInput
                      id="phone"
                      value={phone}
                      onChange={(value) => setPhone(value || "")}
                      className="h-10 rounded-lg border-border"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-border flex justify-end">
                  <Button type="submit" disabled={isSaving} className="bg-primary text-white hover:bg-primary/95 font-semibold h-10 px-6 rounded-lg gap-2">
                    {isSaving && <Spinner className="w-4 h-4 text-white" />}
                    Save Profile Changes
                  </Button>
                </div>
              </CardContent>
            </Card>
          </form>
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value="preferences" className="m-0 focus-visible:outline-none">
          <form onSubmit={handleSavePreferences}>
            <Card className="border-border bg-bg-surface shadow-sm">
              <CardHeader className="border-b border-border/50 pb-4">
                <CardTitle className="text-base font-bold text-text-primary">Travel Preferences</CardTitle>
                <CardDescription>Tailor your ticket purchases and passenger details by default.</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Seating preference */}
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="preferredSeat" className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                      Seating Preference
                    </Label>
                    <Select value={preferredSeat} onValueChange={setPreferredSeat}>
                      <SelectTrigger className="h-10 rounded-lg border border-border bg-bg-surface px-3 py-2 text-sm text-text-primary focus:ring-primary focus:border-primary">
                        <SelectValue placeholder="No seating preference" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NONE">No seating preference</SelectItem>
                        <SelectItem value="WINDOW">Window Seats</SelectItem>
                        <SelectItem value="AISLE">Aisle Seats</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Seat Class preference */}
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="preferredClass" className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                      Preferred Seating Class
                    </Label>
                    <Select value={preferredClass} onValueChange={setPreferredClass}>
                      <SelectTrigger className="h-10 rounded-lg border border-border bg-bg-surface px-3 py-2 text-sm text-text-primary focus:ring-primary focus:border-primary">
                        <SelectValue placeholder="Economy Class" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ECONOMY">Economy Class</SelectItem>
                        <SelectItem value="STANDARD">Standard Class</SelectItem>
                        <SelectItem value="BUSINESS">Business Class</SelectItem>
                        <SelectItem value="VIP">VIP Class</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="border-t border-border pt-5 space-y-4">
                  <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-primary" /> Notification Settings
                  </h4>
                  
                  <div className="flex items-center justify-between p-4 border border-border/60 rounded-lg">
                    <div className="space-y-0.5 max-w-md">
                      <Label htmlFor="marketing" className="text-sm font-semibold text-text-primary">
                        Marketing & Promotions
                      </Label>
                      <p className="text-xs text-text-muted">
                        Receive customized vouchers, discount codes, and seasonal travel deal notifications via email.
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
                  <Button type="submit" disabled={isSaving} className="bg-primary text-white hover:bg-primary/95 font-semibold h-10 px-6 rounded-lg gap-2">
                    {isSaving && <Spinner className="w-4 h-4 text-white" />}
                    Save Travel Preferences
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
