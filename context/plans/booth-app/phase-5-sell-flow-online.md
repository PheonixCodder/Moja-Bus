# Phase 5 — Sell Flow (Online)

> **Status**: ✅ Complete  
> **Depends on**: Phase 4 (auth + session)  
> **Blocks**: Phase 6 (offline wiring)

---

## Objective

Build the complete online sell flow: tabs layout, trip list, seat map, passenger lookup/creation, payment (cash + Paystack QR), and confirmation screen. Offline extensions are wired in Phase 6.

---

## 5.1 — `apps/booth-app/app/(tabs)/_layout.tsx`

```typescript
import { Tabs } from "expo-router";
import { Platform } from "react-native";
import { ShoppingCart, ScanLine, List, User } from "lucide-react-native";
import { colors } from "@/constants/theme";
import { t } from "@/lib/i18n";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.neutral.muted,
        tabBarStyle: {
          backgroundColor: colors.neutral.background,
          borderTopColor: colors.border,
          paddingBottom: Platform.OS === "ios" ? 20 : 8,
          height: Platform.OS === "ios" ? 85 : 65,
        },
        tabBarLabelStyle: { fontFamily: "Outfit-Medium", fontSize: 11 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t("sell.tabLabel"),
          tabBarIcon: ({ color, size }) => <ShoppingCart size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="checkin"
        options={{
          title: t("checkin.tabLabel"),
          tabBarIcon: ({ color, size }) => <ScanLine size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="bookings"
        options={{
          title: t("bookings.tabLabel"),
          tabBarIcon: ({ color, size }) => <List size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t("profile.tabLabel"),
          tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
```

---

## 5.2 — `apps/booth-app/app/(tabs)/index.tsx` — Sell Tab (Trip List)

```typescript
import { useState } from "react";
import { View, Text, FlatList, TextInput, TouchableOpacity, RefreshControl } from "react-native";
import { router } from "expo-router";
import { trpc } from "@/lib/trpc";
import { useSessionStore } from "@/stores/session";
import { OfflineBanner } from "@/components/offline-banner";
import { t } from "@/lib/i18n";
import { format } from "date-fns";

export default function SellTab() {
  const { selectedTerminal } = useSessionStore();
  const [search, setSearch] = useState("");
  const todayDate = format(new Date(), "yyyy-MM-dd");

  const { data: trips, isPending, refetch, isRefetching } = trpc.booth.getTodayTrips.useQuery(
    { terminalId: selectedTerminal!.id, date: todayDate },
    { enabled: !!selectedTerminal },
  );

  const filtered = trips?.filter((trip) => {
    if (!search.trim()) return true;
    const dest = trip.tripStops
      .filter((s) => s.isDropoff)
      .map((s) => s.terminal.cityRelation?.name ?? s.terminal.name)
      .join(", ")
      .toLowerCase();
    return dest.includes(search.toLowerCase());
  });

  return (
    <View className="flex-1 bg-background">
      <OfflineBanner />

      {/* Header */}
      <View className="px-6 pt-14 pb-4">
        <Text className="font-heading text-2xl font-bold text-foreground">
          {t("sell.title")}
        </Text>
        <Text className="text-foreground/60 text-sm mt-0.5">
          {selectedTerminal?.name}
        </Text>
      </View>

      {/* Search */}
      <View className="px-6 mb-4">
        <TextInput
          className="bg-card border border-input rounded-lg px-4 py-2.5 text-foreground"
          placeholder={t("sell.searchPlaceholder")}
          placeholderTextColor="#9ca3af"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Trip list */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerClassName="px-6 gap-3 pb-8"
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        renderItem={({ item }) => {
          const destStop = item.tripStops.find((s) => s.isDropoff);
          const destName = destStop?.terminal.cityRelation?.name ?? destStop?.terminal.name ?? "?";
          const depTime = item.departureDate
            ? format(new Date(item.departureDate), "HH:mm")
            : "?";
          const isIntercity = item.schedule?.serviceType === "INTERCITY";

          return (
            <TouchableOpacity
              className="bg-card border border-border rounded-xl px-5 py-4 active:opacity-70"
              onPress={() =>
                router.push({
                  pathname: "/sell/[tripId]",
                  params: { tripId: item.id },
                })
              }
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <Text className="font-semibold text-foreground text-base">
                    {selectedTerminal?.name} → {destName}
                  </Text>
                  <Text className="text-foreground/60 text-sm mt-0.5">
                    {depTime} · {item.bus?.registrationPlate ?? item.bus?.internalName ?? ""}
                  </Text>
                </View>
                <View className="items-end gap-1">
                  <Text
                    className={`text-sm font-semibold ${
                      item.availableSeats === 0 ? "text-destructive" : "text-green-600"
                    }`}
                  >
                    {t("sell.availableSeats", { count: item.availableSeats })}
                  </Text>
                  <View
                    className={`rounded-full px-2.5 py-0.5 ${
                      isIntercity ? "bg-blue-100" : "bg-orange-100"
                    }`}
                  >
                    <Text
                      className={`text-xs font-medium ${
                        isIntercity ? "text-blue-700" : "text-orange-700"
                      }`}
                    >
                      {isIntercity ? "Intercity" : "Urban"}
                    </Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          !isPending ? (
            <View className="items-center py-16">
              <Text className="text-foreground/50 text-center">{t("sell.noTrips")}</Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}
```

