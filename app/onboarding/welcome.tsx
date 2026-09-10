import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Heart, Sparkles, ShieldCheck } from 'lucide-react-native';
import { GeriButton } from '../../src/components/common/GeriButton';
import { ROUTES } from '../../src/constants/routes';

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-background-warm">
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        contentContainerClassName="justify-between"
        className="px-6 py-8"
      >
        {/* Top Branding Section */}
        <View className="items-center mt-6">
          <View className="w-20 h-20 rounded-3xl bg-teal-100 border border-teal-200 items-center justify-center mb-5 shadow-sm">
            <Heart size={42} color="#2E7D7A" fill="#E0F2F1" />
          </View>
          <Text className="text-3xl font-extrabold text-navy tracking-tight text-center">
            GeriCare AI
          </Text>
          <View className="flex-row items-center mt-2 px-3 py-1 bg-teal-50 rounded-full border border-teal-100">
            <Sparkles size={14} color="#2E7D7A" />
            <Text className="text-xs font-semibold text-teal-800 ml-1.5 uppercase tracking-wider">
              Voice Care Companion
            </Text>
          </View>
        </View>

        {/* Center Headline Section */}
        <View className="items-center my-10 px-2">
          <Text className="text-4xl font-bold text-navy text-center tracking-tight leading-tight mb-4">
            Care that feels familiar.
          </Text>
          <Text className="text-xl text-navy-600 text-center leading-relaxed max-w-sm">
            A personal voice companion designed to provide comfort, connection and support.
          </Text>

          <View className="mt-8 flex-row items-center bg-white px-5 py-3.5 rounded-2xl border border-navy-100 shadow-xs">
            <ShieldCheck size={22} color="#2E7D7A" />
            <Text className="text-sm font-medium text-navy-700 ml-3">
              Patient-safe & caregiver-connected
            </Text>
          </View>
        </View>

        {/* Action Buttons Section */}
        <View className="w-full max-w-md mx-auto space-y-4 mb-4">
          <GeriButton
            title="Set Up This Device"
            onPress={() => router.push(ROUTES.ONBOARDING.PAIRING as any)}
            variant="primary"
            size="large"
            accessibilityLabel="Set up this device"
            accessibilityHint="Begins pairing this device with caregiver profile"
          />

          <View className="mt-3">
            <GeriButton
              title="Already paired? Continue"
              onPress={() => router.push(ROUTES.ONBOARDING.PIN as any)}
              variant="outline"
              size="large"
              accessibilityLabel="Already paired? Continue"
              accessibilityHint="Enter device PIN to unlock"
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
