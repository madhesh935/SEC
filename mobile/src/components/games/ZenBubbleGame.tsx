import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Pressable,
  StyleSheet,
  useWindowDimensions,
} from "react-native";
import {
  Sparkles,
  Volume2,
  VolumeX,
  RotateCcw,
  Sun,
  Heart,
  Moon,
  Flower2,
} from "lucide-react-native";
import { Copy, Card, palette } from "../patient/Design";
import { gameAudio } from "../../utils/gameAudio";

interface Bubble {
  id: number;
  x: number; // percentage (10% to 80%)
  y: number; // percentage (10% to 80%)
  size: number;
  color: string;
  borderColor: string;
  popped: boolean;
  pulseScale: number;
  icon: "sparkle" | "flower" | "heart" | "sun";
}

interface ZenBubbleGameProps {
  onComplete?: () => void;
  onExit?: () => void;
}

const BUBBLE_COLORS = [
  { bg: "#E8F7F0", border: "#8ABFA6", icon: "flower" as const },
  { bg: "#F1ECFF", border: "#B4A0E5", icon: "sparkle" as const },
  { bg: "#EAF3FF", border: "#8BB4F6", icon: "sun" as const },
  { bg: "#FFF0E7", border: "#F9B896", icon: "heart" as const },
  { bg: "#FFF0F0", border: "#F69C9C", icon: "sparkle" as const },
];

