import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Delete, Lock, AlertCircle } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { GeriHeader } from '../../src/components/common/GeriHeader';
import { pairingService } from '../../src/services/pairing.service';
import { getOrCreateDeviceId } from '../../src/utils/deviceId';
import { useSessionStore } from '../../src/store/session.store';
import { ROUTES } from '../../src/constants/routes';

export default function PinVerificationScreen() {
  const router = useRouter();
  const setSession = useSessionStore((s) => s.setSession);

  const [pin, setPin] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleDigitPress = async (digit: string) => {
    if (loading || pin.length >= 4) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // ignore
    }

    const nextPin = pin + digit;
    setPin(nextPin);
    setErrorMessage(null);

    if (nextPin.length === 4) {
      await submitPin(nextPin);
    }
  };

  const handleDelete = () => {
    if (loading || pin.length === 0) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // ignore
    }
    setPin((prev) => prev.slice(0, -1));
    setErrorMessage(null);
  };

  const handleClear = () => {
    setPin('');
    setErrorMessage(null);
  };

  const submitPin = async (completedPin: string) => {
    setLoading(true);
    setErrorMessage(null);

    try {
      const deviceId = await getOrCreateDeviceId();
      // Real API verification - Never hardcoded valid PIN
      const result = await pairingService.verifyPin({
        pin: completedPin,
        deviceId,
      });

      if (result && result.accessToken && result.patientId) {
        await setSession({
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
          patientId: result.patientId,
          deviceId,
          patientPreferredName: result.patientPreferredName,
        });
        router.replace(ROUTES.ONBOARDING.COMPLETE as any);
      } else {
        setErrorMessage('Incorrect PIN. Please try again.');
        setPin('');
      }
    } catch {
      setErrorMessage('Unable to connect right now. Please check your connection.');
      setPin('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background-warm">
      <GeriHeader
        title="Enter Device PIN"
        subtitle="4-digit care access code"
        onBackPress={() => router.back()}
      />

      <View className="flex-1 px-6 justify-around py-4">
        {/* Top prompt & PIN Dots */}
        <View className="items-center">
          <View className="w-16 h-16 rounded-full bg-teal-100 items-center justify-center mb-4">
            <Lock size={30} color="#2E7D7A" />
          </View>
          <Text className="text-xl font-bold text-navy text-center mb-2">
            Enter 4-Digit PIN
          </Text>
          <Text className="text-base text-navy-500 text-center mb-6">
            Provided by your family or caregiver
          </Text>

          {/* Secure 4 Dots display */}
          <View className="flex-row space-x-6 items-center my-3">
            {[0, 1, 2, 3].map((index) => {
              const isFilled = pin.length > index;
              return (
                <View
                  key={index}
                  className={`w-6 h-6 rounded-full mx-3 border-2 ${
                    isFilled
                      ? 'bg-teal-600 border-teal-700'
                      : 'bg-white border-navy-300'
                  }`}
                />
              );
            })}
          </View>

          {errorMessage && (
            <View className="flex-row items-center mt-4 px-4 py-2 bg-red-50 rounded-xl border border-red-200">
              <AlertCircle size={18} color="#DC2626" />
              <Text className="text-sm font-semibold text-red-700 ml-2">
                {errorMessage}
              </Text>
            </View>
          )}
        </View>

        {/* Accessible Large Numeric Keypad */}
        <View className="w-full max-w-xs mx-auto">
          <View className="flex-row justify-between mb-4">
            {['1', '2', '3'].map((digit) => (
              <TouchableOpacity
                key={digit}
                onPress={() => handleDigitPress(digit)}
                disabled={loading}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={`Digit ${digit}`}
                className="w-20 h-20 rounded-3xl bg-white border border-navy-200 items-center justify-center shadow-xs active:bg-teal-50"
              >
                <Text className="text-3xl font-bold text-navy">{digit}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View className="flex-row justify-between mb-4">
            {['4', '5', '6'].map((digit) => (
              <TouchableOpacity
                key={digit}
                onPress={() => handleDigitPress(digit)}
                disabled={loading}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={`Digit ${digit}`}
                className="w-20 h-20 rounded-3xl bg-white border border-navy-200 items-center justify-center shadow-xs active:bg-teal-50"
              >
                <Text className="text-3xl font-bold text-navy">{digit}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View className="flex-row justify-between mb-4">
            {['7', '8', '9'].map((digit) => (
              <TouchableOpacity
                key={digit}
                onPress={() => handleDigitPress(digit)}
                disabled={loading}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={`Digit ${digit}`}
                className="w-20 h-20 rounded-3xl bg-white border border-navy-200 items-center justify-center shadow-xs active:bg-teal-50"
              >
                <Text className="text-3xl font-bold text-navy">{digit}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View className="flex-row justify-between mb-2">
            <TouchableOpacity
              onPress={handleClear}
              disabled={loading || pin.length === 0}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Clear PIN"
              className="w-20 h-20 rounded-3xl items-center justify-center active:bg-navy-100"
            >
              <Text className="text-sm font-semibold text-navy-500">Clear</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleDigitPress('0')}
              disabled={loading}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Digit 0"
              className="w-20 h-20 rounded-3xl bg-white border border-navy-200 items-center justify-center shadow-xs active:bg-teal-50"
            >
              <Text className="text-3xl font-bold text-navy">0</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleDelete}
              disabled={loading || pin.length === 0}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Delete digit"
              className="w-20 h-20 rounded-3xl items-center justify-center active:bg-navy-100"
            >
              <Delete size={28} color="#0F172A" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
