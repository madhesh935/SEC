import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Pressable,
  StyleSheet,
  useWindowDimensions,
} from "react-native";
import {
  Music,
  Sparkles,
  Volume2,
  VolumeX,
  RotateCcw,
  Smile,
  Heart,
} from "lucide-react-native";
import { Copy, Action, Card, palette } from "../patient/Design";
import { gameAudio } from "../../utils/gameAudio";

interface ChimeBar {
  key: string;
  note: string;
  label: string;
  color: string;
  glowColor: string;
  heightRatio: number; // height gradient for visual aesthetic
}

const CHIME_BARS: ChimeBar[] = [
  { key: "C4", note: "Do", label: "C", color: "#E05368", glowColor: "#FF8E9E", heightRatio: 1.0 },
  { key: "D4", note: "Re", label: "D", color: "#E67E22", glowColor: "#F39C12", heightRatio: 0.94 },
  { key: "E4", note: "Mi", label: "E", color: "#F1C40F", glowColor: "#F9E79F", heightRatio: 0.88 },
  { key: "G4", note: "Sol", label: "G", color: "#087E80", glowColor: "#58B391", heightRatio: 0.82 },
  { key: "A4", note: "La", label: "A", color: "#2980B9", glowColor: "#85C1E9", heightRatio: 0.76 },
  { key: "C5", note: "Do", label: "High C", color: "#8E44AD", glowColor: "#BB8FCE", heightRatio: 0.7 },
];

interface Song {
  id: string;
  title: string;
  notes: string[];
}

const SONGS: Song[] = [
  {
    id: "twinkle",
    title: "Twinkle Star",
    notes: ["C4", "C4", "G4", "G4", "A4", "A4", "G4"],
  },
  {
    id: "sunshine",
    title: "Morning Melody",
    notes: ["C4", "D4", "E4", "G4", "E4", "D4", "C4"],
  },
  {
    id: "joy",
    title: "Song of Joy",
    notes: ["E4", "E4", "G4", "G4", "E4", "D4", "C4"],
  },
];

interface MelodyChimesGameProps {
  onComplete?: () => void;
  onExit?: () => void;
}

