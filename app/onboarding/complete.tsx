import React from 'react';
import { View, Text, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { CheckCircle2 } from 'lucide-react-native';
import { GeriButton } from '../../src/components/common/GeriButton';
import { useSessionStore } from '../../src/store/session.store';
import { ROUTES } from '../../src/constants/routes';

export default function SetupCompleteScreen() {
  const router = useRouter();
  const session = useSessionStore((s) => s.session);

  const handleContinue = () => {
    router.replace(ROUTES.PATIENT.HOME as any);
  };

  return (
    <SafeAreaView className="flex-1 bg-background-warm">
      <View className="flex-1 px-8 py-12 justify-between items-center">
        <View />

        {/* Center Success Card */}
        <View className="items-center max-w-sm">
          <View className="w-24 h-24 rounded-full bg-emerald-100 border-4 border-emerald-200 items-center justify-center mb-6 shadow-sm">
            <CheckCircle2 size={54} color="#059669" />
          </View>

          <Text className="text-3xl font-extrabold text-navy text-center mb-3">
            Device Connected
          </Text>

          {/* Only render patient preferred name if returned by actual backend */}
          {session?.patientPreferredName ? (
            <Text className="text-xl font-semibold text-teal-700 text-center mb-2">
              Ready for {session.patientPreferredName}
            </Text>
          ) : null}

          <Text className="text-lg text-navy-600 text-center leading-relaxed">
            This device is now ready for the patient.
          </Text>
        </View>

        {/* Continue Button */}
        <View className="w-full max-w-sm">
          <GeriButton
            title="Continue"
            onPress={handleContinue}
            variant="primary"
            size="large"
            accessibilityLabel="Continue to patient home"
          />
        </View>
      </View>
    </SafeAreaView>
  );
}