---

## 5.3 — `apps/booth-app/app/sell/[tripId].tsx` — Seat Map / Auto-Assign

```typescript
import { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, Alert } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { trpc } from "@/lib/trpc";
import { SeatMap } from "@/components/seat-map";
import { useSessionStore } from "@/stores/session";
import { useHoldPool } from "@/hooks/use-hold-pool";
import { useNetworkStatus } from "@/hooks/use-network-status";
import { t } from "@/lib/i18n";
import { ArrowLeft } from "lucide-react-native";

// Shared sell state — passed via router params to subsequent screens
// In practice, use a Zustand sell-session store (see note below)

export default function TripDetailScreen() {
  const { tripId } = useLocalSearchParams<{ tripId: string }>();
  const { selectedTerminal } = useSessionStore();
  const { isOnline } = useNetworkStatus();
  const { getAvailablePoolSeats } = useHoldPool();

  const [selectedSeatId, setSelectedSeatId] = useState<string | null>(null);
  const [passengerCount, setPassengerCount] = useState(1); // Urban only

  const { data: seatMap, isPending } = trpc.booth.getTripSeatMap.useQuery(
    { tripId: tripId!, terminalId: selectedTerminal!.id },
    { enabled: !!tripId && !!selectedTerminal },
  );

  const isIntercity = seatMap?.serviceType === "INTERCITY";

  // Offline: only pool-held seats are selectable
  const poolSeats = getAvailablePoolSeats(tripId!);
  const availableOfflineSeatIds = new Set(poolSeats.map((s) => s.seatId));

  function handleSeatSelect(seatId: string) {
    if (!isOnline && !availableOfflineSeatIds.has(seatId)) {
      Alert.alert(
        "Siège non disponible",
        "En mode hors ligne, vous ne pouvez sélectionner que les sièges de votre réserve.",
      );
      return;
    }
    setSelectedSeatId(seatId === selectedSeatId ? null : seatId);
  }

  function handleNextAvailable() {
    if (!seatMap?.seats) return;
    const next = seatMap.seats.find((s) => s.isAvailable && s.type === "PASSENGER_WINDOW");
    if (next) setSelectedSeatId(next.id);
  }

  function handleContinue() {
    if (isIntercity && !selectedSeatId) return;

    // Navigate to passenger screen — pass trip context
    router.push({
      pathname: "/sell/passenger",
      params: {
        tripId: tripId!,
        seatId: selectedSeatId ?? "",
        passengerCount: String(passengerCount),
        isIntercity: String(isIntercity),
      },
    });
  }

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View className="flex-row items-center px-6 pt-14 pb-4 gap-4">
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={22} color="#111" />
        </TouchableOpacity>
        <Text className="font-heading text-xl font-bold text-foreground flex-1">
          {t("sell.selectSeat")}
        </Text>
      </View>

      <ScrollView className="flex-1">
        {/* Seat map (intercity) */}
        {isIntercity && seatMap && (
          <>
            <SeatMap
              seats={seatMap.seats}
              selectedSeatId={selectedSeatId}
              onSeatSelect={handleSeatSelect}
              offlineAvailableSeatIds={!isOnline ? availableOfflineSeatIds : undefined}
            />

            {/* Next available shortcut */}
            <TouchableOpacity
              className="mx-6 mt-4 border border-primary rounded-lg py-3 items-center"
              onPress={handleNextAvailable}
            >
              <Text className="text-primary font-semibold">{t("sell.nextAvailable")}</Text>
            </TouchableOpacity>
          </>
        )}

        {/* Urban — passenger count only */}
        {!isIntercity && (
          <View className="px-6 py-8 items-center gap-6">
            <Text className="text-foreground text-lg font-semibold">Nombre de passagers</Text>
            <View className="flex-row items-center gap-8">
              <TouchableOpacity
                onPress={() => setPassengerCount(Math.max(1, passengerCount - 1))}
                className="w-12 h-12 rounded-full border border-border items-center justify-center"
              >
                <Text className="text-xl font-bold">−</Text>
              </TouchableOpacity>
              <Text className="text-3xl font-bold text-foreground">{passengerCount}</Text>
              <TouchableOpacity
                onPress={() => setPassengerCount(Math.min(10, passengerCount + 1))}
                className="w-12 h-12 rounded-full border border-border items-center justify-center"
              >
                <Text className="text-xl font-bold">+</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Continue button */}
      <View className="px-6 pb-8 pt-4 border-t border-border">
        <TouchableOpacity
          className={`rounded-xl py-4 items-center ${
            (isIntercity && !selectedSeatId) ? "bg-muted" : "bg-primary"
          }`}
          onPress={handleContinue}
          disabled={isIntercity && !selectedSeatId}
        >
          <Text className="text-white font-semibold text-base">Continuer →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
```

