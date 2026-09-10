import { useState, useCallback, useRef, useEffect } from 'react';
import {
  useAudioRecorder,
  useAudioRecorderState,
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  createAudioPlayer,
  AudioPlayer,
} from 'expo-audio';
import * as Haptics from 'expo-haptics';
import { useCompanionStore } from '../store/companion.store';
import { useSessionStore } from '../store/session.store';
import { conversationService } from '../services/conversation.service';
import { sanitizePatientErrorMessage } from '../utils/error';

export function useCompanionVoice() {
  const {
    state,
    uiMode,
    conversationId,
    errorMessage,
    setState,
    setUiMode,
    setConversationId,
    setTranscript,
    setResponseText,
    setErrorMessage,
    setIsPlayingAudio,
    resetToIdle,
  } = useCompanionStore();

  const session = useSessionStore((s) => s.session);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(audioRecorder);
  const activePlayerRef = useRef<AudioPlayer | null>(null);

  // Initialize audio permissions & mode
  useEffect(() => {
    async function initAudio() {
      try {
        await setAudioModeAsync({
          playsInSilentMode: true,
          allowsRecording: true,
        });
        const perm = await AudioModule.getRecordingPermissionsAsync();
        setHasPermission(perm.granted);
      } catch {
        // Audio module initialization catch
      }
    }
    initAudio();

    return () => {
      if (activePlayerRef.current) {
        try {
          activePlayerRef.current.pause();
        } catch {
          // cleanup
        }
      }
    };
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      const perm = await AudioModule.requestRecordingPermissionsAsync();
      setHasPermission(perm.granted);
      return perm.granted;
    } catch {
      setHasPermission(false);
      return false;
    }
  }, []);

  const startRecording = useCallback(async () => {
    try {
      setErrorMessage(null);

      // Check permission
      let permitted = hasPermission;
      if (!permitted) {
        permitted = await requestPermission();
        if (!permitted) {
          setState('error');
          setErrorMessage('Microphone access is needed to speak with your companion.');
          return;
        }
      }

      // Haptic feedback for tactile accessibility
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch {
        // haptics unavailable on some devices
      }

      // Stop any existing playback
      if (activePlayerRef.current) {
        try {
          activePlayerRef.current.pause();
        } catch {
          // ignore
        }
        setIsPlayingAudio(false);
      }

      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();
      setState('recording');
    } catch (err) {
      setState('error');
      setErrorMessage(sanitizePatientErrorMessage(err, 'Unable to start listening. Please try again.'));
    }
  }, [hasPermission, requestPermission, audioRecorder, setErrorMessage, setState, setIsPlayingAudio]);

  const stopRecordingAndSend = useCallback(async () => {
    try {
      // Light haptic feedback
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {
        // ignore
      }

      setState('uploading');
      await audioRecorder.stop();
      const localUri = audioRecorder.uri;

      if (!localUri) {
        setState('error');
        setErrorMessage("Couldn't capture voice. Please try speaking again.");
        return;
      }

      if (!session?.patientId) {
        setState('error');
        setErrorMessage('Device is not paired to a patient profile.');
        return;
      }

      setState('processing');
      // Send multipart voice to backend - Real server response only
      const response = await conversationService.sendVoiceConversation({
        audioUri: localUri,
        patientId: session.patientId,
        conversationId: conversationId || undefined,
      });

      // Update state with real response
      if (response.conversationId) {
        setConversationId(response.conversationId);
      }
      if (response.transcript) {
        setTranscript(response.transcript);
      }
      if (response.responseText) {
        setResponseText(response.responseText);
      }
      if (response.uiMode) {
        setUiMode(response.uiMode);
      }

      // If comfort mode was returned, trigger comfort UI
      if (response.uiMode === 'comfort') {
        setState('comfort');
      }

      // Play returned audio response if URL provided
      if (response.responseAudioUrl) {
        setState('speaking');
        setIsPlayingAudio(true);

        const player = createAudioPlayer(response.responseAudioUrl);
        activePlayerRef.current = player;
        player.play();

        player.addListener('playbackStatusUpdate', (status) => {
          if (status.isLoaded && status.didJustFinish) {
            setIsPlayingAudio(false);
            if (response.uiMode === 'comfort') {
              setState('comfort');
            } else {
              setState('idle');
            }
          }
        });
      } else {
        if (response.uiMode === 'comfort') {
          setState('comfort');
        } else {
          setState('idle');
        }
      }
    } catch (err) {
      setState('error');
      setErrorMessage(sanitizePatientErrorMessage(err, 'Your companion is resting. Please try again in a moment.'));
    }
  }, [
    audioRecorder,
    session,
    conversationId,
    setState,
    setErrorMessage,
    setConversationId,
    setTranscript,
    setResponseText,
    setUiMode,
    setIsPlayingAudio,
  ]);

  const toggleVoice = useCallback(() => {
    if (state === 'recording') {
      stopRecordingAndSend();
    } else if (state === 'idle' || state === 'comfort' || state === 'error') {
      startRecording();
    }
  }, [state, startRecording, stopRecordingAndSend]);

  return {
    state,
    uiMode,
    isRecording: state === 'recording',
    isProcessing: state === 'processing' || state === 'uploading',
    isSpeaking: state === 'speaking',
    errorMessage,
    hasPermission,
    recorderState,
    startRecording,
    stopRecordingAndSend,
    toggleVoice,
    resetToIdle,
    requestPermission,
  };
}
