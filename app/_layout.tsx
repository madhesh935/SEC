import React, { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import {
  QueryClient,
  QueryClientProvider,
  focusManager,
} from "@tanstack/react-query";
import { View, AppState } from "react-native";
import { useNetwork } from "../src/hooks/useNetwork";
import { OfflineState } from "../src/components/states/OfflineState";
import { useSettingsStore } from "../src/store/settings.store";
import { useSessionStore } from "../src/store/session.store";
import "../global.css";

// Global TanStack Query client configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 60, // 1 hour
      retry: 2,
      refetchOnWindowFocus: true,
    },
  },
});

function RootLayoutContent() {
  useEffect(
    () =>
      useSessionStore.subscribe((state, previous) => {
        if (state.session?.patientId !== previous.session?.patientId)
          queryClient.clear();
      }),
    [],
  );
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) =>
      focusManager.setFocused(state === "active"),
    );
    return () => subscription.remove();
  }, []);
  const { isOffline } = useNetwork();
  const loadSettings = useSettingsStore((s) => s.loadSettings);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  return (
    <View className="flex-1 bg-background-warm">
      <StatusBar style="dark" />
      {isOffline && <OfflineState fullScreen={false} />}
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "#FAF9F6" },
          animation: "fade",
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="(patient)" />
      </Stack>
    </View>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <RootLayoutContent />
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