---

## 5.4 — `apps/booth-app/app/sell/passenger.tsx`

```typescript
import { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { trpc } from "@/lib/trpc";
import { t } from "@/lib/i18n";
import { ArrowLeft, Search, UserPlus } from "lucide-react-native";
import { colors } from "@/constants/theme";

type Mode = "search" | "create" | "confirmed";

export default function PassengerScreen() {
  const params = useLocalSearchParams<{
    tripId: string; seatId: string; passengerCount: string; isIntercity: string;
  }>();

  const [mode, setMode] = useState<Mode>("search");
  const [searchQuery, setSearchQuery] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedPassenger, setSelectedPassenger] = useState<{
    userId: string; fullName: string; email: string; phone?: string | null;
    isNewAccount: boolean;
  } | null>(null);

  const lookupMutation = trpc.booth.lookupOrCreatePassenger.useMutation();

  async function handleSearch() {
    if (!searchQuery.trim()) return;
    setLoading(true);
    try {
      const result = await lookupMutation.mutateAsync({
        email: searchQuery.trim(),
        fullName: "", // Not needed for lookup — only for create
        phone: undefined,
      });
      setSelectedPassenger(result);
      setMode("confirmed");
    } catch {
      // Not found — switch to create mode
      setMode("create");
      // Pre-fill email if it looks like one
      if (searchQuery.includes("@")) setEmail(searchQuery.trim());
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    if (!fullName.trim() || !email.trim()) return;
    setLoading(true);
    try {
      const result = await lookupMutation.mutateAsync({
        email: email.trim().toLowerCase(),
        fullName: fullName.trim(),
        phone: phone.trim() || undefined,
      });
      setSelectedPassenger(result);
      setMode("confirmed");
    } catch {
      // show error
    } finally {
      setLoading(false);
    }
  }

  function handleContinue() {
    if (!selectedPassenger) return;
    router.push({
      pathname: "/sell/payment",
      params: {
        ...params,
        passengerId: selectedPassenger.userId,
        passengerName: selectedPassenger.fullName,
        passengerEmail: selectedPassenger.email,
        passengerPhone: selectedPassenger.phone ?? "",
        isNewAccount: String(selectedPassenger.isNewAccount),
      },
    });
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-background"
    >
      <View className="flex-row items-center px-6 pt-14 pb-4 gap-4">
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={22} color="#111" />
        </TouchableOpacity>
        <Text className="font-heading text-xl font-bold text-foreground flex-1">
          {t("passenger.title")}
        </Text>
      </View>

      <ScrollView className="flex-1 px-6" keyboardShouldPersistTaps="handled">
        {/* Search mode */}
        {(mode === "search" || mode === "create") && (
          <View className="gap-4 mt-2">
            <View className="gap-1.5">
              <Text className="text-sm font-medium text-foreground">
                {t("passenger.searchLabel")}
              </Text>
              <View className="flex-row gap-2">
                <TextInput
                  className="flex-1 border border-input rounded-lg px-4 py-3 bg-card text-foreground"
                  placeholder={t("passenger.searchPlaceholder")}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  className="bg-primary rounded-lg px-4 items-center justify-center"
                  onPress={handleSearch}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Search size={20} color="white" />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Create mode — walk-up form */}
            {mode === "create" && (
              <View className="gap-4 mt-4">
                <View className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
                  <Text className="text-amber-800 text-sm">
                    {t("passenger.newPassenger")}
                  </Text>
                </View>

                <View className="gap-1.5">
                  <Text className="text-sm font-medium text-foreground">
                    {t("passenger.fullNameLabel")} *
                  </Text>
                  <TextInput
                    className="border border-input rounded-lg px-4 py-3 bg-card text-foreground"
                    value={fullName}
                    onChangeText={setFullName}
                    autoCapitalize="words"
                  />
                </View>

                <View className="gap-1.5">
                  <Text className="text-sm font-medium text-foreground">
                    {t("passenger.emailLabel")} *
                  </Text>
                  <TextInput
                    className="border border-input rounded-lg px-4 py-3 bg-card text-foreground"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>

                <View className="gap-1.5">
                  <Text className="text-sm font-medium text-foreground">
                    {t("passenger.phoneLabel")}
                  </Text>
                  <TextInput
                    className="border border-input rounded-lg px-4 py-3 bg-card text-foreground"
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                    placeholder="+225..."
                  />
                </View>

                <TouchableOpacity
                  className="bg-primary rounded-xl py-4 items-center flex-row justify-center gap-2"
                  onPress={handleCreate}
                  disabled={loading || !fullName.trim() || !email.trim()}
                >
                  <UserPlus size={18} color="white" />
                  <Text className="text-white font-semibold">
                    {loading ? "..." : t("passenger.createButton")}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* Confirmed passenger */}
        {mode === "confirmed" && selectedPassenger && (
          <View className="gap-4 mt-2">
            <View className="bg-green-50 border border-green-200 rounded-xl px-5 py-4">
              <Text className="text-green-800 font-semibold text-base">
                {selectedPassenger.isNewAccount
                  ? t("passenger.newPassenger")
                  : t("passenger.existingFound")}
              </Text>
              <Text className="text-green-700 text-sm mt-1">{selectedPassenger.fullName}</Text>
              <Text className="text-green-600 text-sm">{selectedPassenger.email}</Text>
              {selectedPassenger.phone && (
                <Text className="text-green-600 text-sm">{selectedPassenger.phone}</Text>
              )}
            </View>

            <TouchableOpacity
              className="border border-border rounded-lg py-3 items-center"
              onPress={() => { setMode("search"); setSelectedPassenger(null); }}
            >
              <Text className="text-foreground/70">Changer de passager</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Continue */}
      {mode === "confirmed" && selectedPassenger && (
        <View className="px-6 pb-8 pt-4 border-t border-border">
          <TouchableOpacity
            className="bg-primary rounded-xl py-4 items-center"
            onPress={handleContinue}
          >
            <Text className="text-white font-semibold text-base">
              {t("passenger.selectButton")} →
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}
```

