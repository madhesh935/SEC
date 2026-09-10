import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, Easing, Platform } from 'react-native';
import { useSettingsStore } from '../../store/settings.store';

const NATIVE_DRIVER = Platform.OS !== 'web';

interface LoadingStateProps {
  message?: string;
  subMessage?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Just a moment...',
  subMessage,
}) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const reducedMotion = useSettingsStore((s) => s.reducedMotion);

  useEffect(() => {
    if (reducedMotion) return;

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 1400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: NATIVE_DRIVER,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: NATIVE_DRIVER,
        }),
      ])
    );

    animation.start();
    return () => animation.stop();
  }, [pulseAnim, reducedMotion]);

  return (
    <View
      accessible={true}
      accessibilityRole="progressbar"
      accessibilityLabel={message}
      className="flex-1 items-center justify-center p-8 bg-background-warm"
    >
      <Animated.View
        style={{
          transform: [{ scale: reducedMotion ? 1 : pulseAnim }],
        }}
        className="w-24 h-24 rounded-full bg-teal-100 border-4 border-teal-300 items-center justify-center mb-6 shadow-sm"
      >
        <View className="w-12 h-12 rounded-full bg-teal-600" />
      </Animated.View>
      <Text className="text-xl font-semibold text-navy text-center mb-2">
        {message}
      </Text>
      {subMessage && (
        <Text className="text-base text-navy-500 text-center max-w-xs">
          {subMessage}
        </Text>
      )}
    </View>
  );
};
