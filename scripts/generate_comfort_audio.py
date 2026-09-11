"""Generate soothing, authentic acoustic comfort audio tracks using Python standard library (wave, math, struct, random).

Generates:
1. cornwall_waves.wav - Calming rhythmic ocean surf with gentle waves rolling onto the sand.
2. clair_de_lune.wav - Classical piano chords and melody (Debussy Clair de Lune).
3. garden_birdsong.wav - Sweet, peaceful morning garden birdsong and soft breeze.
4. choir_harmony.wav - Rich, warm choral vocal harmony.
"""

from __future__ import annotations

import math
import random
import struct
import wave
from pathlib import Path

SAMPLE_RATE = 44100


def create_cornwall_waves(duration_sec=20.0) -> bytes:
    """Generate ocean waves using modulated pink/brown noise with periodic swells."""
    total_samples = int(SAMPLE_RATE * duration_sec)
    samples = []
    
    # Pink noise filter states
    b0, b1, b2, b3, b4, b5, b6 = 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0
    rng = random.Random(42)

    wave_period = 6.5  # seconds per wave swell

    for i in range(total_samples):
        t = i / SAMPLE_RATE
        # White noise
        white = rng.uniform(-1.0, 1.0)
        
        # Pink noise approximation (Paul Kellet's filter)
        b0 = 0.99886 * b0 + white * 0.0555179
        b1 = 0.99332 * b1 + white * 0.0750759
        b2 = 0.96900 * b2 + white * 0.1538520
        b3 = 0.86650 * b3 + white * 0.3104856
        b4 = 0.55000 * b4 + white * 0.5329522
        b5 = -0.7616 * b5 - white * 0.0168980
        pink = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362
        b6 = white * 0.115926
        pink *= 0.11

        # Smooth periodic wave swell modulation
        swell = 0.35 + 0.65 * (0.5 + 0.5 * math.sin(2 * math.pi * t / wave_period - math.pi / 2)) ** 2
        # Secondary rolling water variation
        ripple = 0.85 + 0.15 * math.sin(2 * math.pi * t * 0.7)
        
        sample = pink * swell * ripple * 0.65
        # Clamp
        sample = max(-0.95, min(0.95, sample))
        samples.append(int(sample * 32767))

    return struct.pack(f"<{len(samples)}h", *samples)


def create_piano_melody(duration_sec=22.0) -> bytes:
    """Synthesize Clair de Lune style piano notes with rich harmonics and exponential decay."""
    total_samples = int(SAMPLE_RATE * duration_sec)
    buffer = [0.0] * total_samples

    # Note pitches in Hz (Clair de Lune iconic opening: Db Major)
    # F5 (698.46), Eb5 (622.25), Db5 (554.37), C5 (523.25), Bb4 (466.16), Ab4 (415.30), F4 (349.23)
    # Plus warm bass accompaniment Db3 (138.59), Ab3 (207.65), F3 (174.61)
    notes = [
        # (start_time, duration, freq, velocity)
        # Bar 1: F5 -> Eb5
        (0.4, 2.8, 698.46, 0.45),
        (0.4, 4.0, 138.59, 0.35),  # Bass Db
        (1.2, 3.5, 207.65, 0.25),  # Ab
        (1.8, 3.0, 349.23, 0.30),  # F
        (3.0, 3.2, 622.25, 0.40),  # Eb5
        
        # Bar 2: Db5
        (4.8, 3.5, 554.37, 0.45),  # Db5
        (4.8, 4.5, 174.61, 0.35),  # Bass F
        (5.6, 3.5, 261.63, 0.25),  # C
        (6.4, 3.0, 415.30, 0.30),  # Ab
        (7.6, 3.0, 523.25, 0.38),  # C5
        
        # Bar 3: Bb4 -> Ab4
        (9.2, 3.5, 466.16, 0.42),  # Bb4
        (9.2, 4.5, 116.54, 0.35),  # Bass Bb
        (10.0, 3.5, 233.08, 0.25), # Bb
        (10.8, 3.0, 349.23, 0.28), # F
        (12.0, 3.5, 415.30, 0.40), # Ab4
        
        # Bar 4: Final resolving chord (Db major)
        (14.0, 7.0, 138.59, 0.35), # Bass Db
        (14.4, 6.5, 277.18, 0.28), # Db4
        (14.8, 6.5, 349.23, 0.30), # F4
        (15.2, 6.5, 415.30, 0.32), # Ab4
        (15.6, 6.0, 554.37, 0.38), # Db5
    ]

    for start_t, dur, freq, vel in notes:
        start_idx = int(start_t * SAMPLE_RATE)
        note_samples = int(dur * SAMPLE_RATE)
        for i in range(note_samples):
            idx = start_idx + i
            if idx >= total_samples:
                break
            t = i / SAMPLE_RATE
            # Piano envelope: sharp percussive attack, dual exponential decay
            env = (math.exp(-i / (SAMPLE_RATE * 0.008))) * 0.15 + math.exp(-t * 0.85) * 0.85
            # Harmonics
            harmonic1 = math.sin(2 * math.pi * freq * t)
            harmonic2 = 0.50 * math.sin(2 * math.pi * freq * 2 * t) * math.exp(-t * 1.5)
            harmonic3 = 0.25 * math.sin(2 * math.pi * freq * 3 * t) * math.exp(-t * 2.5)
            harmonic4 = 0.10 * math.sin(2 * math.pi * freq * 4 * t) * math.exp(-t * 3.5)
            tone = (harmonic1 + harmonic2 + harmonic3 + harmonic4) * env * vel
            buffer[idx] += tone

    # Normalize gently
    max_val = max(abs(s) for s in buffer) or 1.0
    samples = [int((s / max_val) * 0.88 * 32767) for s in buffer]
    return struct.pack(f"<{len(samples)}h", *samples)