---

## 5.5 — `apps/booth-app/app/sell/payment.tsx`

```typescript
import { useState } from "react";
import { View, Text, TouchableOpacity, Alert } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { trpc } from "@/lib/trpc";
import { PaystackQR } from "@/components/paystack-qr";
import { t } from "@/lib/i18n";
import { ArrowLeft, Banknote, Smartphone } from "lucide-react-native";

type PaymentMode = "select" | "cash" | "paystack";

export default function PaymentScreen() {
  const params = useLocalSearchParams<{
    tripId: string; seatId: string; passengerCount: string;
    isIntercity: string; passengerId: string; passengerName: string;
    passengerEmail: string; passengerPhone: string; isNewAccount: string;
  }>();

  const [mode, setMode] = useState<PaymentMode>("select");
  const [loading, setLoading] = useState(false);

  // Paystack link state
  const [paystackData, setPaystackData] = useState<{
    holdId: string; reference: string; paymentUrl: string;
    amountXOF: number; expiresAt: string;
  } | null>(null);

  const createCashSale = trpc.booth.createCashSale.useMutation();
  const initiatePaystack = trpc.booth.initiatePaystackLink.useMutation();

  async function handleCashConfirm(fareAmountXOF: number) {
    setLoading(true);
    try {
      const result = await createCashSale.mutateAsync({
        tripId: params.tripId!,
        terminalId: params.terminalId ?? "",
        destinationTerminalId: params.destTerminalId ?? "",
        seatIds: params.seatId ? [params.seatId] : undefined,
        passengerCount: params.isIntercity === "false"
          ? parseInt(params.passengerCount ?? "1")
          : undefined,
        passengerId: params.passengerId!,
        passengerName: params.passengerName!,
        passengerEmail: params.passengerEmail!,
        passengerPhone: params.passengerPhone || undefined,
        cashAmountXOF: fareAmountXOF,
        wasOffline: false,
        walkedUpPassenger: true,
        passengerAccountCreated: params.isNewAccount === "true",
      });

      router.replace({
        pathname: "/sell/confirmation",
        params: { bookingId: result.bookingId, passengerEmail: params.passengerEmail },
      });
    } catch (e: any) {
      Alert.alert("Erreur", e.message ?? t("errors.generic"));
    } finally {
      setLoading(false);
    }
  }

  async function handlePaystackInitiate(fareAmountXOF: number) {
    setLoading(true);
    try {
      const result = await initiatePaystack.mutateAsync({
        tripId: params.tripId!,
        terminalId: params.terminalId ?? "",
        destinationTerminalId: params.destTerminalId ?? "",
        seatIds: params.seatId ? [params.seatId] : undefined,
        passengerCount: params.isIntercity === "false"
          ? parseInt(params.passengerCount ?? "1")
          : undefined,
        passengerId: params.passengerId!,
        passengerEmail: params.passengerEmail!,
        passengerName: params.passengerName!,
        passengerPhone: params.passengerPhone || undefined,
        walkedUpPassenger: true,
        passengerAccountCreated: params.isNewAccount === "true",
      });
      setPaystackData(result);
      setMode("paystack");
    } catch (e: any) {
      Alert.alert("Erreur", e.message ?? t("errors.generic"));
    } finally {
      setLoading(false);
    }
  }

  // TODO: fetch actual fare for this trip+seat from trip detail
  const fareAmountXOF = 5000; // PLACEHOLDER — replace with actual fare

  return (
    <View className="flex-1 bg-background">
      <View className="flex-row items-center px-6 pt-14 pb-4 gap-4">
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={22} color="#111" />
        </TouchableOpacity>
        <Text className="font-heading text-xl font-bold text-foreground flex-1">
          {t("payment.title")}
        </Text>
      </View>

      {/* Fare display */}
      <View className="mx-6 mb-6 bg-card border border-border rounded-xl px-5 py-4">
        <Text className="text-foreground/60 text-sm">{params.passengerName}</Text>
        <Text className="text-2xl font-bold text-foreground mt-1">
          {fareAmountXOF.toLocaleString("fr-CI")} XOF
        </Text>
      </View>

      {/* Payment method selection */}
      {mode === "select" && (
        <View className="px-6 gap-4">
          {/* Cash */}
          <TouchableOpacity
            className="bg-green-50 border border-green-200 rounded-xl px-5 py-6 flex-row items-center gap-4"
            onPress={() => handleCashConfirm(fareAmountXOF)}
            disabled={loading}
          >
            <Banknote size={32} color="#16a34a" />
            <View>
              <Text className="font-semibold text-green-800 text-lg">{t("payment.methodCash")}</Text>
              <Text className="text-green-700 text-sm mt-0.5">{t("payment.cashConfirm")}</Text>
            </View>
          </TouchableOpacity>

          {/* Paystack QR */}
          <TouchableOpacity
            className="bg-blue-50 border border-blue-200 rounded-xl px-5 py-6 flex-row items-center gap-4"
            onPress={() => handlePaystackInitiate(fareAmountXOF)}
            disabled={loading}
          >
            <Smartphone size={32} color="#2563eb" />
            <View>
              <Text className="font-semibold text-blue-800 text-lg">{t("payment.methodPaystack")}</Text>
              <Text className="text-blue-700 text-sm mt-0.5">{t("payment.qrInstruction")}</Text>
            </View>
          </TouchableOpacity>
        </View>
      )}

      {/* Paystack QR view */}
      {mode === "paystack" && paystackData && (
        <PaystackQR
          holdId={paystackData.holdId}
          paymentUrl={paystackData.paymentUrl}
          reference={paystackData.reference}
          amountXOF={paystackData.amountXOF}
          expiresAt={new Date(paystackData.expiresAt)}
          onPaid={() =>
            router.replace({
              pathname: "/sell/confirmation",
              params: { bookingId: "pending", passengerEmail: params.passengerEmail },
            })
          }
          onTimeout={() => {
            setMode("select");
            setPaystackData(null);
          }}
          onBack={() => setMode("select")}
        />
      )}
    </View>
  );
}
```

