import React from 'react';
import { View, Text } from 'react-native';
import { GeriButton } from '../common/GeriButton';

interface EmptyStateProps {
  title?: string;
  message: string;
  icon?: React.ReactNode;
  actionTitle?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  message,
  icon,
  actionTitle,
  onAction,
}) => {
  return (
    <View
      accessible={true}
      className="flex-1 items-center justify-center p-8 bg-background-warm"
    >
      {icon && (
        <View className="w-20 h-20 rounded-full bg-navy-50 items-center justify-center mb-6 border border-navy-100">
          {icon}
        </View>
      )}
      {title && (
        <Text className="text-2xl font-bold text-navy text-center mb-3">
          {title}
        </Text>
      )}
      <Text className="text-lg text-navy-600 text-center leading-relaxed max-w-sm mb-6">
        {message}
      </Text>
      {actionTitle && onAction && (
        <View className="w-full max-w-xs mt-2">
          <GeriButton title={actionTitle} onPress={onAction} variant="secondary" />
        </View>
      )}
    </View>
  );
};
