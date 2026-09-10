import React from 'react';
import { TouchableOpacity, Text, View, ActivityIndicator } from 'react-native';
import { Mic, MicOff, Square, Volume2 } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { CompanionState, CompanionUiMode } from '../../types/conversation';

interface VoiceButtonProps {
  state: CompanionState;
  uiMode?: CompanionUiMode;
  onPress: () => void;
  disabled?: boolean;
}

export const VoiceButton: React.FC<VoiceButtonProps> = ({
  state,
  uiMode = 'normal',
  onPress,
  disabled = false,
}) => {
  const isComfort = uiMode === 'comfort' || state === 'comfort';

  const handlePress = () => {
    if (disabled) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {
      // ignore
    }
    onPress();
  };

  const getConfig = () => {
    switch (state) {
      case 'recording':
        return {
          icon: <Square size={34} color="#FFFFFF" fill="#FFFFFF" />,
          label: 'Tap to Finish',
          subLabel: "I'm listening...",
          bgClass: 'bg-emerald-600 border-emerald-700',
          accessibilityHint: 'Stops recording and sends voice to companion',
        };
      case 'uploading':
      case 'processing':
        return {
          icon: <ActivityIndicator size="large" color="#FFFFFF" />,
          label: 'Processing',
          subLabel: 'Just a moment...',
          bgClass: 'bg-indigo-600 border-indigo-700',
          accessibilityHint: 'Companion is thinking',
        };
      case 'speaking':
        return {
          icon: <Volume2 size={36} color="#FFFFFF" />,
          label: 'Speaking',
          subLabel: 'Listening to companion...',
          bgClass: 'bg-blue-600 border-blue-700',
          accessibilityHint: 'Companion is speaking',
        };
      case 'offline':
      case 'error':
        return {
          icon: <MicOff size={36} color="#FFFFFF" />,
          label: 'Unavailable',
          subLabel: state === 'offline' ? "You're offline" : 'Tap to retry',
          bgClass: 'bg-navy-400 border-navy-500',
          accessibilityHint: 'Voice is currently unavailable',
        };
      case 'idle':
      case 'comfort':
      default:
        return {
          icon: <Mic size={38} color="#FFFFFF" />,
          label: isComfort ? 'Talk to Me' : 'Tap to Talk',
          subLabel: isComfort ? "You're not alone" : 'Tap when ready',
          bgClass: isComfort ? 'bg-amber-600 border-amber-700' : 'bg-teal-600 border-teal-700',
          accessibilityHint: 'Starts voice recording',
        };
    }
  };

  const config = getConfig();

  return (
    <View className="items-center justify-center my-4">
      <TouchableOpacity
        onPress={handlePress}
        disabled={disabled || state === 'processing' || state === 'uploading'}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={config.label}
        accessibilityHint={config.accessibilityHint}
        activeOpacity={0.8}
        className={`w-24 h-24 rounded-full items-center justify-center border-4 shadow-lg active:scale-95 ${config.bgClass}`}
        style={{ elevation: 6 }}
      >
        {config.icon}
      </TouchableOpacity>

      <Text className="text-xl font-bold text-navy mt-4 tracking-tight text-center">
        {config.label}
      </Text>
      <Text className="text-base text-navy-500 mt-1 text-center">
        {config.subLabel}
      </Text>
    </View>
  );
};
