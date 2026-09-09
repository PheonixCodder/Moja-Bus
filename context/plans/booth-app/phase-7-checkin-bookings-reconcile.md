# Phase 7 — Check-In, Bookings Tab, Reconciliation & Profile

> **Status**: ✅ Complete  
> **Depends on**: Phase 5 (tabs layout exists)  
> **Blocks**: Nothing

---

## Objective

Build the remaining three tabs (Check-In, Bookings, Profile) and the full-screen Reconciliation screen. Also includes Bluetooth print wiring and the mid-session terminal switch flow.

---

## 7.1 — `apps/booth-app/app/(tabs)/checkin.tsx`

```typescript
import { useState, useRef } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { trpc } from "@/lib/trpc";
import { useSessionStore } from "@/stores/session";
import { t } from "@/lib/i18n";
import { CheckCircle, XCircle, ScanLine } from "lucide-react-native";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

type ScanState = "scanning" | "success" | "error";

interface CheckInResult {
  passengerName: string;
  seatNumber: string | null;
  departureDate: Date | null;
  route: string;
}

export default function CheckInTab() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanState, setScanState] = useState<ScanState>("scanning");
  const [result, setResult] = useState<CheckInResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const lastScannedToken = useRef<string | null>(null);

  const { selectedTerminal } = useSessionStore();
  const checkIn = trpc.booth.checkInPassenger.useMutation();

  async function handleQRScan(token: string) {
    // Debounce — ignore duplicate scans of the same token within 3 seconds
    if (token === lastScannedToken.current || isProcessing) return;
    lastScannedToken.current = token;
    setIsProcessing(true);

    try {
      const res = await checkIn.mutateAsync({
        ticketToken: token,
        terminalId: selectedTerminal!.id,
      });

      setResult({
        passengerName: res.passengerName ?? "Passager",
        seatNumber: res.seatNumber ?? null,
        departureDate: res.departureDate ? new Date(res.departureDate) : null,
        route: "Confirmé",
      });
      setScanState("success");
    } catch (e: any) {
      const msg = e?.message ?? t("errors.generic");
      if (msg.includes("not found")) setErrorMsg(t("checkin.errorNotFound"));
      else if (msg.includes("already")) setErrorMsg(t("checkin.errorUsed"));
      else if (msg.includes("terminal")) setErrorMsg(t("checkin.errorWrongTerminal"));
      else setErrorMsg(t("checkin.errorStatus", { status: msg }));
      setScanState("error");
    } finally {
      setIsProcessing(false);
      // Allow re-scanning after 3 seconds
      setTimeout(() => {
        lastScannedToken.current = null;
        setScanState("scanning");
        setResult(null);
        setErrorMsg(null);
      }, 3000);
    }
  }

  if (!permission) {
    return <View className="flex-1 bg-background" />;
  }

  if (!permission.granted) {
    return (
      <View className="flex-1 bg-background items-center justify-center px-6">
        <ScanLine size={48} color="#9ca3af" />
        <Text className="text-foreground text-center mt-4 mb-6">
          L'accès à la caméra est requis pour scanner les QR tickets.
        </Text>
        <TouchableOpacity
          className="bg-primary rounded-xl px-6 py-3"
          onPress={requestPermission}
        >
          <Text className="text-white font-semibold">Autoriser la caméra</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      {/* Header */}
      <View className="absolute top-14 left-0 right-0 z-10 items-center">
        <Text className="text-white font-heading text-xl font-bold">
          {t("checkin.title")}
        </Text>
        <Text className="text-white/70 text-sm mt-1">{t("checkin.instruction")}</Text>
      </View>

      {/* Camera */}
      {scanState === "scanning" && (
        <CameraView
          style={StyleSheet.absoluteFillObject}
          facing="back"
          onBarcodeScanned={(data) => {
            if (data.data) handleQRScan(data.data);
          }}
          barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
        />
      )}

      {/* Scan overlay frame */}
      {scanState === "scanning" && (
        <View className="flex-1 items-center justify-center">
          <View className="w-64 h-64 border-2 border-white/60 rounded-2xl" />
        </View>
      )}

      {/* Success state */}
      {scanState === "success" && result && (
        <View className="flex-1 items-center justify-center px-8 gap-4">
          <CheckCircle size={72} color="#22c55e" />
          <Text className="text-white font-heading text-2xl font-bold text-center">
            {t("checkin.success")}
          </Text>
          <View className="bg-white/10 rounded-2xl px-6 py-5 w-full gap-2">
            <Text className="text-white font-semibold text-lg">{result.passengerName}</Text>
            {result.seatNumber && (
              <Text className="text-white/80">Siège : {result.seatNumber}</Text>
            )}
            {result.departureDate && (
              <Text className="text-white/80">
                {format(result.departureDate, "d MMMM yyyy · HH:mm", { locale: fr })}
              </Text>
            )}
          </View>
        </View>
      )}

      {/* Error state */}
      {scanState === "error" && (
        <View className="flex-1 items-center justify-center px-8 gap-4">
          <XCircle size={72} color="#ef4444" />
          <Text className="text-white font-heading text-2xl font-bold text-center">
            Erreur
          </Text>
          <View className="bg-white/10 rounded-2xl px-6 py-4 w-full">
            <Text className="text-white/90 text-center">{errorMsg}</Text>
          </View>
        </View>
      )}
    </View>
  );
}
```

