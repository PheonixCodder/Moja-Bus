/**
 * Profile tab — operator info, current terminal, terminal switch,
 * language selector, bluetooth printer pairing, and logout.
 */
import {
  ArrowRight01Icon,
  BarChartIcon,
  Building01Icon,
  CheckmarkCircle02Icon,
  Globe02Icon,
  Logout01Icon,
  MapPinIcon,
  PrinterIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PageHeader } from "@/components/page-header";
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
  const queryClient = useQueryClient();

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
          queryClient.clear();
          clearSession();
          setTerminal(null);
          void i18n.changeLanguage("fr");
          setLoggingOut(false);
          router.replace("/(auth)/login");
        },
      },
    ]);
  }

  const staffInitials = useMemo(() => {
    if (!profile?.staffName) return "GC";
    const parts = profile.staffName.trim().split(" ");
    if (parts.length >= 2) {
      return `${parts[0]?.[0] ?? ""}${parts[parts.length - 1]?.[0] ?? ""}`.toUpperCase();
    }
    return (parts[0]?.slice(0, 2) ?? "GC").toUpperCase();
  }, [profile?.staffName]);

  const bottomPadding = insets.bottom > 0 ? insets.bottom + 100 : 120;

  return (
    <View className="flex-1 bg-background">
      <PageHeader
        title={t("profile.tabLabel")}
        description={`${profile?.companyName ?? "Moja Ride"} · ${terminal?.name ?? "Guichet"}`}
      />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 12,
          paddingBottom: bottomPadding,
          gap: 20,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Operator Identity Card */}
        <View className="bg-card border border-border/80 rounded-3xl p-5 shadow-2xs gap-4">
          <View className="flex-row items-center gap-4">
            <View className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/25 items-center justify-center">
              <Text className="text-primary font-heading font-black text-xl">
                {staffInitials}
              </Text>
            </View>

            <View className="flex-1 min-w-0">
              <Text
                className="text-foreground font-heading font-black text-lg truncate"
                numberOfLines={1}
              >
                {profile?.staffName ?? t("profile.anonymousStaff")}
              </Text>
              <Text
                className="text-muted-foreground text-xs font-medium truncate mt-0.5"
                numberOfLines={1}
              >
                {profile?.staffEmail ?? ""}
              </Text>
            </View>
          </View>

          {/* Role & Company Badges */}
          <View className="flex-row flex-wrap items-center gap-2 pt-1 border-t border-border/40">
            <View className="bg-foreground px-2.5 py-1 rounded-lg">
              <Text className="text-background text-[10px] font-black uppercase tracking-wider font-mono">
                {profile?.role ?? "BOOTH"}
              </Text>
            </View>

            {profile?.companyName ? (
              <View className="flex-row items-center gap-1.5 bg-muted/60 border border-border/50 px-2.5 py-1 rounded-lg">
                <HugeiconsIcon
                  icon={Building01Icon}
                  size={12}
                  color={IconColors.muted}
                />
                <Text className="text-[11px] font-bold text-muted-foreground">
                  {profile.companyName}
                </Text>
              </View>
            ) : null}

            <View className="flex-row items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg ml-auto">
              <View className="size-1.5 rounded-full bg-emerald-500" />
              <Text className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                En service
              </Text>
            </View>
          </View>
        </View>

        {/* Section 1: Terminal & Hardware */}
        <View className="gap-2">
          <Text className="text-[11px] font-heading font-black uppercase tracking-wider text-muted-foreground px-1">
            Terminal & Matériel
          </Text>

          <View className="bg-card border border-border/80 rounded-3xl overflow-hidden divide-y divide-border/40 shadow-2xs">
            {/* Terminal Row */}
            <Pressable
              onPress={() => {
                BoothFeedback.tap();
                setShowSwitchModal(true);
              }}
              className="p-4 flex-row items-center gap-3.5 active:bg-muted/30"
            >
              <View className="size-10 rounded-xl bg-primary/10 items-center justify-center">
                <HugeiconsIcon
                  icon={MapPinIcon}
                  size={20}
                  color={Palette.rose[500]}
                />
              </View>

              <View className="flex-1 min-w-0">
                <Text className="text-muted-foreground text-xs font-semibold">
                  {t("profile.currentTerminal")}
                </Text>
                <Text
                  className="text-foreground font-heading font-bold text-base mt-0.5 truncate"
                  numberOfLines={1}
                >
                  {terminal?.name ?? t("profile.noneAssigned")}
                </Text>
              </View>

              <View className="bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-full">
                <Text className="text-primary font-black text-xs">
                  {t("profile.switchTerminal")}
                </Text>
              </View>
            </Pressable>

            {/* Printer Row */}
            <Pressable
              onPress={() => {
                BoothFeedback.tap();
                setShowPrinterModal(true);
                void loadPrinters();
              }}
              className="p-4 flex-row items-center gap-3.5 active:bg-muted/30"
            >
              <View className="size-10 rounded-xl bg-amber-500/10 items-center justify-center">
                <HugeiconsIcon
                  icon={PrinterIcon}
                  size={20}
                  color={IconColors.warning}
                />
              </View>

              <View className="flex-1 min-w-0">
                <Text className="text-foreground font-heading font-bold text-base">
                  {t("profile.printer")}
                </Text>
                <View className="flex-row items-center gap-1.5 mt-0.5">
                  <View
                    className={`size-1.5 rounded-full ${
                      selectedPrinter ? "bg-emerald-500" : "bg-zinc-400"
                    }`}
                  />
                  <Text className="text-muted-foreground text-xs font-medium truncate">
                    {selectedPrinter
                      ? `${t("profile.printerConnected")} (${selectedPrinter.name})`
                      : t("profile.printerDisconnected")}
                  </Text>
                </View>
              </View>

              <HugeiconsIcon
                icon={ArrowRight01Icon}
                size={18}
                color={IconColors.muted}
              />
            </Pressable>
          </View>
        </View>

        {/* Section 2: Operations */}
        <View className="gap-2">
          <Text className="text-[11px] font-heading font-black uppercase tracking-wider text-muted-foreground px-1">
            Opérations Guichet
          </Text>

          <View className="bg-card border border-border/80 rounded-3xl overflow-hidden divide-y divide-border/40 shadow-2xs">
            {/* Daily Reconciliation */}
            <Pressable
              onPress={() => {
                BoothFeedback.tap();
                router.push("/reconcile");
              }}
              className="p-4 flex-row items-center gap-3.5 active:bg-muted/30"
            >
              <View className="size-10 rounded-xl bg-blue-500/10 items-center justify-center">
                <HugeiconsIcon
                  icon={BarChartIcon}
                  size={20}
                  color={IconColors.info}
                />
              </View>

              <View className="flex-1 min-w-0">
                <Text className="text-foreground font-heading font-bold text-base">
                  {t("reconcile.title")}
                </Text>
                <Text
                  className="text-muted-foreground text-xs font-medium mt-0.5 truncate"
                  numberOfLines={1}
                >
                  {t("reconcile.subtitle")}
                </Text>
              </View>

              <HugeiconsIcon
                icon={ArrowRight01Icon}
                size={18}
                color={IconColors.muted}
              />
            </Pressable>
          </View>
        </View>

        {/* Section 3: Preferences */}
        <View className="gap-2">
          <Text className="text-[11px] font-heading font-black uppercase tracking-wider text-muted-foreground px-1">
            Préférences
          </Text>

          <View className="bg-card border border-border/80 rounded-3xl overflow-hidden shadow-2xs">
            {/* Language Selector */}
            <View className="p-4 flex-row items-center gap-3.5">
              <View className="size-10 rounded-xl bg-muted/40 items-center justify-center">
                <HugeiconsIcon
                  icon={Globe02Icon}
                  size={20}
                  color={IconColors.muted}
                />
              </View>

              <Text className="text-foreground font-heading font-bold text-base flex-1">
                {t("profile.language")}
              </Text>

              <View className="flex-row gap-1 bg-muted/50 p-1 rounded-2xl border border-border/40">
                {(["fr", "en"] as const).map((lang) => {
                  const isActive = (locale || i18n.language) === lang;
                  return (
                    <Pressable
                      key={lang}
                      onPress={() => {
                        BoothFeedback.selection();
                        void setLocale(lang);
                        void switchLanguage(lang);
                      }}
                      className={`px-3 py-1.5 rounded-xl transition-all ${
                        isActive ? "bg-primary shadow-xs" : "bg-transparent"
                      }`}
                    >
                      <Text
                        className={`text-xs font-heading font-black ${
                          isActive ? "text-white" : "text-muted-foreground"
                        }`}
                      >
                        {lang.toUpperCase()}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </View>
        </View>

        {/* Destructive Logout Action Row */}
        <Pressable
          onPress={() => {
            BoothFeedback.tap();
            handleLogout();
          }}
          disabled={loggingOut}
          className="bg-destructive/10 border border-destructive/25 rounded-2xl p-4 flex-row items-center justify-center gap-2.5 active:bg-destructive/20 transition-all mt-1"
        >
          {loggingOut ? (
            <ActivityIndicator color="#e11d48" size="small" />
          ) : (
            <>
              <HugeiconsIcon icon={Logout01Icon} size={18} color="#e11d48" />
              <Text className="text-destructive font-heading font-black text-sm">
                {t("profile.logout")}
              </Text>
            </>
          )}
        </Pressable>
      </ScrollView>

      {/* Switch Terminal Modal */}
      <Modal
        visible={showSwitchModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSwitchModal(false)}
      >
        <View className="flex-1 bg-black/60 items-center justify-center px-6">
          <Card className="p-6 w-full max-w-sm gap-4 shadow-2xl rounded-3xl">
            <Text className="font-heading font-black text-foreground text-lg">
              {t("terminalSelect.switchTitle")}
            </Text>
            <Text className="text-muted-foreground text-xs leading-5">
              {t("terminalSelect.switchWarning")}
            </Text>
            <View className="flex-row gap-3 mt-2">
              <Button
                variant="outline"
                className="flex-1 rounded-xl"
                onPress={() => {
                  BoothFeedback.tap();
                  setShowSwitchModal(false);
                }}
              >
                <Text className="text-foreground font-bold text-xs">
                  {t("terminalSelect.switchCancel")}
                </Text>
              </Button>
              <Button
                variant="default"
                className="flex-1 rounded-xl bg-primary"
                onPress={handleSwitchTerminal}
              >
                <Text className="text-white font-bold text-xs">
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
          <View
            className="bg-card rounded-t-3xl px-6 pt-5 pb-8 w-full gap-4 max-h-[85%] border-t border-border shadow-2xl"
            style={{ paddingBottom: Math.max(insets.bottom, 20) + 12 }}
          >
            {/* Modal Handle */}
            <View className="w-12 h-1.5 rounded-full bg-muted-foreground/30 self-center mb-1" />

            <View className="flex-row items-center justify-between pb-3 border-b border-border/60">
              <View>
                <Text className="font-heading font-black text-foreground text-lg">
                  {t("profile.printer")}
                </Text>
                <Text className="text-muted-foreground text-xs mt-0.5">
                  Rechercher et associer une imprimante ESC/POS
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  BoothFeedback.tap();
                  setShowPrinterModal(false);
                }}
                className="bg-muted/60 px-3 py-1.5 rounded-full"
              >
                <Text className="text-muted-foreground font-bold text-xs">
                  Fermer
                </Text>
              </TouchableOpacity>
            </View>

            {/* Test print button if printer is connected */}
            {selectedPrinter ? (
              <View className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl gap-3">
                <View className="flex-row items-center gap-2">
                  <HugeiconsIcon
                    icon={CheckmarkCircle02Icon}
                    size={18}
                    color="#059669"
                  />
                  <Text className="text-xs font-black text-emerald-800 uppercase tracking-wider">
                    {t("profile.printerConnected")} : {selectedPrinter.name}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={handleTestPrint}
                  className="bg-emerald-600 active:bg-emerald-700 py-2.5 rounded-xl items-center justify-center"
                >
                  <Text className="text-white font-heading font-black text-xs">
                    {t("profile.testPrint")}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : null}

            <View className="flex-row items-center justify-between pt-1">
              <Text className="text-xs font-heading font-black uppercase tracking-wider text-muted-foreground">
                Appareils à proximité
              </Text>
              <TouchableOpacity
                onPress={loadPrinters}
                disabled={isScanningPrinters}
                className="bg-muted/40 px-3 py-1.5 rounded-full"
              >
                {isScanningPrinters ? (
                  <ActivityIndicator size="small" color={Palette.rose[500]} />
                ) : (
                  <Text className="text-xs font-bold text-foreground">
                    Actualiser
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            <ScrollView className="max-h-60">
              {printerList.length === 0 ? (
                <View className="py-8 items-center">
                  <Text className="text-muted-foreground text-xs text-center leading-relaxed">
                    {isScanningPrinters
                      ? "Recherche d'imprimantes Bluetooth en cours..."
                      : "Aucune imprimante détectée.\nAssurez-vous que le Bluetooth est activé."}
                  </Text>
                </View>
              ) : (
                <View className="gap-2.5">
                  {printerList.map((printer) => {
                    const isSelected =
                      selectedPrinter?.address === printer.address;
                    return (
                      <Pressable
                        key={printer.address}
                        className={`p-3.5 rounded-2xl border flex-row items-center justify-between ${
                          isSelected
                            ? "border-emerald-500/40 bg-emerald-500/10"
                            : "border-border/80 bg-card active:bg-muted/30"
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
                        <View
                          className={`px-3 py-1 rounded-full ${
                            isSelected ? "bg-emerald-600" : "bg-muted"
                          }`}
                        >
                          <Text
                            className={`text-xs font-bold ${
                              isSelected ? "text-white" : "text-foreground"
                            }`}
                          >
                            {isSelected
                              ? t("profile.printerConnected")
                              : "Connecter"}
                          </Text>
                        </View>
                      </Pressable>
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
