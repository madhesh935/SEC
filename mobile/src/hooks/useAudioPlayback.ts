import { useState, useRef, useEffect, useCallback } from "react";
import { useFocusEffect } from "expo-router";
import { createAudioPlayer, AudioPlayer, setAudioModeAsync } from "expo-audio";
import { useSettingsStore } from "../store/settings.store";
export function useAudioPlayback() {
  const [isPlaying, setPlaying] = useState(false),
    [currentUrl, setUrl] = useState<string | null>(null),
    [error, setError] = useState<string | null>(null);
  const player = useRef<AudioPlayer | null>(null),
    timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const callbacks = useRef<{ done?: () => void; error?: () => void }>({});
  const generation = useRef(0);
  const stopAudio = useCallback(() => {
    generation.current++;
    if (timer.current) clearTimeout(timer.current);
    if (player.current) {
      player.current.pause();
      player.current.remove();
      player.current = null;
    }
    setPlaying(false);
    setUrl(null);
  }, []);
  useFocusEffect(useCallback(() => () => stopAudio(), [stopAudio]));
  const playAudio = useCallback(
    async (url: string, onDone?: () => void, onError?: () => void) => {
      stopAudio();
      setError(null);
      callbacks.current = { done: onDone, error: onError };
      const run = generation.current;
      try {
        await setAudioModeAsync({
          playsInSilentMode: true,
          allowsRecording: false,
        });
        if (run !== generation.current) return;
        const current = createAudioPlayer(url);
        player.current = current;
        setUrl(url);
        current.volume = useSettingsStore.getState().voiceVolume;
        const fail = () => {
          stopAudio();
          setError("We couldn’t play this audio. Please try again.");
          callbacks.current.error?.();
        };
        timer.current = setTimeout(fail, 20000);
        current.addListener("playbackStatusUpdate", (status) => {
          if (player.current !== current) return;
          if (status.error) {
            fail();
            return;
          }
          if (status.playing) {
            if (timer.current) clearTimeout(timer.current);
            setPlaying(true);
          }
          if (status.didJustFinish) {
            stopAudio();
            callbacks.current.done?.();
          }
        });
        current.play();
      } catch {
        if (run !== generation.current) return;
        stopAudio();
        setError("We couldn’t play this audio. Please try again.");
        onError?.();
      }
    },
    [stopAudio],
  );
  const toggleAudio = useCallback(
    (url: string) => {
      if (currentUrl === url) stopAudio();
      else void playAudio(url);
    },
    [currentUrl, stopAudio, playAudio],
  );
  useEffect(
    () => () => {
      generation.current++;
      if (timer.current) clearTimeout(timer.current);
      player.current?.remove();
    },
    [],
  );
  return { isPlaying, currentUrl, error, playAudio, stopAudio, toggleAudio };
}
