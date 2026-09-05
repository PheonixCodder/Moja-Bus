import { useState, useCallback, useRef } from "react";
import { View, ActivityIndicator, Pressable, Modal } from "react-native";
import { WebView } from "react-native-webview";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { X } from "lucide-react-native";
import { Text } from "@/components/ui/text";
import { Palette } from "@/constants/theme";

type PaystackWebViewProps = {
  authorizationUrl: string;
  visible: boolean;
  /** Payment reference from server — passed back on success even if URL lacks it */
  reference?: string;
  onSuccess: (reference?: string) => void;
  onCancel: () => void;
};

const MOBILE_CALLBACK_PATH = "/api/payments/mobile-callback";
const SUCCESS_HOSTS = ["localhost", "192.168", "mojaride.ci", "moja-buss"];
const SUCCESS_PATHS = [
  MOBILE_CALLBACK_PATH,
  "/dashboard/wallet",
  "/dashboard/passenger/wallet",
  "/api/payments/verify",
  "/book/",
  "/success",
];
const CANCEL_PATHS = [`${MOBILE_CALLBACK_PATH}?cancel=1`];

const INJECTED_JS = `
  (function() {
    var originalOpen = window.open;
    window.open = function(url) {
      window.location.href = url;
      return null;
    };
  })();
`;

function extractReferenceFromUrl(url: string): string | undefined {
  try {
    const parsed = new URL(url);
    return parsed.searchParams.get("reference") ?? parsed.searchParams.get("trxref") ?? undefined;
  } catch {
    return undefined;
  }
}

export function PaystackWebView({
  authorizationUrl,
  visible,
  reference: storedReference,
  onSuccess,
  onCancel,
}: PaystackWebViewProps) {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const handledRef = useRef(false);

  const detectCompletion = useCallback((url: string) => {
    if (handledRef.current) return true;
    const lower = url.toLowerCase();

    if (lower.includes(MOBILE_CALLBACK_PATH)) {
      if (lower.includes("cancel=1")) {
        handledRef.current = true;
        onCancel();
        return true;
      }
      handledRef.current = true;
      onSuccess(extractReferenceFromUrl(url) || storedReference);
      return true;
    }

    const isWebDashboardSuccess =
      SUCCESS_PATHS.some((path) => lower.includes(path.toLowerCase())) ||
      (SUCCESS_HOSTS.some((host) => lower.includes(host)) &&
        SUCCESS_PATHS.some((path) => lower.includes(path.toLowerCase())));

    if (isWebDashboardSuccess) {
      handledRef.current = true;
      onSuccess(extractReferenceFromUrl(url) || storedReference);
      return true;
    }

    if (lower.includes("cancelled") || CANCEL_PATHS.some((p) => lower.includes(p))) {
      handledRef.current = true;
      onCancel();
      return true;
    }

    return false;
  }, [onSuccess, onCancel, storedReference]);

  if (!visible) return null;

  if (loadError) {
    return (
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={onCancel}
      >
        <View className="flex-1 items-center justify-center p-4 bg-background">
          <Text className="text-sm text-muted-foreground text-center mb-2">
            Failed to load payment page.
          </Text>
          <View className="flex-row gap-2">
            <Pressable
              onPress={() => { setLoadError(false); setRetryCount((c) => c + 1); }}
              accessibilityRole="button"
              className="py-2 px-4 rounded-lg bg-primary min-h-10 justify-center"
            >
              <Text className="text-sm font-semibold text-primary-foreground">Retry</Text>
            </Pressable>
            <Pressable
              onPress={onCancel}
              accessibilityRole="button"
              className="py-2 px-4 rounded-lg border border-border min-h-10 justify-center"
            >
              <Text className="text-sm font-semibold text-muted-foreground">Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onCancel}
    >
      <View className="flex-1 bg-background">
        <View
          className="flex-row items-center justify-between pb-3 px-4 border-b border-border"
          style={{ paddingTop: insets.top + 12 }}
        >
          <Pressable onPress={onCancel} hitSlop={12} accessibilityRole="button" className="min-h-9 justify-center items-center">
            <X size={20} color={Palette.zinc[800]} />
          </Pressable>
          <Text className="text-base font-semibold text-foreground">Pay with Paystack</Text>
          <View className="w-5" />
        </View>

        {loading ? (
          <View className="absolute top-[60px] left-0 right-0 items-center z-10">
            <ActivityIndicator size="small" color={Palette.rose[500]} />
          </View>
        ) : null}

        <WebView
          key={retryCount}
          source={{ uri: authorizationUrl }}
          style={{ flex: 1 }}
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => setLoading(false)}
          onError={() => setLoadError(true)}
          onNavigationStateChange={(nav) => detectCompletion(nav.url)}
          onShouldStartLoadWithRequest={(req) => !detectCompletion(req.url)}
          injectedJavaScript={INJECTED_JS}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          sharedCookiesEnabled={true}
        />
      </View>
    </Modal>
  );
}