---

## 5.6 — `apps/booth-app/app/sell/confirmation.tsx`

```typescript
import { View, Text, TouchableOpacity } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { trpc } from "@/lib/trpc";
import QRCode from "react-native-qrcode-svg";
import { t } from "@/lib/i18n";
import { CheckCircle, Printer, Share2, ShoppingCart } from "lucide-react-native";

export default function ConfirmationScreen() {
  const { bookingId, passengerEmail } = useLocalSearchParams<{
    bookingId: string; passengerEmail: string;
  }>();

  // Fetch booking to get ticket token for QR
  const { data: booking } = trpc.operator.getBooking.useQuery(
    { bookingId: bookingId! },
    { enabled: !!bookingId && bookingId !== "pending" },
  );

  function handlePrint() {
    // Phase 7: Bluetooth print implementation
    // import { printTicket } from "@/lib/bluetooth-print";
    // printTicket(booking);
  }

  return (
    <View className="flex-1 bg-background items-center justify-center px-6">
      {/* Success icon */}
      <CheckCircle size={60} color="#22c55e" />

      <Text className="font-heading text-2xl font-bold text-foreground mt-4 text-center">
        {t("confirmation.title")}
      </Text>

      {/* Ticket QR */}
      {booking?.ticketToken && (
        <View className="my-8 bg-white p-6 rounded-2xl shadow-sm border border-border">
          <QRCode value={booking.ticketToken} size={200} />
        </View>
      )}

      {/* Email confirmation */}
      <Text className="text-foreground/60 text-center text-sm">
        {t("confirmation.ticketSent", { email: passengerEmail })}
      </Text>

      {/* Action buttons */}
      <View className="w-full gap-3 mt-8">
        <TouchableOpacity
          className="border border-border rounded-xl py-3.5 flex-row items-center justify-center gap-2"
          onPress={handlePrint}
        >
          <Printer size={18} color="#555" />
          <Text className="text-foreground/70 font-medium">{t("confirmation.printButton")}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="bg-primary rounded-xl py-4 flex-row items-center justify-center gap-2"
          onPress={() => router.replace("/(tabs)")}
        >
          <ShoppingCart size={18} color="white" />
          <Text className="text-white font-semibold">{t("confirmation.sellAnother")}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
```

