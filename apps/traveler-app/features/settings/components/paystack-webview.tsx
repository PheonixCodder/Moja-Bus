import { useState, useCallback, useRef } from "react";
import { View, ActivityIndicator, Pressable, Modal } from "react-native";
import { WebView } from "react-native-webview";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { X } from "lucide-react-native";
import { Text } from "@/components/ui/text";
import { Colors, Spacing } from "@moja/theme/tokens";

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
const SUCCESS_PATHS = [MOBILE_CALLBACK_PATH, "/dashboard/wallet", "/dashboard/passenger/wallet"];
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

    // Mobile callback URL (clean minimal page, no web dashboard loading)
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

    // Web dashboard fallback (existing detection for backward compat)
    const isWebDashboardSuccess = SUCCESS_HOSTS.some((host) => lower.includes(host)) &&
      SUCCESS_PATHS.some((path) => lower.includes(path));

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
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: Spacing.four, backgroundColor: Colors.light.background }}>
          <Text style={{ fontSize: 14, color: Colors.light.textSecondary, textAlign: "center", marginBottom: Spacing.two }}>
            Failed to load payment page.
          </Text>
          <View style={{ flexDirection: "row", gap: Spacing.two }}>
            <Pressable
              onPress={() => { setLoadError(false); setRetryCount((c) => c + 1); }}
              style={{ paddingVertical: Spacing.two, paddingHorizontal: Spacing.four, borderRadius: 8, backgroundColor: Colors.light.primary }}
            >
              <Text style={{ fontSize: 13, fontWeight: "600", color: Colors.light.primaryForeground }}>
                Retry
              </Text>
            </Pressable>
            <Pressable
              onPress={onCancel}
              style={{ paddingVertical: Spacing.two, paddingHorizontal: Spacing.four, borderRadius: 8, borderWidth: 1, borderColor: Colors.light.backgroundSelected }}
            >
              <Text style={{ fontSize: 13, fontWeight: "600", color: Colors.light.textSecondary }}>
                Cancel
              </Text>
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
      <View style={{ flex: 1, backgroundColor: Colors.light.background }}>
        <View style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingTop: insets.top + 12,
          paddingBottom: 12,
          paddingHorizontal: Spacing.four,
          borderBottomWidth: 1,
          borderBottomColor: Colors.light.backgroundSelected,
        }}>
          <Pressable onPress={onCancel} hitSlop={12}>
            <X size={20} color={Colors.light.text} />
          </Pressable>
          <Text style={{ fontSize: 15, fontWeight: "600", color: Colors.light.text }}>
            Pay with Paystack
          </Text>
          <View style={{ width: 20 }} />
        </View>

        {loading ? (
          <View style={{ position: "absolute", top: 60, left: 0, right: 0, alignItems: "center", zIndex: 10 }}>
            <ActivityIndicator size="small" color={Colors.light.primary} />
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
