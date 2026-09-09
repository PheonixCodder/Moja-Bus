/**
 * Check-in tab — QR scanner for ticket validation at departure gate.
 * Uses expo-camera to scan boarding pass QR codes and calls the
 * booth.checkInPassenger tRPC procedure to validate and stamp check-in.
 */
import {
  BarcodeScanIcon,
  CancelCircleIcon,
  CheckmarkCircle01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { useMutation } from "@tanstack/react-query";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useTRPC } from "@/lib/trpc";
import { useSessionStore } from "@/stores/session";
import { IconColors } from "@/constants/ui-colors";

type ScanState = "scanning" | "success" | "error";

interface CheckInResult {
  passengerName: string;
  departureTime: string | null;
  bookingId: string;
}

export default function CheckInTab() {
  const { t } = useTranslation();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanState, setScanState] = useState<ScanState>("scanning");
  const [result, setResult] = useState<CheckInResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const lastScannedToken = useRef<string | null>(null);

  const terminal = useSessionStore((s) => s.terminal);
  const trpc = useTRPC();

  const checkIn = useMutation(trpc.booth.checkInPassenger.mutationOptions());

  async function handleQRScan(token: string) {
    if (token === lastScannedToken.current || isProcessing) return;
    if (!terminal) return;
    lastScannedToken.current = token;
    setIsProcessing(true);

    try {
      const res = await checkIn.mutateAsync({
        ticketToken: token,
        terminalId: terminal.id,
      });

      setResult({
        passengerName: res.passengerName,
        departureTime: res.checkedInAt,
        bookingId: res.bookingId,
      });
      setScanState("success");
    } catch (e: unknown) {
      const error = e as { data?: { code?: string }; message?: string };
      const code = error.data?.code;
      const msg = error.message ?? t("errors.generic");

      if (code === "NOT_FOUND") {
        setErrorMsg(t("checkin.errorNotFound"));
      } else if (code === "CONFLICT") {
        setErrorMsg(t("checkin.errorUsed"));
      } else if (code === "FORBIDDEN") {
        setErrorMsg(t("checkin.errorWrongTerminal"));
      } else {
        setErrorMsg(t("checkin.errorStatus", { status: msg }));
      }
      setScanState("error");
    } finally {
      setIsProcessing(false);
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
        <HugeiconsIcon icon={BarcodeScanIcon} size={48} color={IconColors.muted} />
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
      <View className="absolute top-14 left-0 right-0 z-10 items-center">
        <Text className="text-white font-heading text-xl font-bold">
          {t("checkin.title")}
        </Text>
        <Text className="text-white/70 text-sm mt-1">
          {t("checkin.instruction")}
        </Text>
      </View>

      {scanState === "scanning" && (
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
          onBarcodeScanned={(data) => {
            if (data.data) handleQRScan(data.data);
          }}
          barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
        />
      )}

      {scanState === "scanning" && (
        <View className="flex-1 items-center justify-center">
          <View className="w-64 h-64 border-2 border-white/60 rounded-2xl" />
        </View>
      )}

      {isProcessing && (
        <View className="absolute bottom-14 left-0 right-0 items-center">
          <ActivityIndicator size="large" color={IconColors.onPrimary} />
          <Text className="text-white/70 text-sm mt-2">Validation...</Text>
        </View>
      )}

      {scanState === "success" && result && (
        <View className="flex-1 items-center justify-center px-8 gap-6">
          <HugeiconsIcon
            icon={CheckmarkCircle01Icon}
            size={72}
            color={IconColors.success}
          />
          <Text className="text-white font-heading text-2xl font-bold text-center">
            {t("checkin.success")}
          </Text>
          <View className="bg-white/10 rounded-2xl px-6 py-5 w-full gap-2">
            <Text className="text-white font-semibold text-lg">
              {result.passengerName}
            </Text>
            <Text className="text-white/80 text-sm">
              {result.departureTime}
            </Text>
          </View>
        </View>
      )}

      {scanState === "error" && (
        <View className="flex-1 items-center justify-center px-8 gap-6">
          <HugeiconsIcon icon={CancelCircleIcon} size={72} color={IconColors.error} />
          <Text className="text-white font-heading text-2xl font-bold text-center">
            {t("checkin.error")}
          </Text>
          <View className="bg-white/10 rounded-2xl px-6 py-4 w-full">
            <Text className="text-white/90 text-center">{errorMsg}</Text>
          </View>
        </View>
      )}
    </View>
  );
}