export function MelodyChimesGame({ onComplete, onExit }: MelodyChimesGameProps) {
  const { width } = useWindowDimensions();
  const [mode, setMode] = useState<"free" | "song">("free");
  const [selectedSong, setSelectedSong] = useState<Song>(SONGS[0]);
  const [songStep, setSongStep] = useState<number>(0);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [muted, setMuted] = useState(gameAudio.isMuted());
  const [songCompleted, setSongCompleted] = useState<boolean>(false);
  const [message, setMessage] = useState("Tap any bell to play a soothing chime.");

  // Identify which key should glow in song mode
  const targetKey = mode === "song" && !songCompleted ? selectedSong.notes[songStep] : null;

  const handleChimePress = (chime: ChimeBar) => {
    setActiveKey(chime.key);
    gameAudio.playChime(chime.key, 1.4);

    setTimeout(() => {
      setActiveKey((curr) => (curr === chime.key ? null : curr));
    }, 450);

    if (mode === "song" && !songCompleted) {
      if (chime.key === targetKey) {
        const nextStep = songStep + 1;
        if (nextStep >= selectedSong.notes.length) {
          setSongCompleted(true);
          setSongStep(nextStep);
          setMessage(`Wonderful! You finished ${selectedSong.title}!`);
          setTimeout(() => {
            gameAudio.playCelebration();
            onComplete?.();
          }, 350);
        } else {
          setSongStep(nextStep);
          setMessage("Great job! Follow the glowing chime.");
        }
      } else {
        // Gentle guidance without penalty
        setMessage("Keep going! Follow the gentle glowing chime.");
      }
    }
  };

  const selectSong = useCallback((song: Song) => {
    setSelectedSong(song);
    setSongStep(0);
    setSongCompleted(false);
    setMessage(`Follow the glowing bell to play ${song.title}.`);
    gameAudio.playTap();
  }, []);

  const switchMode = (newMode: "free" | "song") => {
    setMode(newMode);
    setSongCompleted(false);
    setSongStep(0);
    if (newMode === "free") {
      setMessage("Tap any bell to play a soothing chime.");
    } else {
      selectSong(selectedSong);
    }
    gameAudio.playTap();
  };

  const toggleSound = () => {
    const next = gameAudio.toggleMuted();
    setMuted(next);
  };

  const barWidth = Math.max(
    38,
    Math.min(56, Math.floor((Math.min(width - 56, 440) - 36) / 6)),
  );

  return (
    <View style={styles.container}>
      {/* Top Header Bar */}
      <View style={styles.topBar}>
        <View style={styles.badge}>
          <Music color={palette.teal} size={18} />
          <Copy size={16} bold style={{ color: palette.teal }}>
            {mode === "free" ? "Free Play" : selectedSong.title}
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

          {mode === "song" && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Restart song"
              onPress={() => selectSong(selectedSong)}
              style={styles.circleBtn}
            >
              <RotateCcw color={palette.ink} size={20} />
            </Pressable>
          )}
        </View>
      </View>

      {/* Mode Switcher */}
      <View style={styles.modeRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Free play mode"
          onPress={() => switchMode("free")}
          style={[styles.modeTab, mode === "free" && styles.modeTabSelected]}
        >
          <Sparkles size={16} color={mode === "free" ? palette.white : palette.teal} />
          <Copy
            size={15}
            bold={mode === "free"}
            style={{ color: mode === "free" ? palette.white : palette.ink }}
          >
            Free Play
          </Copy>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Play along song mode"
          onPress={() => switchMode("song")}
          style={[styles.modeTab, mode === "song" && styles.modeTabSelected]}
        >
          <Music size={16} color={mode === "song" ? palette.white : palette.teal} />
          <Copy
            size={15}
            bold={mode === "song"}
            style={{ color: mode === "song" ? palette.white : palette.ink }}
          >
            Play a Song
          </Copy>
        </Pressable>
      </View>

      {/* Song selector if in song mode */}
      {mode === "song" && (
        <View style={styles.songRow}>
          {SONGS.map((song) => {
            const isSelected = selectedSong.id === song.id;
            return (
              <Pressable
                key={song.id}
                accessibilityRole="button"
                accessibilityLabel={`Play ${song.title}`}
                onPress={() => selectSong(song)}
                style={[styles.songChip, isSelected && styles.songChipSelected]}
              >
                <Copy
                  size={14}
                  bold={isSelected}
                  style={{ color: isSelected ? palette.teal : palette.muted }}
                >
                  {song.title}
                </Copy>
              </Pressable>
            );
          })}
        </View>
      )}

      {/* Gentle Guidance Banner */}
      <View style={styles.messageBanner}>
        <Smile color={palette.teal} size={22} />
        <Copy size={16} bold style={{ color: palette.ink, flex: 1 }}>
          {message}
        </Copy>
      </View>

      {/* Musical Chimes Keyboard */}
      <View style={styles.chimesFrame}>
        <View style={styles.chimesRow}>
          {CHIME_BARS.map((chime) => {
            const isTarget = chime.key === targetKey;
            const isPlaying = activeKey === chime.key;

            return (
              <Pressable
                key={chime.key}
                accessibilityRole="button"
                accessibilityLabel={`Musical bell ${chime.label}, note ${chime.note}.${isTarget ? " Tap this note now." : ""}`}
                onPress={() => handleChimePress(chime)}
                style={({ pressed }) => [
                  styles.chimeBar,
                  {
                    width: barWidth,
                    height: 200 * chime.heightRatio,
                    backgroundColor: chime.color,
                    borderColor: isTarget ? "#FFFFFF" : "rgba(255,255,255,0.4)",
                    transform: [
                      { scale: pressed || isPlaying ? 0.96 : isTarget ? 1.04 : 1 },
                    ],
                  },
                  isTarget && styles.chimeBarGlow,
                  isPlaying && { opacity: 0.9 },
                ]}
              >
                {/* Target beacon indicator */}
                {isTarget && (
                  <View style={styles.beaconRing}>
                    <Sparkles size={20} color="#FFFFFF" />
                  </View>
                )}

                {/* Note Label */}
                <View style={styles.chimeInfo}>
                  <Copy size={18} bold style={{ color: "#FFFFFF", textAlign: "center" }}>
                    {chime.label}
                  </Copy>
                  <Copy size={12} style={{ color: "rgba(255,255,255,0.85)", textAlign: "center" }}>
                    {chime.note}
                  </Copy>
                </View>

                {/* Soft bottom screw/peg design */}
                <View style={styles.peg} />
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Song completion card */}
      {songCompleted && (
        <Card tone="mint" style={styles.celebrationCard}>
          <View style={{ alignItems: "center", gap: 10 }}>
            <Heart color={palette.teal} size={36} />
            <Copy size={22} bold style={{ textAlign: "center", color: palette.ink }}>
              Melody Complete!
            </Copy>
            <Copy size={16} style={{ textAlign: "center", color: palette.muted }}>
              You played the entire song! Such a delightful melody.
            </Copy>
            <View style={{ flexDirection: "row", gap: 12, marginTop: 8, width: "100%" }}>
              <Action
                label="Play Again"
                onPress={() => selectSong(selectedSong)}
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
  modeRow: {
    flexDirection: "row",
    gap: 10,
  },
  modeTab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 10,
    borderRadius: 18,
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: palette.line,
  },
  modeTabSelected: {
    backgroundColor: palette.teal,
    borderColor: palette.teal,
  },
  songRow: {
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    flexWrap: "wrap",
  },
  songChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: palette.line,
  },
  songChipSelected: {
    borderColor: palette.teal,
    backgroundColor: palette.mint,
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
  chimesFrame: {
    paddingVertical: 18,
    paddingHorizontal: 8,
    backgroundColor: "#2C3E50",
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    maxWidth: 440,
    alignSelf: "center",
    boxShadow: "0px 8px 24px rgba(18,51,86,0.18)",
  },
  chimesRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "center",
    gap: 6,
  },
  chimeBar: {
    borderRadius: 16,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    boxShadow: "0px 6px 14px rgba(0,0,0,0.25)",
  },
  chimeBarGlow: {
    borderColor: "#FFFFFF",
    borderWidth: 3,
    boxShadow: "0px 0px 18px rgba(255,255,255,0.85)",
  },
  beaconRing: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  chimeInfo: {
    alignItems: "center",
    gap: 2,
  },
  peg: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "rgba(255,255,255,0.45)",
  },
  celebrationCard: {
    marginTop: 8,
    borderWidth: 2,
    borderColor: palette.teal,
  },
});
