import React, { useState, useRef, useEffect } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Screen,
  Copy,
  Action,
  PatientImage,
  QueryState,
  Card,
  Reassurance,
} from "../../../src/components/patient/Design";
import { useActivity } from "../../../src/hooks/usePatient";
import { activityService } from "../../../src/services/activity.service";
import { useSessionStore } from "../../../src/store/session.store";
import { useAudioPlayback } from "../../../src/hooks/useAudioPlayback";
export default function Activity() {
  const { id } = useLocalSearchParams<{ id: string }>(),
    query = useActivity(id),
    router = useRouter(),
    client = useQueryClient();
  const pid = useSessionStore((s) => s.session?.patientId),
    audio = useAudioPlayback(),
    [answer, setAnswer] = useState<string[]>([]),
    started = useRef(Date.now());
  const mutation = useMutation({
    mutationFn: (result: "completed" | "skipped" | "liked") =>
      activityService.submit(pid!, id, {
        result,
        response: answer,
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
    started.current = Date.now();
  }, [id, reset]);
  const item = query.data,
    feedback = mutation.data;
  return (
    <Screen title={item?.title || "Mind & Memory"} subtitle="Take your time">
      <QueryState
        loading={query.isPending}
        error={query.error}
        retry={() => void query.refetch()}
      >
        {item && (
          <>
            {item.imageUrl && (
              <PatientImage
                url={item.imageUrl}
                label={item.description}
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
                    label={audio.currentUrl ? "Stop Music" : "Play Again"}
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
                  label="Do Something Else"
                  secondary
                  loading={mutation.isPending}
                  onPress={() => mutation.mutate("skipped")}
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
                  label="Back to Activities"
                  onPress={() => router.replace("/activities")}
                />
              </Card>
            )}
            {item.interactionMode === "listen" && item.nextActivityId && (
              <Action
                label="Another Song"
                secondary
                onPress={() =>
                  router.replace({
                    pathname: "/activity/[id]",
                    params: { id: item.nextActivityId! },
                  })
                }
              />
            )}
          </>
        )}
      </QueryState>
      <Reassurance />
    </Screen>
  );
}
