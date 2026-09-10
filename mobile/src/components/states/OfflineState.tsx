import React from "react";
import { View, Text } from "react-native";
import { WifiOff } from "lucide-react-native";
import { GeriButton } from "../common/GeriButton";

interface OfflineStateProps {
  onRetry?: () => void;
  fullScreen?: boolean;
}

export const OfflineState: React.FC<OfflineStateProps> = ({
  onRetry,
  fullScreen = true,
}) => {
  if (!fullScreen) {
    return (
      <View
        accessible={true}
        accessibilityRole="alert"
        className="flex-row items-center justify-between px-5 py-3 bg-amber-50 border-b border-amber-200"
      >
        <View className="flex-row items-center flex-1 mr-3">
          <WifiOff size={22} color="#D97706" />
          <Text className="text-base font-medium text-amber-900 ml-3">
            You're offline right now.
          </Text>
        </View>
        {onRetry && (
          <GeriButton
            title="Retry"
            size="medium"
            variant="outline"
            onPress={onRetry}
            style={{ minHeight: 40, paddingVertical: 6, paddingHorizontal: 14 }}
          />
        )}
      </View>
    );
  }

  return (
    <View
      accessible={true}
      accessibilityRole="alert"
      className="flex-1 items-center justify-center p-8 bg-background-warm"
    >
      <View className="w-20 h-20 rounded-full bg-amber-50 items-center justify-center mb-6 border border-amber-200">
        <WifiOff size={40} color="#D97706" />
      </View>
      <Text className="text-2xl font-bold text-navy text-center mb-3">
        You're offline right now.
      </Text>
      <Text className="text-lg text-navy-600 text-center leading-relaxed max-w-sm mb-8">
        Your companion needs an internet connection to talk. Please check your
        Wi-Fi or connection.
      </Text>
      {onRetry && (
        <View className="w-full max-w-xs">
          <GeriButton title="Try Again" onPress={onRetry} variant="primary" />
        </View>
      )}
    </View>
  );
};
