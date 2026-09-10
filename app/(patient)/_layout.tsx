import React, { useEffect } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { BottomNav } from '../../src/components/navigation/BottomNav';
import { useSessionStore } from '../../src/store/session.store';
import { ROUTES } from '../../src/constants/routes';

export default function PatientLayout() {
  const router = useRouter();
  const { session, isAuthenticated, isLoading } = useSessionStore();

  // If no session exists, redirect back to onboarding welcome
  useEffect(() => {
    if (!isLoading && (!session || !isAuthenticated)) {
      router.replace(ROUTES.ONBOARDING.WELCOME as any);
    }
  }, [session, isAuthenticated, isLoading, router]);

  return (
    <SafeAreaView className="flex-1 bg-background-warm">
      <View className="flex-1 bg-background-warm">
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: '#FAF9F6' },
            animation: 'fade',
          }}
        >
          <Stack.Screen name="home" />
          <Stack.Screen name="companion" />
          <Stack.Screen name="family" />
          <Stack.Screen name="family/[id]" />
          <Stack.Screen name="memories" />
          <Stack.Screen name="memory/[id]" />
          <Stack.Screen name="comfort" />
          <Stack.Screen name="activities" />
          <Stack.Screen name="help" />
          <Stack.Screen name="settings" />
        </Stack>
      </View>
      <BottomNav />
    </SafeAreaView>
  );
}
