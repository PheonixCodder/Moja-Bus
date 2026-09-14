/**
 * Bookings tab — today's ticket sales list.
 * Financial ledger layout showing all BoothSale records for the selected terminal on the current date,
 * with detailed customer inspection drawer and reprint capability.
 */

import {
  BanknoteIcon,
  CheckmarkCircle02Icon,
  Copy01Icon,
  Invoice01Icon,
  Mail01Icon,
  MapPinIcon,
  PrinterIcon,
  SmartPhone01Icon,
  UserIcon,
  WifiOff01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import * as Clipboard from "expo-clipboard";
import React, { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { OfflineBanner } from "@/components/offline-banner";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Palette } from "@/constants/theme";
import { IconColors } from "@/constants/ui-colors";
import { printTicket } from "@/lib/bluetooth-print";
import { BoothFeedback } from "@/lib/haptics";
import { useTRPC } from "@/lib/trpc";
import {
  selectOperatorProfile,
  selectTerminalId,
  selectTerminalName,
  useSessionStore,
} from "@/stores/session";

type Filter = "ALL" | "CASH" | "PAYSTACK_LINK";

const BOOKING_CARD_HEIGHT = 82;

const getBookingItemLayout = (_: unknown, index: number) => ({
  length: BOOKING_CARD_HEIGHT,
  offset: BOOKING_CARD_HEIGHT * index,
  index,
});

type SaleRecord = {
  id: string;
  paymentMethod: string;
  cashAmountXOF?: number | null;
  confirmedAt?: Date | string | null;
  wasOffline?: boolean;
  booking?: {
    id: string;
    bookingReference?: string | null;
    passengerName?: string | null;
    passengerPhone?: string | null;
    farePaid?: number | null;
    status?: string | null;
    checkedInAt?: Date | string | null;
    seat?: { id?: string; label?: string } | null;
    user?: { email?: string | null; phoneNumber?: string | null } | null;
    originTripStop?: { terminal?: { name?: string } | null } | null;
    destinationTripStop?: { terminal?: { name?: string } | null } | null;
    trip?: {
      id?: string;
      departureDate?: Date | string;
      serviceType?: string;
      gate?: string | null;
      bus?: { registrationPlate?: string | null; internalName?: string | null } | null;
    } | null;
  } | null;
  staff?: {
    id: string;
    user?: { id: string; fullName: string } | null;
  } | null;
};

interface BookingItemProps {
  item: SaleRecord;
  formattedTime: string;
  offlineLabel: string;
  onPress: () => void;
}

const BookingCard = React.memo(function BookingCard({
  item,
  formattedTime,
  offlineLabel,
  onPress,
}: BookingItemProps) {
  const isCash = item.paymentMethod === "CASH";
  const amount = isCash
    ? (item.cashAmountXOF ?? item.booking?.farePaid ?? 0)
    : (item.booking?.farePaid ?? 0);

  const passengerName = item.booking?.passengerName ?? "Passager Guichet";
  const initials = useMemo(() => {
    const parts = passengerName.trim().split(" ");
    if (parts.length >= 2) {
      return `${parts[0]?.[0] ?? ""}${parts[parts.length - 1]?.[0] ?? ""}`.toUpperCase();
    }
    return (parts[0]?.slice(0, 2) ?? "PA").toUpperCase();
  }, [passengerName]);

  return (
    <Pressable
      onPress={onPress}
      className="p-3.5 flex-row items-center gap-3.5 bg-card border border-border/80 rounded-2xl active:scale-[0.99] transition-transform shadow-2xs"
    >
      {/* Passenger Avatar / Initials with Payment Indicator */}
      <View className="relative">
        <View className="w-11 h-11 rounded-2xl bg-muted/60 border border-border/60 items-center justify-center">
          <Text className="font-heading font-black text-xs text-foreground">
            {initials}
          </Text>
        </View>
        <View
          className={`absolute -bottom-1 -right-1 size-4 rounded-full border-2 border-card items-center justify-center ${
            isCash ? "bg-emerald-500" : "bg-primary"
          }`}
        >
          <HugeiconsIcon
            icon={isCash ? BanknoteIcon : SmartPhone01Icon}
            size={9}
            color="white"
          />
        </View>
      </View>

      {/* Center: Passenger info, Reference, Phone hint */}
      <View className="flex-1 min-w-0">
        <Text
          className="font-heading font-bold text-foreground text-sm truncate"
          numberOfLines={1}
        >
          {passengerName}
        </Text>
        <View className="flex-row items-center gap-1.5 mt-0.5">
          <Text className="text-muted-foreground text-xs font-mono font-medium">
            {item.booking?.bookingReference ?? "—"}
          </Text>
          {formattedTime ? (
            <Text className="text-muted-foreground text-[11px]">
              · {formattedTime}
            </Text>
          ) : null}
          {item.wasOffline ? (
            <View className="flex-row items-center gap-0.5 bg-amber-500/10 px-1.5 py-0.2 rounded-full border border-amber-500/20">
              <HugeiconsIcon
                icon={WifiOff01Icon}
                size={9}
                color={IconColors.warning}
              />
              <Text className="text-[9px] font-bold text-amber-800">
                {offlineLabel}
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      {/* Right: Bold Monetary Amount */}
      <View className="items-end shrink-0">
        <Text className="text-sm font-heading font-black text-foreground">
          +{amount.toLocaleString("fr-CI")} FCFA
        </Text>
        <Text
          className={`text-[10px] font-bold uppercase tracking-wider mt-0.5 ${
            isCash ? "text-emerald-700 dark:text-emerald-400" : "text-primary"
          }`}
        >
          {isCash ? "Espèces" : "Mobile"}
        </Text>
      </View>
    </Pressable>
  );
});

export default function BookingsTab() {
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const trpc = useTRPC();
  const terminalId = useSessionStore(selectTerminalId);
  const terminalName = useSessionStore(selectTerminalName);
  const profile = useSessionStore(selectOperatorProfile);

  const [filter, setFilter] = useState<Filter>("ALL");
  const [selectedSale, setSelectedSale] = useState<SaleRecord | null>(null);
  const [copiedRef, setCopiedRef] = useState(false);
  const [reprinting, setReprinting] = useState(false);

  const todayDate = format(new Date(), "yyyy-MM-dd");

  // Fetch sales for current filter
  const { data, isPending, refetch, isRefetching } = useQuery(
    trpc.booth.getTerminalBookings.queryOptions(
      {
        terminalId: terminalId ?? "",
        date: todayDate,
        paymentMethod: filter,
        page: 1,
        limit: 100,
      },
      { enabled: !!terminalId },
    ),
  );

  // Fetch daily reconciliation for total financial totals
  const reconQuery = useQuery(
    trpc.booth.getDailyReconciliation.queryOptions(
      {
        terminalId: terminalId ?? "",
        date: todayDate,
      },
      { enabled: !!terminalId },
    ),
  );

  const filterTabs: { key: Filter; label: string }[] = [
    { key: "ALL", label: t("bookings.filterAll") },
    { key: "CASH", label: t("bookings.filterCash") },
    { key: "PAYSTACK_LINK", label: t("bookings.filterPaystack") },
  ];

  const formattedDate = useMemo(() => {
    const d = new Date();
    const isFr = i18n.language === "fr";
    const locale = isFr ? "fr-FR" : "en-US";
    const prefix = isFr ? "Aujourd'hui, " : "Today, ";
    const dateStr = d.toLocaleDateString(locale, {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    return `${prefix}${dateStr} · ${terminalName || "Guichet"}`;
  }, [i18n.language, terminalName]);

  const formatTime = useCallback(
    (date: Date | string | null | undefined): string => {
      if (!date) return "";
      const d = typeof date === "string" ? new Date(date) : date;
      const locale = i18n.language === "fr" ? "fr-FR" : "en-US";
      return d.toLocaleTimeString(locale, {
        hour: "2-digit",
        minute: "2-digit",
      });
    },
    [i18n.language],
  );

  const formatDateTime = useCallback(
    (date: Date | string | null | undefined): string => {
      if (!date) return "—";
      const d = typeof date === "string" ? new Date(date) : date;
      const locale = i18n.language === "fr" ? "fr-FR" : "en-US";
      return d.toLocaleDateString(locale, {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
    },
    [i18n.language],
  );

  async function handleCopyReference(ref: string) {
    BoothFeedback.tap();
    await Clipboard.setStringAsync(ref);
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2000);
  }

  async function handleReprintTicket(sale: SaleRecord) {
    if (!sale.booking) return;
    setReprinting(true);
    BoothFeedback.tap();

    const isCash = sale.paymentMethod === "CASH";
    const amount = isCash
      ? (sale.cashAmountXOF ?? sale.booking.farePaid ?? 0)
      : (sale.booking.farePaid ?? 0);

    const origin = sale.booking.originTripStop?.terminal?.name ?? terminalName ?? "Départ";
    const destination = sale.booking.destinationTripStop?.terminal?.name ?? "Arrivée";
    const depDate = sale.booking.trip?.departureDate
      ? formatDateTime(sale.booking.trip.departureDate)
      : formattedDate;

    try {
      await printTicket({
        passengerName: sale.booking.passengerName ?? "Passager Guichet",
        bookingReference: sale.booking.bookingReference ?? "MJ-TICKET",
        route: `${origin} → ${destination}`,
        departureDate: depDate,
        seatLabel: sale.booking.seat?.label ?? "LIBRE",
        amountXOF: amount,
        terminalName: terminalName ?? "Terminal",
        companyName: profile?.companyName ?? "Moja Ride",
        busPlate: sale.booking.trip?.bus?.registrationPlate ?? sale.booking.trip?.bus?.internalName ?? undefined,
        gate: sale.booking.trip?.gate ?? undefined,
        cashierName: sale.staff?.user?.fullName ?? profile?.staffName ?? undefined,
      });
      BoothFeedback.successScan();
    } catch {
      Alert.alert("Erreur d'impression", "Vérifiez que votre imprimante thermique est allumée et appairée.");
    } finally {
      setReprinting(false);
    }
  }

  const cashTotalXOF = reconQuery.data?.cashTotalXOF ?? 0;
  const cashSalesCount = reconQuery.data?.cashCount ?? 0;
  const mobileTotalXOF = reconQuery.data?.paystackTotalXOF ?? 0;
  const mobileSalesCount = reconQuery.data?.paystackCount ?? 0;

  const renderItem = useCallback(
    ({ item }: { item: SaleRecord }) => (
      <BookingCard
        item={item}
        formattedTime={formatTime(item.confirmedAt)}
        offlineLabel={t("bookings.offline")}
        onPress={() => {
          BoothFeedback.selection();
          setSelectedSale(item);
        }}
      />
    ),
    [formatTime, t],
  );

  const bottomPadding = insets.bottom > 0 ? insets.bottom + 100 : 120;

  return (
    <View className="flex-1 bg-background">
      <OfflineBanner />

      <PageHeader
        title={t("bookings.title")}
        description={formattedDate}
      />

      {/* Segmented Filter Control */}
      <View style={{ paddingHorizontal: 20 }} className="mb-3.5">
        <View className="bg-muted/40 p-1 rounded-2xl flex-row border border-border/50">
          {filterTabs.map((tab) => {
            const isSelected = filter === tab.key;
            return (
              <Pressable
                key={tab.key}
                onPress={() => {
                  BoothFeedback.selection();
                  setFilter(tab.key);
                }}
                className={`flex-1 py-2 rounded-xl items-center justify-center transition-all ${
                  isSelected
                    ? "bg-primary shadow-xs"
                    : "bg-transparent active:bg-muted/60"
                }`}
              >
                <Text
                  className={`text-xs font-heading font-extrabold ${
                    isSelected ? "text-white" : "text-muted-foreground"
                  }`}
                >
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Financial KPI Summary Cards */}
      <View style={{ paddingHorizontal: 20 }} className="flex-row gap-3 mb-3.5">
        {/* Cash KPI */}
        <View className="flex-1 p-3.5 bg-card border border-border/80 rounded-2xl shadow-2xs gap-1.5">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-1.5">
              <View className="size-6 rounded-lg bg-emerald-500/10 items-center justify-center">
                <HugeiconsIcon
                  icon={BanknoteIcon}
                  size={14}
                  color={IconColors.success}
                />
              </View>
              <Text className="text-muted-foreground text-[10px] font-black uppercase tracking-wider">
                {t("bookings.filterCash")}
              </Text>
            </View>
            <View className="bg-muted/60 px-1.5 py-0.5 rounded-md">
              <Text className="text-[10px] font-bold text-foreground">
                {cashSalesCount}
              </Text>
            </View>
          </View>
          <Text className="text-foreground font-heading font-black text-lg">
            {cashTotalXOF.toLocaleString("fr-CI")}{" "}
            <Text className="text-xs font-extrabold text-muted-foreground">
              FCFA
            </Text>
          </Text>
        </View>

        {/* Mobile / Card KPI */}
        <View className="flex-1 p-3.5 bg-card border border-border/80 rounded-2xl shadow-2xs gap-1.5">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-1.5">
              <View className="size-6 rounded-lg bg-primary/10 items-center justify-center">
                <HugeiconsIcon
                  icon={SmartPhone01Icon}
                  size={14}
                  color={Palette.rose[500]}
                />
              </View>
              <Text className="text-muted-foreground text-[10px] font-black uppercase tracking-wider">
                {t("bookings.filterPaystack")}
              </Text>
            </View>
            <View className="bg-muted/60 px-1.5 py-0.5 rounded-md">
              <Text className="text-[10px] font-bold text-foreground">
                {mobileSalesCount}
              </Text>
            </View>
          </View>
          <Text className="text-foreground font-heading font-black text-lg">
            {mobileTotalXOF.toLocaleString("fr-CI")}{" "}
            <Text className="text-xs font-extrabold text-muted-foreground">
              FCFA
            </Text>
          </Text>
        </View>
      </View>

      {/* Transaction List / Loading */}
      {isPending ? (
        <View style={{ paddingHorizontal: 20 }} className="gap-3 pt-1">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="p-4 gap-2">
              <View className="flex-row justify-between items-center">
                <Skeleton className="h-4 w-36 rounded-md" />
                <Skeleton className="h-5 w-24 rounded-full" />
              </View>
              <Skeleton className="h-3.5 w-24 rounded-md" />
            </Card>
          ))}
        </View>
      ) : (
        <FlatList
          data={(data?.sales as SaleRecord[] | undefined) ?? []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingBottom: bottomPadding,
            gap: 10,
          }}
          getItemLayout={getBookingItemLayout}
          initialNumToRender={10}
          maxToRenderPerBatch={12}
          windowSize={5}
          removeClippedSubviews={Platform.OS === "android"}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching || reconQuery.isRefetching}
              onRefresh={() => {
                refetch();
                reconQuery.refetch();
              }}
              colors={[Palette.rose[500]]}
              tintColor={Palette.rose[500]}
            />
          }
          ListEmptyComponent={
            <View className="items-center justify-center py-16 px-4">
              <View className="w-14 h-14 rounded-full bg-muted/30 items-center justify-center mb-3">
                <HugeiconsIcon
                  icon={Invoice01Icon}
                  size={24}
                  color={IconColors.muted}
                />
              </View>
              <Text className="text-foreground font-heading font-bold text-base text-center">
                {t("bookings.noBookings")}
              </Text>
              <Text className="text-muted-foreground text-xs text-center mt-1">
                {t("bookings.noBookingsHelp") ||
                  "Les billets vendus aujourd'hui s'afficheront ici"}
              </Text>
            </View>
          }
        />
      )}

      {/* Booking Details Bottom Sheet / Drawer */}
      <Modal
        visible={selectedSale !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedSale(null)}
      >
        <Pressable
          className="flex-1 justify-end bg-black/60"
          onPress={() => setSelectedSale(null)}
        >
          <Pressable
            className="bg-card rounded-t-3xl border-t border-border/80 px-6 pt-5 pb-8 shadow-2xl gap-4 max-h-[85%]"
            style={{ paddingBottom: Math.max(insets.bottom + 16, 28) }}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Drawer Handle */}
            <View className="w-12 h-1.5 rounded-full bg-muted-foreground/30 self-center mb-1" />

            {/* Header: Title & Booking Reference Pill */}
            <View className="flex-row items-center justify-between pb-3 border-b border-border/60">
              <View>
                <Text className="text-lg font-heading font-black text-foreground">
                  {t("bookings.detailsTitle")}
                </Text>
                <Text className="text-xs text-muted-foreground mt-0.5">
                  {selectedSale?.confirmedAt ? formatDateTime(selectedSale.confirmedAt) : ""}
                </Text>
              </View>

              {selectedSale?.booking?.bookingReference ? (
                <TouchableOpacity
                  onPress={() => handleCopyReference(selectedSale.booking!.bookingReference!)}
                  className="flex-row items-center gap-1.5 bg-muted/60 border border-border/70 px-3 py-1.5 rounded-full active:bg-muted"
                >
                  <Text className="font-mono text-xs font-black text-foreground">
                    {selectedSale.booking.bookingReference}
                  </Text>
                  <HugeiconsIcon
                    icon={copiedRef ? CheckmarkCircle02Icon : Copy01Icon}
                    size={13}
                    color={copiedRef ? "#059669" : IconColors.muted}
                  />
                </TouchableOpacity>
              ) : null}
            </View>

            <ScrollView showsVerticalScrollIndicator={false} className="gap-4">
              {/* Section 1: Passenger Identification */}
              <View className="gap-2">
                <Text className="text-[11px] font-heading font-black uppercase tracking-wider text-muted-foreground px-1">
                  {t("bookings.passengerInfo")}
                </Text>
                <View className="bg-muted/30 border border-border/60 rounded-2xl p-4 gap-2.5">
                  <View className="flex-row items-center gap-3">
                    <View className="size-10 rounded-xl bg-primary/10 items-center justify-center">
                      <HugeiconsIcon icon={UserIcon} size={18} color={Palette.rose[500]} />
                    </View>
                    <View className="flex-1 min-w-0">
                      <Text className="font-heading font-bold text-foreground text-base truncate">
                        {selectedSale?.booking?.passengerName ?? "Passager"}
                      </Text>
                      <Text className="text-xs text-muted-foreground font-medium">
                        {selectedSale?.booking?.status === "CONFIRMED" ? "Billet validé" : "Confirmé"}
                      </Text>
                    </View>
                  </View>

                  <View className="pt-2 border-t border-border/40 gap-2">
                    {/* Phone Number */}
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center gap-1.5">
                        <HugeiconsIcon icon={SmartPhone01Icon} size={14} color={IconColors.muted} />
                        <Text className="text-xs font-semibold text-muted-foreground">
                          {t("bookings.phone")}
                        </Text>
                      </View>
                      <Text className="text-xs font-mono font-bold text-foreground">
                        {selectedSale?.booking?.passengerPhone ||
                          selectedSale?.booking?.user?.phoneNumber ||
                          "Non renseigné"}
                      </Text>
                    </View>

                    {/* Email */}
                    {selectedSale?.booking?.user?.email ? (
                      <View className="flex-row items-center justify-between">
                        <View className="flex-row items-center gap-1.5">
                          <HugeiconsIcon icon={Mail01Icon} size={14} color={IconColors.muted} />
                          <Text className="text-xs font-semibold text-muted-foreground">
                            {t("bookings.email")}
                          </Text>
                        </View>
                        <Text className="text-xs font-medium text-foreground">
                          {selectedSale.booking.user.email}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                </View>
              </View>

              {/* Section 2: Trip & Seat Details */}
              <View className="gap-2">
                <Text className="text-[11px] font-heading font-black uppercase tracking-wider text-muted-foreground px-1">
                  {t("bookings.tripInfo")}
                </Text>
                <View className="bg-muted/30 border border-border/60 rounded-2xl p-4 gap-2.5">
                  <View className="flex-row items-center gap-2">
                    <HugeiconsIcon icon={MapPinIcon} size={16} color={Palette.rose[500]} />
                    <Text className="font-heading font-bold text-foreground text-sm flex-1">
                      {selectedSale?.booking?.originTripStop?.terminal?.name ?? terminalName ?? "Départ"} →{" "}
                      {selectedSale?.booking?.destinationTripStop?.terminal?.name ?? "Arrivée"}
                    </Text>
                  </View>

                  <View className="grid grid-cols-2 gap-2 pt-2 border-t border-border/40">
                    <View className="flex-row items-center justify-between">
                      <Text className="text-xs font-semibold text-muted-foreground">
                        {t("bookings.seat")}
                      </Text>
                      <View className="bg-primary/10 border border-primary/25 px-2.5 py-0.5 rounded-full">
                        <Text className="text-xs font-black text-primary">
                          {selectedSale?.booking?.seat?.label ? `Siège ${selectedSale.booking.seat.label}` : "Libre / Urbain"}
                        </Text>
                      </View>
                    </View>

                    {selectedSale?.booking?.trip?.bus ? (
                      <View className="flex-row items-center justify-between">
                        <Text className="text-xs font-semibold text-muted-foreground">
                          {t("bookings.bus")}
                        </Text>
                        <Text className="text-xs font-bold text-foreground">
                          {selectedSale.booking.trip.bus.registrationPlate ?? selectedSale.booking.trip.bus.internalName}
                        </Text>
                      </View>
                    ) : null}

                    {selectedSale?.booking?.trip?.gate ? (
                      <View className="flex-row items-center justify-between">
                        <Text className="text-xs font-semibold text-muted-foreground">
                          {t("bookings.gate")}
                        </Text>
                        <Text className="text-xs font-bold text-foreground">
                          Quai {selectedSale.booking.trip.gate}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                </View>
              </View>

              {/* Section 3: Financial & Register Audit */}
              <View className="gap-2">
                <Text className="text-[11px] font-heading font-black uppercase tracking-wider text-muted-foreground px-1">
                  {t("bookings.paymentInfo")}
                </Text>
                <View className="bg-muted/30 border border-border/60 rounded-2xl p-4 gap-2">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-xs font-semibold text-muted-foreground">
                      Montant encaissé
                    </Text>
                    <Text className="text-lg font-heading font-black text-foreground">
                      {((selectedSale?.paymentMethod === "CASH"
                        ? selectedSale?.cashAmountXOF
                        : selectedSale?.booking?.farePaid) ?? 0).toLocaleString("fr-CI")}{" "}
                      FCFA
                    </Text>
                  </View>

                  <View className="flex-row items-center justify-between pt-1">
                    <Text className="text-xs font-semibold text-muted-foreground">
                      Mode de règlement
                    </Text>
                    <View
                      className={`px-2.5 py-0.5 rounded-full ${
                        selectedSale?.paymentMethod === "CASH"
                          ? "bg-emerald-500/10 border border-emerald-500/25"
                          : "bg-primary/10 border border-primary/25"
                      }`}
                    >
                      <Text
                        className={`text-xs font-black ${
                          selectedSale?.paymentMethod === "CASH"
                            ? "text-emerald-800 dark:text-emerald-400"
                            : "text-primary"
                        }`}
                      >
                        {selectedSale?.paymentMethod === "CASH" ? "Espèces (Guichet)" : "Mobile Money (QR)"}
                      </Text>
                    </View>
                  </View>

                  <View className="flex-row items-center justify-between pt-1">
                    <Text className="text-xs font-semibold text-muted-foreground">
                      {t("bookings.cashier")}
                    </Text>
                    <Text className="text-xs font-bold text-foreground">
                      {selectedSale?.staff?.user?.fullName ?? profile?.staffName ?? "Guichetier"}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Action Buttons */}
              <View className="gap-2.5 pt-3">
                <TouchableOpacity
                  onPress={() => selectedSale && handleReprintTicket(selectedSale)}
                  disabled={reprinting}
                  className="h-12 bg-primary rounded-2xl flex-row items-center justify-center gap-2 active:opacity-90 shadow-2xs"
                >
                  {reprinting ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <>
                      <HugeiconsIcon icon={PrinterIcon} size={18} color="white" />
                      <Text className="text-white font-heading font-black text-sm">
                        {t("bookings.reprint")}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setSelectedSale(null)}
                  className="h-11 bg-muted/50 rounded-2xl items-center justify-center active:bg-muted"
                >
                  <Text className="text-foreground font-bold text-sm">
                    {t("bookings.close")}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
