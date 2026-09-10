import React from "react";
import { View, Text } from "react-native";
import { AlertCircle } from "lucide-react-native";
import { GeriButton } from "../common/GeriButton";

interface RetryCardProps {
  message?: string;
  onRetry: () => void;
}

export const RetryCard: React.FC<RetryCardProps> = ({
  message = "Unable to load content right now.",
  onRetry,
}) => {
  return (
    <View className="rounded-2xl border border-navy-200 bg-white p-6 items-center my-4">
      <AlertCircle size={32} color="#D97706" />
      <Text className="text-base text-navy-700 text-center my-3">
        {message}
      </Text>
      <View className="w-40">
        <GeriButton
          title="Try Again"
          size="medium"
          variant="secondary"
          onPress={onRetry}
        />
      </View>
    </View>
  );
};
