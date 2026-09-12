import { Cancel01Icon, Copy01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { useMutation, useQuery } from "@tanstack/react-query";
import * as Clipboard from "expo-clipboard";
import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Text, View } from "react-native";
import QRCode from "react-native-qrcode-svg";
import Toast from "react-native-toast-message";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { IconColors } from "@/constants/ui-colors";
import { BoothFeedback } from "@/lib/haptics";
import { useTRPC } from "@/lib/trpc";
import { cn } from "@/lib/utils";

const TIMEOUT_SECONDS = 600;
const POLL_INTERVAL_MS = 3000;

export interface PaystackQRProps {
  holdId: string;
  paymentUrl: string;
  reference: string;
  amountXOF: number;
  onPaid: () => void;
  onTimeout: () => void;
  onBack: () => void;
}

export function PaystackQR({
  holdId,
  paymentUrl,
  reference,
  amountXOF,
  onPaid,
  onTimeout,
  onBack,
}: PaystackQRProps) {
  const { t } = useTranslation();
  const trpc = useTRPC();

  const [secondsLeft, setSecondsLeft] = useState(TIMEOUT_SECONDS);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { data: pollData } = useQuery(
    trpc.booth.pollPaymentStatus.queryOptions(
      { paystackReference: reference },
      {
        refetchInterval: POLL_INTERVAL_MS,
        enabled: secondsLeft > 0,
      },
    ),
  );

  const cancelHold = useMutation(
    trpc.booth.cancelPendingHold.mutationOptions(),
  );

  useEffect(() => {
    if (pollData?.status === "PAID") {
      void BoothFeedback.paymentSuccess();
      onPaid();
    } else if (pollData?.status === "FAILED") {
      void BoothFeedback.invalidScan();
      onTimeout();
    }
  }, [pollData, onPaid, onTimeout]);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          void cancelHold.mutate({ holdGroupId: holdId });
          onTimeout();
          return 0;
        }
        return s - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [holdId, onTimeout, cancelHold]);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;

  const handleCopyLink = async () => {
    await Clipboard.setStringAsync(paymentUrl);
    void BoothFeedback.lightTap();
    Toast.show({
      type: "success",
      text1: "Lien de paiement copié",
      visibilityTime: 2000,
    });
  };

  return (
    <View className="flex-1 items-center justify-center px-6 bg-background">
      <View className="items-center mb-6 max-w-sm">
        <Text className="font-heading text-2xl font-bold text-foreground text-center">
          {t("payment.qrTitle")}
        </Text>
        <Text className="text-muted-foreground text-sm text-center mt-1">
          {t("payment.qrInstruction")}
        </Text>
      </View>

      {/* QR Code Container Card */}
      <Card className="bg-white p-6 rounded-3xl border border-border items-center mb-6">
        <QRCode value={paymentUrl} size={220} />
      </Card>

      {/* Amount Display */}
      <Text className="text-3xl font-heading font-extrabold text-foreground mb-2 tracking-tight">
        {amountXOF.toLocaleString("fr-CI")} XOF
      </Text>

      {/* Countdown and Live Polling Indicator */}
      <View className="flex-row items-center gap-2 mb-4 bg-muted/50 px-3.5 py-1.5 rounded-full border border-border">
        <ActivityIndicator size="small" color={IconColors.info} />
        <Text className="text-muted-foreground text-xs font-medium">
          {t("payment.qrTimeout")}:
        </Text>
        <Text
          className={cn(
            "font-mono font-bold text-xs",
            secondsLeft < 60 ? "text-destructive" : "text-foreground",
          )}
        >
          {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
        </Text>
      </View>

      <Text className="text-muted-foreground/70 text-xs mb-8 text-center max-w-xs">
        {t("payment.qrWaiting")}
      </Text>

      {/* Action Buttons */}
      <View className="w-full max-w-sm flex-col gap-3">
        <Button
          variant="outline"
          size="default"
          onPress={handleCopyLink}
          icon={
            <HugeiconsIcon
              icon={Copy01Icon}
              size={18}
              color={IconColors.default}
            />
          }
          title="Copier le lien de paiement"
        />

        <Button
          variant="ghost"
          size="default"
          onPress={() => {
            void cancelHold.mutate({ holdGroupId: holdId });
            onBack();
          }}
          icon={
            <HugeiconsIcon
              icon={Cancel01Icon}
              size={18}
              color={IconColors.muted}
            />
          }
          title="Annuler le paiement"
        />
      </View>
    </View>
  );
}
