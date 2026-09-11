import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  View,
  Pressable,
  StyleSheet,
  useWindowDimensions,
} from "react-native";
import {
  Heart,
  Sparkles,
  RotateCcw,
  Volume2,
  VolumeX,
  Smile,
  Flower2,
  Cat,
  Coffee,
  Users,
  Sun,
  Bird,
  Dog,
} from "lucide-react-native";
import { Copy, Action, Card, palette, getContextualImage } from "../patient/Design";
import { gameAudio } from "../../utils/gameAudio";
import { Image } from "expo-image";

export interface CardItem {
  id: string;
  pairKey: string;
  label: string;
  iconType?: "flower" | "sun" | "bird" | "tea" | "cat" | "dog" | "butterfly" | "heart";
  imageUrl?: string | null;
  color?: string;
}

interface CardMatchGameProps {
  familyData?: Array<{ id: string; name: string; photoUrl?: string | null }>;
  onComplete?: () => void;
  onExit?: () => void;
}

const DEFAULT_THEMES = [
  {
    id: "garden",
    name: "Blossoms",
    icon: Flower2,
    cards: [
      { pairKey: "rose", label: "Red Rose", iconType: "flower", color: "#E05368" },
      { pairKey: "sunflower", label: "Sunflower", iconType: "sun", color: "#F4A228" },
      { pairKey: "lavender", label: "Songbird", iconType: "bird", color: "#6C5CE7" },
      { pairKey: "daisy", label: "Butterfly", iconType: "butterfly", color: "#00B894" },
    ],
  },
  {
    id: "pets",
    name: "Gentle Pets",
    icon: Cat,
    cards: [
      { pairKey: "cat", label: "Kitten", iconType: "cat", color: "#E17055" },
      { pairKey: "dog", label: "Friendly Pup", iconType: "dog", color: "#F39C12" },
      { pairKey: "bird", label: "Songbird", iconType: "bird", color: "#0984E3" },
      { pairKey: "heart", label: "Sweet Friend", iconType: "heart", color: "#E84393" },
    ],
  },
  {
    id: "cozy",
    name: "Cozy Day",
    icon: Coffee,
    cards: [
      { pairKey: "tea", label: "Warm Tea", iconType: "tea", color: "#00B894" },
      { pairKey: "sun", label: "Morning Sun", iconType: "sun", color: "#F1C40F" },
      { pairKey: "flower", label: "Sweet Bloom", iconType: "flower", color: "#FD79A8" },
      { pairKey: "heart", label: "Kind Heart", iconType: "heart", color: "#E74C3C" },
    ],
  },
] as const;

