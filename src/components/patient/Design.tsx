import React, { useState } from "react";
import {
  View,
  Text,
  TextProps,
  Pressable,
  ScrollView,
  StyleSheet,
  ViewStyle,
  useWindowDimensions,
} from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import {
  ChevronLeft,
  Heart,
  Leaf,
  Image as ImageIcon,
  RefreshCw,
} from "lucide-react-native";
import Svg, { Path, G } from "react-native-svg";
import { useSettingsStore } from "../../store/settings.store";
import { useNetwork } from "../../hooks/useNetwork";
import { CompanionOrb } from "../companion/CompanionOrb";

export const palette = {
  ink: "#123356",
  muted: "#466480",
  teal: "#087E80",
  ivory: "#FFFCF5",
  mint: "#E8F7F0",
  blue: "#EAF3FF",
  lavender: "#F1ECFF",
  peach: "#FFF0E7",
  rose: "#FFF0F0",
  line: "#DFE9E5",
  white: "#FFFFFF",
  red: "#B63443",
};
export type Tone = "mint" | "blue" | "lavender" | "peach" | "rose" | "white";
export function Copy({
  children,
  size = 18,
  bold = false,
  style,
  ...props
}: TextProps & { size?: number; bold?: boolean }) {
  const textSize = useSettingsStore((s) => s.textSize);
  const scale =
    textSize === "extra-large" ? 1.22 : textSize === "normal" ? 0.94 : 1;
  return (
    <Text
      {...props}
      style={[
        {
          color: palette.ink,
          fontSize: size * scale,
          lineHeight: size * scale * 1.4,
          fontWeight: bold ? "700" : "400",
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}
export function Botanical({ right = false }: { right?: boolean }) {
  return (
    <View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{
        position: "absolute",
        bottom: 0,
        [right ? "right" : "left"]: -12,
        width: 100,
        height: 245,
        opacity: 0.38,
        transform: [{ scaleX: right ? -1 : 1 }],
      }}
    >
      <Svg width="100%" height="100%" viewBox="0 0 100 245">
        <G fill="#8ABFA6">
          <Path
            d="M20 245 Q76 140 45 10"
            fill="none"
            stroke="#79AA91"
            strokeWidth="2"
          />
          <Path d="M48 60 Q12 52 18 19 Q52 31 48 60 M54 93 Q91 76 87 43 Q52 53 54 93 M54 129 Q15 110 17 80 Q52 90 54 129 M48 163 Q90 152 95 115 Q59 124 48 163 M36 199 Q2 183 7 145 Q41 158 36 199 M22 232 Q62 232 78 194 Q41 193 22 232" />
        </G>
      </Svg>
    </View>
  );
}
export function Brand() {
  return (
    <View style={{ alignItems: "center", gap: 4 }}>
      <View style={styles.row}>
        <Heart color={palette.teal} size={34} strokeWidth={2.5} />
        <Copy size={30} bold>
          GeriCare
        </Copy>
      </View>
      <Copy size={15} style={{ color: palette.muted }}>
        Always with you
      </Copy>
    </View>
  );
}
export function Screen({
  title,
  subtitle,
  children,
  back = true,
  warm = false,
  right,
  onBack,
}: {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  back?: boolean;
  warm?: boolean;
  right?: React.ReactNode;
  onBack?: () => void;
}) {
  const router = useRouter();
  return (
    <View
      style={{ flex: 1, backgroundColor: warm ? palette.peach : palette.ivory }}
    >
      <Botanical />
      <Botanical right />
      {title && (
        <View style={styles.header}>
          {back ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Go back"
              onPress={
                onBack ||
                (() =>
                  router.canGoBack() ? router.back() : router.replace("/home"))
              }
              style={styles.back}
            >
              <ChevronLeft color={palette.ink} size={25} />
            </Pressable>
          ) : (
            <View style={{ width: 48 }} />
          )}
          <View style={{ flex: 1, alignItems: "center" }}>
            <Copy size={24} bold style={{ textAlign: "center" }}>
              {title}
            </Copy>
            {subtitle && (
              <Copy
                size={16}
                style={{ textAlign: "center", color: palette.muted }}
              >
                {subtitle}
              </Copy>
            )}
          </View>
          {right || <View style={{ width: 48 }} />}
        </View>
      )}
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.content}
      >
        {children}
      </ScrollView>
    </View>
  );
}
export function Card({
  children,
  tone = "white",
  style,
}: {
  children: React.ReactNode;
  tone?: Tone;
  style?: ViewStyle;
}) {
  return (
    <View style={[styles.card, { backgroundColor: palette[tone] }, style]}>
      {children}
    </View>
  );
}
export function Action({
  label,
  onPress,
  icon,
  secondary = false,
  danger = false,
  disabled = false,
  loading = false,
  style,
}: {
  label: string;
  onPress: () => void;
  icon?: React.ReactNode;
  secondary?: boolean;
  danger?: boolean;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      style={({ pressed }) => [
        styles.action,
        {
          backgroundColor: secondary
            ? palette.white
            : danger
              ? palette.red
              : palette.teal,
          opacity: disabled || loading ? 0.65 : pressed ? 0.8 : 1,
        },
        style,
      ]}
    >
      {icon}
      <Copy
        size={18}
        bold
        style={{
          color: secondary ? palette.teal : palette.white,
          textAlign: "center",
          flexShrink: 1,
        }}
      >
        {loading ? "Just a moment…" : label}
      </Copy>
    </Pressable>
  );
}
export function MenuCard({
  title,
  description,
  icon,
  tone = "mint",
  onPress,
}: {
  title: string;
  description?: string;
  icon: React.ReactNode;
  tone?: Tone;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
      style={({ pressed }) => [
        styles.card,
        {
          flexDirection: "row",
          alignItems: "center",
          gap: 14,
          opacity: pressed ? 0.75 : 1,
        },
      ]}
    >
      <View style={[styles.icon, { backgroundColor: palette[tone] }]}>
        {icon}
      </View>
      <View style={{ flex: 1 }}>
        <Copy bold size={20}>
          {title}
        </Copy>
        {description && (
          <Copy size={16} style={{ color: palette.muted }}>
            {description}
          </Copy>
        )}
      </View>
      <ChevronLeft
        color={palette.teal}
        size={22}
        style={{ transform: [{ rotate: "180deg" }] }}
      />
    </Pressable>
  );
}
export function Reassurance({
  children = "Take your time. You’re doing great!",
}: {
  children?: React.ReactNode;
}) {
  return (
    <View
      style={{
        padding: 18,
        borderRadius: 22,
        backgroundColor: palette.blue,
        flexDirection: "row",
        gap: 12,
        alignItems: "center",
      }}
    >
      <Heart size={26} color={palette.teal} />
      <Copy size={16} style={{ flex: 1, color: palette.muted }}>
        {children}
      </Copy>
    </View>
  );
}
export function QueryState({
  loading,
  error,
  empty,
  message,
  retry,
  children,
}: {
  loading: boolean;
  error: unknown;
  empty?: boolean;
  message?: string;
  retry: () => void;
  children: React.ReactNode;
}) {
  const { isOffline } = useNetwork();
  if (isOffline || error)
    return (
      <Card tone="peach">
        <Copy size={24} bold>
          We couldn’t connect right now.
        </Copy>
        <Copy>
          {isOffline ? "Please check your connection." : "Please try again."}
        </Copy>
        <Action
          label="Try Again"
          onPress={retry}
          icon={<RefreshCw color="white" size={20} />}
        />
      </Card>
    );
  if (loading)
    return (
      <View
        accessibilityLiveRegion="polite"
        style={{ alignItems: "center", gap: 20, paddingTop: 28 }}
      >
        <CompanionOrb state="processing" size={115} />
        <Copy>Just a moment…</Copy>
        {[0, 1, 2].map((i) => (
          <View
            key={i}
            style={{
              height: 64,
              width: "100%",
              borderRadius: 22,
              backgroundColor: palette.mint,
            }}
          />
        ))}
      </View>
    );
  if (empty)
    return (
      <View style={{ paddingVertical: 48, alignItems: "center", gap: 20 }}>
        <Leaf size={42} color={palette.teal} />
        <Copy size={21} style={{ textAlign: "center", maxWidth: 360 }}>
          {message}
        </Copy>
      </View>
    );
  return <>{children}</>;
}
export function PatientImage({
  url,
  label,
  height = 180,
  style,
}: {
  url?: string | null;
  label: string;
  height?: number;
  style?: ViewStyle;
}) {
  const [failed, setFailed] = useState(false),
    [loading, setLoading] = useState(true);
  React.useEffect(() => {
    setFailed(false);
    setLoading(true);
  }, [url]);
  return (
    <View
      style={[
        {
          height,
          backgroundColor: palette.mint,
          borderRadius: 18,
          overflow: "hidden",
          alignItems: "center",
          justifyContent: "center",
        },
        style,
      ]}
    >
      {(!url || failed || loading) && (
        <ImageIcon color={palette.teal} size={30} />
      )}
      {url && !failed && (
        <Image
          source={{ uri: url }}
          accessibilityLabel={label}
          accessible
          contentFit="cover"
          style={StyleSheet.absoluteFill}
          onLoad={() => setLoading(false)}
          onError={() => {
            setFailed(true);
            setLoading(false);
          }}
        />
      )}
    </View>
  );
}
export function useColumns() {
  const { width, fontScale } = useWindowDimensions();
  const size = useSettingsStore((s) => s.textSize);
  return width < 360 || fontScale > 1.3 || size === "extra-large" ? 1 : 2;
}
export const styles = StyleSheet.create({
  content: {
    padding: 20,
    paddingBottom: 32,
    gap: 18,
    flexGrow: 1,
    width: "100%",
    maxWidth: 680,
    alignSelf: "center",
  },
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingTop: 12,
    paddingBottom: 10,
    gap: 4,
    width: "100%",
    maxWidth: 720,
    alignSelf: "center",
  },
  back: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 24,
    backgroundColor: "#FFFFFFB8",
  },
  card: {
    padding: 18,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: palette.line,
    gap: 14,
    backgroundColor: palette.white,
    boxShadow: "0px 3px 12px rgba(18,51,86,0.045)",
  },
  action: {
    minHeight: 56,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 28,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: palette.teal,
  },
  icon: {
    width: 56,
    height: 56,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
});
