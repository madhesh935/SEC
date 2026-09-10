import { useState, useRef, useEffect, useCallback } from 'react';
import { createAudioPlayer, AudioPlayer } from 'expo-audio';

export function useAudioPlayback() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentUrl, setCurrentUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const playerRef = useRef<AudioPlayer | null>(null);

  useEffect(() => {
    return () => {
      if (playerRef.current) {
        try {
          playerRef.current.pause();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  const playAudio = useCallback((url: string) => {
    try {
      setError(null);
      if (playerRef.current) {
        playerRef.current.pause();
      }

      const player = createAudioPlayer(url);
      playerRef.current = player;
      setCurrentUrl(url);
      setIsPlaying(true);
      player.play();

      player.addListener('playbackStatusUpdate', (status) => {
        if (status.isLoaded && status.didJustFinish) {
          setIsPlaying(false);
          setCurrentUrl(null);
        }
      });
    } catch {
      setError('Unable to play audio.');
      setIsPlaying(false);
    }
  }, []);

  const stopAudio = useCallback(() => {
    if (playerRef.current) {
      try {
        playerRef.current.pause();
      } catch {
        // ignore
      }
    }
    setIsPlaying(false);
    setCurrentUrl(null);
  }, []);

  const toggleAudio = useCallback(
    (url: string) => {
      if (isPlaying && currentUrl === url) {
        stopAudio();
      } else {
        playAudio(url);
      }
    },
    [isPlaying, currentUrl, playAudio, stopAudio]
  );

  return {
    isPlaying,
    currentUrl,
    error,
    playAudio,
    stopAudio,
    toggleAudio,
  };
}
