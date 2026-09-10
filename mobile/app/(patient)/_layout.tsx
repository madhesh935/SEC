import React, { useEffect } from "react";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useRouter } from "expo-router";
import { BottomNav } from "../../src/components/navigation/BottomNav";
import { useSessionStore } from "../../src/store/session.store";
import { palette } from "../../src/components/patient/Design";
import { usePatientSettings } from "../../src/hooks/usePatient";
import { useSettingsStore } from "../../src/store/settings.store";
export default function PatientLayout() {
  const session = useSessionStore((s) => s.session),
    router = useRouter();
  const settings = usePatientSettings();
  useEffect(() => {
    if (settings.data) useSettingsStore.setState(settings.data);
  }, [settings.data]);
  useEffect(() => {
    if (!session) router.replace("/");
  }, [session, router]);
  if (!session) return null;
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.ivory }}>
      <View style={{ flex: 1 }}>
        <Stack
          screenOptions={{
            headerShown: false,
            animation: "none",
            contentStyle: { backgroundColor: palette.ivory },
          }}
        />
      </View>
      <BottomNav />
    </SafeAreaView>
  );
}
