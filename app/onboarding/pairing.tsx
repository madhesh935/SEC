import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { QrCode, KeyRound, Hash, AlertCircle } from 'lucide-react-native';
import { GeriHeader } from '../../src/components/common/GeriHeader';
import { GeriButton } from '../../src/components/common/GeriButton';
import { GeriCard } from '../../src/components/common/GeriCard';
import { pairingService } from '../../src/services/pairing.service';
import { getOrCreateDeviceId } from '../../src/utils/deviceId';
import { useSessionStore } from '../../src/store/session.store';
import { ROUTES } from '../../src/constants/routes';

type PairingMode = 'code' | 'qr';

export default function PairingScreen() {
  const router = useRouter();
  const setSession = useSessionStore((s) => s.setSession);

  const [mode, setMode] = useState<PairingMode>('code');
  const [pairingCode, setPairingCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleVerifyCode = async () => {
    const trimmed = pairingCode.trim();
    if (!trimmed) {
      setErrorMessage('Please enter a pairing code from the caregiver portal.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const deviceId = await getOrCreateDeviceId();
      // REAL API CALL - Never simulated
      const result = await pairingService.verifyPairing({
        pairingCode: trimmed,
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
        setErrorMessage('Unable to connect right now. The code may be invalid or expired.');
      }
    } catch {
      // Backend unavailable or invalid
      setErrorMessage('Unable to connect right now.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background-warm">
      <GeriHeader
        title="Pair Device"
        subtitle="Connect with caregiver account"
        onBackPress={() => router.back()}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          className="p-6 justify-between"
          keyboardShouldPersistTaps="handled"
        >
          <View>
            <Text className="text-xl text-navy-700 mb-6">
              Choose how to pair this device with the patient profile from the caregiver portal.
            </Text>

            {/* Error Message Box */}
            {errorMessage && (
              <View className="mb-6 rounded-2xl bg-amber-50 border border-amber-300 p-5">
                <View className="flex-row items-center mb-2">
                  <AlertCircle size={24} color="#D97706" />
                  <Text className="text-lg font-bold text-amber-900 ml-2">
                    {errorMessage}
                  </Text>
                </View>
                <Text className="text-sm text-amber-800 mb-4">
                  Please verify your network connection and ensure the pairing code is active.
                </Text>
                <View className="flex-row space-x-3">
                  <View className="flex-1 mr-2">
                    <GeriButton
                      title="Try Again"
                      size="medium"
                      variant="primary"
                      onPress={handleVerifyCode}
                      loading={loading}
                    />
                  </View>
                  <View className="flex-1">
                    <GeriButton
                      title="Go Back"
                      size="medium"
                      variant="outline"
                      onPress={() => router.back()}
                    />
                  </View>
                </View>
              </View>
            )}

            {/* Mode Selector Tabs */}
            <View className="flex-row bg-navy-100 p-1.5 rounded-2xl mb-6">
              <TouchableOpacity
                onPress={() => {
                  setMode('code');
                  setErrorMessage(null);
                }}
                className={`flex-1 py-3 items-center justify-center rounded-xl flex-row ${
                  mode === 'code' ? 'bg-white shadow-xs' : 'bg-transparent'
                }`}
              >
                <KeyRound size={20} color={mode === 'code' ? '#2E7D7A' : '#64748B'} />
                <Text
                  className={`text-base font-semibold ml-2 ${
                    mode === 'code' ? 'text-teal-700' : 'text-navy-500'
                  }`}
                >
                  Pairing Code
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setMode('qr');
                  setErrorMessage(null);
                }}
                className={`flex-1 py-3 items-center justify-center rounded-xl flex-row ${
                  mode === 'qr' ? 'bg-white shadow-xs' : 'bg-transparent'
                }`}
              >
                <QrCode size={20} color={mode === 'qr' ? '#2E7D7A' : '#64748B'} />
                <Text
                  className={`text-base font-semibold ml-2 ${
                    mode === 'qr' ? 'text-teal-700' : 'text-navy-500'
                  }`}
                >
                  Scan QR
                </Text>
              </TouchableOpacity>
            </View>

            {/* Option 1: QR Code Placeholder / Camera Trigger */}
            {mode === 'qr' && (
              <GeriCard className="items-center p-8 mb-6">
                <View className="w-36 h-36 rounded-3xl bg-teal-50 border-2 border-dashed border-teal-300 items-center justify-center mb-4">
                  <QrCode size={64} color="#2E7D7A" />
                </View>
                <Text className="text-lg font-bold text-navy text-center mb-2">
                  Scan Caregiver QR Code
                </Text>
                <Text className="text-sm text-navy-600 text-center mb-6 max-w-xs">
                  Point the camera at the pairing QR code displayed on the caregiver portal.
                </Text>
                <GeriButton
                  title="Activate Camera"
                  variant="secondary"
                  size="medium"
                  onPress={() => {
                    setErrorMessage('Unable to connect right now. Please enter the pairing code manually.');
                  }}
                />
              </GeriCard>
            )}

            {/* Option 2: Enter Pairing Code */}
            {mode === 'code' && (
              <GeriCard className="p-6 mb-6">
                <Text className="text-base font-semibold text-navy mb-2">
                  Enter 8-digit Pairing Code:
                </Text>
                <TextInput
                  value={pairingCode}
                  onChangeText={(text) => {
                    setPairingCode(text.toUpperCase());
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="e.g. GC-9824"
                  placeholderTextColor="#94A3B8"
                  autoCapitalize="characters"
                  autoCorrect={false}
                  maxLength={12}
                  className="bg-white border-2 border-teal-600 rounded-2xl px-5 py-4 text-2xl font-bold text-navy tracking-widest text-center mb-5"
                />
                <GeriButton
                  title="Verify & Connect"
                  variant="primary"
                  size="large"
                  onPress={handleVerifyCode}
                  loading={loading}
                />
              </GeriCard>
            )}

            {/* Option 3: Use 4-digit PIN */}
            <TouchableOpacity
              onPress={() => router.push(ROUTES.ONBOARDING.PIN as any)}
              className="flex-row items-center justify-between p-5 bg-white rounded-2xl border border-navy-200 active:bg-navy-50"
            >
              <View className="flex-row items-center flex-1">
                <View className="w-12 h-12 rounded-xl bg-lavender-100 items-center justify-center mr-4">
                  <Hash size={24} color="#7C3AED" />
                </View>
                <View className="flex-1">
                  <Text className="text-lg font-bold text-navy">
                    Option 3: Use 4-digit PIN
                  </Text>
                  <Text className="text-sm text-navy-500">
                    Quick setup with preset care PIN
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
