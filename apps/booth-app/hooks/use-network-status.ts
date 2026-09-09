import NetInfo, { type NetInfoState } from "@react-native-community/netinfo";
import { useEffect, useState } from "react";

export interface NetworkStatus {
  isOnline: boolean;
  isConnected: boolean | null;
  connectionType: string | null;
}

export function useNetworkStatus() {
  const [status, setStatus] = useState<NetworkStatus>({
    isOnline: true,
    isConnected: null,
    connectionType: null,
  });

  useEffect(() => {
    NetInfo.fetch().then((state) => {
      setStatus({
        isOnline: !!(state.isConnected && state.isInternetReachable),
        isConnected: state.isConnected,
        connectionType: state.type,
      });
    });

    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      setStatus({
        isOnline: !!(state.isConnected && state.isInternetReachable),
        isConnected: state.isConnected,
        connectionType: state.type,
      });
    });

    return unsubscribe;
  }, []);

  return status;
}