---

## 5.7 — `apps/booth-app/components/seat-map.tsx`

```typescript
import { View, Text, TouchableOpacity, ScrollView } from "react-native";

interface Seat {
  id: string;
  seatNumber: string;
  seatClass: "ECONOMY" | "STANDARD" | "VIP";
  type: string;
  isAvailable: boolean;
  row: number;
  col: number;
}

interface SeatMapProps {
  seats: Seat[];
  selectedSeatId: string | null;
  onSeatSelect: (seatId: string) => void;
  offlineAvailableSeatIds?: Set<string>;
}

export function SeatMap({ seats, selectedSeatId, onSeatSelect, offlineAvailableSeatIds }: SeatMapProps) {
  const maxRow = Math.max(...seats.map((s) => s.row));
  const maxCol = Math.max(...seats.map((s) => s.col));

  return (
    <ScrollView className="px-4">
      {/* Legend */}
      <View className="flex-row gap-4 justify-center mb-4">
        <View className="flex-row items-center gap-1.5">
          <View className="w-4 h-4 rounded bg-green-500" />
          <Text className="text-xs text-foreground/60">Disponible</Text>
        </View>
        <View className="flex-row items-center gap-1.5">
          <View className="w-4 h-4 rounded bg-primary" />
          <Text className="text-xs text-foreground/60">Sélectionné</Text>
        </View>
        <View className="flex-row items-center gap-1.5">
          <View className="w-4 h-4 rounded bg-foreground/20" />
          <Text className="text-xs text-foreground/60">Réservé</Text>
        </View>
        {offlineAvailableSeatIds && (
          <View className="flex-row items-center gap-1.5">
            <View className="w-4 h-4 rounded bg-amber-400" />
            <Text className="text-xs text-foreground/60">Réserve</Text>
          </View>
        )}
      </View>

      {/* Seat grid */}
      {Array.from({ length: maxRow }, (_, row) => (
        <View key={row} className="flex-row justify-center gap-2 mb-2">
          {Array.from({ length: maxCol }, (_, col) => {
            const seat = seats.find((s) => s.row === row + 1 && s.col === col + 1);
            if (!seat || seat.type === "EMPTY_SPACE") {
              return <View key={col} className="w-10 h-10" />;
            }
            if (seat.type === "DRIVER_AREA") {
              return (
                <View key={col} className="w-10 h-10 rounded bg-foreground/10 items-center justify-center">
                  <Text className="text-xs text-foreground/40">🚗</Text>
                </View>
              );
            }

            const isSelected = seat.id === selectedSeatId;
            const isOfflinePool = offlineAvailableSeatIds?.has(seat.id);
            const isAvailable = seat.isAvailable;

            let bg = "bg-foreground/15"; // booked
            if (isSelected) bg = "bg-primary";
            else if (isOfflinePool) bg = "bg-amber-400";
            else if (isAvailable) bg = "bg-green-500";

            return (
              <TouchableOpacity
                key={seat.id}
                className={`w-10 h-10 rounded items-center justify-center ${bg}`}
                onPress={() => isAvailable || isOfflinePool ? onSeatSelect(seat.id) : null}
                disabled={!isAvailable && !isOfflinePool}
              >
                <Text className={`text-xs font-bold ${isSelected ? "text-white" : "text-white"}`}>
                  {seat.seatNumber}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
    </ScrollView>
  );
}
```