---

## 7.2 — `apps/booth-app/app/(tabs)/bookings.tsx`

```typescript
import { useState } from "react";
import {
  View, Text, FlatList, TouchableOpacity, RefreshControl,
} from "react-native";
import { trpc } from "@/lib/trpc";
import { useSessionStore } from "@/stores/session";
import { t } from "@/lib/i18n";
import { format } from "date-fns";
import { Banknote, Smartphone, WifiOff } from "lucide-react-native";
import { router } from "expo-router";

type Filter = "ALL" | "CASH" | "PAYSTACK_LINK";

export default function BookingsTab() {
  const { selectedTerminal } = useSessionStore();
  const [filter, setFilter] = useState<Filter>("ALL");
  const todayDate = format(new Date(), "yyyy-MM-dd");

  const { data, isPending, refetch, isRefetching } = trpc.booth.getTerminalBookings.useQuery(
    {
      terminalId: selectedTerminal!.id,
      date: todayDate,
      paymentMethod: filter,
      page: 1,
      limit: 100,
    },
    { enabled: !!selectedTerminal },
  );

  const filterTabs: { key: Filter; label: string }[] = [
    { key: "ALL", label: t("bookings.filterAll") },
    { key: "CASH", label: t("bookings.filterCash") },
    { key: "PAYSTACK_LINK", label: t("bookings.filterPaystack") },
  ];

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View className="px-6 pt-14 pb-4">
        <Text className="font-heading text-2xl font-bold text-foreground">
          {t("bookings.title")}
        </Text>
        <Text className="text-foreground/60 text-sm mt-0.5">
          {todayDate} · {selectedTerminal?.name}
        </Text>
      </View>

      {/* Filter tabs */}
      <View className="flex-row px-6 gap-2 mb-4">
        {filterTabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            onPress={() => setFilter(tab.key)}
            className={`px-4 py-1.5 rounded-full border ${
              filter === tab.key
                ? "bg-primary border-primary"
                : "border-border bg-card"
            }`}
          >
            <Text
              className={`text-sm font-medium ${
                filter === tab.key ? "text-white" : "text-foreground/70"
              }`}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Summary row */}
      {data && (
        <View className="flex-row px-6 gap-4 mb-4">
          <View className="flex-1 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
            <Text className="text-green-700 text-xs font-medium">Espèces</Text>
            <Text className="text-green-800 font-bold text-base mt-0.5">
              {data.items.filter((i) => i.paymentMethod === "CASH").length} ventes
            </Text>
          </View>
          <View className="flex-1 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
            <Text className="text-blue-700 text-xs font-medium">Mobile</Text>
            <Text className="text-blue-800 font-bold text-base mt-0.5">
              {data.items.filter((i) => i.paymentMethod === "PAYSTACK_LINK").length} ventes
            </Text>
          </View>
        </View>
      )}

      {/* List */}
      <FlatList
        data={data?.items ?? []}
        keyExtractor={(item) => item.id}
        contentContainerClassName="px-6 gap-3 pb-8"
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        renderItem={({ item }) => (
          <View className="bg-card border border-border rounded-xl px-4 py-3.5">
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="font-semibold text-foreground text-sm">
                  {item.booking.passengerName}
                </Text>
                <Text className="text-foreground/60 text-xs mt-0.5">
                  {item.booking.bookingReference}
                  {item.booking.seatNumber ? ` · Siège ${item.booking.seatNumber}` : ""}
                </Text>
              </View>
              <View className="items-end gap-1">
                <View
                  className={`flex-row items-center gap-1 px-2 py-0.5 rounded-full ${
                    item.paymentMethod === "CASH" ? "bg-green-100" : "bg-blue-100"
                  }`}
                >
                  {item.paymentMethod === "CASH" ? (
                    <Banknote size={12} color="#16a34a" />
                  ) : (
                    <Smartphone size={12} color="#2563eb" />
                  )}
                  <Text
                    className={`text-xs font-medium ${
                      item.paymentMethod === "CASH" ? "text-green-700" : "text-blue-700"
                    }`}
                  >
                    {item.paymentMethod === "CASH"
                      ? (item.cashAmountXOF ?? 0).toLocaleString("fr-CI")
                      : (item.booking.totalAmountXOF ?? 0).toLocaleString("fr-CI")}{" "}
                    XOF
                  </Text>
                </View>
                {item.wasOffline && (
                  <View className="flex-row items-center gap-0.5">
                    <WifiOff size={10} color="#f59e0b" />
                    <Text className="text-amber-600 text-xs">Hors ligne</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        )}
        ListEmptyComponent={
          !isPending ? (
            <View className="items-center py-16">
              <Text className="text-foreground/50">{t("bookings.noBookings")}</Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}
```

