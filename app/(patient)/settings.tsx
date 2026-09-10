import React, { useState } from 'react';
import { View, Text, ScrollView, Switch, TouchableOpacity, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { Volume2, Type, Globe, Eye, RefreshCw, LogOut, Check } from 'lucide-react-native';
import { GeriHeader } from '../../src/components/common/GeriHeader';
import { GeriButton } from '../../src/components/common/GeriButton';
import { GeriCard } from '../../src/components/common/GeriCard';
import { useSettingsStore, TextSizeOption } from '../../src/store/settings.store';
import { useSessionStore } from '../../src/store/session.store';
import { ROUTES } from '../../src/constants/routes';

export default function SettingsScreen() {
  const router = useRouter();
  const {
    textSize,
    voiceVolume,
    language,
    reducedMotion,
    replayVoiceResponse,
    setTextSize,
    setVoiceVolume,
    setLanguage,
    setReducedMotion,
    setReplayVoiceResponse,
  } = useSettingsStore();

  const { session, clearSession } = useSessionStore();
  const [unpairModalVisible, setUnpairModalVisible] = useState(false);

  const handleUnpair = async () => {
    setUnpairModalVisible(false);
    await clearSession();
    router.replace(ROUTES.ONBOARDING.WELCOME as any);
  };

  return (
    <View className="flex-1 bg-background-warm">
      <GeriHeader
        title="Settings"
        subtitle="Patient comfort and accessibility options"
        onBackPress={() => router.back()}
      />

      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        className="p-6 justify-between"
      >
        <View>
          {/* Section 1: Text Size */}
          <GeriCard className="p-5 mb-5">
            <View className="flex-row items-center mb-3">
              <Type size={22} color="#2E7D7A" />
              <Text className="text-xl font-bold text-navy ml-2.5">
                Text Size
              </Text>
            </View>
            <View className="flex-row space-x-2">
              {(['normal', 'large', 'extra-large'] as TextSizeOption[]).map((size) => (
                <TouchableOpacity
                  key={size}
                  onPress={() => setTextSize(size)}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel={`Text size ${size}`}
                  className={`flex-1 py-3 items-center justify-center rounded-2xl border ${
                    textSize === size
                      ? 'bg-teal-600 border-teal-700'
                      : 'bg-white border-navy-200'
                  }`}
                >
                  <Text
                    className={`font-semibold capitalize ${
                      textSize === size ? 'text-white' : 'text-navy-700'
                    } ${size === 'extra-large' ? 'text-lg' : size === 'large' ? 'text-base' : 'text-sm'}`}
                  >
                    {size === 'extra-large' ? 'XL' : size}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </GeriCard>

          {/* Section 2: Voice Volume */}
          <GeriCard className="p-5 mb-5">
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center">
                <Volume2 size={22} color="#2E7D7A" />
                <Text className="text-xl font-bold text-navy ml-2.5">
                  Voice Volume
                </Text>
              </View>
              <Text className="text-base font-semibold text-teal-700">
                {Math.round(voiceVolume * 100)}%
              </Text>
            </View>
            <View className="flex-row space-x-2">
              {[0.5, 0.75, 1.0].map((vol) => (
                <TouchableOpacity
                  key={vol}
                  onPress={() => setVoiceVolume(vol)}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel={`Volume ${Math.round(vol * 100)} percent`}
                  className={`flex-1 py-3 items-center justify-center rounded-2xl border ${
                    voiceVolume === vol
                      ? 'bg-teal-600 border-teal-700'
                      : 'bg-white border-navy-200'
                  }`}
                >
                  <Text
                    className={`font-semibold ${
                      voiceVolume === vol ? 'text-white' : 'text-navy-700'
                    }`}
                  >
                    {vol === 0.5 ? 'Soft' : vol === 0.75 ? 'Medium' : 'Louder'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </GeriCard>

          {/* Section 3: Language */}
          <GeriCard className="p-5 mb-5">
            <View className="flex-row items-center mb-3">
              <Globe size={22} color="#2E7D7A" />
              <Text className="text-xl font-bold text-navy ml-2.5">
                Language
              </Text>
            </View>
            <View className="flex-row space-x-3">
              {[
                { code: 'en', label: 'English' },
                { code: 'es', label: 'Español' },
              ].map((lang) => (
                <TouchableOpacity
                  key={lang.code}
                  onPress={() => setLanguage(lang.code)}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel={`Language ${lang.label}`}
                  className={`flex-1 py-3 items-center justify-center rounded-2xl border ${
                    language === lang.code
                      ? 'bg-teal-600 border-teal-700'
                      : 'bg-white border-navy-200'
                  }`}
                >
                  <Text
                    className={`font-semibold ${
                      language === lang.code ? 'text-white' : 'text-navy-700'
                    }`}
                  >
                    {lang.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </GeriCard>

          {/* Section 4: Accessibility Toggles */}
          <GeriCard className="p-5 mb-5">
            <View className="flex-row items-center justify-between py-2 border-b border-navy-100">
              <View className="flex-row items-center flex-1 mr-3">
                <Eye size={22} color="#2E7D7A" />
                <View className="ml-3 flex-1">
                  <Text className="text-lg font-bold text-navy">
                    Reduced Motion
                  </Text>
                  <Text className="text-xs text-navy-500">
                    Slower and simpler companion animations
                  </Text>
                </View>
              </View>
              <Switch
                value={reducedMotion}
                onValueChange={setReducedMotion}
                trackColor={{ false: '#CBD5E1', true: '#2E7D7A' }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View className="flex-row items-center justify-between py-2 mt-2">
              <View className="flex-row items-center flex-1 mr-3">
                <RefreshCw size={22} color="#2E7D7A" />
                <View className="ml-3 flex-1">
                  <Text className="text-lg font-bold text-navy">
                    Replay Voice Responses
                  </Text>
                  <Text className="text-xs text-navy-500">
                    Allow repeating the last spoken message
                  </Text>
                </View>
              </View>
              <Switch
                value={replayVoiceResponse}
                onValueChange={setReplayVoiceResponse}
                trackColor={{ false: '#CBD5E1', true: '#2E7D7A' }}
                thumbColor="#FFFFFF"
              />
            </View>
          </GeriCard>

          {/* Section 5: Device Status & Unpair */}
          <GeriCard className="p-5 mb-6 bg-navy-50 border-navy-200">
            <Text className="text-sm font-bold text-navy-500 uppercase tracking-wider mb-2">
              Device Pairing Status
            </Text>
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-row items-center">
                <View className="w-3 h-3 rounded-full bg-emerald-500 mr-2" />
                <Text className="text-base font-semibold text-navy">
                  Connected & Paired
                </Text>
              </View>
              {session?.deviceId && (
                <Text className="text-xs text-navy-400 font-mono">
                  ID: {session.deviceId.slice(0, 8)}...
                </Text>
              )}
            </View>

            <GeriButton
              title="Unpair This Device"
              variant="outline"
              size="medium"
              onPress={() => setUnpairModalVisible(true)}
              icon={<LogOut size={18} color="#0F172A" />}
            />
          </GeriCard>
        </View>
      </ScrollView>

      {/* Unpair Confirmation Modal */}
      <Modal
        visible={unpairModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setUnpairModalVisible(false)}
      >
        <View className="flex-1 bg-black/60 items-center justify-center p-6">
          <View className="w-full max-w-sm bg-white rounded-3xl p-6 border border-navy-200 shadow-xl">
            <Text className="text-2xl font-bold text-navy text-center mb-2">
              Unpair Device?
            </Text>
            <Text className="text-base text-navy-600 text-center mb-6 leading-relaxed">
              This will disconnect the device from the patient profile. You will need a new pairing code to reconnect.
            </Text>

            <View className="space-y-3">
              <GeriButton
                title="Yes, Unpair Device"
                variant="danger"
                size="large"
                onPress={handleUnpair}
              />
              <View className="mt-3">
                <GeriButton
                  title="Cancel"
                  variant="outline"
                  size="large"
                  onPress={() => setUnpairModalVisible(false)}
                />
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
