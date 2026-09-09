import { X } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Text, TouchableOpacity, View } from "react-native";
import QRCode from "react-native-qrcode-svg";
import { BoothFeedback } from "@/lib/haptics";
import { useTRPC } from "@/lib/trpc";
import { IconColors } from "@/constants/ui-colors";

const TIMEOUT_SECONDS = 600;
const POLL_INTERVAL_MS = 3000;

interface PaystackQRProps {
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
      BoothFeedback.paymentSuccess();
      onPaid();
    } else if (pollData?.status === "FAILED") {
      BoothFeedback.invalidScan();
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

  return (
    <View className="flex-1 items-center px-6 bg-background">
      <View className="items-center mb-6">
        <Text className="font-semibold text-foreground text-lg">
          {t("payment.qrTitle")}
        </Text>
        <Text className="text-foreground/60 text-sm mt-1">
          {t("payment.qrInstruction")}
        </Text>
      </View>

      <View className="bg-white p-4 rounded-2xl border border-border mb-6">
        <QRCode value={paymentUrl} size={220} />
      </View>

      <Text className="text-2xl font-bold text-foreground mb-2">
        {amountXOF.toLocaleString("fr-CI")} XOF
      </Text>

      <View className="flex-row items-center gap-2 mb-6">
        <Text className="text-foreground/60 text-sm">
          {t("payment.qrTimeout")}
        </Text>
        <Text
          className={`font-bold text-sm ${
            secondsLeft < 60 ? "text-red-500" : "text-foreground"
          }`}
        >
          {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
        </Text>
      </View>

      <Text className="text-foreground/50 text-sm mb-6">
        {t("payment.qrWaiting")}
      </Text>

      <TouchableOpacity
        className="mt-4 flex-row items-center gap-2 border border-border rounded-lg px-4 py-2.5"
        onPress={() => {
          void cancelHold.mutate({ holdGroupId: holdId });
          onBack();
        }}
      >
        <HugeiconsIcon icon={X} size={16} color={IconColors.muted} />
        <Text className="text-foreground/70 text-sm">Annuler</Text>
      </TouchableOpacity>
    </View>
  );
}
