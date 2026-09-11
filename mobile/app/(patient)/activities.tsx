import React, { useState } from "react";
import { View, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import {
  Flower2,
  Sun,
  Music,
  Images,
  ArrowLeft,
  Sparkles,
  Heart,
  ChevronRight,
} from "lucide-react-native";
import {
  Screen,
  Copy,
  Card,
  Reassurance,
  palette,
  Tone,
} from "../../src/components/patient/Design";
import {
  useRecommendedActivities,
  useFamilyMembers,
  useMemories,
} from "../../src/hooks/usePatient";
import { CardMatchGame } from "../../src/components/games/CardMatchGame";
import { ZenBubbleGame } from "../../src/components/games/ZenBubbleGame";
import { MelodyChimesGame } from "../../src/components/games/MelodyChimesGame";
import { PicturePuzzleGame } from "../../src/components/games/PicturePuzzleGame";
import { gameAudio } from "../../src/utils/gameAudio";

type ActiveGame = "match" | "bubbles" | "chimes" | "puzzle" | null;

interface GameMenuItem {
  id: ActiveGame;
  title: string;
  subtitle: string;
  tone: Tone;
  icon: typeof Flower2;
  iconColor: string;
  badge: string;
}

const GAMES: GameMenuItem[] = [
  {
    id: "match",
    title: "Card Match Pairs",
    subtitle: "Find matching flowers, friendly pets & loved ones",
    tone: "lavender",
    icon: Flower2,
    iconColor: "#7350A3",
    badge: "Memory & Focus",
  },
  {
    id: "bubbles",
    title: "Zen Bubble Pop",
    subtitle: "Gently touch floating bubbles to pop & relax",
    tone: "mint",
    icon: Sun,
    iconColor: "#087E80",
    badge: "Sensory Calm",
  },
  {
    id: "chimes",
    title: "Melody Chimes",
    subtitle: "Play peaceful bells & timeless familiar tunes",
    tone: "peach",
    icon: Music,
    iconColor: "#E67E22",
    badge: "Musical Joy",
  },
  {
    id: "puzzle",
    title: "Picture Puzzle",
    subtitle: "Piece together serene photos & cherished memories",
    tone: "blue",
    icon: Images,
    iconColor: "#2980B9",
    badge: "Visual Flow",
  },
];

export default function Activities() {
  const router = useRouter();
  const [activeGame, setActiveGame] = useState<ActiveGame>(null);

  const activitiesQuery = useRecommendedActivities();
  const familyQuery = useFamilyMembers();
  const memoriesQuery = useMemories();

  const familyData = familyQuery.data?.map((f) => ({
    id: f.id,
    name: f.name,
    photoUrl: f.photoUrl,
  }));

  const memoryWithPhoto = memoriesQuery.data?.find((m) => !!m.imageUrl);
  const customImage = memoryWithPhoto
    ? {
        url: memoryWithPhoto.imageUrl,
        title: memoryWithPhoto.title,
      }
    : undefined;

  const handleSelectGame = (gameId: ActiveGame) => {
    gameAudio.playTap();
    setActiveGame(gameId);
  };

  const handleExitGame = () => {
    gameAudio.playTap();
    setActiveGame(null);
  };

  // If a game is actively playing, show focused game view
  if (activeGame) {
    const currentGame = GAMES.find((g) => g.id === activeGame);
    return (
      <Screen
        title={currentGame?.title || "Joyful Game"}
        subtitle={currentGame?.badge || "Gentle mind play"}
        onBack={handleExitGame}
      >
        {/* Sleek Game Switcher Pills */}
        <View style={styles.tabIconsRow}>
          {GAMES.map((g) => {
            const Icon = g.icon;
            const isSelected = activeGame === g.id;
            return (
              <Pressable
                key={g.id}
                accessibilityRole="button"
                accessibilityLabel={`Switch to ${g.title}`}
                onPress={() => handleSelectGame(g.id)}
                style={[
                  styles.tabIconBtn,
                  isSelected && styles.tabIconBtnActive,
                ]}
              >
                <Icon
                  size={20}
                  color={isSelected ? palette.white : g.iconColor}
                />
                {isSelected && (
                  <Copy size={13} bold style={{ color: palette.white }}>
                    {g.title.split(" ")[0]}
                  </Copy>
                )}
              </Pressable>
            );
          })}
        </View>

        {/* Render Active Game */}
        {activeGame === "match" && (
          <CardMatchGame
            familyData={familyData}
            onExit={handleExitGame}
          />
        )}

        {activeGame === "bubbles" && (
          <ZenBubbleGame
            onExit={handleExitGame}
          />
        )}

        {activeGame === "chimes" && (
          <MelodyChimesGame
            onExit={handleExitGame}
          />
        )}

        {activeGame === "puzzle" && (
          <PicturePuzzleGame
            customImage={customImage}
            onExit={handleExitGame}
          />
        )}
      </Screen>
    );
  }

  // Otherwise, render the Games Arcade Hub
  return (
    <Screen
      title="Joyful Games"
      subtitle="Calm, interactive activities for fun and relaxation."
    >
      {/* Welcome Banner */}
      <Card tone="mint" style={styles.welcomeCard}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
          <View style={styles.bannerIconCircle}>
            <Sparkles color={palette.teal} size={30} />
          </View>
          <View style={{ flex: 1, gap: 4 }}>
            <Copy size={20} bold style={{ color: palette.ink }}>
              Welcome to Play & Calm
            </Copy>
            <Copy size={15} style={{ color: palette.muted }}>
              Choose a gentle game below. No timers, no scores — just peaceful fun.
            </Copy>
          </View>
        </View>
      </Card>

      {/* Main Interactive Games List */}
      <View style={styles.gamesList}>
        {GAMES.map((game) => {
          const Icon = game.icon;
          return (
            <Pressable
              key={game.id}
              accessibilityRole="button"
              accessibilityLabel={`Play ${game.title}: ${game.subtitle}`}
              onPress={() => handleSelectGame(game.id)}
              style={({ pressed }) => [
                styles.gameCard,
                {
                  backgroundColor: palette[game.tone],
                  opacity: pressed ? 0.8 : 1,
                  transform: [{ scale: pressed ? 0.98 : 1 }],
                },
              ]}
            >
              <View
                style={[
                  styles.gameIconBox,
                  { backgroundColor: palette.white },
                ]}
              >
                <Icon color={game.iconColor} size={32} />
              </View>

              <View style={{ flex: 1, gap: 4 }}>
                <View style={styles.tagBadge}>
                  <Copy size={12} bold style={{ color: palette.teal }}>
                    {game.badge}
                  </Copy>
                </View>
                <Copy size={21} bold style={{ color: palette.ink }}>
                  {game.title}
                </Copy>
                <Copy size={15} style={{ color: palette.muted }}>
                  {game.subtitle}
                </Copy>
              </View>

              <View style={styles.arrowCircle}>
                <ChevronRight color={palette.teal} size={22} />
              </View>
            </Pressable>
          );
        })}
      </View>

      {/* Recommended Caregiver Activities (if any) */}
      {activitiesQuery.data && activitiesQuery.data.length > 0 && (
        <View style={{ gap: 10, marginTop: 8 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Heart size={20} color={palette.teal} />
            <Copy size={18} bold style={{ color: palette.ink }}>
              Special Prompts from Family
            </Copy>
          </View>

          {activitiesQuery.data.map((item) => (
            <Pressable
              key={item.id}
              accessibilityRole="button"
              accessibilityLabel={item.title}
              onPress={() =>
                router.push({
                  pathname: "/activity/[id]",
                  params: { id: item.id },
                })
              }
              style={({ pressed }) => [
                styles.caregiverCard,
                { opacity: pressed ? 0.8 : 1 },
              ]}
            >
              <View style={{ flex: 1, gap: 4 }}>
                <Copy size={18} bold style={{ color: palette.ink }}>
                  {item.title}
                </Copy>
                <Copy size={14} style={{ color: palette.muted }}>
                  {item.description}
                </Copy>
              </View>
              <ChevronRight color={palette.teal} size={20} />
            </Pressable>
          ))}
        </View>
      )}

      <Reassurance>
        Take all the time you need. Every game is here for your comfort.
      </Reassurance>
    </Screen>
  );
}

const styles = StyleSheet.create({
  welcomeCard: {
    padding: 18,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: palette.line,
  },
  bannerIconCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: palette.white,
    alignItems: "center",
    justifyContent: "center",
  },
  gamesList: {
    gap: 14,
  },
  gameCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    padding: 18,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: palette.line,
    boxShadow: "0px 4px 14px rgba(18,51,86,0.06)",
  },
  gameIconBox: {
    width: 62,
    height: 62,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0px 2px 8px rgba(18,51,86,0.05)",
  },
  tagBadge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.7)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  arrowCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: palette.white,
    alignItems: "center",
    justifyContent: "center",
  },
  caregiverCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 20,
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: palette.line,
  },
  tabIconsRow: {
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 4,
    flexWrap: "wrap",
  },
  tabIconBtn: {
    flexDirection: "row",
    gap: 6,
    height: 40,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: palette.line,
    alignItems: "center",
    justifyContent: "center",
  },
  tabIconBtnActive: {
    backgroundColor: palette.teal,
    borderColor: palette.teal,
  },
});
