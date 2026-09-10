import React from "react";
import { View, TouchableOpacity, ViewStyle } from "react-native";

export type CardVariant = "default" | "mint" | "blue" | "lavender" | "comfort";

interface GeriCardProps {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: CardVariant;
  className?: string;
  style?: ViewStyle;
  accessible?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export const GeriCard: React.FC<GeriCardProps> = ({
  children,
  onPress,
  variant = "default",
  className = "",
  style,
  accessible = true,
  accessibilityLabel,
  accessibilityHint,
}) => {
  const getVariantClasses = () => {
    switch (variant) {
      case "mint":
        return "bg-mint-50 border-mint-200";
      case "blue":
        return "bg-softblue-50 border-softblue-200";
      case "lavender":
        return "bg-lavender-50 border-lavender-200";
      case "comfort":
        return "bg-comfort-card border-amber-200";
      case "default":
      default:
        return "bg-white border-navy-100 shadow-sm";
    }
  };

  const cardClasses = `rounded-3xl border p-5 ${getVariantClasses()} ${className}`;

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.8}
        accessible={accessible}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        className={cardClasses}
        style={style}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View
      accessible={accessible}
      accessibilityLabel={accessibilityLabel}
      className={cardClasses}
      style={style}
    >
      {children}
    </View>
  );
};