export function CardMatchGame({
  familyData = [],
  onComplete,
  onExit,
}: CardMatchGameProps) {
  const { width } = useWindowDimensions();
  const [selectedTheme, setSelectedTheme] = useState<string>("garden");
  const [cardCount, setCardCount] = useState<4 | 6>(4);
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [matchedPairs, setMatchedPairs] = useState<string[]>([]);
  const [encouragement, setEncouragement] = useState("Tap any two cards to find a match.");
  const [muted, setMuted] = useState(gameAudio.isMuted());

  const hasFamilyPhotos = useMemo(
    () => familyData.length >= 2,
    [familyData],
  );

  // Generate shuffled deck based on theme and pair count
  const deck = useMemo(() => {
    let sourcePairs: Array<{
      pairKey: string;
      label: string;
      iconType?: string;
      imageUrl?: string | null;
      color?: string;
    }> = [];

    if (selectedTheme === "family" && hasFamilyPhotos) {
      sourcePairs = familyData
        .slice(0, cardCount / 2)
        .map((f) => {
          const isInvalidOrLocal =
            !f.photoUrl ||
            f.photoUrl.includes("127.0.0.1") ||
            f.photoUrl.includes("localhost");
          return {
            pairKey: `family-${f.id}`,
            label: f.name,
            imageUrl: isInvalidOrLocal
              ? getContextualImage(f.name, "family").fallbackUrl
              : f.photoUrl,
            color: palette.teal,
          };
        });
    } else {
      const activeTheme =
        DEFAULT_THEMES.find((t) => t.id === selectedTheme) || DEFAULT_THEMES[0];
      sourcePairs = activeTheme.cards.slice(0, cardCount / 2);
    }

    // Duplicate each into a pair
    const cards: CardItem[] = [];
    sourcePairs.forEach((item, pIdx) => {
      cards.push({
        id: `card-${pIdx}-A`,
        pairKey: item.pairKey,
        label: item.label,
        iconType: item.iconType as CardItem["iconType"],
        imageUrl: item.imageUrl,
        color: item.color,
      });
      cards.push({
        id: `card-${pIdx}-B`,
        pairKey: item.pairKey,
        label: item.label,
        iconType: item.iconType as CardItem["iconType"],
        imageUrl: item.imageUrl,
        color: item.color,
      });
    });

    // Deterministic pleasant shuffle
    return cards.sort(() => Math.random() - 0.5);
  }, [selectedTheme, cardCount, hasFamilyPhotos, familyData]);

  // Reset state on new game
  const resetGame = useCallback(() => {
    setFlippedIndices([]);
    setMatchedPairs([]);
    setEncouragement("Tap any two cards to find a match.");
    gameAudio.playTap();
  }, []);

  useEffect(() => {
    resetGame();
  }, [selectedTheme, cardCount, resetGame]);

  const totalPairs = cardCount / 2;
  const isAllMatched = matchedPairs.length === totalPairs && totalPairs > 0;

  // Handle card click
  const handleCardPress = (index: number) => {
    // If card is already flipped, matched, or two are currently showing, ignore
    if (
      flippedIndices.includes(index) ||
      matchedPairs.includes(deck[index].pairKey) ||
      flippedIndices.length >= 2
    ) {
      return;
    }

    gameAudio.playTap();
    const newFlipped = [...flippedIndices, index];
    setFlippedIndices(newFlipped);

    if (newFlipped.length === 2) {
      const [firstIdx, secondIdx] = newFlipped;
      const firstCard = deck[firstIdx];
      const secondCard = deck[secondIdx];

      if (firstCard.pairKey === secondCard.pairKey) {
        // Match!
        const updatedMatches = [...matchedPairs, firstCard.pairKey];
        setMatchedPairs(updatedMatches);
        setFlippedIndices([]);
        gameAudio.playMatch();
        setEncouragement(`Wonderful! You matched ${firstCard.label}!`);

        if (updatedMatches.length === totalPairs) {
          setTimeout(() => {
            gameAudio.playCelebration();
            onComplete?.();
          }, 400);
        }
      } else {
        // Gentle no-match: leave visible briefly so patient sees them, then flip back
        setEncouragement("Good try! Take a moment to see them.");
        setTimeout(() => {
          setFlippedIndices([]);
          setEncouragement("Pick any two cards.");
        }, 1300);
      }
    }
  };

  const toggleSound = () => {
    const next = gameAudio.toggleMuted();
    setMuted(next);
  };

  const cardWidth = width < 420 ? "46%" : "47%";

  return (
    <View style={styles.container}>
      {/* Header bar with sound toggle & calm reassurance */}
      <View style={styles.topBar}>
        <View style={styles.badge}>
          <Sparkles color={palette.teal} size={18} />
          <Copy size={16} bold style={{ color: palette.teal }}>
            {matchedPairs.length} of {totalPairs} pairs found
          </Copy>
        </View>

        <View style={{ flexDirection: "row", gap: 10 }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={muted ? "Unmute sounds" : "Mute sounds"}
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
            accessibilityLabel="Shuffle and restart"
            onPress={resetGame}
            style={styles.circleBtn}
          >
            <RotateCcw color={palette.ink} size={20} />
          </Pressable>
        </View>
      </View>

      {/* Theme selection row */}
      <View style={styles.themeRow}>
        {DEFAULT_THEMES.map((t) => {
          const Icon = t.icon;
          const isSelected = selectedTheme === t.id;
          return (
            <Pressable
              key={t.id}
              accessibilityRole="button"
              accessibilityLabel={`Select theme ${t.name}`}
              onPress={() => setSelectedTheme(t.id)}
              style={[
                styles.themeTab,
                isSelected && styles.themeTabSelected,
              ]}
            >
              <Icon
                size={18}
                color={isSelected ? palette.white : palette.teal}
              />
              <Copy
                size={14}
                bold={isSelected}
                style={{ color: isSelected ? palette.white : palette.ink }}
              >
                {t.name}
              </Copy>
            </Pressable>
          );
        })}

        {hasFamilyPhotos && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Select Family Loved Ones theme"
            onPress={() => setSelectedTheme("family")}
            style={[
              styles.themeTab,
              selectedTheme === "family" && styles.themeTabSelected,
            ]}
          >
            <Users
              size={18}
              color={selectedTheme === "family" ? palette.white : palette.teal}
            />
            <Copy
              size={14}
              bold={selectedTheme === "family"}
              style={{
                color: selectedTheme === "family" ? palette.white : palette.ink,
              }}
            >
              Loved Ones
            </Copy>
          </Pressable>
        )}
      </View>

      {/* Encouragement message banner */}
      <View style={styles.messageBanner}>
        <Smile color={palette.teal} size={22} />
        <Copy size={16} bold style={{ color: palette.ink, flex: 1 }}>
          {encouragement}
        </Copy>
      </View>

      {/* Card Grid */}
      <View style={styles.grid}>
        {deck.map((card, idx) => {
          const isFlipped =
            flippedIndices.includes(idx) || matchedPairs.includes(card.pairKey);
          const isMatched = matchedPairs.includes(card.pairKey);

          return (
            <Pressable
              key={`${card.id}-${idx}`}
              accessibilityRole="button"
              accessibilityLabel={
                isFlipped
                  ? `${card.label}${isMatched ? ", matched" : ""}`
                  : `Card ${idx + 1}, face down. Tap to reveal.`
              }
              onPress={() => handleCardPress(idx)}
              style={({ pressed }) => [
                styles.cardBox,
                isFlipped ? styles.cardFlipped : styles.cardBack,
                isMatched && styles.cardMatched,
                pressed && { transform: [{ scale: 0.98 }] },
              ]}
            >
              {isFlipped ? (
                <View style={styles.cardContent}>
                  {card.imageUrl ? (
                    <Image
                      source={{ uri: card.imageUrl }}
                      contentFit="cover"
                      style={styles.cardImage}
                    />
                  ) : (
                    <View
                      style={[
                        styles.iconCircle,
                        { backgroundColor: card.color ? `${card.color}25` : palette.mint },
                      ]}
                    >
                      {card.iconType === "flower" ? (
                        <Flower2 color={card.color || palette.teal} size={32} />
                      ) : card.iconType === "sun" ? (
                        <Sun color={card.color || palette.teal} size={32} />
                      ) : card.iconType === "bird" ? (
                        <Bird color={card.color || palette.teal} size={32} />
                      ) : card.iconType === "cat" ? (
                        <Cat color={card.color || palette.teal} size={32} />
                      ) : card.iconType === "dog" ? (
                        <Dog color={card.color || palette.teal} size={32} />
                      ) : card.iconType === "tea" ? (
                        <Coffee color={card.color || palette.teal} size={32} />
                      ) : card.iconType === "heart" ? (
                        <Heart color={card.color || palette.teal} size={32} />
                      ) : (
                        <Sparkles color={card.color || palette.teal} size={32} />
                      )}
                    </View>
                  )}
                  <Copy size={17} bold style={{ textAlign: "center", color: palette.ink }}>
                    {card.label}
                  </Copy>
                  {isMatched && (
                    <View style={styles.matchTag}>
                      <Heart size={14} color={palette.teal} />
                      <Copy size={12} bold style={{ color: palette.teal }}>
                        Matched
                      </Copy>
                    </View>
                  )}
                </View>
              ) : (
                <View style={styles.cardBackPattern}>
                  <View style={styles.cardBackCircle}>
                    <Flower2 color={palette.teal} size={28} />
                  </View>
                  <Copy size={14} style={{ color: palette.muted, marginTop: 4 }}>
                    Tap to Turn
                  </Copy>
                </View>
              )}
            </Pressable>
          );
        })}
      </View>

      {/* Card Count / Difficulty Selector */}
      <View style={styles.difficultyRow}>
        <Copy size={15} style={{ color: palette.muted }}>
          Pairs:
        </Copy>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="2 pairs mode"
          onPress={() => setCardCount(4)}
          style={[styles.diffBtn, cardCount === 4 && styles.diffBtnActive]}
        >
          <Copy
            size={14}
            bold={cardCount === 4}
            style={{ color: cardCount === 4 ? palette.white : palette.ink }}
          >
            2 Pairs (Gentle)
          </Copy>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="3 pairs mode"
          onPress={() => setCardCount(6)}
          style={[styles.diffBtn, cardCount === 6 && styles.diffBtnActive]}
        >
          <Copy
            size={14}
            bold={cardCount === 6}
            style={{ color: cardCount === 6 ? palette.white : palette.ink }}
          >
            3 Pairs
          </Copy>
        </Pressable>
      </View>

      {/* Completion Dialog Card */}
      {isAllMatched && (
        <Card tone="mint" style={styles.celebrationCard}>
          <View style={{ alignItems: "center", gap: 10 }}>
            <Sparkles color={palette.teal} size={40} />
            <Copy size={24} bold style={{ textAlign: "center", color: palette.ink }}>
              Beautifully Done!
            </Copy>
            <Copy size={17} style={{ textAlign: "center", color: palette.muted }}>
              You found every single matching pair. You did wonderful!
            </Copy>
            <View style={{ flexDirection: "row", gap: 12, marginTop: 8, width: "100%" }}>
              <Action
                label="Play Again"
                onPress={resetGame}
                style={{ flex: 1 }}
              />
              {onExit && (
                <Action
                  label="All Games"
                  secondary
                  onPress={onExit}
                  style={{ flex: 1 }}
                />
              )}
            </View>
          </View>
        </Card>
      )}
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
  themeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  themeTab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: palette.line,
  },
  themeTabSelected: {
    backgroundColor: palette.teal,
    borderColor: palette.teal,
  },
  messageBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: palette.blue,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "center",
    marginTop: 4,
  },
  cardBox: {
    flexBasis: "46%",
    flexGrow: 1,
    maxWidth: "48%",
    minHeight: 125,
    borderRadius: 20,
    borderWidth: 2,
    padding: 10,
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0px 4px 14px rgba(18,51,86,0.06)",
  },
  cardBack: {
    backgroundColor: "#F9FBFA",
    borderColor: palette.line,
  },
  cardFlipped: {
    backgroundColor: palette.white,
    borderColor: palette.teal,
  },
  cardMatched: {
    backgroundColor: palette.mint,
    borderColor: "#58B391",
  },
  cardContent: {
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    width: "100%",
  },
  cardImage: {
    width: 72,
    height: 72,
    borderRadius: 16,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  matchTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: palette.white,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  cardBackPattern: {
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  cardBackCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: palette.mint,
    alignItems: "center",
    justifyContent: "center",
  },
  difficultyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    justifyContent: "center",
    marginTop: 6,
  },
  diffBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: palette.line,
  },
  diffBtnActive: {
    backgroundColor: palette.teal,
    borderColor: palette.teal,
  },
  celebrationCard: {
    marginTop: 14,
    borderWidth: 2,
    borderColor: palette.teal,
  },
});
