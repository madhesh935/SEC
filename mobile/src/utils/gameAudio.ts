import * as Haptics from "expo-haptics";
import { useSettingsStore } from "../store/settings.store";

// Audio context singleton for web / webview
let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AudioContextClass =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext })
      .webkitAudioContext;
  if (!AudioContextClass) return null;

  if (!audioCtx || audioCtx.state === "closed") {
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export const NOTE_FREQUENCIES: Record<string, number> = {
  C4: 261.63,
  D4: 293.66,
  E4: 329.63,
  F4: 349.23,
  G4: 392.0,
  A4: 440.0,
  B4: 493.88,
  C5: 523.25,
  D5: 587.33,
  E5: 659.25,
};

class GameAudioService {
  private muted = false;

  public isMuted(): boolean {
    return this.muted;
  }

  public setMuted(val: boolean) {
    this.muted = val;
  }

  public toggleMuted(): boolean {
    this.muted = !this.muted;
    return this.muted;
  }

  private triggerHaptic(type: "light" | "medium" | "success" = "light") {
    try {
      if (type === "success") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
          () => {},
        );
      } else if (type === "medium") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      }
    } catch {
      // Haptics not available on web or unsupported devices
    }
  }

  /**
   * Play a peaceful, resonant musical chime
   */
  public playChime(noteOrFreq: string | number, durationSec = 1.2) {
    this.triggerHaptic("light");
    if (this.muted) return;

    const ctx = getAudioContext();
    if (!ctx) return;

    const userVol = useSettingsStore.getState().voiceVolume ?? 1;
    if (userVol <= 0) return;

    const freq =
      typeof noteOrFreq === "number"
        ? noteOrFreq
        : NOTE_FREQUENCIES[noteOrFreq] || 440;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    // Warm sine wave with gentle overtone
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, now);

    // Envelope: quick attack, smooth exponential decay
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.28 * userVol, now + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + durationSec);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + durationSec + 0.05);
  }

  /**
   * Play a gentle water bubble pop sound with pitch bend
   */
  public playPop() {
    this.triggerHaptic("light");
    if (this.muted) return;

    const ctx = getAudioContext();
    if (!ctx) return;

    const userVol = useSettingsStore.getState().voiceVolume ?? 1;
    if (userVol <= 0) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    // Gentle upward then downward water pop sound
    osc.type = "sine";
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(680, now + 0.03);
    osc.frequency.exponentialRampToValueAtTime(220, now + 0.12);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.25 * userVol, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.13);
  }

  /**
   * Play rewarding harmonic match chord (e.g. C5 + E5)
   */
  public playMatch() {
    this.triggerHaptic("medium");
    if (this.muted) return;

    const ctx = getAudioContext();
    if (!ctx) return;

    const userVol = useSettingsStore.getState().voiceVolume ?? 1;
    if (userVol <= 0) return;

    const notes = [523.25, 659.25]; // C5, E5
    const now = ctx.currentTime;

    notes.forEach((f, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(f, now + i * 0.08);

      gain.gain.setValueAtTime(0.0001, now + i * 0.08);
      gain.gain.linearRampToValueAtTime(0.22 * userVol, now + i * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.08 + 0.9);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + i * 0.08);
      osc.stop(now + i * 0.08 + 0.95);
    });
  }

  /**
   * Play joyful celebratory harp arpeggio
   */
  public playCelebration() {
    this.triggerHaptic("success");
    if (this.muted) return;

    const ctx = getAudioContext();
    if (!ctx) return;

    const userVol = useSettingsStore.getState().voiceVolume ?? 1;
    if (userVol <= 0) return;

    const arpeggio = [261.63, 329.63, 392.0, 523.25, 659.25]; // C4, E4, G4, C5, E5
    const now = ctx.currentTime;

    arpeggio.forEach((freq, idx) => {
      const delay = idx * 0.11;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + delay);

      gain.gain.setValueAtTime(0.0001, now + delay);
      gain.gain.linearRampToValueAtTime(0.25 * userVol, now + delay + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + delay + 1.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + delay);
      osc.stop(now + delay + 1.25);
    });
  }

  /**
   * Gentle soft click tap
   */
  public playTap() {
    this.triggerHaptic("light");
    if (this.muted) return;

    const ctx = getAudioContext();
    if (!ctx) return;

    const userVol = useSettingsStore.getState().voiceVolume ?? 1;
    if (userVol <= 0) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(480, now);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.12 * userVol, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.06);
  }
}

export const gameAudio = new GameAudioService();
