import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  View,
  Pressable,
  StyleSheet,
  useWindowDimensions,
} from "react-native";
import { Image } from "expo-image";
import {
  Sparkles,
  RotateCcw,
  Volume2,
  VolumeX,
  Heart,
  Smile,
  ImageIcon,
} from "lucide-react-native";
import { Copy, Action, Card, palette, getContextualImage } from "../patient/Design";
import { gameAudio } from "../../utils/gameAudio";

interface PuzzleImageOption {
  id: string;
  title: string;
  url: string;
  caption: string;
}

const DEFAULT_PUZZLES: PuzzleImageOption[] = [
  {
    id: "garden",
    title: "Cottage Garden",
    url: "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=600&auto=format&fit=crop&q=80",
    caption: "A peaceful garden in full morning bloom.",
  },
  {
    id: "lake",
    title: "Quiet Lake",
    url: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600&auto=format&fit=crop&q=80",
    caption: "Still, calming waters under a warm sunset sky.",
  },
  {
    id: "bird",
    title: "Robin Songbird",
    url: "https://images.unsplash.com/photo-1444464666168-49d633b86797?w=600&auto=format&fit=crop&q=80",
    caption: "A cheerful songbird resting in the morning sun.",
  },
];

interface PicturePuzzleGameProps {
  customImage?: {
    url?: string | null;
    title?: string;
  };
  onComplete?: () => void;
  onExit?: () => void;
}

interface Tile {
  originalIndex: number; // 0: top-left, 1: top-right, 2: bottom-left, 3: bottom-right
  currentSlot: number;
}

function resolveCustomImageUrl(url?: string | null, title?: string) {
  if (!url || url.includes("127.0.0.1") || url.includes("localhost")) {
    return getContextualImage(title || "Memory").fallbackUrl;
  }
  return url;
}

