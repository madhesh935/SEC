import React from "react";
import { View, Text } from "react-native";
import { AlertCircle } from "lucide-react-native";
import { GeriButton } from "../common/GeriButton";

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  onGoBack?: () => void;
  retryTitle?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = "Unable to connect right now",
  message = "We are having trouble reaching our care service. Please try again in a moment.",
  onRetry,
  onGoBack,
  retryTitle = "Try Again",
}) => {
  return (
    <View
      accessible={true}
      accessibilityRole="alert"
      className="flex-1 items-center justify-center p-8 bg-background-warm"
    >
      <View className="w-20 h-20 rounded-full bg-amber-50 items-center justify-center mb-6 border border-amber-200">
        <AlertCircle size={40} color="#D97706" />
      </View>
      <Text className="text-2xl font-bold text-navy text-center mb-3">
        {title}
      </Text>
      <Text className="text-lg text-navy-600 text-center leading-relaxed max-w-sm mb-8">
        {message}
      </Text>
      <View className="w-full max-w-xs space-y-3">
        {onRetry && (
          <GeriButton title={retryTitle} onPress={onRetry} variant="primary" />
        )}
        {onGoBack && (
          <View className="mt-3">
            <GeriButton title="Go Back" onPress={onGoBack} variant="outline" />
          </View>
        )}
      </View>
    </View>
  );
};
