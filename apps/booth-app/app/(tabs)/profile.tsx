/**
 * Profile tab — operator info, current terminal, terminal switch,
 * language selector, bluetooth printer pairing, and logout.
 */
import {
  ArrowRight01Icon,
  BarChartIcon,
  Building01Icon,
  Globe02Icon,
  Logout01Icon,
  MapPinIcon,
  PrinterIcon,
  UserIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { router } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Palette } from "@/constants/theme";
import { IconColors } from "@/constants/ui-colors";
import { useHoldPool } from "@/hooks/use-hold-pool";
import { signOut } from "@/lib/auth-client";
import {
  connectPrinter,
  discoverPrinters,
  printTicket,
} from "@/lib/bluetooth-print";
import { BoothFeedback } from "@/lib/haptics";
import { switchLanguage } from "@/lib/i18n";
import { useSessionStore } from "@/stores/session";

export default function ProfileTab() {
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const terminal = useSessionStore((s) => s.terminal);
  const profile = useSessionStore((s) => s.profile);
  const locale = useSessionStore((s) => s.locale);
  const setTerminal = useSessionStore((s) => s.setTerminal);
  const clearSession = useSessionStore((s) => s.clearSession);
  const setLocale = useSessionStore((s) => s.setLocale);
  const { releaseAllHolds } = useHoldPool();
  const [showSwitchModal, setShowSwitchModal] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [showPrinterModal, setShowPrinterModal] = useState(false);
  const [printerList, setPrinterList] = useState<
    Array<{ name: string; address: string }>
  >([]);
  const [selectedPrinter, setSelectedPrinter] = useState<{
    name: string;
    address: string;
  } | null>(null);
  const [isScanningPrinters, setIsScanningPrinters] = useState(false);
  const [isConnectingPrinter, setIsConnectingPrinter] = useState(false);

  async function loadPrinters() {
    setIsScanningPrinters(true);
    try {
      const devices = await discoverPrinters();
      setPrinterList(devices);
    } catch {
      setPrinterList([]);
    } finally {
      setIsScanningPrinters(false);
    }
  }

  async function handleConnectPrinter(device: {
    name: string;
    address: string;
  }) {
    setIsConnectingPrinter(true);
    BoothFeedback.tap();
    const ok = await connectPrinter(device.address);
    setIsConnectingPrinter(false);
    if (ok) {
      setSelectedPrinter(device);
      BoothFeedback.successScan();
      Alert.alert("Succès", `Imprimante ${device.name} connectée.`);
    } else {
      Alert.alert("Erreur", `Impossible de se connecter à ${device.name}.`);
    }
  }

  async function handleTestPrint() {
    BoothFeedback.tap();
    await printTicket({
      passengerName: "Test Impression",
      bookingReference: "MJ-TEST01",
      route: "Abidjan → Yamoussoukro",
      departureDate: new Date().toLocaleDateString("fr-FR"),
      seatLabel: "01A",
      amountXOF: 5000,
      terminalName: terminal?.name ?? "Terminal Principal",
      companyName: profile?.companyName ?? "Moja Ride",
    });
  }

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

  const staffInitials = profile?.staffName
    ? profile.staffName
        .split(" ")
        .map((p) => p[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "OP";

  return (
    <View
      className="flex-1 bg-background"
      style={{ paddingTop: Math.max(insets.top, 16) }}
    >
      {/* Header */}
      <View className="px-6 pt-3 pb-4 border-b border-border">
        <Text className="font-heading text-2xl font-bold text-foreground tracking-tight">
          {t("profile.tabLabel")}
        </Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-6 py-5 gap-4"
        contentContainerStyle={{
          paddingBottom: Math.max(insets.bottom, 20) + 20,
        }}
      >
        {/* Operator Profile Card */}
        <Card variant="elevated" className="p-5">
          <View className="flex-row items-center gap-4">
            <View className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 items-center justify-center">
              <Text className="text-primary font-heading font-bold text-lg">
                {staffInitials}
              </Text>
            </View>
            <View className="flex-1">
              <Text className="text-foreground font-heading font-bold text-lg">
                {profile?.staffName ?? t("profile.anonymousStaff")}
              </Text>
              <Text className="text-muted-foreground text-xs mt-0.5">
                {profile?.staffEmail ?? ""}
              </Text>
              <View className="flex-row items-center gap-2 mt-2">
                <Badge variant="outline">
                  <Text className="text-xs font-semibold text-primary uppercase">
                    {profile?.role ?? "AGENT"}
                  </Text>
                </Badge>
                {profile?.companyName ? (
                  <Badge variant="secondary">
                    <HugeiconsIcon
                      icon={Building01Icon}
                      size={12}
                      color={IconColors.muted}
                    />
                    <Text className="text-xs font-semibold text-muted-foreground">
                      {profile.companyName}
                    </Text>
                  </Badge>
                ) : null}
              </View>
            </View>
          </View>
        </Card>

        {/* Current Terminal & Switch */}
        <Card
          variant="elevated"
          className="p-4"
          onPress={() => {
            BoothFeedback.tap();
            setShowSwitchModal(true);
          }}
        >
          <View className="flex-row items-center gap-3.5">
            <View className="w-10 h-10 rounded-xl bg-primary/10 items-center justify-center">
              <HugeiconsIcon
                icon={MapPinIcon}
                size={20}
                color={IconColors.brand}
              />
            </View>
            <View className="flex-1">
              <Text className="text-muted-foreground text-xs font-medium">
                {t("profile.currentTerminal")}
              </Text>
              <Text className="text-foreground font-heading font-bold text-base mt-0.5">
                {terminal?.name ?? t("profile.noneAssigned")}
              </Text>
            </View>
            <Text className="text-primary font-semibold text-xs bg-primary/10 px-3 py-1.5 rounded-full">
              {t("profile.switchTerminal")}
            </Text>
          </View>
        </Card>

        {/* Daily Reconciliation */}
        <Card
          variant="elevated"
          className="p-4"
          onPress={() => {
            BoothFeedback.tap();
            router.push("/reconcile");
          }}
        >
          <View className="flex-row items-center gap-3.5">
            <View className="w-10 h-10 rounded-xl bg-blue-500/10 items-center justify-center">
              <HugeiconsIcon
                icon={BarChartIcon}
                size={20}
                color={IconColors.info}
              />
            </View>
            <View className="flex-1">
              <Text className="text-foreground font-heading font-bold text-base">
                {t("reconcile.title")}
              </Text>
              <Text className="text-muted-foreground text-xs mt-0.5">
                {t("reconcile.subtitle") ||
                  "Rapport de caisse et clôture de shift"}
              </Text>
            </View>
            <HugeiconsIcon
              icon={ArrowRight01Icon}
              size={18}
              color={IconColors.muted}
            />
          </View>
        </Card>

        {/* Thermal Printer Settings */}
        <Card
          variant="elevated"
          className="p-4"
          onPress={() => {
            BoothFeedback.tap();
            setShowPrinterModal(true);
            void loadPrinters();
          }}
        >
          <View className="flex-row items-center gap-3.5">
            <View className="w-10 h-10 rounded-xl bg-amber-500/10 items-center justify-center">
              <HugeiconsIcon
                icon={PrinterIcon}
                size={20}
                color={IconColors.warning}
              />
            </View>
            <View className="flex-1">
              <Text className="text-foreground font-heading font-bold text-base">
                {t("profile.printer") || "Imprimante thermique"}
              </Text>
              <Text className="text-muted-foreground text-xs mt-0.5">
                {selectedPrinter
                  ? `Connectée : ${selectedPrinter.name}`
                  : "Non connectée"}
              </Text>
            </View>
            <HugeiconsIcon
              icon={ArrowRight01Icon}
              size={18}
              color={IconColors.muted}
            />
          </View>
        </Card>

        {/* Language Selector */}
        <Card variant="elevated" className="p-4">
          <View className="flex-row items-center gap-3.5">
            <View className="w-10 h-10 rounded-xl bg-muted/30 items-center justify-center">
              <HugeiconsIcon
                icon={Globe02Icon}
                size={20}
                color={IconColors.muted}
              />
            </View>
            <Text className="text-foreground font-heading font-bold text-base flex-1">
              {t("profile.language")}
            </Text>
            <View className="flex-row gap-1.5 bg-muted/40 p-1 rounded-2xl">
              {(["fr", "en"] as const).map((lang) => {
                const isActive = locale === lang;
                return (
                  <Pressable
                    key={lang}
                    onPress={() => {
                      BoothFeedback.selection();
                      void setLocale(lang);
                      void switchLanguage(lang);
                    }}
                    className={`px-3.5 py-1.5 rounded-xl ${
                      isActive ? "bg-primary shadow-sm" : "bg-transparent"
                    }`}
                  >
                    <Text
                      className={`text-xs font-bold ${
                        isActive
                          ? "text-primary-foreground"
                          : "text-muted-foreground"
                      }`}
                    >
                      {lang.toUpperCase()}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </Card>

        {/* Logout */}
        <Button
          variant="destructive"
          className="mt-4"
          onPress={handleLogout}
          disabled={loggingOut}
        >
          {loggingOut ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <View className="flex-row items-center gap-2">
              <HugeiconsIcon icon={Logout01Icon} size={18} color="#ffffff" />
              <Text className="text-destructive-foreground font-semibold text-base">
                {t("profile.logout")}
              </Text>
            </View>
          )}
        </Button>
      </ScrollView>

      {/* Switch Terminal Modal */}
      <Modal
        visible={showSwitchModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSwitchModal(false)}
      >
        <View className="flex-1 bg-black/60 items-center justify-center px-6">
          <Card className="p-6 w-full max-w-sm gap-4 shadow-2xl">
            <Text className="font-heading font-bold text-foreground text-lg">
              {t("terminalSelect.switchTitle")}
            </Text>
            <Text className="text-muted-foreground text-sm leading-5">
              {t("terminalSelect.switchWarning")}
            </Text>
            <View className="flex-row gap-3 mt-2">
              <Button
                variant="outline"
                className="flex-1"
                onPress={() => {
                  BoothFeedback.tap();
                  setShowSwitchModal(false);
                }}
              >
                <Text className="text-foreground font-semibold">
                  {t("terminalSelect.switchCancel")}
                </Text>
              </Button>
              <Button
                variant="default"
                className="flex-1"
                onPress={handleSwitchTerminal}
              >
                <Text className="text-primary-foreground font-semibold">
                  {t("terminalSelect.switchConfirm")}
                </Text>
              </Button>
            </View>
          </Card>
        </View>
      </Modal>

      {/* Printer Settings Modal */}
      <Modal
        visible={showPrinterModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPrinterModal(false)}
      >
        <View className="flex-1 bg-black/60 justify-end">
          <View className="bg-card rounded-t-3xl px-6 pt-6 pb-10 w-full gap-4 max-h-[85%] border-t border-border shadow-2xl">
            <View className="flex-row items-center justify-between pb-3 border-b border-border">
              <View>
                <Text className="font-heading font-bold text-foreground text-lg">
                  Imprimante thermique
                </Text>
                <Text className="text-muted-foreground text-xs mt-0.5">
                  Rechercher et associer une imprimante ESC/POS
                </Text>
              </View>
              <Button
                variant="ghost"
                size="sm"
                onPress={() => {
                  BoothFeedback.tap();
                  setShowPrinterModal(false);
                }}
              >
                <Text className="text-muted-foreground font-medium text-xs">
                  Fermer
                </Text>
              </Button>
            </View>

            {/* Test print button if printer is connected */}
            {selectedPrinter ? (
              <Card className="p-4 bg-primary/5 border-primary/20 gap-3">
                <Text className="text-xs font-semibold text-primary uppercase">
                  Connectée : {selectedPrinter.name} ({selectedPrinter.address})
                </Text>
                <Button variant="default" onPress={handleTestPrint}>
                  <Text className="text-primary-foreground font-semibold">
                    Imprimer un ticket test
                  </Text>
                </Button>
              </Card>
            ) : null}

            <View className="flex-row items-center justify-between pt-1">
              <Text className="text-sm font-semibold text-foreground">
                Appareils à proximité
              </Text>
              <Button
                variant="outline"
                size="sm"
                onPress={loadPrinters}
                disabled={isScanningPrinters}
              >
                {isScanningPrinters ? (
                  <ActivityIndicator size="small" color={IconColors.brand} />
                ) : (
                  <Text className="text-xs font-medium text-foreground">
                    Actualiser
                  </Text>
                )}
              </Button>
            </View>

            <ScrollView className="max-h-60">
              {printerList.length === 0 ? (
                <View className="py-8 items-center">
                  <Text className="text-muted-foreground text-sm text-center leading-5">
                    {isScanningPrinters
                      ? "Recherche d'imprimantes Bluetooth en cours..."
                      : "Aucune imprimante détectée.\nAssurez-vous que le Bluetooth est actif."}
                  </Text>
                </View>
              ) : (
                <View className="gap-2.5">
                  {printerList.map((printer) => {
                    const isSelected =
                      selectedPrinter?.address === printer.address;
                    return (
                      <Card
                        key={printer.address}
                        variant="elevated"
                        className={`p-4 flex-row items-center justify-between ${
                          isSelected ? "border-primary bg-primary/5" : ""
                        }`}
                        onPress={() => handleConnectPrinter(printer)}
                        disabled={isConnectingPrinter}
                      >
                        <View className="flex-1 pr-3">
                          <Text className="font-heading font-bold text-foreground text-sm">
                            {printer.name || "Imprimante inconnue"}
                          </Text>
                          <Text className="text-muted-foreground text-xs font-mono mt-0.5">
                            {printer.address}
                          </Text>
                        </View>
                        <Badge variant={isSelected ? "default" : "outline"}>
                          <Text
                            className={`text-xs font-bold ${
                              isSelected
                                ? "text-primary-foreground"
                                : "text-muted-foreground"
                            }`}
                          >
                            {isSelected ? "Connectée" : "Connecter"}
                          </Text>
                        </Badge>
                      </Card>
                    );
                  })}
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
