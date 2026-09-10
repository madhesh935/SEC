import React from 'react';
import { View, Text, Linking } from 'react-native';
import { MicOff } from 'lucide-react-native';
import { GeriButton } from '../common/GeriButton';

interface PermissionDeniedStateProps {
  onRetry?: () => void;
}

export const PermissionDeniedState: React.FC<PermissionDeniedStateProps> = ({ onRetry }) => {
  const openSettings = () => {
    Linking.openSettings();
  };

  return (
    <View
      accessible={true}
      accessibilityRole="alert"
      className="flex-1 items-center justify-center p-8 bg-background-warm"
    >
      <View className="w-20 h-20 rounded-full bg-red-50 items-center justify-center mb-6 border border-red-200">
        <MicOff size={40} color="#DC2626" />
      </View>
      <Text className="text-2xl font-bold text-navy text-center mb-3">
        Microphone Access Needed
      </Text>
      <Text className="text-lg text-navy-600 text-center leading-relaxed max-w-sm mb-8">
        GeriCare AI listens through your microphone so you can talk to your companion. Please allow microphone access in your device settings.
      </Text>
      <View className="w-full max-w-xs space-y-3">
        <GeriButton
          title="Open Device Settings"
          onPress={openSettings}
          variant="primary"
        />
        {onRetry && (
          <View className="mt-3">
            <GeriButton
              title="Check Again"
              onPress={onRetry}
              variant="outline"
            />
          </View>
        )}
      </View>
    </View>
  );
};