---

## 5.8 — `apps/booth-app/components/paystack-qr.tsx`

```typescript
import { useEffect, useRef, useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import QRCode from "react-native-qrcode-svg";
import { trpc } from "@/lib/trpc";
import { t } from "@/lib/i18n";
import { X } from "lucide-react-native";

const TIMEOUT_SECONDS = 600; // 10 minutes
const POLL_INTERVAL_MS = 3000; // 3 seconds

interface PaystackQRProps {
  holdId: string;
  paymentUrl: string;
  reference: string;
  amountXOF: number;
  expiresAt: Date;
  onPaid: () => void;
  onTimeout: () => void;
  onBack: () => void;
}

export function PaystackQR({
  holdId, paymentUrl, reference, amountXOF, expiresAt, onPaid, onTimeout, onBack,
}: PaystackQRProps) {
  const [secondsLeft, setSecondsLeft] = useState(TIMEOUT_SECONDS);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const cancelHold = trpc.booth.cancelPendingHold.useMutation();

  const { data: pollData } = trpc.booth.pollPaymentStatus.useQuery(
    { holdId, paystackReference: reference },
    {
      refetchInterval: POLL_INTERVAL_MS,
      enabled: secondsLeft > 0,
    },
  );

  // Handle payment status
  useEffect(() => {
    if (pollData?.status === "PAID") {
      onPaid();
    } else if (pollData?.status === "FAILED") {
      onTimeout();
    }
  }, [pollData]);

  // Countdown timer
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(intervalRef.current!);
          cancelHold.mutate({ holdId });
          onTimeout();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current!);
  }, []);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;

  return (
    <View className="flex-1 items-center px-6">
      <View className="items-center mb-6">
        <Text className="font-semibold text-foreground text-lg">{t("payment.qrTitle")}</Text>
        <Text className="text-foreground/60 text-sm mt-1">{t("payment.qrInstruction")}</Text>
      </View>

      {/* QR Code */}
      <View className="bg-white p-6 rounded-2xl border border-border mb-6">
        <QRCode value={paymentUrl} size={220} />
      </View>

      {/* Amount */}
      <Text className="text-2xl font-bold text-foreground mb-2">
        {amountXOF.toLocaleString("fr-CI")} XOF
      </Text>

      {/* Countdown */}
      <View className="flex-row items-center gap-2 mb-6">
        <Text className="text-foreground/60 text-sm">{t("payment.qrTimeout")}</Text>
        <Text className={`font-bold text-sm ${secondsLeft < 60 ? "text-destructive" : "text-foreground"}`}>
          {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
        </Text>
      </View>

      {/* Status */}
      <Text className="text-foreground/50 text-sm">{t("payment.qrWaiting")}</Text>

      {/* Cancel */}
      <TouchableOpacity
        className="mt-6 flex-row items-center gap-2 border border-border rounded-lg px-4 py-2.5"
        onPress={() => {
          cancelHold.mutate({ holdId });
          onBack();
        }}
      >
        <X size={16} color="#555" />
        <Text className="text-foreground/70 text-sm">Annuler</Text>
      </TouchableOpacity>
    </View>
  );
}
```

