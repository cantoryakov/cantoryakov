// Game Boy 8-bit Chiptune Audio Synthesizer
// Uses native Web Audio API (AudioContext) with square waves and noise channels.
// No external sound files or libraries required.

class ChiptuneAudioEngine {
  private ctx: AudioContext | null = null;
  private activeSources: Set<AudioScheduledSourceNode> = new Set();
  private scheduledTimers: Set<number> = new Set();
  private isMuted: boolean = false;
  private currentLoopTimer: number | null = null;

  // Lazily get or initialize the AudioContext
  public getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  // Ensures audio is unlocked on user interaction
  public async unlockAudio(): Promise<boolean> {
    const ctx = this.getContext();
    if (!ctx) return false;
    if (ctx.state === 'suspended') {
      try {
        await ctx.resume();
        return true;
      } catch {
        return false;
      }
    }
    return true;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted) {
      this.stopAllAudio();
    }
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  private registerTimer(timer: number): number {
    this.scheduledTimers.add(timer);
    return timer;
  }

  private clearAllTimers() {
    this.scheduledTimers.forEach((timer) => clearTimeout(timer));
    this.scheduledTimers.clear();
    if (this.currentLoopTimer !== null) {
      clearTimeout(this.currentLoopTimer);
      this.currentLoopTimer = null;
    }
  }

  private registerSource(source: AudioScheduledSourceNode) {
    this.activeSources.add(source);
    source.onended = () => {
      this.activeSources.delete(source);
    };
  }

  // Stop and disconnect all active oscillators/sources and clear scheduled notes
  public stopAllAudio() {
    this.clearAllTimers();
    this.activeSources.forEach((source) => {
      try {
        source.stop();
        source.disconnect();
      } catch {
        // Source might already have stopped
      }
    });
    this.activeSources.clear();
  }

  /**
   * Generates a buffer of authentic 8-bit white noise
   */
  private createNoiseBuffer(duration: number, decayMultiplier = 0.5): AudioBuffer | null {
    const ctx = this.getContext();
    if (!ctx) return null;
    const bufferSize = Math.max(1, Math.floor(ctx.sampleRate * duration));
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      // 8-bit stepped noise emulation: quantization to emulate Game Boy LFSR noise channel
      const raw = Math.random() * 2 - 1;
      const quantized = Math.round(raw * 8) / 8;
      const decay = Math.pow(1 - i / bufferSize, decayMultiplier);
      data[i] = quantized * decay;
    }