export function PicturePuzzleGame({
  customImage,
  onComplete,
  onExit,
}: PicturePuzzleGameProps) {
  const { width } = useWindowDimensions();

  const [selectedPuzzle, setSelectedPuzzle] = useState<PuzzleImageOption>(() => {
    if (customImage?.url) {
      return {
        id: "custom",
        title: customImage.title || "Cherished Memory",
        url: resolveCustomImageUrl(customImage.url, customImage.title),
        caption: customImage.title || "A special moment in time.",
      };
    }
    return DEFAULT_PUZZLES[0];
  });

  useEffect(() => {
    if (customImage?.url) {
      setSelectedPuzzle({
        id: "custom",
        title: customImage.title || "Cherished Memory",
        url: resolveCustomImageUrl(customImage.url, customImage.title),
        caption: customImage.title || "A special moment in time.",
      });
    }
  }, [customImage?.url, customImage?.title]);

  const [tiles, setTiles] = useState<Tile[]>([]);
  const [selectedTileSlot, setSelectedTileSlot] = useState<number | null>(null);
  const [muted, setMuted] = useState(gameAudio.isMuted());
  const [message, setMessage] = useState("Tap two pieces to swap them into place.");

  // Exact mathematical geometry
  const GAP = 8;
  const PADDING = 8;
  // Maximum inner width clamped for mobile screens
  const maxAvailable = Math.min(300, width - 48 - (2 * PADDING));
  const tileSize = Math.floor((maxAvailable - GAP) / 2);
  const boardInnerSize = (tileSize * 2) + GAP;
  const boardOuterSize = boardInnerSize + (2 * PADDING);

  // Initialize and shuffle
  const shuffleTiles = useCallback(() => {
    // Standard solvable initial scramble
    let order = [1, 0, 3, 2];
    if (Math.random() > 0.5) order = [2, 3, 0, 1];

    const initialTiles: Tile[] = order.map((origIdx, slot) => ({
      originalIndex: origIdx,
      currentSlot: slot,
    }));

    setTiles(initialTiles);
    setSelectedTileSlot(null);
    setMessage("Tap two pieces to swap them into place.");
    gameAudio.playTap();
  }, []);

  useEffect(() => {
    shuffleTiles();
  }, [selectedPuzzle, shuffleTiles]);

  // Check if puzzle is solved
  const isSolved = useMemo(() => {
    if (tiles.length !== 4) return false;
    return tiles.every((tile, index) => tile.originalIndex === index);
  }, [tiles]);

  const handleTilePress = (slotIndex: number) => {
    if (isSolved) return;

    if (selectedTileSlot === null) {
      // First tile selected
      setSelectedTileSlot(slotIndex);
      gameAudio.playTap();
      setMessage("Now tap another piece to swap them.");
    } else if (selectedTileSlot === slotIndex) {
      // Deselect if clicked same tile
      setSelectedTileSlot(null);
      setMessage("Tap two pieces to swap them into place.");
    } else {
      // Swap the two tiles
      gameAudio.playMatch();
      const newTiles = [...tiles];
      const temp = newTiles[selectedTileSlot];
      newTiles[selectedTileSlot] = newTiles[slotIndex];
      newTiles[slotIndex] = temp;

      newTiles[selectedTileSlot].currentSlot = selectedTileSlot;
      newTiles[slotIndex].currentSlot = slotIndex;

      setTiles(newTiles);
      setSelectedTileSlot(null);

      const solvedNow = newTiles.every((t, i) => t.originalIndex === i);
      if (solvedNow) {
        setMessage("Wonderful! The picture is complete!");
        setTimeout(() => {
          gameAudio.playCelebration();
          onComplete?.();
        }, 300);
      } else {
        setMessage("Great swap! Keep going.");
      }
    }
  };

  const toggleSound = () => {
    const next = gameAudio.toggleMuted();
    setMuted(next);
  };

  const renderTile = (slotIndex: number) => {
    const tile = tiles[slotIndex];
    if (!tile) return null;

    const isSelected = selectedTileSlot === slotIndex;
    const origRow = Math.floor(tile.originalIndex / 2);
    const origCol = tile.originalIndex % 2;

    return (
      <Pressable
        key={`slot-${slotIndex}`}
        accessibilityRole="button"
        accessibilityLabel={`Puzzle piece ${tile.originalIndex + 1} at spot ${slotIndex + 1}.${isSelected ? " Selected." : ""}`}
        onPress={() => handleTilePress(slotIndex)}
        style={({ pressed }) => [
          styles.tileBox,
          {
            width: tileSize,
            height: tileSize,
          },
          isSelected && styles.tileBoxSelected,
          pressed && { opacity: 0.8 },
        ]}
      >
        <View
          style={{
            width: tileSize,
            height: tileSize,
            overflow: "hidden",
            borderRadius: 12,
          }}
        >
          <Image
            source={{ uri: selectedPuzzle.url }}
            contentFit="cover"
            style={{
              position: "absolute",
              width: boardInnerSize,
              height: boardInnerSize,
              left: -origCol * (tileSize + GAP),
              top: -origRow * (tileSize + GAP),
            }}
          />
        </View>

        {/* Number badge guide */}
        <View style={styles.tileBadge}>
          <Copy size={13} bold style={{ color: palette.ink }}>
            {tile.originalIndex + 1}
          </Copy>
        </View>
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      {/* Top Header Bar */}
      <View style={styles.topBar}>
        <View style={styles.badge}>
          <ImageIcon color={palette.teal} size={18} />
          <Copy size={15} bold numberOfLines={1} style={{ color: palette.teal, maxWidth: 180 }}>
            {selectedPuzzle.title}
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
              <VolumeX color={palette.muted} size={20} />
            ) : (
              <Volume2 color={palette.teal} size={20} />
            )}
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Shuffle puzzle"
            onPress={shuffleTiles}
            style={styles.circleBtn}
          >
            <RotateCcw color={palette.ink} size={18} />
          </Pressable>
        </View>
      </View>

      {/* Picture Selector (if multiple puzzles available) */}
      {!customImage?.url && (
        <View style={styles.selectorRow}>
          {DEFAULT_PUZZLES.map((p) => {
            const isSelected = selectedPuzzle.id === p.id;
            return (
              <Pressable
                key={p.id}
                accessibilityRole="button"
                accessibilityLabel={`Select picture ${p.title}`}
                onPress={() => setSelectedPuzzle(p)}
                style={[
                  styles.selectorChip,
                  isSelected && styles.selectorChipSelected,
                ]}
              >
                <Copy
                  size={13}
                  bold={isSelected}
                  style={{ color: isSelected ? palette.teal : palette.ink }}
                >
                  {p.title}
                </Copy>
              </Pressable>
            );
          })}
        </View>
      )}

      {/* Guidance Message Banner */}
      <View style={styles.messageBanner}>
        <Smile color={palette.teal} size={20} />
        <Copy size={15} bold style={{ color: palette.ink, flex: 1 }}>
          {message}
        </Copy>
      </View>

      {/* 2x2 Picture Puzzle Board */}
      <View style={styles.centerWrapper}>
        <View
          style={[
            styles.puzzleBoard,
            {
              width: boardOuterSize,
              height: boardOuterSize,
              padding: PADDING,
            },
            isSolved && styles.puzzleBoardSolved,
          ]}
        >
          {isSolved ? (
            // Solved full picture view
            <View style={{ width: "100%", height: "100%", borderRadius: 16, overflow: "hidden" }}>
              <Image
                source={{ uri: selectedPuzzle.url }}
                contentFit="cover"
                style={StyleSheet.absoluteFill}
              />
            </View>
          ) : (
            // 2x2 Explicit Grid: Row 0 & Row 1
            <View style={{ gap: GAP, width: "100%", height: "100%" }}>
              <View style={{ flexDirection: "row", gap: GAP, justifyContent: "center" }}>
                {renderTile(0)}
                {renderTile(1)}
              </View>
              <View style={{ flexDirection: "row", gap: GAP, justifyContent: "center" }}>
                {renderTile(2)}
                {renderTile(3)}
              </View>
            </View>
          )}
        </View>
      </View>

      {/* Celebration Card upon Solving */}
      {isSolved && (
        <Card tone="mint" style={styles.celebrationCard}>
          <View style={{ alignItems: "center", gap: 8 }}>
            <Sparkles color={palette.teal} size={32} />
            <Copy size={20} bold style={{ textAlign: "center", color: palette.ink }}>
              Beautifully Pieced Together!
            </Copy>
            <Copy size={15} style={{ textAlign: "center", color: palette.muted }}>
              {selectedPuzzle.caption}
            </Copy>
            <View style={{ flexDirection: "row", gap: 10, marginTop: 6, width: "100%" }}>
              <Action
                label="Mix Again"
                onPress={shuffleTiles}
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
    gap: 12,
    width: "100%",
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 2,
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
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: palette.line,
    alignItems: "center",
    justifyContent: "center",
  },
  selectorRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
    justifyContent: "center",
  },
  selectorChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: palette.line,
  },
  selectorChipSelected: {
    backgroundColor: palette.mint,
    borderColor: palette.teal,
  },
  messageBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: palette.blue,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
  },
  centerWrapper: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 4,
  },
  puzzleBoard: {
    backgroundColor: palette.white,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: palette.line,
    boxShadow: "0px 6px 16px rgba(18,51,86,0.08)",
  },
  puzzleBoardSolved: {
    borderColor: palette.teal,
    borderWidth: 3,
    boxShadow: "0px 0px 18px rgba(8,126,128,0.25)",
  },
  tileBox: {
    borderRadius: 14,
    borderWidth: 2,
    borderColor: palette.line,
    overflow: "hidden",
    position: "relative",
    backgroundColor: palette.mint,
  },
  tileBoxSelected: {
    borderColor: palette.teal,
    borderWidth: 3,
    boxShadow: "0px 0px 12px rgba(8,126,128,0.5)",
  },
  tileBadge: {
    position: "absolute",
    bottom: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderWidth: 1,
    borderColor: palette.line,
    alignItems: "center",
    justifyContent: "center",
  },
  celebrationCard: {
    marginTop: 4,
    borderWidth: 2,
    borderColor: palette.teal,
    padding: 16,
  },
});