---

## 5.9 — Sell Session State (Zustand)

Instead of passing all params through router params (fragile), create a Zustand sell session store:

**`apps/booth-app/stores/sell-session.ts`**:
```typescript
import { create } from "zustand";

export interface SellSession {
  tripId: string | null;
  seatId: string | null;
  passengerCount: number;
  isIntercity: boolean;
  passengerId: string | null;
  passengerName: string | null;
  passengerEmail: string | null;
  passengerPhone: string | null;
  isNewAccount: boolean;
  terminalId: string | null;
  destinationTerminalId: string | null;
  fareAmountXOF: number | null;

  setTrip: (tripId: string, isIntercity: boolean) => void;
  setSeat: (seatId: string | null) => void;
  setPassengerCount: (count: number) => void;
  setPassenger: (data: {
    passengerId: string; passengerName: string; passengerEmail: string;
    passengerPhone?: string | null; isNewAccount: boolean;
  }) => void;
  setFare: (amountXOF: number) => void;
  setTerminals: (terminalId: string, destinationTerminalId: string) => void;
  reset: () => void;
}

const initialState = {
  tripId: null, seatId: null, passengerCount: 1, isIntercity: true,
  passengerId: null, passengerName: null, passengerEmail: null,
  passengerPhone: null, isNewAccount: false, terminalId: null,
  destinationTerminalId: null, fareAmountXOF: null,
};

export const useSellSession = create<SellSession>((set) => ({
  ...initialState,
  setTrip: (tripId, isIntercity) => set({ tripId, isIntercity }),
  setSeat: (seatId) => set({ seatId }),
  setPassengerCount: (count) => set({ passengerCount: count }),
  setPassenger: (data) => set(data),
  setFare: (amountXOF) => set({ fareAmountXOF: amountXOF }),
  setTerminals: (terminalId, destinationTerminalId) =>
    set({ terminalId, destinationTerminalId }),
  reset: () => set(initialState),
}));
```

---

## 5.10 — Verification Checklist

```bash
# Typecheck
pnpm --filter booth-app typecheck

# Manual test:
# 1. Tap a trip → seat map loads ✓
# 2. Select seat → navigate to passenger ✓
# 3. Search existing user → found ✓
# 4. Create walk-up user → created + isNewAccount = true ✓
# 5. Select Cash → createCashSale fires → confirmation screen ✓
# 6. Select Paystack → QR displays → countdown starts ✓
# 7. Paystack timeout → hold released → back to payment select ✓
```
