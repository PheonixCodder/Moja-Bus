import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { HugeiconsIcon } from '@hugeicons/react-native';
import {
  Cancel01Icon,
  UserIcon,
  Call02Icon,
  Wallet01Icon,
  CreditCardIcon,
  CheckmarkCircle01Icon,
  SparklesIcon,
} from '@hugeicons/core-free-icons';
import { Colors, Palette } from '@/constants/theme';
import { authClient } from '@/lib/auth-client';
import { useTRPC } from '@/lib/trpc';
import { useSavedPassengers } from '@/hooks/use-passengers';
import { useWalletBalance } from '@/hooks/use-wallet';
import {
  useCreateHold,
  useCheckoutWithWallet,
  useInitiatePayment,
  useVerifyPayment,
  useReleaseHold,
} from '@/features/booking/hooks/use-booking-actions';
import { PaystackWebView } from '@/features/settings/components/paystack-webview';
import type { Offer } from './offer-card';
import { formatPriceXOF } from '../lib/format';
import { resolveDiscountRejectionMessage } from '../lib/discount-errors';

export interface PassengerDraft {
  seatId: string;
  passengerName: string;
  passengerPhone: string;
  savedId?: string;
}

interface PassengerFormSheetProps {
  visible: boolean;
  offer: Offer | null;
  seatIds: string[];
  onClose: () => void;
  onBack: () => void;
}