---

## 7.3 — `apps/booth-app/app/reconcile.tsx`

```typescript
import { View, Text, ScrollView, TouchableOpacity, Share } from "react-native";
import { router } from "expo-router";
import { trpc } from "@/lib/trpc";
import { useSessionStore } from "@/stores/session";
import { t } from "@/lib/i18n";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { X } from "lucide-react-native";

export default function ReconcileScreen() {
  const { selectedTerminal, staff } = useSessionStore();
  const todayDate = format(new Date(), "yyyy-MM-dd");

  const { data, isPending } = trpc.booth.getDailyReconciliation.useQuery(
    { terminalId: selectedTerminal!.id, date: todayDate },
    { enabled: !!selectedTerminal },
  );

  async function handleShare() {
    if (!data) return;
    const text = [
      `=== ${t("reconcile.shareTitle", { date: todayDate })} ===`,
      `Agent : ${staff?.fullName ?? ""}`,
      `Terminal : ${selectedTerminal?.name ?? ""}`,
      ``,
      `${t("reconcile.totalSales")} : ${data.totalSales}`,
      `${t("reconcile.cashTotal")} : ${data.cashTotalXOF.toLocaleString("fr-CI")} XOF (${data.cashCount} ventes)`,
      `${t("reconcile.paystackTotal")} : ${data.paystackTotalXOF.toLocaleString("fr-CI")} XOF (${data.paystackCount} ventes)`,
      `${t("reconcile.grandTotal")} : ${data.grandTotalXOF.toLocaleString("fr-CI")} XOF`,
      ``,
      `Ventes hors ligne : ${data.offlineSalesCount}`,
      `Passagers au comptoir : ${data.walkUpCount}`,
      ``,
      `--- Détail des ventes ---`,
      ...data.sales.map(
        (s) =>
          `${format(new Date(s.confirmedAt), "HH:mm")} · ${s.passengerName} · ${s.route} · ${(s.amountXOF ?? 0).toLocaleString("fr-CI")} XOF (${s.paymentMethod === "CASH" ? "Espèces" : "Mobile"})`,
      ),
    ].join("\n");

    await Share.share({ message: text, title: t("reconcile.shareTitle", { date: todayDate }) });
  }

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View className="flex-row items-center px-6 pt-14 pb-4 border-b border-border">
        <Text className="font-heading text-xl font-bold text-foreground flex-1">
          {t("reconcile.title")}
        </Text>
        <TouchableOpacity onPress={() => router.back()}>
          <X size={22} color="#555" />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1" contentContainerClassName="px-6 py-6 gap-4">
        {/* Date + terminal */}
        <Text className="text-foreground/60 text-sm">
          {format(new Date(), "d MMMM yyyy", { locale: fr })} · {selectedTerminal?.name}
        </Text>

        {/* Summary cards */}
        <View className="gap-3">
          <View className="flex-row gap-3">
            <View className="flex-1 bg-card border border-border rounded-xl px-4 py-4">
              <Text className="text-foreground/60 text-sm">{t("reconcile.totalSales")}</Text>
              <Text className="text-foreground font-bold text-2xl mt-1">
                {data?.totalSales ?? "-"}
              </Text>
            </View>
            <View className="flex-1 bg-card border border-border rounded-xl px-4 py-4">
              <Text className="text-foreground/60 text-sm">{t("reconcile.walkUps")}</Text>
              <Text className="text-foreground font-bold text-2xl mt-1">
                {data?.walkUpCount ?? "-"}
              </Text>
            </View>
          </View>

          <View className="bg-green-50 border border-green-200 rounded-xl px-5 py-4">
            <View className="flex-row justify-between items-center">
              <Text className="text-green-700 font-medium">{t("reconcile.cashTotal")}</Text>
              <Text className="text-green-800 font-bold text-sm">
                {data?.cashCount ?? 0} ventes
              </Text>
            </View>
            <Text className="text-green-900 font-bold text-xl mt-1">
              {(data?.cashTotalXOF ?? 0).toLocaleString("fr-CI")} XOF
            </Text>
          </View>

          <View className="bg-blue-50 border border-blue-200 rounded-xl px-5 py-4">
            <View className="flex-row justify-between items-center">
              <Text className="text-blue-700 font-medium">{t("reconcile.paystackTotal")}</Text>
              <Text className="text-blue-800 font-bold text-sm">
                {data?.paystackCount ?? 0} ventes
              </Text>
            </View>
            <Text className="text-blue-900 font-bold text-xl mt-1">
              {(data?.paystackTotalXOF ?? 0).toLocaleString("fr-CI")} XOF
            </Text>
          </View>

          <View className="bg-primary/10 border border-primary/20 rounded-xl px-5 py-4">
            <Text className="text-primary font-medium">{t("reconcile.grandTotal")}</Text>
            <Text className="text-primary font-bold text-2xl mt-1">
              {(data?.grandTotalXOF ?? 0).toLocaleString("fr-CI")} XOF
            </Text>
          </View>
        </View>

        {/* Sale list */}
        {data?.sales && data.sales.length > 0 && (
          <View className="gap-2 mt-2">
            <Text className="font-semibold text-foreground">Détail des ventes</Text>
            {data.sales.map((sale) => (
              <View
                key={sale.id}
                className="bg-card border border-border rounded-lg px-4 py-3"
              >
                <View className="flex-row justify-between">
                  <Text className="text-foreground/60 text-xs">
                    {format(new Date(sale.confirmedAt), "HH:mm")}
                    {sale.wasOffline ? " · 📶 Hors ligne" : ""}
                  </Text>
                  <Text
                    className={`text-xs font-medium ${
                      sale.paymentMethod === "CASH" ? "text-green-700" : "text-blue-700"
                    }`}
                  >
                    {sale.paymentMethod === "CASH" ? "Espèces" : "Mobile"}
                  </Text>
                </View>
                <Text className="text-foreground font-medium text-sm mt-0.5">
                  {sale.passengerName}
                </Text>
                <View className="flex-row justify-between mt-0.5">
                  <Text className="text-foreground/60 text-xs">{sale.route}</Text>
                  <Text className="text-foreground font-semibold text-sm">
                    {(sale.amountXOF ?? 0).toLocaleString("fr-CI")} XOF
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Share button */}
      <View className="px-6 pb-8 pt-4 border-t border-border">
        <TouchableOpacity
          className="bg-primary rounded-xl py-4 items-center"
          onPress={handleShare}
        >
          <Text className="text-white font-semibold">{t("reconcile.shareButton")}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
```