def create_garden_birdsong(duration_sec=20.0) -> bytes:
    """Synthesize cheerful, gentle morning birdsong and soft ambient rustle."""
    total_samples = int(SAMPLE_RATE * duration_sec)
    buffer = [0.0] * total_samples
    rng = random.Random(77)

    # Ambient soft garden breeze (filtered noise)
    pink = 0.0
    for i in range(total_samples):
        white = rng.uniform(-1.0, 1.0)
        pink = 0.98 * pink + 0.02 * white
        t = i / SAMPLE_RATE
        breeze = 0.04 * pink * (0.8 + 0.2 * math.sin(2 * math.pi * t * 0.2))
        buffer[i] += breeze

    # Bird chirping motifs at pleasant musical intervals
    # Frequency sweeps in 2.5kHz - 4.5kHz range
    chirps = [
        # (start_time, duration, start_freq, end_freq, amplitude)
        # Motif 1
        (1.2, 0.18, 3200, 3800, 0.35),
        (1.45, 0.15, 3900, 3400, 0.30),
        (1.7, 0.25, 3400, 4200, 0.40),
        
        # Motif 2
        (3.5, 0.12, 2800, 3600, 0.32),
        (3.7, 0.14, 3700, 4300, 0.38),
        (3.9, 0.22, 4200, 3500, 0.35),
        (4.2, 0.30, 3500, 4000, 0.30),
        
        # Motif 3 (distant call)
        (6.8, 0.20, 2400, 3100, 0.22),
        (7.1, 0.22, 3200, 2600, 0.20),
        
        # Motif 4
        (9.5, 0.15, 3300, 4100, 0.36),
        (9.75, 0.18, 4100, 3600, 0.34),
        (10.0, 0.28, 3600, 4400, 0.42),
        
        # Motif 5
        (12.8, 0.16, 2900, 3700, 0.30),
        (13.05, 0.25, 3800, 3200, 0.35),
        (13.4, 0.35, 3400, 4100, 0.32),
        
        # Motif 6 (sweet trill)
        (16.0, 0.12, 3500, 4200, 0.35),
        (16.2, 0.12, 4200, 3600, 0.32),
        (16.4, 0.12, 3600, 4300, 0.38),
        (16.6, 0.30, 4300, 3500, 0.30),
    ]

    for start_t, dur, f_start, f_end, amp in chirps:
        start_idx = int(start_t * SAMPLE_RATE)
        num_s = int(dur * SAMPLE_RATE)
        for i in range(num_s):
            idx = start_idx + i
            if idx >= total_samples:
                break
            prog = i / num_s
            freq = f_start + (f_end - f_start) * prog
            t = i / SAMPLE_RATE
            # Sine window for soft onset and decay
            window = math.sin(prog * math.pi)
            tone = math.sin(2 * math.pi * freq * t) * window * amp
            buffer[idx] += tone

    max_val = max(abs(s) for s in buffer) or 1.0
    samples = [int((s / max_val) * 0.82 * 32767) for s in buffer]
    return struct.pack(f"<{len(samples)}h", *samples)


