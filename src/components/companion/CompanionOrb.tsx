import React, { useEffect, useRef, useId } from "react";
import {
  View,
  Animated,
  Easing,
  Platform,
  AccessibilityInfo,
} from "react-native";
import Svg, {
  Defs,
  RadialGradient,
  Stop,
  Circle,
  Ellipse,
  Path,
} from "react-native-svg";
import { CompanionState, CompanionUiMode } from "../../types/conversation";
import { useSettingsStore } from "../../store/settings.store";

export function CompanionOrb({
  state,
  uiMode = "normal",
  size = 220,
}: {
  state: CompanionState;
  uiMode?: CompanionUiMode;
  size?: number;
}) {
  const reduced = useSettingsStore((s) => s.reducedMotion);
  const [systemReduced, setSystemReduced] = React.useState(false);
  const motion = useRef(new Animated.Value(1)).current;
  const id = useId().replace(/:/g, "");
  const comfort = uiMode === "comfort" || state === "comfort",
    offline = state === "offline" || state === "error";
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setSystemReduced);
    const subscription = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setSystemReduced,
    );
    return () => subscription.remove();
  }, []);
  useEffect(() => {
    motion.setValue(1);
    if (reduced || systemReduced || offline) return;
    const duration = comfort ? 3800 : state === "speaking" ? 1800 : 2800;
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(motion, {
          toValue: 1.035,
          duration,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: Platform.OS !== "web",
        }),
        Animated.timing(motion, {
          toValue: 1,
          duration,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: Platform.OS !== "web",
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [state, comfort, offline, reduced, systemReduced, motion]);
  const color = offline
    ? "#A7BDC0"
    : comfort
      ? "#EACBA4"
      : state === "processing" || state === "uploading"
        ? "#B8C6EF"
        : "#58D4D6";
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel="Your GeriCare companion"
      style={{
        width: size + 28,
        height: size + 28,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Animated.View
        style={{
          width: size + 28,
          height: size + 28,
          transform: [{ scale: motion }],
        }}
      >
        <Svg width="100%" height="100%" viewBox="0 0 260 260">
          <Defs>
            <RadialGradient id={id} cx="40%" cy="28%" r="75%">
              <Stop offset="0" stopColor="#FFFFFF" />
              <Stop offset=".45" stopColor="#E3FFFF" />
              <Stop offset=".82" stopColor={color} />
              <Stop offset="1" stopColor={offline ? "#8AA4A9" : "#2EBBBE"} />
            </RadialGradient>
          </Defs>
          <Circle cx="130" cy="124" r="119" fill={color} opacity=".10" />
          <Circle
            cx="130"
            cy="124"
            r="109"
            fill="none"
            stroke={color}
            strokeWidth="1.4"
            opacity=".3"
          />
          <Ellipse
            cx="130"
            cy="238"
            rx="62"
            ry="7"
            fill="#4A8D8A"
            opacity=".1"
          />
          <Circle
            cx="130"
            cy="124"
            r="94"
            fill={`url(#${id})`}
            stroke="white"
            strokeWidth="4"
          />
          <Path
            d="M65 84 Q86 45 124 45"
            fill="none"
            stroke="white"
            strokeWidth="5"
            strokeLinecap="round"
            opacity=".85"
          />
          <Ellipse
            cx="83"
            cy="139"
            rx="13"
            ry="8"
            fill="#F3B6BB"
            opacity=".58"
          />
          <Ellipse
            cx="177"
            cy="139"
            rx="13"
            ry="8"
            fill="#F3B6BB"
            opacity=".58"
          />
          {offline ? (
            <Path
              d="M91 119 Q99 125 107 119 M153 119 Q161 125 169 119"
              stroke="#123356"
              strokeWidth="5"
              strokeLinecap="round"
              fill="none"
            />
          ) : (
            <>
              <Ellipse cx="99" cy="116" rx="6.5" ry="8.5" fill="#123356" />
              <Ellipse cx="161" cy="116" rx="6.5" ry="8.5" fill="#123356" />
              <Circle cx="101" cy="113" r="2" fill="white" />
              <Circle cx="163" cy="113" r="2" fill="white" />
            </>
          )}
          {state === "speaking" ? (
            <Ellipse cx="130" cy="146" rx="10" ry="12" fill="#123356" />
          ) : (
            <Path
              d="M118 142 Q130 155 142 142"
              fill="none"
              stroke="#123356"
              strokeWidth="5"
              strokeLinecap="round"
            />
          )}
          <Path
            d="M130 195 C113 183 117 177 123 179 Q130 180 130 185 Q134 176 141 180 C149 188 136 194 130 195"
            fill="white"
            opacity=".9"
          />
        </Svg>
      </Animated.View>
    </View>
  );
}
