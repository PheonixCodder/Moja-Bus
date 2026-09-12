/**
 * Check-in tab — QR scanner for ticket validation at departure gate.
 * Uses expo-camera to scan boarding pass QR codes and calls the
 * booth.checkInPassenger tRPC procedure to validate and stamp check-in.
 * Also supports manual entry of booking reference (e.g. MJ-7K9A) or ticket token.
 */
import {
  BarcodeScanIcon,
  CancelCircleIcon,
  CheckmarkCircle01Icon,
  Edit01Icon,
  QrCode01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { parseTicketToken } from "@moja/schemas";
import { useMutation } from "@tanstack/react-query";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { IconColors } from "@/constants/ui-colors";
import { useNetworkStatus } from "@/hooks/use-network-status";
import { BoothFeedback } from "@/lib/haptics";
import { useTRPC } from "@/lib/trpc";
import { useOfflineQueue } from "@/stores/offline-queue";
import {
  selectTerminalId,
  selectTerminalName,
  useSessionStore,
} from "@/stores/session";

type ScanState = "scanning" | "success" | "error";

interface CheckInResult {
  passengerName: string;
  departureTime: string | null;
  bookingId: string;
}

export default function CheckInTab() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanState, setScanState] = useState<ScanState>("scanning");
  const [result, setResult] = useState<CheckInResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const lastScannedToken = useRef<string | null>(null);

  const { isOnline } = useNetworkStatus();
  const terminalId = useSessionStore(selectTerminalId);
  const terminalName = useSessionStore(selectTerminalName);
  const trpc = useTRPC();

  const checkIn = useMutation(trpc.booth.checkInPassenger.mutationOptions());

  async function handleValidateToken(token: string) {
    if (!token.trim() || isProcessing) return;
    if (!terminalId) return;
    lastScannedToken.current = token.trim();
    setIsProcessing(true);

    const normalizedToken = parseTicketToken(token.trim());

    // Offline Gate Fallback
    if (!isOnline) {
      const offlineQueue = useOfflineQueue.getState().queue;
      const match = offlineQueue.find(
        (e) =>
          e.id === normalizedToken ||
          e.holdId === normalizedToken ||
          e.seatLabel.toLowerCase() === normalizedToken.toLowerCase() ||
          (e.passengerName &&
            e.passengerName.toLowerCase() === normalizedToken.toLowerCase()),
      );

      setIsProcessing(false);
      if (match) {
        setResult({
          passengerName: match.passengerName,
          departureTime: new Date().toLocaleTimeString("fr-FR", {
            hour: "2-digit",
            minute: "2-digit",
          }),
          bookingId: match.id,
        });
        setScanState("success");
        BoothFeedback.successScan();
        setShowManualModal(false);
        setManualCode("");
      } else {
        BoothFeedback.invalidScan();
        setErrorMsg(
          t("checkin.errorOfflineOnlyLocal") ||
            "Mode hors-ligne : Seuls les billets enregistrés localement sur cet appareil peuvent être validés.",
        );
        setScanState("error");
      }

      setTimeout(() => {
        lastScannedToken.current = null;
        setScanState("scanning");
        setResult(null);
        setErrorMsg(null);
      }, 3500);
      return;
    }

    try {
      const res = await checkIn.mutateAsync({
        ticketToken: normalizedToken,
        terminalId,
      });

      setResult({
        passengerName: res.passengerName,
        departureTime: res.checkedInAt,
        bookingId: res.bookingId,
      });
      setScanState("success");
      BoothFeedback.successScan();
      setShowManualModal(false);
      setManualCode("");
    } catch (e: unknown) {
      BoothFeedback.invalidScan();
      const error = e as { data?: { code?: string }; message?: string };
      const code = error.data?.code;
      const msg = error.message ?? t("errors.generic");

      // Check if network failed mid-flight -> attempt local offline queue verification
      const isNetError =
        msg.toLowerCase().includes("network") ||
        msg.toLowerCase().includes("fetch") ||
        msg.toLowerCase().includes("connect");

      if (isNetError) {
        const offlineQueue = useOfflineQueue.getState().queue;
        const match = offlineQueue.find(
          (entry) =>
            entry.id === normalizedToken ||
            entry.holdId === normalizedToken ||
            entry.seatLabel.toLowerCase() === normalizedToken.toLowerCase() ||
            (entry.passengerName &&
              entry.passengerName.toLowerCase() ===
                normalizedToken.toLowerCase()),
        );

        if (match) {
          setResult({
            passengerName: match.passengerName,
            departureTime: new Date().toLocaleTimeString("fr-FR", {
              hour: "2-digit",
              minute: "2-digit",
            }),
            bookingId: match.id,
          });
          setScanState("success");
          BoothFeedback.successScan();
          setShowManualModal(false);
          setManualCode("");
          return;
        }
      }

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
      }, 3500);
    }
  }

  function handleManualSubmit() {
    if (!manualCode.trim()) return;
    void handleValidateToken(manualCode.trim());
  }

  if (!permission) {
    return <View className="flex-1 bg-background" />;
  }

  if (!permission.granted) {
    return (
      <View
        className="flex-1 bg-background items-center justify-center px-8"
        style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
      >
        <View className="w-20 h-20 rounded-full bg-primary/10 items-center justify-center mb-6">
          <HugeiconsIcon
            icon={BarcodeScanIcon}
            size={40}
            color={IconColors.brand}
          />
        </View>
        <Text className="text-foreground font-heading text-xl font-bold text-center mb-2">
          {t("checkin.cameraPermissionTitle") || "Accès caméra requis"}
        </Text>
        <Text className="text-muted-foreground text-sm text-center leading-5 mb-8 max-w-[280px]">
          {t("checkin.cameraPermissionDesc") ||
            "L'accès à la caméra est indispensable pour scanner les QR codes sur les billets d'embarquement."}
        </Text>
        <Button
          className="w-full max-w-xs"
          onPress={() => {
            BoothFeedback.tap();
            requestPermission();
          }}
        >
          <Text className="text-primary-foreground font-semibold text-base">
            {t("checkin.grantPermission") || "Autoriser la caméra"}
          </Text>
        </Button>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      {/* Top Header HUD */}
      <View
        className="absolute left-0 right-0 z-10 items-center px-6"
        style={{ top: Math.max(insets.top, 20) + 8 }}
      >
        <View className="bg-black/60 px-5 py-2.5 rounded-full border border-white/20 backdrop-blur-md items-center">
          <Text className="text-white font-heading text-base font-bold">
            {t("checkin.title")}
          </Text>
          <Text className="text-white/70 text-xs mt-0.5">
            {terminalName ? `${terminalName} · ` : ""}
            {t("checkin.instruction")}
          </Text>
        </View>
      </View>

      {/* Camera Stream */}
      {scanState === "scanning" && (
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
          onBarcodeScanned={(data) => {
            if (
              data.data &&
              data.data !== lastScannedToken.current &&
              !isProcessing
            ) {
              void handleValidateToken(data.data);
            }
          }}
          barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
        />
      )}

      {/* Scanner Viewfinder Reticle */}
      {scanState === "scanning" && (
        <View className="flex-1 items-center justify-center pointer-events-none">
          <View className="w-68 h-68 items-center justify-center">
            <View className="w-64 h-64 border-2 border-white/80 rounded-3xl relative shadow-2xl">
              {/* Corner Accents */}
              <View className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-primary rounded-tl-xl" />
              <View className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-primary rounded-tr-xl" />
              <View className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-primary rounded-bl-xl" />
              <View className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-primary rounded-br-xl" />
            </View>
          </View>
        </View>
      )}

      {/* Manual Entry Button */}
      {scanState === "scanning" && !isProcessing && (
        <View
          className="absolute left-0 right-0 items-center z-20"
          style={{ bottom: Math.max(insets.bottom, 20) + 16 }}
        >
          <Pressable
            className="flex-row items-center gap-2.5 bg-black/70 backdrop-blur-md px-6 py-3.5 rounded-full border border-white/30 active:opacity-80"
            onPress={() => {
              BoothFeedback.tap();
              setShowManualModal(true);
            }}
          >
            <HugeiconsIcon icon={Edit01Icon} size={18} color="#ffffff" />
            <Text className="text-white font-semibold text-sm">
              {t("checkin.manualEntry")}
            </Text>
          </Pressable>
        </View>
      )}

      {/* Processing Loader */}
      {isProcessing && (
        <View className="absolute inset-0 bg-black/70 items-center justify-center z-30">
          <View className="bg-card p-6 rounded-2xl items-center border border-border shadow-2xl">
            <ActivityIndicator size="large" color={IconColors.brand} />
            <Text className="text-foreground font-semibold text-sm mt-3">
              {t("checkin.validating") || "Validation du billet..."}
            </Text>
          </View>
        </View>
      )}

      {/* Result: SUCCESS */}
      {scanState === "success" && result && (
        <View className="flex-1 items-center justify-center px-8 z-30 bg-black/85">
          <View className="items-center gap-4 w-full max-w-sm">
            <View className="w-20 h-20 rounded-full bg-emerald-500/20 border border-emerald-500/40 items-center justify-center">
              <HugeiconsIcon
                icon={CheckmarkCircle01Icon}
                size={54}
                color={IconColors.success}
              />
            </View>

            <Text className="text-white font-heading text-2xl font-bold text-center">
              {t("checkin.success")}
            </Text>

            <Card className="bg-white/15 border-white/20 rounded-2xl p-5 w-full">
              <Text className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-1">
                {t("checkin.passenger") || "Passager"}
              </Text>
              <Text className="text-white font-bold text-xl">
                {result.passengerName}
              </Text>
              {result.departureTime ? (
                <Text className="text-white/80 text-sm mt-2 font-mono">
                  {result.departureTime}
                </Text>
              ) : null}
            </Card>
          </View>
        </View>
      )}

      {/* Result: ERROR */}
      {scanState === "error" && (
        <View className="flex-1 items-center justify-center px-8 z-30 bg-black/85">
          <View className="items-center gap-4 w-full max-w-sm">
            <View className="w-20 h-20 rounded-full bg-rose-500/20 border border-rose-500/40 items-center justify-center">
              <HugeiconsIcon
                icon={CancelCircleIcon}
                size={54}
                color={IconColors.error}
              />
            </View>

            <Text className="text-white font-heading text-2xl font-bold text-center">
              {t("checkin.error")}
            </Text>

            <Card className="bg-rose-500/10 border-rose-500/30 rounded-2xl p-5 w-full">
              <Text className="text-white font-medium text-center text-sm leading-5">
                {errorMsg}
              </Text>
            </Card>
          </View>
        </View>
      )}

      {/* Manual Entry Modal */}
      <Modal
        visible={showManualModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowManualModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1 justify-center bg-black/70 px-6"
        >
          <Card className="p-6 gap-4 shadow-2xl">
            <View className="flex-row items-center gap-2">
              <HugeiconsIcon
                icon={QrCode01Icon}
                size={22}
                color={IconColors.brand}
              />
              <Text className="text-lg font-heading font-bold text-foreground">
                {t("checkin.manualEntry")}
              </Text>
            </View>

            <Text className="text-muted-foreground text-xs leading-4">
              {t("checkin.manualPrompt")}
            </Text>

            <Input
              placeholder={t("checkin.manualPlaceholder")}
              value={manualCode}
              onChangeText={setManualCode}
              autoCapitalize="characters"
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleManualSubmit}
              className="uppercase tracking-widest font-mono font-bold"
            />

            <View className="flex-row gap-3 mt-2">
              <Button
                variant="outline"
                className="flex-1"
                onPress={() => {
                  BoothFeedback.tap();
                  setShowManualModal(false);
                  setManualCode("");
                }}
              >
                <Text className="font-semibold text-base text-foreground">
                  {t("checkin.cancel")}
                </Text>
              </Button>

              <Button
                variant="default"
                className="flex-1"
                onPress={handleManualSubmit}
                disabled={isProcessing || !manualCode.trim()}
              >
                {isProcessing ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <Text className="text-primary-foreground font-semibold text-base">
                    {t("checkin.validate")}
                  </Text>
                )}
              </Button>
            </View>
          </Card>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
