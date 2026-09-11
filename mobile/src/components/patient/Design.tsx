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
  Flower2,
  Music,
  Sun,
  Coffee,
  Sparkles,
  User,
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
        numberOfLines={1}
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
export function getContextualImage(label: string = "", category?: string) {
  const text = `${label} ${category || ""}`.toLowerCase();

  // 1. Nature, Rose, Garden, Flower, Bird, Tree, Bloom
  if (
    text.includes("rose") ||
    text.includes("garden") ||
    text.includes("flower") ||
    text.includes("bloom") ||
    text.includes("bird") ||
    text.includes("plant") ||
    text.includes("tree") ||
    text.includes("spring") ||
    text.includes("nature")
  ) {
    return {
      icon: Flower2,
      fallbackUrl:
        "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80",
      tone: "mint" as Tone,
      iconColor: palette.teal,
      badgeLabel: "Garden & Nature",
    };
  }

  // 2. Music, Piano, Choir, Song, Melody, Concert, Clair de Lune, Nocturne, Singer
  if (
    text.includes("piano") ||
    text.includes("choir") ||
    text.includes("music") ||
    text.includes("melody") ||
    text.includes("song") ||
    text.includes("concert") ||
    text.includes("gala") ||
    text.includes("clair de lune") ||
    text.includes("nocturne") ||
    text.includes("mozart") ||
    text.includes("sound") ||
    text.includes("audio")
  ) {
    return {
      icon: Music,
      fallbackUrl:
        "https://images.unsplash.com/photo-1520523839898-50712825e3a7?auto=format&fit=crop&w=800&q=80",
      tone: "peach" as Tone,
      iconColor: "#E67E22",
      badgeLabel: "Music & Melody",
    };
  }

  // 3. Seaside, Beach, Holiday, Cornwall, Ocean, Waves, Vacation, Coast
  if (
    text.includes("cornwall") ||
    text.includes("beach") ||
    text.includes("sea") ||
    text.includes("ocean") ||
    text.includes("holiday") ||
    text.includes("summer") ||
    text.includes("coast") ||
    text.includes("water") ||
    text.includes("lake") ||
    text.includes("sand") ||
    text.includes("travel")
  ) {
    return {
      icon: Sun,
      fallbackUrl:
        "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80",
      tone: "blue" as Tone,
      iconColor: "#2980B9",
      badgeLabel: "Seaside & Travel",
    };
  }

  // 4. Food, Scones, Baking, Tea, Kitchen, Breakfast, Meal, Lemon
  if (
    text.includes("scone") ||
    text.includes("baking") ||
    text.includes("bake") ||
    text.includes("tea") ||
    text.includes("kitchen") ||
    text.includes("lemon") ||
    text.includes("food") ||
    text.includes("cook") ||
    text.includes("breakfast")
  ) {
    return {
      icon: Coffee,
      fallbackUrl:
        "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80",
      tone: "peach" as Tone,
      iconColor: "#D35400",
      badgeLabel: "Cozy Kitchen",
    };
  }

  // 5. Family, Daughter, Husband, Granddaughter, Son, Sarah, Sophia, David, Robert
  if (
    text.includes("sarah") ||
    text.includes("sophia") ||
    text.includes("david") ||
    text.includes("robert") ||
    text.includes("daughter") ||
    text.includes("husband") ||
    text.includes("granddaughter") ||
    text.includes("family") ||
    text.includes("friend") ||
    text.includes("loved") ||
    text.includes("caregiver")
  ) {
    return {
      icon: Heart,
      fallbackUrl:
        "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=800&q=80",
      tone: "rose" as Tone,
      iconColor: "#E84393",
      badgeLabel: "Loved One",
    };
  }

  // Default / General Cherished Memory
  return {
    icon: Sparkles,
    fallbackUrl:
      "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80",
    tone: "mint" as Tone,
    iconColor: palette.teal,
    badgeLabel: "Cherished Moment",
  };
}

export function PatientImage({
  url,
  label,
  category,
  height = 180,
  style,
}: {
  url?: string | null;
  label: string;
  category?: string;
  height?: number;
  style?: ViewStyle;
}) {
  const context = getContextualImage(label, category);

  // Substitute local unreachable / broken placeholder URLs with context fallback
  const isInvalidOrLocalUrl =
    !url ||
    url.includes("127.0.0.1") ||
    url.includes("localhost");

  const effectiveUrl = isInvalidOrLocalUrl ? context.fallbackUrl : url;

  const [failed, setFailed] = useState(false);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    setFailed(false);
    setLoading(true);
  }, [effectiveUrl]);

  const Icon = context.icon;

  return (
    <View
      style={[
        {
          height,
          backgroundColor: palette[context.tone] || palette.mint,
          borderRadius: 18,
          overflow: "hidden",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        },
        style,
      ]}
    >
      {/* Contextual Card Fallback / Loading state */}
      {(!effectiveUrl || failed || loading) && (
        <View
          style={{
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            padding: 8,
          }}
        >
          <View
            style={{
              width: Math.min(height * 0.45, 52),
              height: Math.min(height * 0.45, 52),
              borderRadius: Math.min(height * 0.225, 26),
              backgroundColor: "rgba(255,255,255,0.85)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon color={context.iconColor} size={Math.min(height * 0.25, 26)} />
          </View>
          <Copy
            size={13}
            bold
            style={{ color: context.iconColor, textAlign: "center" }}
          >
            {context.badgeLabel}
          </Copy>
        </View>
      )}

      {/* Actual / Context-Matched Image */}
      {effectiveUrl && !failed && (
        <Image
          source={{ uri: effectiveUrl }}
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
    minWidth: 0,
    alignSelf: "stretch",
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 28,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: palette.teal,
    overflow: "hidden",
  },
  icon: {
    width: 56,
    height: 56,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
});
