import React, { useEffect } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSessionStore } from '../src/store/session.store';
import { LoadingState } from '../src/components/common/LoadingState';
import { ROUTES } from '../src/constants/routes';

export default function StartupGateway() {
  const router = useRouter();
  const { initializeSession, isLoading, isAuthenticated } = useSessionStore();

  useEffect(() => {
    async function checkAuth() {
      const session = await initializeSession();
      if (session && session.accessToken && session.patientId) {
        router.replace(ROUTES.PATIENT.HOME as any);
      } else {
        router.replace(ROUTES.ONBOARDING.WELCOME as any);
      }
    }

    checkAuth();
  }, [initializeSession, router]);

  return (
    <View className="flex-1 bg-background-warm">
      <LoadingState message="Starting GeriCare..." subMessage="Preparing your care companion" />
    </View>
  );
}