---

## 7.4 — `apps/booth-app/app/(tabs)/profile.tsx`

```typescript
import { useState } from "react";
import { View, Text, TouchableOpacity, Alert, Modal } from "react-native";
import { authClient } from "@/lib/auth-client";
import { useSessionStore } from "@/stores/session";
import { useHoldPool } from "@/hooks/use-hold-pool";
import { t } from "@/lib/i18n";
import { router } from "expo-router";
import { MapPin, Globe, LogOut, BarChart3 } from "lucide-react-native";

export default function ProfileTab() {
  const { staff, company, selectedTerminal, clearSession, setLocale, locale } =
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
      { text: "Annuler", style: "cancel" },
      {
        text: t("profile.logout"),
        style: "destructive",
        onPress: async () => {
          setLoggingOut(true);
          await releaseAllHolds();
          await authClient.signOut();
          clearSession();
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
            {staff?.fullName ?? "—"}
          </Text>
          <Text className="text-foreground/60 text-sm mt-0.5">{staff?.email ?? ""}</Text>
          <View className="mt-2 bg-primary/10 rounded-full px-3 py-0.5 self-start">
            <Text className="text-primary text-xs font-medium">{staff?.role}</Text>
          </View>
        </View>

        {/* Company */}
        <View className="bg-card border border-border rounded-xl px-5 py-4">
          <Text className="text-foreground/60 text-xs mb-1">Compagnie</Text>
          <Text className="text-foreground font-semibold">{company?.name ?? "—"}</Text>
        </View>

        {/* Current terminal + switch */}
        <TouchableOpacity
          className="bg-card border border-border rounded-xl px-5 py-4 flex-row items-center gap-3"
          onPress={() => setShowSwitchModal(true)}
        >
          <MapPin size={20} color="#ee237c" />
          <View className="flex-1">
            <Text className="text-foreground/60 text-xs">{t("profile.currentTerminal")}</Text>
            <Text className="text-foreground font-semibold mt-0.5">
              {selectedTerminal?.name ?? "—"}
            </Text>
          </View>
          <Text className="text-primary text-sm">{t("profile.switchTerminal")}</Text>
        </TouchableOpacity>

        {/* Reconciliation */}
        <TouchableOpacity
          className="bg-card border border-border rounded-xl px-5 py-4 flex-row items-center gap-3"
          onPress={() => router.push("/reconcile")}
        >
          <BarChart3 size={20} color="#2563eb" />
          <Text className="text-foreground font-medium flex-1">{t("reconcile.title")}</Text>
          <Text className="text-foreground/40">→</Text>
        </TouchableOpacity>

        {/* Language */}
        <View className="bg-card border border-border rounded-xl px-5 py-4 flex-row items-center gap-3">
          <Globe size={20} color="#6b7280" />
          <Text className="text-foreground font-medium flex-1">{t("profile.language")}</Text>
          <View className="flex-row gap-2">
            {(["fr", "en"] as const).map((lang) => (
              <TouchableOpacity
                key={lang}
                onPress={() => setLocale(lang)}
                className={`px-3 py-1 rounded-full border ${
                  locale === lang ? "bg-primary border-primary" : "border-border"
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
          <LogOut size={20} color="#ef4444" />
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
```

---

## 7.5 — `apps/booth-app/lib/bluetooth-print.ts`

```typescript
import BluetoothPrinter from "react-native-thermal-receipt-printer-enhanced";
import { Platform } from "react-native";

interface TicketData {
  passengerName: string;
  bookingReference: string;
  route: string;
  departureDate: string;
  seatNumber: string | null;
  amountXOF: number;
  terminalName: string;
  companyName: string;
}

/**
 * Prints a ticket to a connected Bluetooth thermal printer.
 * Must be called after the user has selected a printer from the device list.
 *
 * Usage:
 * 1. Call discoverPrinters() to get available printers
 * 2. Call connectPrinter(printerMac) to connect
 * 3. Call printTicket(ticketData) to print
 */

export async function discoverPrinters() {
  if (Platform.OS !== "android" && Platform.OS !== "ios") return [];
  try {
    const printers = await BluetoothPrinter.getDeviceList();
    return printers;
  } catch {
    return [];
  }
}

export async function connectPrinter(address: string): Promise<boolean> {
  try {
    await BluetoothPrinter.connectPrinter(address);
    return true;
  } catch {
    return false;
  }
}

export async function printTicket(data: TicketData): Promise<void> {
  const lines = [
    { type: "TEXT", value: data.companyName, style: { bold: true, align: "CENTER", size: 2 } },
    { type: "TEXT", value: "BILLET DE TRANSPORT", style: { align: "CENTER" } },
    { type: "SEPARATOR" },
    { type: "TEXT", value: `Passager : ${data.passengerName}` },
    { type: "TEXT", value: `Ref : ${data.bookingReference}` },
    { type: "TEXT", value: `Trajet : ${data.route}` },
    { type: "TEXT", value: `Départ : ${data.departureDate}` },
    ...(data.seatNumber ? [{ type: "TEXT", value: `Siège : ${data.seatNumber}` }] : []),
    { type: "TEXT", value: `Montant : ${data.amountXOF.toLocaleString("fr-CI")} XOF` },
    { type: "SEPARATOR" },
    { type: "TEXT", value: `Terminal : ${data.terminalName}` },
    { type: "TEXT", value: "Présentez ce ticket à l'embarquement", style: { align: "CENTER", small: true } },
    { type: "TEXT", value: "Moja Ride — mojaride.com", style: { align: "CENTER", small: true } },
    { type: "FEED", value: 3 },
  ];

  await BluetoothPrinter.printBill(lines as any);
}
```

---

## 7.6 — Verification Checklist

```bash
# TypeCheck
pnpm --filter booth-app typecheck

# Manual tests:
# Check-in:
# 1. Scan a valid QR → success screen with name + seat ✓
# 2. Scan already-used QR → "already used" error ✓
# 3. Scan QR for wrong terminal → "wrong terminal" error ✓
# 4. Same QR scanned twice in 3s → debounced (no duplicate call) ✓

# Bookings:
# 5. Cash sale shows green badge ✓
# 6. Paystack sale shows blue badge ✓
# 7. Offline sale shows WiFi icon ✓

# Reconciliation:
# 8. Totals add up correctly ✓
# 9. Share text is formatted correctly ✓

# Profile:
# 10. Switch terminal → confirmation modal → hold pool released → terminal select ✓
# 11. Logout → holds released → session cleared → login screen ✓
```