export function ZenBubbleGame({ onComplete }: ZenBubbleGameProps) {
  const { width } = useWindowDimensions();
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [popCount, setPopCount] = useState<number>(0);
  const [muted, setMuted] = useState(gameAudio.isMuted());
  const [calmMessage, setCalmMessage] = useState("Tap any floating bubble to pop it gently.");
  const nextId = useRef(1);

  // Initialize bubbles
  const spawnInitialBubbles = useCallback(() => {
    const initial: Bubble[] = [];
    const count = 7;
    for (let i = 0; i < count; i++) {
      const c = BUBBLE_COLORS[i % BUBBLE_COLORS.length];
      initial.push({
        id: nextId.current++,
        x: 12 + (i % 3) * 28 + (Math.random() * 8 - 4),
        y: 12 + Math.floor(i / 3) * 26 + (Math.random() * 8 - 4),
        size: 72 + Math.floor(Math.random() * 20),
        color: c.bg,
        borderColor: c.border,
        popped: false,
        pulseScale: 1,
        icon: c.icon,
      });
    }
    setBubbles(initial);
  }, []);

  useEffect(() => {
    spawnInitialBubbles();
  }, [spawnInitialBubbles]);

  // Gentle floating drift effect
  useEffect(() => {
    const interval = setInterval(() => {
      setBubbles((prev) =>
        prev.map((b) => {
          if (b.popped) return b;
          // Gentle random drift
          const deltaX = (Math.random() - 0.5) * 1.5;
          const deltaY = (Math.random() - 0.5) * 1.5;
          const newX = Math.max(8, Math.min(82, b.x + deltaX));
          const newY = Math.max(8, Math.min(82, b.y + deltaY));
          return { ...b, x: newX, y: newY };
        }),
      );
    }, 1500);

    return () => clearInterval(interval);
  }, []);

  // Handle popping a bubble
  const handlePop = (id: number) => {
    gameAudio.playPop();

    setBubbles((prev) =>
      prev.map((b) => (b.id === id ? { ...b, popped: true } : b)),
    );

    const newCount = popCount + 1;
    setPopCount(newCount);

    if (newCount === 5) {
      setCalmMessage("So gentle. Breathe in peace, let worries go.");
    } else if (newCount === 10) {
      setCalmMessage("10 moments of calm! You are doing wonderfully.");
      gameAudio.playCelebration();
      onComplete?.();
    } else if (newCount % 6 === 0) {
      setCalmMessage("Soft and peaceful. Take your time.");
    }

    // Respawn a replacement bubble gently after 700ms
    setTimeout(() => {
      const c = BUBBLE_COLORS[Math.floor(Math.random() * BUBBLE_COLORS.length)];
      setBubbles((prev) =>
        prev.map((b) =>
          b.id === id
            ? {
                ...b,
                id: nextId.current++,
                x: 10 + Math.random() * 72,
                y: 10 + Math.random() * 72,
                size: 70 + Math.floor(Math.random() * 22),
                color: c.bg,
                borderColor: c.border,
                popped: false,
                icon: c.icon,
              }
            : b,
        ),
      );
    }, 700);
  };

  const toggleSound = () => {
    const next = gameAudio.toggleMuted();
    setMuted(next);
  };

  const restartPops = () => {
    gameAudio.playTap();
    setPopCount(0);
    setCalmMessage("Tap any floating bubble to pop it gently.");
    spawnInitialBubbles();
  };

  return (
    <View style={styles.container}>
      {/* Top Header Bar */}
      <View style={styles.topBar}>
        <View style={styles.badge}>
          <Heart color={palette.teal} size={18} />
          <Copy size={16} bold style={{ color: palette.teal }}>
            {popCount} moments of calm
          </Copy>
        </View>

        <View style={{ flexDirection: "row", gap: 10 }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={muted ? "Unmute sound" : "Mute sound"}
            onPress={toggleSound}
            style={styles.circleBtn}
          >
            {muted ? (
              <VolumeX color={palette.muted} size={22} />
            ) : (
              <Volume2 color={palette.teal} size={22} />
            )}
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Reset bubble count"
            onPress={restartPops}
            style={styles.circleBtn}
          >
            <RotateCcw color={palette.ink} size={20} />
          </Pressable>
        </View>
      </View>

      {/* Gentle Guidance Banner */}
      <View style={styles.guidanceBanner}>
        <Moon color={palette.teal} size={22} />
        <Copy size={16} bold style={{ color: palette.ink, flex: 1 }}>
          {calmMessage}
        </Copy>
      </View>

      {/* Floating Interactive Canvas */}
      <View style={[styles.canvas, { height: Math.min(340, width * 0.88) }]}>
        {bubbles.map((b) => {
          if (b.popped) {
            // Ripple burst
            return (
              <View
                key={b.id}
                style={[
                  styles.burstCircle,
                  {
                    left: `${b.x}%`,
                    top: `${b.y}%`,
                    width: b.size * 1.25,
                    height: b.size * 1.25,
                    borderColor: b.borderColor,
                  },
                ]}
              >
                <Sparkles size={24} color={b.borderColor} />
              </View>
            );
          }

          return (
            <Pressable
              key={b.id}
              accessibilityRole="button"
              accessibilityLabel="Floating gentle bubble. Tap to pop."
              onPress={() => handlePop(b.id)}
              style={({ pressed }) => [
                styles.bubble,
                {
                  left: `${b.x}%`,
                  top: `${b.y}%`,
                  width: b.size,
                  height: b.size,
                  borderRadius: b.size / 2,
                  backgroundColor: b.color,
                  borderColor: b.borderColor,
                  transform: [{ scale: pressed ? 0.9 : 1 }],
                },
              ]}
            >
              {/* Soft inner shimmer */}
              <View
                style={[
                  styles.shimmer,
                  {
                    width: b.size * 0.35,
                    height: b.size * 0.35,
                    borderRadius: b.size * 0.175,
                  },
                ]}
              />

              {b.icon === "flower" && <Flower2 size={24} color={b.borderColor} />}
              {b.icon === "heart" && <Heart size={24} color={b.borderColor} />}
              {b.icon === "sun" && <Sun size={24} color={b.borderColor} />}
              {b.icon === "sparkle" && <Sparkles size={24} color={b.borderColor} />}
            </Pressable>
          );
        })}
      </View>

      {/* Reassurance Footer */}
      <Card tone="mint" style={styles.footerCard}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <Sparkles color={palette.teal} size={28} />
          <View style={{ flex: 1 }}>
            <Copy size={16} bold style={{ color: palette.ink }}>
              No time limits, no mistakes.
            </Copy>
            <Copy size={14} style={{ color: palette.muted }}>
              Just soft touches, soothing sounds, and peaceful moments.
            </Copy>
          </View>
        </View>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 14,
    width: "100%",
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 4,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: palette.mint,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.line,
  },
  circleBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: palette.line,
    alignItems: "center",
    justifyContent: "center",
  },
  guidanceBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: palette.lavender,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
  },
  canvas: {
    width: "100%",
    backgroundColor: "#F4FAF8",
    borderRadius: 28,
    borderWidth: 2,
    borderColor: palette.line,
    position: "relative",
    overflow: "hidden",
  },
  bubble: {
    position: "absolute",
    borderWidth: 2.5,
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0px 6px 18px rgba(8,126,128,0.12)",
  },
  shimmer: {
    position: "absolute",
    top: "14%",
    left: "18%",
    backgroundColor: "rgba(255,255,255,0.75)",
  },
  burstCircle: {
    position: "absolute",
    borderRadius: 999,
    borderWidth: 2,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    opacity: 0.6,
  },
  footerCard: {
    padding: 14,
    borderRadius: 20,
  },
});