    return buffer;
  }

  /**
   * Sound Effect: Noise Crash (for battle transitions, logo drops, explosions)
   * A burst of generated white noise through an AudioBuffer with fast exponential gain decay
   */
  public playNoiseCrash(duration = 0.5) {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const buffer = this.createNoiseBuffer(duration, 0.4);
      if (!buffer) return;

      const source = ctx.createBufferSource();
      source.buffer = buffer;

      // Filter to simulate 8-bit noise channel frequency roll-off
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1200, ctx.currentTime);
      filter.Q.setValueAtTime(1.2, ctx.currentTime);

      const gain = ctx.createGain();
      const now = ctx.currentTime;
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      source.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      this.registerSource(source);
      source.start(now);
      source.stop(now + duration);
    } catch {
      // AudioContext safety
    }
  }

  /**
   * Sound Effect: Quick 8-bit square wave bleep tone for hopping, selections, or menu clicks
   */
  public playBleep(freq = 440, duration = 0.08) {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const now = ctx.currentTime;

      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(0.18, now + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      this.registerSource(osc);
      osc.start(now);
      osc.stop(now + duration);
    } catch {
      // AudioContext safety
    }
  }

  /**
   * Sound Effect: Hit Sound
   * Fast pitch-dropping square wave (from 350Hz down to 80Hz in 0.12s) layered with a tiny noise pop
   */
  public playHitSound() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const duration = 0.12;

      // 1. Pitch-dropping square wave
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(350, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + duration);

      oscGain.gain.setValueAtTime(0.25, now);
      oscGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      osc.connect(oscGain);
      oscGain.connect(ctx.destination);

      this.registerSource(osc);
      osc.start(now);
      osc.stop(now + duration);

      // 2. Layered noise pop
      const noiseBuffer = this.createNoiseBuffer(0.06, 1.0);
      if (noiseBuffer) {
        const noiseSource = ctx.createBufferSource();
        noiseSource.buffer = noiseBuffer;

        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0.2, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);

        noiseSource.connect(noiseGain);
        noiseGain.connect(ctx.destination);

        this.registerSource(noiseSource);
        noiseSource.start(now);
        noiseSource.stop(now + 0.06);
      }
    } catch {
      // AudioContext safety
    }
  }

  /**
   * Helper to play an individual 8-bit note
   */
  private playSquareNote(
    freq: number,
    startTime: number,
    duration: number,
    volume = 0.12,
    detune = 0
  ) {
    const ctx = this.getContext();
    if (!ctx || this.isMuted || freq <= 0) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, startTime);
      if (detune !== 0) {
        osc.detune.setValueAtTime(detune, startTime);
      }

      // 8-bit snappy envelope: immediate attack, slight hold, crisp release
      gain.gain.setValueAtTime(volume, startTime);
      gain.gain.setValueAtTime(volume * 0.85, startTime + duration * 0.7);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      this.registerSource(osc);
      osc.start(startTime);
      osc.stop(startTime + duration);
    } catch {
      // AudioContext safety
    }
  }

  /**
   * Helper to play a single noise snare click
   */
  private playSnareClick(startTime: number, volume = 0.15, duration = 0.04) {
    const ctx = this.getContext();
    if (!ctx || this.isMuted) return;

    try {
      const buffer = this.createNoiseBuffer(duration, 0.8);
      if (!buffer) return;

      const source = ctx.createBufferSource();
      source.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(2000, startTime);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(volume, startTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

      source.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      this.registerSource(source);
      source.start(startTime);
      source.stop(startTime + duration);
    } catch {
      // AudioContext safety
    }
  }

  /**
   * Music Sequence: Authentic Game Boy Intro
   * 1. Rapid 16th-note snare roll building up
   * 2. Driving, high-tempo battle arpeggio / chiptune duel loop with lead + bassline
   */
  public playIntroSequence() {
    this.stopAllAudio();
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime + 0.05;
    const stepDuration = 0.07; // Rapid 16th-note feel (~214 BPM)
    const rollCount = 14;

    // Phase 1: Snare roll building up
    for (let i = 0; i < rollCount; i++) {
      const time = now + i * stepDuration;
      const progress = i / (rollCount - 1);
      const volume = 0.05 + progress * 0.22; // Crescendo
      this.playSnareClick(time, volume, 0.045);
    }

    // Impact crash at transition
    const battleStartTime = now + rollCount * stepDuration;
    const timerDelay = (battleStartTime - ctx.currentTime) * 1000;

    const transitionTimer = window.setTimeout(() => {
      this.playNoiseCrash(0.45);
      this.startBattleLoop(0);
    }, Math.max(0, timerDelay));

    this.registerTimer(transitionTimer);
  }

  /**
   * Internal battle duel loop scheduler
   */
  private startBattleLoop(loopIteration = 0) {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    // 155 BPM driving battle chiptune arpeggio
    // 16th note = ~0.0968s
    const noteTime = 0.0968;
    const now = ctx.currentTime + 0.02;

    // Classic 8-bit / Game Boy duel frequencies
    // E4=329.63, G4=392.00, B4=493.88, D5=587.33, E5=659.25, G5=783.99, F#5=739.99
    // Bass: E2=82.41, E3=164.81, G2=98.00, D2=73.42, B2=123.47
    const leadNotes = [
      329.63, 493.88, 659.25, 783.99, 739.99, 659.25, 493.88, 392.00,
      329.63, 493.88, 659.25, 783.99, 739.99, 783.99, 880.00, 987.77,
      587.33, 739.99, 880.00, 739.99, 587.33, 493.88, 392.00, 329.63,
      493.88, 587.33, 659.25, 739.99, 659.25, 493.88, 392.00, 329.63,
    ];

    const bassNotes = [
      164.81, 82.41, 164.81, 82.41, 164.81, 82.41, 164.81, 123.47,
      164.81, 82.41, 164.81, 82.41, 164.81, 82.41, 196.00, 146.83,
      146.83, 73.42, 146.83, 73.42, 146.83, 73.42, 146.83, 110.00,
      123.47, 82.41, 123.47, 82.41, 164.81, 123.47, 164.81, 82.41,
    ];

    const totalSteps = leadNotes.length;

    for (let step = 0; step < totalSteps; step++) {
      const stepTime = now + step * noteTime;
      const leadFreq = leadNotes[step];
      const bassFreq = bassNotes[step];

      // Channel 1: Lead square arpeggio
      this.playSquareNote(leadFreq, stepTime, noteTime * 0.88, 0.11, 4);

      // Channel 2: Driving bassline
      this.playSquareNote(bassFreq, stepTime, noteTime * 0.75, 0.14, -4);

      // Rhythm noise per 4 steps (snare/kick emulation)
      if (step % 4 === 2) {
        this.playSnareClick(stepTime, 0.08, 0.035);
      }
    }

    const loopDurationMs = totalSteps * noteTime * 1000;
    this.currentLoopTimer = window.setTimeout(() => {
      this.startBattleLoop(loopIteration + 1);
    }, loopDurationMs - 40);
  }

  /**
   * Music Sequence: Triumphant, upbeat chiptune fanfare
   * Designed to loop quietly on the title screen
   */
  public playTitleFanfare() {
    this.stopAllAudio();
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    this.startTitleLoop(0);
  }

  private startTitleLoop(iteration = 0) {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    // Upbeat Game Boy title fanfare in C Major (approx 135 BPM)
    // 8th note = 0.222s, 16th note = 0.111s
    const eighth = 0.222;
    const sixteenth = 0.111;
    const now = ctx.currentTime + 0.03;

    // Melody: Triumphant fanfare theme
    // C5=523.25, E5=659.25, G5=783.99, C6=1046.50, B5=987.77, A5=880.00, G5=783.99, F5=698.46
    const fanfareMelody: Array<{ freq: number; dur: number; offset: number; vol?: number }> = [
      // Measure 1: Ascending fanfare triplets & bold tonic
      { freq: 523.25, dur: sixteenth, offset: 0 },
      { freq: 659.25, dur: sixteenth, offset: sixteenth },
      { freq: 783.99, dur: sixteenth, offset: sixteenth * 2 },
      { freq: 1046.50, dur: eighth * 1.5, offset: sixteenth * 3, vol: 0.13 },

      // Measure 2: Cheerful bouncy descent
      { freq: 987.77, dur: eighth, offset: eighth * 3 },
      { freq: 880.00, dur: eighth, offset: eighth * 4 },
      { freq: 783.99, dur: eighth * 1.5, offset: eighth * 5 },

      // Measure 3: Resolving lift
      { freq: 659.25, dur: eighth, offset: eighth * 6.5 },
      { freq: 783.99, dur: eighth, offset: eighth * 7.5 },
      { freq: 1046.50, dur: eighth * 2, offset: eighth * 8.5, vol: 0.14 },

      // Measure 4: Harmonious resolve
      { freq: 880.00, dur: eighth, offset: eighth * 11 },
      { freq: 987.77, dur: eighth, offset: eighth * 12 },
      { freq: 1046.50, dur: eighth * 2.5, offset: eighth * 13, vol: 0.12 },
    ];

    // Bassline accompaniment (cheerful walking bass)
    // C3=130.81, G3=196.00, E3=164.81, A3=220.00, F3=174.61, D3=146.83
    const bassline: Array<{ freq: number; dur: number; offset: number }> = [
      { freq: 130.81, dur: eighth, offset: 0 },
      { freq: 196.00, dur: eighth, offset: eighth },
      { freq: 164.81, dur: eighth, offset: eighth * 2 },
      { freq: 196.00, dur: eighth, offset: eighth * 3 },
      { freq: 174.61, dur: eighth, offset: eighth * 4 },
      { freq: 220.00, dur: eighth, offset: eighth * 5 },
      { freq: 196.00, dur: eighth, offset: eighth * 6 },
      { freq: 164.81, dur: eighth, offset: eighth * 7 },
      { freq: 130.81, dur: eighth, offset: eighth * 8 },
      { freq: 196.00, dur: eighth, offset: eighth * 9 },
      { freq: 174.61, dur: eighth, offset: eighth * 10 },
      { freq: 196.00, dur: eighth, offset: eighth * 11 },
      { freq: 130.81, dur: eighth * 2, offset: eighth * 12 },
      { freq: 196.00, dur: eighth * 1.5, offset: eighth * 14 },
    ];

    fanfareMelody.forEach((note) => {
      this.playSquareNote(note.freq, now + note.offset, note.dur, note.vol ?? 0.09, 2);
    });

    bassline.forEach((note) => {
      this.playSquareNote(note.freq, now + note.offset, note.dur, 0.08, -3);
    });

    const totalDurationMs = (eighth * 16) * 1000;
    this.currentLoopTimer = window.setTimeout(() => {
      this.startTitleLoop(iteration + 1);
    }, totalDurationMs - 30);
  }
}

// Singleton audio engine instance
export const chiptuneEngine = new ChiptuneAudioEngine();

// Exported standalone functions matching requirements
export const playNoiseCrash = (duration = 0.5) => chiptuneEngine.playNoiseCrash(duration);
export const playBleep = (freq = 440, duration = 0.08) => chiptuneEngine.playBleep(freq, duration);
export const playHitSound = () => chiptuneEngine.playHitSound();
export const playIntroSequence = () => chiptuneEngine.playIntroSequence();
export const playTitleFanfare = () => chiptuneEngine.playTitleFanfare();
export const stopAllAudio = () => chiptuneEngine.stopAllAudio();
export const unlockAudio = () => chiptuneEngine.unlockAudio();
export const setChiptuneMuted = (muted: boolean) => chiptuneEngine.setMuted(muted);
