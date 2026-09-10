import React from "react";
import {
  TouchableOpacity,
  Text,
  View,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  AccessibilityRole,
} from "react-native";
import * as Haptics from "expo-haptics";

export type ButtonVariant =
  "primary" | "secondary" | "outline" | "danger" | "comfort";
export type ButtonSize = "medium" | "large";

interface GeriButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export const GeriButton: React.FC<GeriButtonProps> = ({
  title,
  onPress,
  variant = "primary",
  size = "large",
  disabled = false,
  loading = false,
  icon,
  style,
  textStyle,
  accessibilityLabel,
  accessibilityHint,
}) => {
  const handlePress = () => {
    if (disabled || loading) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // ignore
    }
    onPress();
  };

  const getVariantStyles = (): { button: string; text: string } => {
    if (disabled) {
      return {
        button: "bg-navy-200 border-navy-300",
        text: "text-navy-400",
      };
    }
    switch (variant) {
      case "secondary":
        return {
          button: "bg-teal-100 border-teal-200 active:bg-teal-200",
          text: "text-teal-800",
        };
      case "outline":
        return {
          button: "bg-transparent border-navy-300 active:bg-navy-50",
          text: "text-navy-800",
        };
      case "danger":
        return {
          button: "bg-red-600 border-red-700 active:bg-red-700",
          text: "text-white",
        };
      case "comfort":
        return {
          button: "bg-amber-600 border-amber-700 active:bg-amber-700",
          text: "text-white",
        };
      case "primary":
      default:
        return {
          button: "bg-teal-600 border-teal-700 active:bg-teal-700",
          text: "text-white",
        };
    }
  };

  const variantStyle = getVariantStyles();
  const heightClass =
    size === "large" ? "min-h-[58px] py-4 px-6" : "min-h-[48px] py-3 px-5";

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={disabled || loading}
      accessible={true}
      accessibilityRole={"button" as AccessibilityRole}
      accessibilityLabel={accessibilityLabel || title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: disabled || loading }}
      activeOpacity={0.8}
      className={`flex-row items-center justify-center rounded-2xl border ${heightClass} ${variantStyle.button}`}
      style={style}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={
            variant === "primary" ||
            variant === "danger" ||
            variant === "comfort"
              ? "#FFFFFF"
              : "#2E7D7A"
          }
        />
      ) : (
        <>
          {icon && <View className="mr-3">{icon}</View>}
          <Text
            className={`font-semibold text-center text-lg ${variantStyle.text}`}
            style={textStyle}
            numberOfLines={1}
          >
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};
