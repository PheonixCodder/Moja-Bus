/**
 * Profile tab — operator info, current terminal, terminal switch,
 * language selector, and logout.
 */
import {
  BarChartIcon,
  Globe02Icon,
  Logout01Icon,
  MapPinIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { router } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, Modal, Text, TouchableOpacity, View } from "react-native";
import { useHoldPool } from "@/hooks/use-hold-pool";
import { signOut } from "@/lib/auth-client";
import { BoothFeedback } from "@/lib/haptics";
import { switchLanguage } from "@/lib/i18n";
import { useSessionStore } from "@/stores/session";
import { IconColors } from "@/constants/ui-colors";

export default function ProfileTab() {
  const { t, i18n } = useTranslation();
  const { terminal, profile, setTerminal, clearSession, setLocale, locale } =
    useSessionStore();
  const { releaseAllHolds } = useHoldPool();
  const [showSwitchModal, setShowSwitchModal] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleSwitchTerminal() {
    setShowSwitchModal(false);
    await releaseAllHolds();
    router.push("/terminal-select?isSwitching=true");
  }

  async function handleLogout() {
    Alert.alert("", t("profile.logoutConfirm"), [
      { text: t("terminalSelect.switchCancel"), style: "cancel" },
      {
        text: t("profile.logout"),
        style: "destructive",
        onPress: async () => {
          setLoggingOut(true);
          await releaseAllHolds();
          await signOut();
          clearSession();
          setTerminal(null);
          void i18n.changeLanguage("fr");
          setLoggingOut(false);
          router.replace("/(auth)/login");
        },
      },
    ]);
  }

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View className="px-6 pt-14 pb-6 border-b border-border">
        <Text className="font-heading text-2xl font-bold text-foreground">
          {t("profile.tabLabel")}
        </Text>
      </View>

      <View className="px-6 py-6 gap-4">
        {/* Staff info */}
        <View className="bg-card border border-border rounded-xl px-5 py-4">
          <Text className="text-foreground font-semibold text-base">
            {profile?.staffName ?? "—"}
          </Text>
          <Text className="text-foreground/60 text-sm mt-0.5">
            {profile?.staffEmail ?? ""}
          </Text>
          <View className="mt-2 bg-primary/10 rounded-full px-3 py-0.5 self-start">
            <Text className="text-primary text-xs font-medium">
              {profile?.role ?? ""}
            </Text>
          </View>
        </View>

        {/* Company */}
        <View className="bg-card border border-border rounded-xl px-5 py-4">
          <Text className="text-foreground/60 text-xs mb-1">Compagnie</Text>
          <Text className="text-foreground font-semibold">
            {profile?.companyId ?? "—"}
          </Text>
        </View>

        {/* Current terminal + switch */}
        <TouchableOpacity
          className="bg-card border border-border rounded-xl px-5 py-4 flex-row items-center gap-3"
          onPress={() => setShowSwitchModal(true)}
        >
          <HugeiconsIcon icon={MapPinIcon} size={20} color={IconColors.brand} />
          <View className="flex-1">
            <Text className="text-foreground/60 text-xs">
              {t("profile.currentTerminal")}
            </Text>
            <Text className="text-foreground font-semibold mt-0.5">
              {terminal?.name ?? "—"}
            </Text>
          </View>
          <Text className="text-primary text-sm">
            {t("profile.switchTerminal")}
          </Text>
        </TouchableOpacity>

        {/* Reconciliation */}
        <TouchableOpacity
          className="bg-card border border-border rounded-xl px-5 py-4 flex-row items-center gap-3"
          onPress={() => {
            BoothFeedback.tap();
            router.push("/reconcile");
          }}
        >
          <HugeiconsIcon icon={BarChartIcon} size={20} color={IconColors.info} />
          <Text className="text-foreground font-medium flex-1">
            {t("reconcile.title")}
          </Text>
          <Text className="text-foreground/40">→</Text>
        </TouchableOpacity>

        {/* Language */}
        <View className="bg-card border border-border rounded-xl px-5 py-4 flex-row items-center gap-3">
          <HugeiconsIcon icon={Globe02Icon} size={20} color={IconColors.muted} />
          <Text className="text-foreground font-medium flex-1">
            {t("profile.language")}
          </Text>
          <View className="flex-row gap-2">
            {(["fr", "en"] as const).map((lang) => (
              <TouchableOpacity
                key={lang}
                onPress={() => {
                  BoothFeedback.tap();
                  void setLocale(lang);
                  void switchLanguage(lang);
                }}
                className={`px-3 py-1 rounded-full border ${
                  locale === lang
                    ? "bg-primary border-primary"
                    : "border-border"
                }`}
              >
                <Text
                  className={`text-sm font-medium ${
                    locale === lang ? "text-white" : "text-foreground/70"
                  }`}
                >
                  {lang.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Logout */}
        <TouchableOpacity
          className="bg-destructive/10 border border-destructive/20 rounded-xl px-5 py-4 flex-row items-center gap-3"
          onPress={handleLogout}
          disabled={loggingOut}
        >
          <HugeiconsIcon icon={Logout01Icon} size={20} color={IconColors.error} />
          <Text className="text-destructive font-medium">
            {loggingOut ? "..." : t("profile.logout")}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Switch terminal modal */}
      <Modal
        visible={showSwitchModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSwitchModal(false)}
      >
        <View className="flex-1 bg-black/50 items-center justify-center px-6">
          <View className="bg-card rounded-2xl px-6 py-6 w-full gap-4">
            <Text className="font-semibold text-foreground text-lg">
              {t("terminalSelect.switchTitle")}
            </Text>
            <Text className="text-foreground/70 text-sm">
              {t("terminalSelect.switchWarning")}
            </Text>
            <View className="flex-row gap-3">
              <TouchableOpacity
                className="flex-1 border border-border rounded-xl py-3 items-center"
                onPress={() => setShowSwitchModal(false)}
              >
                <Text className="text-foreground/70 font-medium">
                  {t("terminalSelect.switchCancel")}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 bg-primary rounded-xl py-3 items-center"
                onPress={handleSwitchTerminal}
              >
                <Text className="text-white font-medium">
                  {t("terminalSelect.switchConfirm")}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
