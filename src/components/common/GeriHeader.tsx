import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';

interface GeriHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  onBackPress?: () => void;
  rightAction?: React.ReactNode;
}

export const GeriHeader: React.FC<GeriHeaderProps> = ({
  title,
  subtitle,
  showBack = true,
  onBackPress,
  rightAction,
}) => {
  const router = useRouter();

  const handleBack = () => {
    if (onBackPress) {
      onBackPress();
    } else if (router.canGoBack()) {
      router.back();
    }
  };

  return (
    <View className="flex-row items-center justify-between px-6 pt-4 pb-3 bg-background-warm border-b border-navy-100">
      <View className="flex-row items-center flex-1">
        {showBack && (
          <TouchableOpacity
            onPress={handleBack}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            accessibilityHint="Navigates to the previous screen"
            className="w-12 h-12 rounded-full items-center justify-center bg-white border border-navy-200 mr-4 active:bg-navy-50"
          >
            <ChevronLeft size={28} color="#0F172A" />
          </TouchableOpacity>
        )}
        <View className="flex-1">
          <Text className="text-2xl font-bold text-navy tracking-tight" numberOfLines={1}>
            {title}
          </Text>
          {subtitle && (
            <Text className="text-sm text-navy-500 mt-0.5" numberOfLines={1}>
              {subtitle}
            </Text>
          )}
        </View>
      </View>
      {rightAction && <View className="ml-3">{rightAction}</View>}
    </View>
  );
};
