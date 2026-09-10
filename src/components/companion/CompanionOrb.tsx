import React, { useEffect, useRef } from 'react';
import { View, Animated, Easing, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { CompanionState, CompanionUiMode } from '../../types/conversation';
import { useSettingsStore } from '../../store/settings.store';

interface CompanionOrbProps {
  state: CompanionState;
  uiMode?: CompanionUiMode;
  size?: number;
}

export const CompanionOrb: React.FC<CompanionOrbProps> = ({
  state,
  uiMode = 'normal',
  size = 220,
}) => {
  const reducedMotion = useSettingsStore((s) => s.reducedMotion);

  // Animated values
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const waveAnim1 = useRef(new Animated.Value(0.3)).current;
  const waveAnim2 = useRef(new Animated.Value(0.5)).current;
  const waveAnim3 = useRef(new Animated.Value(0.7)).current;

  const isComfort = uiMode === 'comfort' || state === 'comfort';

  // Gentle breathing loop for idle & comfort
  useEffect(() => {
    if (reducedMotion) {
      scaleAnim.setValue(1);
      pulseAnim.setValue(1);
      return;
    }

    let loop: Animated.CompositeAnimation | null = null;

    if (state === 'idle' || isComfort) {
      const duration = isComfort ? 3200 : 2600; // Slower and deeper in comfort mode
      loop = Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.06,
            duration,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      );
      loop.start();
    } else if (state === 'recording') {
      // Gentle listening pulse
      loop = Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.12,
            duration: 1200,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 0.98,
            duration: 1200,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
      loop.start();
    } else if (state === 'processing' || state === 'uploading') {
      // Soft glowing oscillation
      loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.85,
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
      loop.start();
    } else if (state === 'speaking') {
      // Gentle vocal speaking cadence
      loop = Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.08,
            duration: 900,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 0.97,
            duration: 900,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      );
      loop.start();
    }

    return () => {
      if (loop) loop.stop();
    };
  }, [state, isComfort, reducedMotion, scaleAnim, pulseAnim]);

  // Subtle waveform simulation for listening state
  useEffect(() => {
    if (state !== 'recording' || reducedMotion) return;

    const animateWaves = () => {
      Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(waveAnim1, { toValue: 1, duration: 600, useNativeDriver: true }),
            Animated.timing(waveAnim1, { toValue: 0.3, duration: 600, useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.timing(waveAnim2, { toValue: 1, duration: 800, useNativeDriver: true }),
            Animated.timing(waveAnim2, { toValue: 0.4, duration: 800, useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.timing(waveAnim3, { toValue: 1, duration: 700, useNativeDriver: true }),
            Animated.timing(waveAnim3, { toValue: 0.5, duration: 700, useNativeDriver: true }),
          ]),
        ])
      ).start();
    };

    animateWaves();
  }, [state, reducedMotion, waveAnim1, waveAnim2, waveAnim3]);

  // Gradient colors depending on state
  const getGradientColors = (): readonly [string, string, ...string[]] => {
    if (isComfort) {
      return ['#FDE68A', '#F59E0B', '#D97706']; // Warm amber/peach comfort
    }
    if (state === 'recording') {
      return ['#A7F3D0', '#34D399', '#059669']; // Soft mint green listening
    }
    if (state === 'speaking') {
      return ['#BFDBFE', '#60A5FA', '#2563EB']; // Soft caring blue speaking
    }
    if (state === 'processing' || state === 'uploading') {
      return ['#DDD6FE', '#A78BFA', '#7C3AED']; // Lavender processing
    }
    if (state === 'error' || state === 'offline') {
      return ['#E2E8F0', '#94A3B8', '#64748B']; // Neutral resting slate
    }
    // Idle
    return ['#CCFBF1', '#5EEAD4', '#0D9488']; // Calming soft teal
  };

  const gradientColors = getGradientColors();

  return (
    <View
      accessible={true}
      accessibilityRole="image"
      accessibilityLabel={`Companion orb, status: ${state}`}
      className="items-center justify-center"
      style={{ width: size + 40, height: size + 40 }}
    >
      {/* Outer soft ambient aura */}
      <Animated.View
        style={{
          width: size + 32,
          height: size + 32,
          borderRadius: (size + 32) / 2,
          transform: [{ scale: reducedMotion ? 1 : scaleAnim }],
          opacity: 0.35,
        }}
        className={`absolute items-center justify-center ${
          isComfort ? 'bg-amber-300' : 'bg-teal-200'
        }`}
      />

      {/* Middle breathing glow ring */}
      <Animated.View
        style={{
          width: size + 16,
          height: size + 16,
          borderRadius: (size + 16) / 2,
          transform: [{ scale: reducedMotion ? 1 : scaleAnim }],
          opacity: reducedMotion ? 1 : pulseAnim,
        }}
        className={`absolute items-center justify-center ${
          isComfort ? 'bg-amber-100' : 'bg-teal-100'
        }`}
      />

      {/* Main friendly companion orb */}
      <Animated.View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          transform: [{ scale: reducedMotion ? 1 : scaleAnim }],
          shadowColor: isComfort ? '#D97706' : '#2E7D7A',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.18,
          shadowRadius: 20,
          elevation: 8,
        }}
        className="overflow-hidden items-center justify-center"
      >
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0.1, y: 0.1 }}
          end={{ x: 0.9, y: 0.9 }}
          style={{ width: size, height: size, borderRadius: size / 2 }}
          className="items-center justify-center"
        >
          {/* Subtle friendly visual presence */}
          {state === 'recording' ? (
            // Waveform bars while listening
            <View className="flex-row items-center space-x-2">
              <Animated.View
                style={{
                  height: 36,
                  width: 6,
                  backgroundColor: '#FFFFFF',
                  borderRadius: 3,
                  transform: [{ scaleY: waveAnim1 }],
                }}
              />
              <Animated.View
                style={{
                  height: 48,
                  width: 6,
                  backgroundColor: '#FFFFFF',
                  borderRadius: 3,
                  transform: [{ scaleY: waveAnim2 }],
                }}
              />
              <Animated.View
                style={{
                  height: 36,
                  width: 6,
                  backgroundColor: '#FFFFFF',
                  borderRadius: 3,
                  transform: [{ scaleY: waveAnim3 }],
                }}
              />
            </View>
          ) : (
            // Subtle, warm friendly eye curves
            <View className="flex-row items-center justify-center space-x-6">
              <View className="w-4 h-4 rounded-full bg-white opacity-85" />
              <View className="w-4 h-4 rounded-full bg-white opacity-85" />
            </View>
          )}
        </LinearGradient>
      </Animated.View>
    </View>
  );
};
