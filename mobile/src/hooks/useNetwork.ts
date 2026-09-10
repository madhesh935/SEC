import { useState, useEffect } from "react";
import NetInfo from "@react-native-community/netinfo";
import { useCompanionStore } from "../store/companion.store";

export function useNetwork() {
  const [isConnected, setIsConnected] = useState<boolean | null>(true);
  const setIsOnline = useCompanionStore((state) => state.setIsOnline);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const online =
        state.isConnected !== false && state.isInternetReachable !== false;
      setIsConnected(online);
      setIsOnline(online);
    });

    NetInfo.fetch().then((state) => {
      const online =
        state.isConnected !== false && state.isInternetReachable !== false;
      setIsConnected(online);
      setIsOnline(online);
    });

    return () => unsubscribe();
  }, [setIsOnline]);

  return { isConnected, isOffline: isConnected === false };
}
