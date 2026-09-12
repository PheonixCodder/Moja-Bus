/**
 * Profile tab — operator info, current terminal, terminal switch,
 * language selector, and logout.
 */
import {
  BarChartIcon,
  Globe02Icon,
  Logout01Icon,
  MapPinIcon,
  PrinterIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { router } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Button } from "@/components/ui/button";
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
import { IconColors } from "@/constants/ui-colors";

export default function ProfileTab() {
  const { t, i18n } = useTranslation();
  const { terminal, profile, setTerminal, clearSession, setLocale, locale } =
    useSessionStore();
  const { releaseAllHolds } = useHoldPool();
  const [showSwitchModal, setShowSwitchModal] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [showPrinterModal, setShowPrinterModal] = useState(false);
  const [printerList, setPrinterList] = useState<Array<{ name: string; address: string }>>([]);
  const [selectedPrinter, setSelectedPrinter] = useState<{ name: string; address: string } | null>(null);
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

  async function handleConnectPrinter(device: { name: string; address: string }) {
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

        {/* Printer & Peripherals */}
        <TouchableOpacity
          className="bg-card border border-border rounded-xl px-5 py-4 flex-row items-center gap-3"
          onPress={() => {
            BoothFeedback.tap();
            setShowPrinterModal(true);
            void loadPrinters();
          }}
        >
          <HugeiconsIcon icon={PrinterIcon} size={20} color={IconColors.brand} />
          <View className="flex-1">
            <Text className="text-foreground font-medium">
              Imprimante thermique
            </Text>
            <Text className="text-foreground/60 text-xs mt-0.5">
              {selectedPrinter ? selectedPrinter.name : "Non connectée"}
            </Text>
          </View>
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

      {/* Printer Settings Modal */}
      <Modal
        visible={showPrinterModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPrinterModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-card rounded-t-3xl px-6 pt-6 pb-10 w-full gap-4 max-h-[80%]">
            <View className="flex-row items-center justify-between pb-2 border-b border-border">
              <View>
                <Text className="font-semibold text-foreground text-lg">
                  Imprimante thermique
                </Text>
                <Text className="text-foreground/60 text-xs mt-0.5">
                  Rechercher et associer une imprimante ESC/POS
                </Text>
              </View>
              <Button
                variant="ghost"
                size="sm"
                onPress={() => setShowPrinterModal(false)}
              >
                <Text className="text-foreground/70 font-medium">Fermer</Text>
              </Button>
            </View>

            {/* Test print button if printer is connected */}
            {selectedPrinter ? (
              <View className="p-4 bg-primary/5 rounded-xl border border-primary/20 gap-2">
                <Text className="text-xs font-semibold text-primary uppercase">
                  Connectée : {selectedPrinter.name} ({selectedPrinter.address})
                </Text>
                <Button
                  variant="default"
                  className="min-h-[44px] h-11"
                  onPress={handleTestPrint}
                >
                  <Text className="text-primary-foreground font-semibold">
                    Imprimer un ticket test
                  </Text>
                </Button>
              </View>
            ) : null}

            <View className="flex-row items-center justify-between">
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
                  <ActivityIndicator size="small" />
                ) : (
                  <Text className="text-xs font-medium text-foreground">
                    Actualiser
                  </Text>
                )}
              </Button>
            </View>

            <ScrollView className="max-h-60">
              {printerList.length === 0 ? (
                <View className="py-6 items-center">
                  <Text className="text-foreground/50 text-sm text-center">
                    {isScanningPrinters
                      ? "Recherche d'imprimantes Bluetooth en cours..."
                      : "Aucune imprimante détectée.\nAssurez-vous que le Bluetooth est actif."}
                  </Text>
                </View>
              ) : (
                <View className="gap-2">
                  {printerList.map((printer) => {
                    const isSelected = selectedPrinter?.address === printer.address;
                    return (
                      <TouchableOpacity
                        key={printer.address}
                        className={`p-4 rounded-xl border flex-row items-center justify-between ${
                          isSelected
                            ? "border-primary bg-primary/5"
                            : "border-border bg-card"
                        }`}
                        onPress={() => handleConnectPrinter(printer)}
                        disabled={isConnectingPrinter}
                      >
                        <View className="flex-1">
                          <Text className="font-semibold text-foreground">
                            {printer.name || "Imprimante inconnue"}
                          </Text>
                          <Text className="text-foreground/50 text-xs mt-0.5">
                            {printer.address}
                          </Text>
                        </View>
                        <Text
                          className={`text-xs font-bold ${
                            isSelected ? "text-primary" : "text-foreground/60"
                          }`}
                        >
                          {isSelected ? "Connectée" : "Connecter"}
                        </Text>
                      </TouchableOpacity>
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
