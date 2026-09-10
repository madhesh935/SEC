import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Heart, Music, AlertCircle, Sparkles } from 'lucide-react-native';
import { GeriHeader } from '../../src/components/common/GeriHeader';
import { CompanionOrb } from '../../src/components/companion/CompanionOrb';
import { VoiceButton } from '../../src/components/companion/VoiceButton';
import { GeriCard } from '../../src/components/common/GeriCard';
import { useCompanionVoice } from '../../src/hooks/useCompanionVoice';
import { useCompanionStore } from '../../src/store/companion.store';
import { useNetwork } from '../../src/hooks/useNetwork';
import { ROUTES } from '../../src/constants/routes';

export default function CompanionScreen() {
  const router = useRouter();
  const { isOffline } = useNetwork();
  const { state, uiMode, transcript, responseText } = useCompanionStore();
  const {
    toggleVoice,
    isRecording,
    isProcessing,
    isSpeaking,
    errorMessage,
    resetToIdle,
  } = useCompanionVoice();

  const isComfort = uiMode === 'comfort';

  // Dynamic empathetic label
  const getPromptLabel = () => {
    if (isOffline) return "You're offline right now";
    if (errorMessage) return 'Unable to connect';
    if (isRecording) return "I'm listening...";
    if (isProcessing) return 'Just a moment...';
    if (isSpeaking) return 'Speaking...';
    if (isComfort) return "You're not alone.";
    return "Tap when you're ready";
  };

  return (
    <View className={`flex-1 ${isComfort ? 'bg-comfort-bg' : 'bg-background-warm'}`}>
      <GeriHeader
        title="Companion"
        subtitle={isComfort ? 'Comfort & Calm Mode' : 'Personal voice companion'}
        onBackPress={() => router.back()}
      />

      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        className="px-6 py-4 justify-between items-center"
      >
        {/* Top Status & Reassurance Banner */}
        <View className="items-center w-full max-w-sm my-2">
          <View
            className={`flex-row items-center px-4 py-2 rounded-full border mb-2 ${
              isComfort
                ? 'bg-amber-100 border-amber-300'
                : 'bg-teal-50 border-teal-200'
            }`}
          >
            <Sparkles size={16} color={isComfort ? '#D97706' : '#2E7D7A'} />
            <Text
              className={`text-sm font-semibold ml-2 ${
                isComfort ? 'text-amber-900' : 'text-teal-800'
              }`}
            >
              {isComfort ? 'Comfort mode active' : 'Voice companion ready'}
            </Text>
          </View>

          <Text className="text-3xl font-bold text-navy text-center tracking-tight mt-1">
            {getPromptLabel()}
          </Text>

          {isComfort && (
            <Text className="text-lg text-amber-900 text-center mt-2 font-medium">
              Everything is okay. I am right here with you.
            </Text>
          )}
        </View>

        {/* Center Companion Orb */}
        <View className="items-center my-6">
          <CompanionOrb state={state} uiMode={uiMode} size={240} />
        </View>

        {/* Optional Secondary Transcript / Response Bubble (Patient Safe) */}
        {(responseText || transcript) && (
          <View className="w-full max-w-md my-2">
            <GeriCard variant={isComfort ? 'comfort' : 'default'} className="p-4">
              {transcript && (
                <Text className="text-xs text-navy-400 uppercase font-bold tracking-wider mb-1">
                  You said
                </Text>
              )}
              {transcript && (
                <Text className="text-base text-navy-700 italic mb-2">
                  "{transcript}"
                </Text>
              )}
              {responseText && (
                <Text className="text-lg font-medium text-navy leading-relaxed">
                  {responseText}
                </Text>
              )}
            </GeriCard>
          </View>
        )}

        {/* Error Notification */}
        {errorMessage && (
          <View className="w-full max-w-md my-2 p-4 bg-amber-50 rounded-2xl border border-amber-300 flex-row items-center justify-between">
            <View className="flex-row items-center flex-1 mr-2">
              <AlertCircle size={22} color="#D97706" />
              <Text className="text-sm font-medium text-amber-900 ml-2">
                {errorMessage}
              </Text>
            </View>
            <TouchableOpacity
              onPress={resetToIdle}
              className="px-3 py-1.5 bg-white border border-amber-300 rounded-xl"
            >
              <Text className="text-xs font-bold text-amber-900">Dismiss</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Bottom Voice Controller */}
        <View className="w-full items-center my-4">
          <VoiceButton
            state={state}
            uiMode={uiMode}
            onPress={toggleVoice}
            disabled={isOffline || isProcessing}
          />
        </View>

        {/* Comfort Mode Reassuring Shortcuts */}
        {isComfort && (
          <View className="w-full max-w-sm flex-row justify-around mt-2 mb-4">
            <TouchableOpacity
              onPress={() => router.push(ROUTES.PATIENT.COMFORT as any)}
              className="flex-row items-center px-4 py-3 bg-amber-100 rounded-2xl border border-amber-300"
            >
              <Music size={20} color="#D97706" />
              <Text className="text-sm font-bold text-amber-900 ml-2">
                Play Familiar Music
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push(ROUTES.PATIENT.FAMILY as any)}
              className="flex-row items-center px-4 py-3 bg-amber-100 rounded-2xl border border-amber-300"
            >
              <Heart size={20} color="#D97706" />
              <Text className="text-sm font-bold text-amber-900 ml-2">
                See Family
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
