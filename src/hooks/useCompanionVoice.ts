import { useState, useRef, useEffect, useCallback } from "react";
import { AppState } from "react-native";
import { useFocusEffect } from "expo-router";
import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioRecorder,
} from "expo-audio";
import { useCompanionStore } from "../store/companion.store";
import { useSessionStore } from "../store/session.store";
import { useSettingsStore } from "../store/settings.store";
import { useAudioPlayback } from "./useAudioPlayback";
import { conversationService } from "../services/conversation.service";
import { VoiceConversationResponse } from "../types/conversation";
export function useCompanionVoice() {
  const state = useCompanionStore((s) => s.state),
    uiMode = useCompanionStore((s) => s.uiMode);
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY),
    audio = useAudioPlayback();
  const { stopAudio, playAudio } = audio;
  const online = useCompanionStore((s) => s.isOnline);
  const [response, setResponse] = useState<VoiceConversationResponse | null>(
      null,
    ),
    [error, setError] = useState<string | null>(null);
  const request = useRef<AbortController | null>(null),
    generation = useRef(0),
    busy = useRef(false),
    recording = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const setState = useCompanionStore((s) => s.setState);
  const rest = useCallback(
    () =>
      setState(
        useCompanionStore.getState().uiMode === "comfort" ? "comfort" : "idle",
      ),
    [setState],
  );
  const cancel = useCallback(() => {
    generation.current++;
    request.current?.abort();
    request.current = null;
    busy.current = false;
    if (timer.current) clearTimeout(timer.current);
    if (recording.current) {
      recording.current = false;
      void recorder.stop().catch(() => {});
    }
    stopAudio();
    rest();
  }, [recorder, stopAudio, rest]);
  useEffect(() => {
    if (!online) {
      cancel();
      setState("offline");
    }
  }, [online, cancel, setState]);
  useFocusEffect(useCallback(() => () => cancel(), [cancel]));
  useEffect(() => {
    const sub = AppState.addEventListener("change", (s) => {
      if (s !== "active") cancel();
    });
    return () => sub.remove();
  }, [cancel]);
  const play = useCallback(
    (value: VoiceConversationResponse) => {
      if (!value.responseAudioUrl) return;
      setState("speaking");
      void playAudio(value.responseAudioUrl, rest, () => {
        setState("error");
        setError("We couldn’t play the response. Please try Replay Response.");
      });
    },
    [playAudio, rest, setState],
  );
  const send = useCallback(async () => {
    if (busy.current || !recording.current) return;
    busy.current = true;
    recording.current = false;
    if (timer.current) clearTimeout(timer.current);
    const run = generation.current;
    try {
      setState("uploading");
      await recorder.stop();
      if (run !== generation.current) return;
      const session = useSessionStore.getState().session;
      if (!recorder.uri || !session) throw new Error("Recording unavailable");
      const controller = new AbortController();
      request.current = controller;
      const value = await conversationService.sendVoiceConversation({
        audioUri: recorder.uri,
        patientId: session.patientId,
        conversationId:
          useCompanionStore.getState().conversationId || undefined,
        signal: controller.signal,
        onUploaded: () => {
          if (run === generation.current) setState("processing");
        },
      });
      if (run !== generation.current) return;
      setResponse(value);
      useCompanionStore.setState({
        conversationId: value.conversationId || null,
        uiMode: value.uiMode,
        transcript: value.transcript,
        responseText: value.responseText,
      });
      if (value.status === "speech_not_understood") {
        setError("I didn’t catch that. Tap the microphone to speak again.");
        setState("error");
      } else if (value.status === "ai_disabled") {
        setError("Your companion is turned off. Please ask your caregiver.");
        setState("error");
      } else if (value.status === "tts_unavailable") {
        setError(
          "I can show my reply, but my voice isn’t available right now.",
        );
        rest();
      } else if (
        value.responseAudioUrl &&
        useSettingsStore.getState().replayVoiceResponse
      )
        play(value);
      else rest();
    } catch {
      if (run === generation.current) {
        setError("We couldn’t connect right now. Please try again.");
        setState("error");
      }
    } finally {
      if (run === generation.current) busy.current = false;
    }
  }, [recorder, play, rest, setState]);
  const start = useCallback(async () => {
    if (busy.current) return;
    busy.current = true;
    const run = ++generation.current;
    setError(null);
    setResponse(null);
    stopAudio();
    try {
      if (!useCompanionStore.getState().isOnline) {
        setState("offline");
        return;
      }
      const permission = await AudioModule.requestRecordingPermissionsAsync();
      if (run !== generation.current) return;
      if (!permission.granted) {
        setError(
          "Please allow microphone access in your device settings, then try again.",
        );
        setState("error");
        return;
      }
      await setAudioModeAsync({
        playsInSilentMode: true,
        allowsRecording: true,
      });
      await recorder.prepareToRecordAsync();
      if (run !== generation.current) return;
      recorder.record();
      recording.current = true;
      setState("recording");
      timer.current = setTimeout(() => void send(), 60000);
    } catch {
      if (run === generation.current) {
        setError("We couldn’t start listening. Please try again.");
        setState("error");
      }
    } finally {
      if (run === generation.current) busy.current = false;
    }
  }, [recorder, stopAudio, setState, send]);
  return {
    state,
    uiMode,
    response,
    errorMessage: error || audio.error,
    isRecording: state === "recording",
    isProcessing: state === "uploading" || state === "processing",
    isSpeaking: state === "speaking",
    toggleVoice: () => (state === "recording" ? void send() : void start()),
    cancel,
    replay: () => {
      if (response) play(response);
    },
  };
}
