import React, { useState, useRef, useEffect } from "react";
import { View, Pressable, StyleSheet } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Sparkles, Gamepad2, Heart, CheckCircle2 } from "lucide-react-native";
import {
  Screen,
  Copy,
  Action,
  PatientImage,
  QueryState,
  Card,
  Reassurance,
  palette,
} from "../../../src/components/patient/Design";
import { useActivity, useFamilyMembers } from "../../../src/hooks/usePatient";
import { activityService } from "../../../src/services/activity.service";
import { useSessionStore } from "../../../src/store/session.store";
import { useAudioPlayback } from "../../../src/hooks/useAudioPlayback";
import { CardMatchGame } from "../../../src/components/games/CardMatchGame";
import { PicturePuzzleGame } from "../../../src/components/games/PicturePuzzleGame";
import { MelodyChimesGame } from "../../../src/components/games/MelodyChimesGame";
import { gameAudio } from "../../../src/utils/gameAudio";

export default function Activity() {
  const { id } = useLocalSearchParams<{ id: string }>(),
    query = useActivity(id),
    familyQuery = useFamilyMembers(),
    router = useRouter(),
    client = useQueryClient();

  const pid = useSessionStore((s) => s.session?.patientId),
    audio = useAudioPlayback(),
    [answer, setAnswer] = useState<string[]>([]),
    [showInteractiveGame, setShowInteractiveGame] = useState<boolean>(true),
    started = useRef(Date.now());

  const mutation = useMutation({
    mutationFn: (result: "completed" | "skipped" | "liked") =>
      activityService.submit(pid!, id, {
        result,
        response: answer.length > 0 ? answer : query.data?.options.map(o => o.id) || [],
        completionTime: (Date.now() - started.current) / 1000,
      }),
    onSuccess: () => {
      audio.stopAudio();
      void client.invalidateQueries({ queryKey: ["activities", pid] });
    },
  });

  const { reset } = mutation;

  useEffect(() => {
    setAnswer([]);
    reset();
    setShowInteractiveGame(true);
    started.current = Date.now();
  }, [id, reset]);

  const item = query.data,
    feedback = mutation.data;

  const familyData = familyQuery.data?.map((f) => ({
    id: f.id,
    name: f.name,
    photoUrl: f.photoUrl,
  }));

  const handleInteractiveComplete = () => {
    gameAudio.playCelebration();
    // Automatically select the correct option if choice/sequence
    if (item?.options && item.options.length > 0) {
      setAnswer([item.options[0].id]);
    }
    mutation.mutate("completed");
  };

  return (
    <Screen
      title={item?.title || "Joyful Activity"}
      subtitle="Take your time and enjoy"
    >
      <QueryState
        loading={query.isPending}
        error={query.error}
        retry={() => void query.refetch()}
      >
        {item && (
          <>
            {/* Interactive Game View */}
            {showInteractiveGame && !feedback && (
              <View style={{ gap: 14 }}>
                {/* Family or Photo Card Match Game */}
                {item.type === "family_recognition" && (
                  <View style={{ gap: 12 }}>
                    <Card tone="lavender" style={styles.interactiveBanner}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                        <Gamepad2 size={24} color="#7350A3" />
                        <View style={{ flex: 1 }}>
                          <Copy size={17} bold style={{ color: palette.ink }}>
                            Interactive Card Match: Loved Ones
                          </Copy>
                          <Copy size={14} style={{ color: palette.muted }}>
                            Find matching pairs of your family & loved ones!
                          </Copy>
                        </View>
                      </View>
                    </Card>

                    <CardMatchGame
                      familyData={familyData}
                      onComplete={handleInteractiveComplete}
                    />
                  </View>
                )}

                {/* Photo Recognition / Reminisce Picture Puzzle */}
                {(item.type === "photo_recognition" || item.type === "life_memory_recall") && (
                  <View style={{ gap: 12 }}>
                    <Card tone="blue" style={styles.interactiveBanner}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                        <Sparkles size={24} color="#2980B9" />
                        <View style={{ flex: 1 }}>
                          <Copy size={17} bold style={{ color: palette.ink }}>
                            Interactive Picture Puzzle
                          </Copy>
                          <Copy size={14} style={{ color: palette.muted }}>
                            Swap pieces to complete this cherished picture!
                          </Copy>
                        </View>
                      </View>
                    </Card>

                    <PicturePuzzleGame
                      customImage={
                        item.imageUrl
                          ? { url: item.imageUrl, title: item.title }
                          : undefined
                      }
                      onComplete={handleInteractiveComplete}
                    />
                  </View>
                )}

                {/* Music Memory Melody Chimes Game */}
                {item.type === "music_memory" && (
                  <View style={{ gap: 12 }}>
                    <Card tone="peach" style={styles.interactiveBanner}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                        <Heart size={24} color="#E67E22" />
                        <View style={{ flex: 1 }}>
                          <Copy size={17} bold style={{ color: palette.ink }}>
                            Interactive Melody Chimes
                          </Copy>
                          <Copy size={14} style={{ color: palette.muted }}>
                            Play along with peaceful musical bells!
                          </Copy>
                        </View>
                      </View>
                    </Card>

                    <MelodyChimesGame
                      onComplete={handleInteractiveComplete}
                    />
                  </View>
                )}

                {/* Daily Routine sequencing interactive cards */}
                {item.type === "daily_routine_sequencing" && (
                  <View style={{ gap: 12 }}>
                    <Card tone="mint" style={styles.interactiveBanner}>
                      <Copy size={20} bold style={{ color: palette.ink }}>
                        {item.prompt}
                      </Copy>
                      <Copy size={15} style={{ color: palette.muted }}>
                        Tap each step to arrange your lovely day:
                      </Copy>
                    </Card>

                    <View style={{ gap: 10 }}>
                      {item.steps.map((step) => {
                        const isChosen = answer.includes(step.id);
                        const orderNum = isChosen ? answer.indexOf(step.id) + 1 : null;
                        return (
                          <Pressable
                            key={step.id}
                            accessibilityRole="button"
                            accessibilityLabel={`${step.label}${isChosen ? `, step ${orderNum}` : ""}`}
                            disabled={isChosen}
                            onPress={() => {
                              gameAudio.playTap();
                              const newAns = [...answer, step.id];
                              setAnswer(newAns);
                              if (newAns.length === item.steps.length) {
                                setTimeout(() => {
                                  gameAudio.playCelebration();
                                }, 300);
                              }
                            }}
                            style={[
                              styles.routineCard,
                              isChosen && styles.routineCardChosen,
                            ]}
                          >
                            <View
                              style={[
                                styles.routineNumber,
                                isChosen && { backgroundColor: palette.teal },
                              ]}
                            >
                              {isChosen ? (
                                <CheckCircle2 size={20} color={palette.white} />
                              ) : (
                                <Copy size={16} bold style={{ color: palette.muted }}>
                                  {step.id}
                                </Copy>
                              )}
                            </View>
                            <Copy size={18} bold style={{ color: palette.ink, flex: 1 }}>
                              {step.label}
                            </Copy>
                          </Pressable>
                        );
                      })}
                    </View>

                    {answer.length > 0 && answer.length < item.steps.length && (
                      <Action
                        label="Start Over"
                        secondary
                        onPress={() => {
                          gameAudio.playTap();
                          setAnswer([]);
                        }}
                      />
                    )}

                    {answer.length === item.steps.length && (
                      <Action
                        label="Done with Routine"
                        onPress={() => mutation.mutate("completed")}
                      />
                    )}
                  </View>
                )}

                {/* Option to switch to simple view or finish */}
                <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
                  <Action
                    label="Done"
                    style={{ flex: 1 }}
                    loading={mutation.isPending}
                    onPress={() => mutation.mutate("completed")}
                  />
                  <Action
                    label="Simple View"
                    secondary
                    style={{ flex: 1 }}
                    onPress={() => setShowInteractiveGame(false)}
                  />
                </View>
              </View>
            )}

            {/* Simple / Classic Guided View (accessible fallback) */}
            {(!showInteractiveGame || feedback) && (
              <>
                {item.imageUrl && (
                  <PatientImage
                    url={item.imageUrl}
                    label={item.description}
                    category={item.type}
                    height={240}
                  />
                )}
                <Copy size={24} bold>
                  {item.prompt}
                </Copy>
                {!feedback && (
                  <>
                    {item.interactionMode === "choice" &&
                      item.options.map((option) => (
                        <Action
                          key={option.id}
                          label={option.label}
                          secondary={answer[0] !== option.id}
                          onPress={() => setAnswer([option.id])}
                        />
                      ))}
                    {item.interactionMode === "sequence" && (
                      <>
                        <Copy>Tap each step in order.</Copy>
                        {item.steps.map((step) => (
                          <Action
                            key={step.id}
                            label={
                              (answer.includes(step.id)
                                ? answer.indexOf(step.id) + 1 + ". "
                                : "") + step.label
                            }
                            secondary={!answer.includes(step.id)}
                            disabled={answer.includes(step.id)}
                            onPress={() => setAnswer([...answer, step.id])}
                          />
                        ))}
                        <Action
                          label="Clear Order"
                          secondary
                          onPress={() => setAnswer([])}
                        />
                      </>
                    )}
                    {item.interactionMode === "reflection" &&
                      item.steps.map((step) => (
                        <Card key={step.id}>
                          <Copy>{step.label}</Copy>
                        </Card>
                      ))}
                    {item.audioUrl && (
                      <Action
                        label={audio.currentUrl ? "Stop Music" : "Play Music"}
                        onPress={() => audio.toggleAudio(item.audioUrl!)}
                      />
                    )}
                    {item.interactionMode === "listen" && (
                      <Action
                        label="I Like This"
                        secondary
                        loading={mutation.isPending}
                        onPress={() => mutation.mutate("liked")}
                      />
                    )}
                    <Action
                      label={
                        item.interactionMode === "choice" ||
                        item.interactionMode === "sequence"
                          ? "Check Answer"
                          : "Done"
                      }
                      loading={mutation.isPending}
                      disabled={
                        item.interactionMode === "choice"
                          ? !answer.length
                          : item.interactionMode === "sequence"
                            ? answer.length !== item.steps.length
                            : false
                      }
                      onPress={() => mutation.mutate("completed")}
                    />
                    <Action
                      label="Back to Interactive Game"
                      secondary
                      onPress={() => setShowInteractiveGame(true)}
                    />
                  </>
                )}
                {mutation.error && (
                  <Copy accessibilityRole="alert">
                    We couldn’t save that. Please try again.
                  </Copy>
                )}
                {audio.error && (
                  <Copy accessibilityRole="alert">{audio.error}</Copy>
                )}
                {feedback && (
                  <Card tone="mint">
                    <Copy size={23} accessibilityLiveRegion="polite">
                      {feedback.feedback}
                    </Copy>
                    <Action
                      label="Back to Games"
                      onPress={() => router.replace("/activities")}
                    />
                  </Card>
                )}
              </>
            )}
          </>
        )}
      </QueryState>
      <Reassurance />
    </Screen>
  );
}

const styles = StyleSheet.create({
  interactiveBanner: {
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: palette.line,
  },
  routineCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 16,
    borderRadius: 20,
    backgroundColor: palette.white,
    borderWidth: 1.5,
    borderColor: palette.line,
  },
  routineCardChosen: {
    backgroundColor: palette.mint,
    borderColor: palette.teal,
  },
  routineNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: palette.ivory,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: palette.line,
  },
});