def create_choir_harmony(duration_sec=20.0) -> bytes:
    """Synthesize warm, gentle vocal choral harmony with natural vibrato and acoustic resonance."""
    total_samples = int(SAMPLE_RATE * duration_sec)
    buffer = [0.0] * total_samples

    # Warm choral chord progression: F maj -> Bb maj -> C maj -> F maj
    chords = [
        # (start_t, dur, [freqs])
        (0.5, 5.0, [174.61, 261.63, 349.23, 440.00, 523.25]),  # F Major (F3, C4, F4, A4, C5)
        (5.0, 5.0, [116.54, 233.08, 293.66, 349.23, 466.16]),  # Bb Major (Bb2, Bb3, D4, F4, Bb4)
        (10.0, 5.0, [130.81, 261.63, 329.63, 392.00, 523.25]), # C Major (C3, C4, E4, G4, C5)
        (15.0, 5.0, [174.61, 220.00, 261.63, 349.23, 440.00]), # F Major resolution
    ]

    for start_t, dur, freqs in chords:
        start_idx = int(start_t * SAMPLE_RATE)
        chord_samples = int(dur * SAMPLE_RATE)
        for i in range(chord_samples):
            idx = start_idx + i
            if idx >= total_samples:
                break
            t = i / SAMPLE_RATE
            prog = i / chord_samples
            # Smooth swell envelope (fade in and out)
            env = math.sin(prog * math.pi) ** 1.5
            
            chord_sum = 0.0
            for fi, f in enumerate(freqs):
                # Subtle gentle vibrato (5 Hz, 0.3% depth)
                vibrato = 1.0 + 0.003 * math.sin(2 * math.pi * 5.2 * t + fi * 0.7)
                act_f = f * vibrato
                # Voice formant blend: fundamental + warm overtones
                v1 = math.sin(2 * math.pi * act_f * t)
                v2 = 0.35 * math.sin(2 * math.pi * act_f * 2 * t)
                v3 = 0.15 * math.sin(2 * math.pi * act_f * 3 * t)
                v4 = 0.08 * math.sin(2 * math.pi * act_f * 4 * t)
                chord_sum += (v1 + v2 + v3 + v4) * 0.18
                
            buffer[idx] += chord_sum * env

    max_val = max(abs(s) for s in buffer) or 1.0
    samples = [int((s / max_val) * 0.85 * 32767) for s in buffer]
    return struct.pack(f"<{len(samples)}h", *samples)


def write_wav(path: Path, data: bytes) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(path), "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(SAMPLE_RATE)
        wf.writeframes(data)
    print(f"Generated WAV ({len(data)} bytes): {path}")


def main():
    root = Path(__file__).resolve().parents[1]
    backend_audio = root / "backend" / "app" / "static" / "media" / "audio"
    mobile_audio = root / "mobile" / "assets" / "media" / "audio"

    generators = {
        "cornwall_waves.wav": create_cornwall_waves,
        "clair_de_lune.wav": create_piano_melody,
        "garden_birdsong.wav": create_garden_birdsong,
        "choir_harmony.wav": create_choir_harmony,
    }

    for filename, fn in generators.items():
        print(f"Synthesizing {filename}...")
        raw = fn()
        dest_backend = backend_audio / filename
        dest_mobile = mobile_audio / filename
        write_wav(dest_backend, raw)
        write_wav(dest_mobile, raw)

    print("All authentic comfort audio files created successfully.")


if __name__ == "__main__":
    main()
