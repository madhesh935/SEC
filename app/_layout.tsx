import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { View } from 'react-native';
import { useNetwork } from '../src/hooks/useNetwork';
import { OfflineState } from '../src/components/states/OfflineState';
import { useSettingsStore } from '../src/store/settings.store';
import '../global.css';

// Global TanStack Query client configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 60, // 1 hour
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

function RootLayoutContent() {
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
          contentStyle: { backgroundColor: '#FAF9F6' },
          animation: 'fade',
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