export function PassengerFormSheet({
  visible,
  offer,
  seatIds,
  onClose,
  onBack,
}: PassengerFormSheetProps) {
  const { t } = useTranslation(['search', 'booking']);
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // Auth & Saved Data
  const { data: session } = authClient.useSession();
  const isAuthenticated = !!session?.user;
  const { data: savedData } = useSavedPassengers(isAuthenticated);
  const savedPassengers = savedData?.items ?? [];

  const balanceQuery = useWalletBalance(isAuthenticated);
  const walletBalance = balanceQuery.data?.availableBalance ?? 0;
  const trpc = useTRPC();

  // Mutations
  const createHold = useCreateHold();
  const checkoutWallet = useCheckoutWithWallet();
  const initiatePayment = useInitiatePayment();
  const verifyPayment = useVerifyPayment();
  const releaseHold = useReleaseHold();

  // State
  const [passengers, setPassengers] = useState<PassengerDraft[]>(() =>
    seatIds.map((id) => ({ seatId: id, passengerName: '', passengerPhone: '' }))
  );
  const [paymentMethod, setPaymentMethod] = useState<'WALLET' | 'PAYSTACK'>('WALLET');
  const [promoCode, setPromoCode] = useState('');
  const [appliedCode, setAppliedCode] = useState<string | undefined>(undefined);

  // Paystack Modal State
  const [authorizationUrl, setAuthorizationUrl] = useState<string | null>(null);
  const [paystackReference, setPaystackReference] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [pendingChargeXOF, setPendingChargeXOF] = useState<number | null>(null);
  const [activeHoldId, setActiveHoldId] = useState<string | null>(null);
  /** Booking refs from createHold — never use Paystack `moja_…` as ticket ref */
  const [heldBookingRefs, setHeldBookingRefs] = useState<string[]>([]);

  const seatCount = Math.min(Math.max(seatIds.length, 1), 6);
  const pricingQuery = useQuery({
    ...trpc.payments.getCheckoutPricing.queryOptions({
      offerId: offer?.id ?? '',
      seatCount,
      paymentMethod,
      code: appliedCode,
      autoApply: true,
      useCredits: true,
    }),
    enabled: visible && !!offer?.id && seatIds.length > 0,
  });

  // Re-sync if seatIds change
  useEffect(() => {
    setPassengers(
      seatIds.map((id) => ({ seatId: id, passengerName: '', passengerPhone: '' }))
    );
  }, [seatIds.join(',')]);

  // Pre-fill first passenger if user has a self saved profile
  useEffect(() => {
    if (savedPassengers.length > 0 && passengers.length > 0) {
      const self = savedPassengers.find((p) => p.isSelf) ?? savedPassengers[0];
      if (self && !passengers[0]?.passengerName) {
        setPassengers((prev) =>
          prev.map((p, idx) =>
            idx === 0
              ? {
                  ...p,
                  passengerName: self.fullName,
                  passengerPhone: self.phone,
                  savedId: self.id,
                }
              : p
          )
        );
      }
    }
  }, [savedPassengers.length]);

  const updatePassenger = (
    idx: number,
    field: 'passengerName' | 'passengerPhone' | 'savedId',
    value: string
  ) => {
    setPassengers((prev) =>
      prev.map((p, i) => (i === idx ? { ...p, [field]: value } : p))
    );
  };

  const handleSelectSavedPassenger = (idx: number, savedId: string) => {
    const saved = savedPassengers.find((p) => p.id === savedId);
    if (!saved) return;
    setPassengers((prev) =>
      prev.map((p, i) =>
        i === idx
          ? {
              ...p,
              passengerName: saved.fullName,
              passengerPhone: saved.phone,
              savedId: saved.id,
            }
          : p
      )
    );
  };

  const fallbackSubtotal = (offer?.priceXOF ?? 0) * (seatIds.length || 1);
  const preDiscountSubtotalXOF =
    pricingQuery.data?.preDiscountSubtotalXOF ?? fallbackSubtotal;
  const subtotalBaseXOF = pricingQuery.data?.subtotalBaseXOF ?? fallbackSubtotal;
  const ticketDiscountXOF = pricingQuery.data?.ticketDiscountXOF ?? 0;
  const creditAppliedXOF = pricingQuery.data?.creditAppliedXOF ?? 0;
  const convenienceFeeXOF =
    pricingQuery.data?.displayFeeXOF ??
    (paymentMethod === 'WALLET' ? 0 : (pricingQuery.data?.convenienceFeeXOF ?? 0));
  const totalAmountXOF =
    pricingQuery.data?.payableXOF ??
    (paymentMethod === 'WALLET'
      ? Math.max(0, subtotalBaseXOF - creditAppliedXOF)
      : (pricingQuery.data?.chargeAmountXOF ?? subtotalBaseXOF + convenienceFeeXOF));

  const isZeroCash = totalAmountXOF === 0 && pricingQuery.data !== undefined;
  const effectivePaymentMethod = isZeroCash ? 'WALLET' : paymentMethod;

  const isValid = passengers.every(
    (p) => p.passengerName.trim().length >= 2 && p.passengerPhone.trim().length >= 6
  );

  const isPending =
    createHold.isPending ||
    checkoutWallet.isPending ||
    initiatePayment.isPending ||
    releaseHold.isPending ||
    isVerifying;

  const handleConfirmAndPay = async () => {
    if (!offer) return;
    if (!isValid) {
      Alert.alert(t('passengerFormTitle'), t('passengerFormValidation'));
      return;
    }

    if (effectivePaymentMethod === 'WALLET' && !isZeroCash && walletBalance < totalAmountXOF) {
      Alert.alert(
        t('booking:insufficientFunds'),
        t('booking:insufficientWallet'),
        [
          { text: t('booking:cancel'), style: 'cancel' },
          {
            text: t('booking:topUpWallet'),
            onPress: () => {
              onClose();
              router.push('/wallet');
            },
          },
        ]
      );
      return;
    }

    let holdId: string | null = null;

    try {
      if (!pricingQuery.data?.quoteId) {
        Alert.alert(t('error'), t('passengerFormValidation'));
        return;
      }
      const { getDeviceHash } = await import("@/lib/device-hash");
      const deviceHash = await getDeviceHash();
      const holdResult = await createHold.mutateAsync({
        offerId: offer.id,
        quoteId: pricingQuery.data.quoteId,
        passengers: passengers.map((p) =>
          p.savedId
            ? { seatId: p.seatId, savedPassengerId: p.savedId }
            : {
                seatId: p.seatId,
                passenger: {
                  passengerName: p.passengerName.trim(),
                  passengerPhone: p.passengerPhone.trim(),
                },
              }
        ),
        discount: {
          code: appliedCode,
          autoApply: true,
          useCredits: true,
        },
        ...(deviceHash ? { deviceHash } : {}),
      });

      holdId = holdResult.holdId;
      setActiveHoldId(holdId);
      setHeldBookingRefs(holdResult.bookingReferences ?? []);
      const walletCharge = holdResult.subtotalBaseXOF ?? subtotalBaseXOF;
      const paystackCharge = holdResult.totalAmountXOF ?? totalAmountXOF;

      if (effectivePaymentMethod === 'WALLET') {
        if (!isZeroCash && walletBalance < walletCharge) {
          await releaseHold.mutateAsync({ holdId });
          Alert.alert(
            t('booking:insufficientFunds'),
            t('booking:insufficientWallet'),
            [
              { text: t('booking:cancel'), style: 'cancel' },
              {
                text: t('booking:topUpWallet'),
                onPress: () => {
                  onClose();
                  router.push('/wallet');
                },
              },
            ]
          );
          return;
        }

        const walletResult = await checkoutWallet.mutateAsync({ holdId });
        const ref =
          walletResult.bookingReferences?.find((r) => !!r && !r.startsWith('moja_')) ??
          holdResult.bookingReferences?.find((r) => !!r && !r.startsWith('moja_')) ??
          null;
        setActiveHoldId(null);
        setHeldBookingRefs([]);
        onClose();
        if (!ref) {
          Alert.alert(
            t('booking:bookingConfirmedTitle'),
            t('booking:paymentOkCheckBookings', {
              defaultValue:
                'Payment received. Open My Bookings to view your ticket.',
            }),
          );
          router.replace('/(tabs)/bookings' as any);
          return;
        }
        router.push(
          `/booking/success?reference=${encodeURIComponent(ref)}&total=${walletCharge}&method=WALLET`
        );
      } else {
        setPendingChargeXOF(paystackCharge);
        const paystackResult = await initiatePayment.mutateAsync({
          holdId,
          payerEmail: session?.user?.email ?? undefined,
        });

        if (paystackResult.paystack?.authorizationUrl) {
          setAuthorizationUrl(paystackResult.paystack.authorizationUrl);
          setPaystackReference(paystackResult.paystack.reference ?? null);
        } else {
          await releaseHold.mutateAsync({ holdId });
          Alert.alert(t('error'), 'Could not initiate Paystack checkout.');
        }
      }
    } catch (err: any) {
      if (holdId) {
        try {
          await releaseHold.mutateAsync({ holdId });
        } catch {
          // Hold may already be expired or released
        }
      }
      const msg = err?.message ?? '';
      if (msg.includes('hold is no longer active') || msg.includes('expired')) {
        Alert.alert(
          t('error'),
          'Your seat reservation has expired. Please select your seats again.',
          [{ text: 'OK', onPress: onBack }]
        );
      } else {
        Alert.alert(t('error'), msg || t('holdFailed'));
      }
    }
  };

  const handlePaystackSuccess = async (ref?: string) => {
    setAuthorizationUrl(null);
    setIsVerifying(true);
    const referenceToVerify = ref || paystackReference;
    const chargeTotal = pendingChargeXOF ?? totalAmountXOF;

    const pickBookingRef = (refs?: string[] | null) =>
      refs?.find((r) => !!r && !r.startsWith('moja_')) ?? null;

    try {
      let bookingRef =
        pickBookingRef(heldBookingRefs) ??
        null;

      if (referenceToVerify) {
        const confirmed = await verifyPayment.mutateAsync({
          reference: referenceToVerify,
        });
        bookingRef =
          pickBookingRef(confirmed.bookingReferences) ?? bookingRef;
      }

      if (!bookingRef) {
        Alert.alert(
          t('booking:bookingConfirmedTitle'),
          t('booking:paymentOkCheckBookings', {
            defaultValue:
              'Payment received. Open My Bookings to view your ticket.',
          }),
        );
        onClose();
        router.replace('/(tabs)/bookings' as any);
        return;
      }

      setActiveHoldId(null);
      setHeldBookingRefs([]);
      onClose();
      router.push(
        `/booking/success?reference=${encodeURIComponent(bookingRef)}&total=${chargeTotal}&method=PAYSTACK`
      );
    } catch {
      Alert.alert(t('error'), 'Payment confirmation failed. Please check your bookings.');
    } finally {
      setIsVerifying(false);
      setPendingChargeXOF(null);
      setActiveHoldId(null);
    }
  };

  const handlePaystackCancel = async () => {
    setAuthorizationUrl(null);
    setPaystackReference(null);
    setPendingChargeXOF(null);
    setHeldBookingRefs([]);
    if (activeHoldId) {
      try {
        await releaseHold.mutateAsync({ holdId: activeHoldId });
      } catch {
        // Hold may already be expired
      }
      setActiveHoldId(null);
    }
  };

  const handleCloseSheet = async () => {
    if (activeHoldId && !authorizationUrl) {
      try {
        await releaseHold.mutateAsync({ holdId: activeHoldId });
      } catch {
        // ignore
      }
      setActiveHoldId(null);
    }
    onClose();
  };

  if (!offer) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => {
        void handleCloseSheet();
      }}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <View
          className="flex-1 bg-background"
          style={{ paddingTop: Math.max(insets.top, 12) }}
        >
          {/* Header */}
          <View className="flex-row items-center justify-between p-4 bg-card border-b border-border">
            <Pressable onPress={onBack} accessibilityRole="button" className="p-2 -ml-2 min-h-11 justify-center">
              <Text className="text-primary font-bold text-sm">
                ← {t('back')}
              </Text>
            </Pressable>
            <Text className="text-base font-extrabold text-foreground">
              {t('passengerFormTitle')}
            </Text>
            <Pressable onPress={() => { void handleCloseSheet(); }} accessibilityRole="button" className="p-2 bg-muted rounded-full min-h-9 justify-center items-center">
              <HugeiconsIcon icon={Cancel01Icon} size={18} color={Palette.zinc[400]} />
            </Pressable>
          </View>

          <ScrollView
            className="flex-1"
            contentContainerStyle={{ padding: 16, paddingBottom: 140 }}
            keyboardShouldPersistTaps="handled"
          >
            {/* Route summary + pricing */}
            <View className="bg-card border border-border rounded-2xl p-4 mb-5 shadow-xs">
              <View className="flex-row items-center justify-between border-b border-border/40 pb-3 mb-3">
                <View className="flex-1">
                  <Text className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    {offer.operatorName}
                  </Text>
                  <Text className="text-base font-black text-foreground" numberOfLines={1}>
                    {offer.departureCity} → {offer.arrivalCity}
                  </Text>
                </View>
                <View className="bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-full">
                  <Text className="text-primary font-black text-sm">
                    {formatPriceXOF(totalAmountXOF)}
                  </Text>
                </View>
              </View>

              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-xs font-semibold text-muted-foreground">
                  {offer.departureTime} - {t('search:seatsSelected', { count: seatIds.length })}
                </Text>
                <Text className="text-xs font-bold text-primary">
                  {offer.busClass} {t('booking:seatClass')}
                </Text>
              </View>

              <View className="gap-1.5 pt-1 border-t border-border/40">
                <View className="flex-row items-center justify-between">
                  <Text className="text-sm text-muted-foreground">{t('booking:baseFare')}</Text>
                  <Text className="text-sm font-semibold text-foreground">
                    {formatPriceXOF(preDiscountSubtotalXOF)}
                  </Text>
                </View>
                {ticketDiscountXOF > 0 ? (
                  <View className="flex-row items-center justify-between">
                    <Text className="text-sm text-success">Discount</Text>
                    <Text className="text-sm font-semibold text-success">
                      −{formatPriceXOF(ticketDiscountXOF)}
                    </Text>
                  </View>
                ) : null}
                {creditAppliedXOF > 0 ? (
                  <View className="flex-row items-center justify-between">
                    <Text className="text-sm text-success">Credits</Text>
                    <Text className="text-sm font-semibold text-success">
                      −{formatPriceXOF(creditAppliedXOF)}
                    </Text>
                  </View>
                ) : null}
                {convenienceFeeXOF > 0 ? (
                  <View className="flex-row items-center justify-between">
                    <Text className="text-sm text-muted-foreground">{t('booking:convenienceFee')}</Text>
                    <Text className="text-sm font-semibold text-foreground">
                      {formatPriceXOF(convenienceFeeXOF)}
                    </Text>
                  </View>
                ) : paymentMethod === 'WALLET' ? (
                  <View className="flex-row items-center justify-between">
                    <Text className="text-sm text-muted-foreground">{t('booking:convenienceFee')}</Text>
                    <Text className="text-sm font-semibold text-success">
                      {t('booking:convenienceFeeWaived')}
                    </Text>
                  </View>
                ) : null}
                <View className="flex-row items-center justify-between pt-1">
                  <Text className="text-base font-black text-foreground">{t('booking:totalAmount')}</Text>
                  <Text className="text-base font-black text-primary">
                    {formatPriceXOF(totalAmountXOF)}
                  </Text>
                </View>
              </View>
            </View>

            {/* Passenger Forms */}
            {passengers.map((pax, idx) => (
              <View
                key={pax.seatId}
                className="bg-card rounded-2xl border border-border shadow-xs mb-4 overflow-hidden"
              >
                {/* Passenger card header */}
                <View className="flex-row items-center px-4 py-3 bg-muted border-b border-border justify-between">
                  <View className="flex-row items-center">
                    <View className="w-6 h-6 rounded-full bg-primary items-center justify-center mr-2">
                      <Text className="text-primary-foreground text-xs font-black">{idx + 1}</Text>
                    </View>
                    <Text className="text-sm font-bold text-foreground">
                      {t('passengerLabel', { number: idx + 1 })}
                    </Text>
                  </View>
                  <View className="bg-muted px-2.5 py-0.5 rounded-full">
                    <Text className="text-muted-foreground text-xs font-bold">
                      {t('booking:seatNumber', { number: idx + 1 })}
                    </Text>
                  </View>
                </View>

                <View className="p-4 gap-3">
                  {/* Quick Select Saved Passenger Dropdown */}
                  {isAuthenticated && savedPassengers.length > 0 ? (
                    <View className="mb-2">
                      <Text className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-1">
                        {t('booking:useSavedPassenger')}
                      </Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-2">
                        {savedPassengers.map((saved) => {
                          const isSelected = pax.savedId === saved.id;
                          return (
                            <Pressable
                              key={saved.id}
                              onPress={() => handleSelectSavedPassenger(idx, saved.id)}
                              accessibilityRole="button"
                              className={`flex-row items-center px-3 py-1.5 rounded-full border min-h-8 ${
                                isSelected
                                  ? 'bg-primary/10 border-primary/30'
                                  : 'bg-muted border-border'
                              }`}
                            >
                              <HugeiconsIcon
                                icon={UserIcon}
                                size={12}
                                color={isSelected ? Palette.rose[500] : Palette.zinc[400]}
                                className="mr-1"
                              />
                              <Text
                                className={`text-xs font-bold ${
                                  isSelected ? 'text-primary' : 'text-foreground'
                                }`}
                              >
                                {saved.fullName}
                              </Text>
                            </Pressable>
                          );
                        })}
                      </ScrollView>
                    </View>
                  ) : null}

                  {/* Name field */}
                  <View>
                    <Text className="text-xs font-bold text-muted-foreground mb-1.5 uppercase tracking-wider">
                      {t('passengerNameLabel')}
                    </Text>
                    <View className="flex-row items-center bg-background border border-border rounded-xl px-3 py-3">
                      <HugeiconsIcon icon={UserIcon} size={18} color={Colors.light.textSecondary} />
                      <TextInput
                        className="flex-1 ml-2.5 text-base text-foreground font-medium"
                        placeholder={t('passengerNamePlaceholder')}
                        placeholderTextColor={Colors.light.textSecondary}
                        value={pax.passengerName}
                        onChangeText={(v) => updatePassenger(idx, 'passengerName', v)}
                        autoCapitalize="words"
                      />
                    </View>
                  </View>

                  {/* Phone field */}
                  <View>
                    <Text className="text-xs font-bold text-muted-foreground mb-1.5 uppercase tracking-wider">
                      {t('passengerPhoneLabel')}
                    </Text>
                    <View className="flex-row items-center bg-background border border-border rounded-xl px-3 py-3">
                      <HugeiconsIcon icon={Call02Icon} size={18} color={Colors.light.textSecondary} />
                      <TextInput
                        className="flex-1 ml-2.5 text-base text-foreground font-medium"
                        placeholder={t('passengerPhonePlaceholder')}
                        placeholderTextColor={Colors.light.textSecondary}
                        value={pax.passengerPhone}
                        onChangeText={(v) => updatePassenger(idx, 'passengerPhone', v)}
                        keyboardType="phone-pad"
                      />
                    </View>
                  </View>
                </View>
              </View>
            ))}

            {/* Promo code */}
            <View className="bg-card rounded-2xl border border-border p-4 shadow-xs mb-4">
              <Text className="text-xs font-extrabold text-foreground uppercase tracking-wider mb-3">
                {t('booking:promoCode')}
              </Text>
              <View className="flex-row gap-2 mb-3">
                <TextInput
                  className="flex-1 bg-background border border-border rounded-xl px-3 py-3 text-sm font-semibold text-foreground uppercase"
                  placeholder={t('booking:promoPlaceholder')}
                  placeholderTextColor={Colors.light.textSecondary}
                  value={promoCode}
                  editable={!appliedCode && !isPending}
                  autoCapitalize="characters"
                  onChangeText={(v) => setPromoCode(v.toUpperCase())}
                />
                <Pressable
                  disabled={(!promoCode.trim() && !appliedCode) || isPending}
                  onPress={() => {
                    if (appliedCode) {
                      setAppliedCode(undefined);
                      setPromoCode('');
                      return;
                    }
                    setAppliedCode(promoCode.trim().toUpperCase());
                  }}
                  className="px-4 rounded-xl bg-primary items-center justify-center"
                >
                  <Text className="text-primary-foreground text-xs font-bold">
                    {appliedCode ? t('booking:removePromo') : t('booking:applyPromo')}
                  </Text>
                </Pressable>
              </View>
              {ticketDiscountXOF > 0 ? (
                <Text className="text-xs text-success font-semibold mb-2">
                  {t('booking:discountLabel')} −{formatPriceXOF(ticketDiscountXOF)}
                </Text>
              ) : null}
              {pricingQuery.data?.discountOk === false && appliedCode ? (
                <Text className="text-xs text-destructive mb-2">
                  {resolveDiscountRejectionMessage(
                    pricingQuery.data?.discountRejection?.messageKey,
                    t
                  )}
                </Text>
              ) : null}
              <View className="mt-3 gap-1 border-t border-border pt-3">
                <View className="flex-row justify-between">
                  <Text className="text-xs text-muted-foreground">Fare</Text>
                  <Text className="text-xs font-semibold text-foreground">
                    {formatPriceXOF(preDiscountSubtotalXOF)}
                  </Text>
                </View>
                {ticketDiscountXOF > 0 ? (
                  <View className="flex-row justify-between">
                    <Text className="text-xs text-success">Discount</Text>
                    <Text className="text-xs font-semibold text-success">
                      −{formatPriceXOF(ticketDiscountXOF)}
                    </Text>
                  </View>
                ) : null}
                {creditAppliedXOF > 0 ? (
                  <View className="flex-row justify-between">
                    <Text className="text-xs text-success">Credits</Text>
                    <Text className="text-xs font-semibold text-success">
                      −{formatPriceXOF(creditAppliedXOF)}
                    </Text>
                  </View>
                ) : null}
                {convenienceFeeXOF > 0 ? (
                  <View className="flex-row justify-between">
                    <Text className="text-xs text-muted-foreground">Service fee</Text>
                    <Text className="text-xs font-semibold text-foreground">
                      {formatPriceXOF(convenienceFeeXOF)}
                    </Text>
                  </View>
                ) : null}
              </View>
            </View>

              {/* Payment Method Selector or 100% Promo Covered Banner */}
              {isZeroCash ? (
                <View className="bg-success/10 rounded-2xl border border-success/20 p-4 shadow-xs mb-4">
                  <View className="flex-row items-center gap-2 mb-2">
                    <HugeiconsIcon icon={SparklesIcon} size={18} color={Palette.emerald[500]} />
                    <Text className="text-sm font-black text-foreground">
                      {t('booking:freeCoverTitle')}
                    </Text>
                  </View>
                  <Text className="text-xs text-success leading-relaxed">
                    {t('booking:freeCoverBody')}
                  </Text>
                </View>
              ) : (
                <View className="bg-card rounded-2xl border border-border p-4 shadow-xs mb-4">
                  <Text className="text-xs font-extrabold text-foreground uppercase tracking-wider mb-3">
                    {t('booking:selectPaymentMethod')}
                  </Text>

                  <View className="gap-2.5">
                    {/* Option 1: Wallet Balance */}
                    <Pressable
                      onPress={() => setPaymentMethod('WALLET')}
                      accessibilityRole="button"
                      className={`p-3.5 rounded-xl border flex-row items-center justify-between min-h-12 ${
                        paymentMethod === 'WALLET'
                          ? 'bg-primary/10 border-primary'
                          : 'bg-muted/50 border-border'
                      }`}
                    >
                      <View className="flex-row items-center flex-1 mr-2">
                        <View className="w-9 h-9 rounded-full bg-primary/10 items-center justify-center mr-3">
                          <HugeiconsIcon icon={Wallet01Icon} size={20} color={Palette.rose[500]} />
                        </View>
                        <View className="flex-1">
                          <View className="flex-row items-center gap-1.5">
                            <Text className="text-sm font-black text-foreground">{t('booking:mojaWallet')}</Text>
                            <View className="bg-success/10 px-2 py-0.5 rounded-full border border-success/20">
                              <Text className="text-success text-xs font-bold">{t('booking:zeroFee')}</Text>
                            </View>
                          </View>
                          <Text className="text-xs text-muted-foreground mt-0.5">
                            {t('booking:available')}: {formatPriceXOF(walletBalance)}
                          </Text>
                          {paymentMethod === 'WALLET' && walletBalance < totalAmountXOF ? (
                            <Text className="text-xs text-warning font-semibold mt-1">
                              {t('booking:walletShortfall', {
                                short: formatPriceXOF(totalAmountXOF - walletBalance),
                              })}
                            </Text>
                          ) : null}
                        </View>
                      </View>
                      {paymentMethod === 'WALLET' ? (
                        <HugeiconsIcon icon={CheckmarkCircle01Icon} size={20} color={Palette.rose[500]} />
                      ) : null}
                    </Pressable>

                    {/* Option 2: Paystack (Card / Mobile Money) */}
                    <Pressable
                      onPress={() => setPaymentMethod('PAYSTACK')}
                      accessibilityRole="button"
                      className={`p-3.5 rounded-xl border flex-row items-center justify-between min-h-12 ${
                        paymentMethod === 'PAYSTACK'
                          ? 'bg-primary/10 border-primary'
                          : 'bg-muted/50 border-border'
                      }`}
                    >
                      <View className="flex-row items-center flex-1 mr-2">
                        <View className="w-9 h-9 rounded-full bg-muted items-center justify-center mr-3">
                          <HugeiconsIcon icon={CreditCardIcon} size={20} color={Palette.zinc[400]} />
                        </View>
                        <View className="flex-1">
                          <Text className="text-sm font-black text-foreground">{t('booking:cardMobileMoney')}</Text>
                          <Text className="text-xs text-muted-foreground mt-0.5">
                            {t('booking:paystackCheckout')}
                          </Text>
                        </View>
                      </View>
                      {paymentMethod === 'PAYSTACK' ? (
                        <HugeiconsIcon icon={CheckmarkCircle01Icon} size={20} color={Palette.rose[500]} />
                      ) : null}
                    </Pressable>
                  </View>

                  {/* Fee-waiver nudge if Paystack selected but wallet could cover */}
                  {paymentMethod === 'PAYSTACK' && walletBalance >= totalAmountXOF ? (
                    <View className="bg-muted rounded-xl p-3 mt-3 border border-border">
                      <Text className="text-xs text-muted-foreground text-center font-medium">
                        {t('booking:walletFeeWaiverNudge')}
                      </Text>
                    </View>
                  ) : null}
                </View>
              )}
            </ScrollView>

            {/* Sticky Bottom Action Bar */}
            <View
              className="absolute left-4 right-4 bg-card p-3 border-t border-border rounded-t-2xl shadow-lg"
              style={{ bottom: Math.max(insets.bottom, 16) }}
            >
              <Pressable
                onPress={handleConfirmAndPay}
                disabled={!isValid || isPending}
                accessibilityRole="button"
                className={`p-4 rounded-2xl items-center flex-row justify-center gap-2 min-h-12 shadow-sm ${
                  !isValid || isPending
                    ? 'bg-muted opacity-60'
                    : 'bg-primary active:opacity-90'
                }`}
              >
                {isPending ? <ActivityIndicator size="small" color={Palette.zinc[50]} /> : null}
                <Text
                  className={`font-black text-base uppercase tracking-wider ${
                    !isValid || isPending ? 'text-muted-foreground' : 'text-primary-foreground'
                  }`}
                >
                  {isPending
                    ? t('search:holdingSeats')
                    : isZeroCash
                    ? t('booking:confirmFreeBooking')
                    : `${t('booking:confirmPayment')} (${formatPriceXOF(totalAmountXOF)})`}
                </Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>

      {/* Paystack Native WebView Overlay */}
      <PaystackWebView
        authorizationUrl={authorizationUrl ?? ''}
        reference={paystackReference ?? undefined}
        visible={!!authorizationUrl}
        onSuccess={handlePaystackSuccess}
        onCancel={handlePaystackCancel}
      />
    </Modal>
  );
}
