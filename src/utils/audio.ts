// Web Audio API and Native Israeli Hebrew Speech Synthesis
import { PERMANENT_LETTER_AUDIO } from '../data/letterAudio';

const activeUtterances: Set<SpeechSynthesisUtterance> = new Set();

// 1. Global registry to protect utterances from Chrome's garbage collector
declare global {
  interface Window {
    __activeUtterances?: SpeechSynthesisUtterance[];
    speakText?: (text: string, lang?: string, rate?: number, onComplete?: () => void) => void;
  }
}

if (typeof window !== 'undefined') {
  if (!window.__activeUtterances) {
    window.__activeUtterances = [];
  }

  // Handle Chrome's asynchronous voice loading
  if ('speechSynthesis' in window) {
    window.speechSynthesis.getVoices();
    window.speechSynthesis.onvoiceschanged = () => {
      if (typeof window !== 'undefined' && (window as unknown as { __soundManager?: { refreshVoices: () => void } }).__soundManager) {
        (window as unknown as { __soundManager?: { refreshVoices: () => void } }).__soundManager?.refreshVoices();
      }
    };
  }
}

// 8-bit mono loopable silent WAV to activate iOS AVAudioSessionCategoryPlayback (bypasses silent switch)
const SILENT_WAV_DATA_URI = 'data:audio/wav;base64,UklGRisAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQcAAACAgICAgICAAAA=';

export const HEBREW_COMPANION_NAMES: Record<string, string> = {
  // Holidays
  'sigd': 'סִיגְד',
  'shabbat': 'שַׁבָּת',
  'rosh hashanah': 'רֹאשׁ הַשָּׁנָה',
  'yom kippur': 'יוֹם כִּפּוּר',
  'sukkot': 'סֻכּוֹת',
  'simchat torah': 'שִׂמְחַת תּוֹרָה',
  'hanukkah': 'חֲנֻכָּה',
  'tu bishvat': 'טוּ בִּשְׁבָט',
  'shevat': 'שְׁבָט',
  'purim': 'פּוּרִים',
  'passover': 'פֶּסַח',
  'pesah': 'פֶּסַח',
  'pesach': 'פֶּסַח',
  'yom haatzmaut': 'יוֹם הָעַצְמָאוּת',
  'yom ha’atzmaut': 'יוֹם הָעַצְמָאוּת',
  'lag baomer': 'לַג בָּעֹמֶר',
  'lag ba’omer': 'לַג בָּעֹמֶר',
  'lag ba\'omer': 'לַג בָּעֹמֶר',
  'yom yerushalayim': 'יוֹם יְרוּשָׁלַיִם',
  'shavuot': 'שָׁבוּעוֹת',
  // Heroes
  'abraham': 'אַבְרָהָם',
  'sarah': 'שָׂרָה',
  'isaac': 'יִצְחָק',
  'rebecca': 'רִבְקָה',
  'jacob': 'יַעֲקֹב',
  'rachel': 'רָחֵל',
  'leah': 'לֵאָה',
  'joseph': 'יוֹסֵף',
  'moses': 'מֹשֶׁה',
  'miriam': 'מִרְיָם',
  'aaron': 'אַהֲרֹן',
  'joshua': 'יְהוֹשֻׁעַ',
  'deborah': 'דְּבוֹרָה',
  'gideon': 'גִּדְעוֹן',
  'samson': 'שִׁמְשׁוֹן',
  'ruth': 'רוּת',
  'samuel': 'שְׁמוּאֵל',
  'king david': 'דָּוִד הַמֶּלֶךְ',
  'king solomon': 'שְׁלֹמֹה הַמֶּלֶךְ',
  'elijah': 'אֵלִיָּהוּ',
  'queen esther': 'אֶסְתֵּר הַמַּלְכָּה',
  'mordechai': 'מָרְדֳּכַי',
  'judah maccabee': 'יְהוּדָה הַמַּכַּבִּי',
  // Villains
  'pharaoh': 'פַּרְעֹה',
  'goliath': 'גָּלְיָת',
  'wicked haman': 'הָמָן הָרָשָׁע',
  'haman': 'הָמָן',
  'king antiochus': 'אַנְטִיּוֹכוּס הַמֶּלֶךְ',
  'antiochus': 'אַנְטִיּוֹכוּס הַמֶּלֶךְ',
  'korah': 'קֹרַח',
  'king balak': 'בָּלָק',
  'balaam': 'בִּלְעָם',
  'king ahab': 'אַחְאָב',
  'queen jezebel': 'אִיזֶבֶל',
  'holofernes': 'הוֹלוֹפֶרְנֶס',
  'general holofernes': 'הוֹלוֹפֶרְנֶס',
  'sennacherib': 'סַנְחֵרִיב',
  'nebuchadnezzar': 'נְבוּכַדְנֶאצַּר',
  // Kosher Foods
  'falafel': 'Falafel',
  'shakshuka': 'שַׁקְשׁוּקָה',
  'hummus': 'חוּמוּס',
  'חוּמוּס': 'חוּמוּס',
  'hamantasch': 'אֹזֶן הָמָן',
  'hamantaschen': 'אֹזֶן הָמָן',
  'challah': 'חַלָּה',
};

class SoundManager {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private synth: SpeechSynthesis | null = null;
  private hebrewVoice: SpeechSynthesisVoice | null = null;
  private englishVoice: SpeechSynthesisVoice | null = null;
  private activeUtterances: Set<SpeechSynthesisUtterance> = new Set();
  private pendingSpeechTimeout: ReturnType<typeof setTimeout> | null = null;
  private currentCustomAudio: HTMLAudioElement | null = null;
  private lastSpokenHebrewText: string = '';
  private lastSpokenEnglishText: string = '';
  private silentAudioElement: HTMLAudioElement | null = null;
  private isIosUnlocked: boolean = false;
  private isSpeechUnlocked: boolean = false;
  private speechSequenceId: number = 0;

  constructor() {
    if (typeof window !== 'undefined') {
      const storedMute = localStorage.getItem('alefbet_muted');
      this.isMuted = storedMute === 'true';

      if ('speechSynthesis' in window) {
        this.synth = window.speechSynthesis;
        this.refreshVoices();

        if (typeof window.speechSynthesis.addEventListener === 'function') {
          window.speechSynthesis.addEventListener('voiceschanged', () => {
            this.refreshVoices();
          });
        }
        window.speechSynthesis.onvoiceschanged = () => {
          this.refreshVoices();
        };

        // Safety interval to unstick paused SpeechSynthesis in Chromium
        setInterval(() => {
          if (this.synth && this.synth.paused) {
            this.synth.resume();
          }
        }, 1000);
      }

      // Initialize silent audio element for iOS silent switch bypass
      this.initIosSilentAudioShield();

      // Automatically stop speech & audio if tab is hidden / not currently selected
      if (typeof document !== 'undefined') {
        document.addEventListener('visibilitychange', () => {
          if (document.hidden) {
            this.stopAllAudio();
          }
        });
      }

      // Expose SoundManager instance for global voiceschanged listener
      (window as unknown as { __soundManager?: SoundManager }).__soundManager = this;

      // Automatically unlock Web Audio Context & iOS Audio Session & SpeechSynthesis on user interactions
      const unlock = () => {
        this.unlockAudio();
      };
      const events = ['touchstart', 'touchend', 'click', 'pointerdown', 'mousedown', 'keydown'];
      events.forEach((evt) => {
        window.addEventListener(evt, unlock, { capture: true, passive: true });
      });
    }
  }

  public refreshVoices() {
    this.hebrewVoice = null;
    this.englishVoice = null;
    this.findHebrewVoice();
    this.findEnglishVoice();
  }

  // Setup loopable silent HTML5 audio element to switch iOS session to Playback mode (bypasses hardware mute switch)
  private initIosSilentAudioShield() {
    if (typeof window === 'undefined') return;
    try {
      const audio = document.createElement('audio');
      audio.setAttribute('x-webkit-airplay', 'deny');
      audio.preload = 'auto';
      audio.loop = true;
      audio.src = SILENT_WAV_DATA_URI;
      this.silentAudioElement = audio;
    } catch {
      // Fallback
    }
  }

  // Find natural English voice for English instructions (respects system default; never forces high-pitched voices)
  private findEnglishVoice(): SpeechSynthesisVoice | null {
    if (!this.synth) return null;
    if (this.englishVoice) return this.englishVoice;
    const voices = this.synth.getVoices();
    if (!voices || voices.length === 0) return null;

    const engVoices = voices.filter((v) => v.lang.toLowerCase().startsWith('en'));
    if (engVoices.length > 0) {
      // 1. If the user or OS has a default English voice, respect and use it
      const defaultVoice = engVoices.find((v) => v.default);
      if (defaultVoice) {
        this.englishVoice = defaultVoice;
        return this.englishVoice;
      }

      // 2. Select standard neutral/natural pitch voice (e.g. Alex, David, Daniel, Aaron),
      // strictly avoiding high-pitched voices (samantha, jenny, female)
      const standardVoice = engVoices.find((v) => {
        const name = v.name.toLowerCase();
        const isHighPitched = name.includes('samantha') || name.includes('jenny') || name.includes('female');
        return (
          !isHighPitched &&
          (name.includes('alex') ||
            name.includes('david') ||
            name.includes('daniel') ||
            name.includes('aaron') ||
            name.includes('natural'))
        );
      });

      // 3. Fallback to any non-high-pitched English voice, or first English voice
      const nonHighPitched = engVoices.find((v) => {
        const name = v.name.toLowerCase();
        return !name.includes('samantha') && !name.includes('jenny') && !name.includes('female');
      });

      this.englishVoice = standardVoice || nonHighPitched || engVoices[0];
      return this.englishVoice;
    }
    return null;
  }

  // Find native Israeli Hebrew voice (Carmit on Apple, Google עברית on Chrome, Hila on Windows)
  private findHebrewVoice(): SpeechSynthesisVoice | null {
    if (!this.synth) return null;
    const voices = this.synth.getVoices();
    if (!voices || voices.length === 0) return null;

    // Filter strictly for Hebrew / Israeli voices (he, iw) - NOT Filipino (fil) or others!
    const hebrewVoices = voices.filter((v) => {
      const lang = v.lang.toLowerCase().replace('_', '-');
      const name = v.name.toLowerCase();

      // Exclude non-Hebrew languages like Filipino ('fil'), Italian ('it'), etc.
      if (lang.startsWith('fil') || lang.startsWith('tl') || name.includes('filipino') || name.includes('tagalog')) {
        return false;
      }

      const isHebrewLang = lang.startsWith('he') || lang.startsWith('iw') || lang === 'he-il' || lang === 'iw-il';
      const isHebrewName =
        name.includes('hebrew') ||
        name.includes('עברית') ||
        name.includes('carmit') ||
        name.includes('hila') ||
        name.includes('asaf') ||
        (name.includes('israel') && !name.includes('filipino'));

      return isHebrewLang || isHebrewName;
    });

    if (hebrewVoices.length > 0) {
      // Prioritize female Israeli voices (Carmit, Hila, Google עברית)
      const female = hebrewVoices.find((v) => {
        const n = v.name.toLowerCase();
        return (
          n.includes('carmit') ||
          n.includes('hila') ||
          n.includes('google') ||
          n.includes('natural') ||
          v.name.includes('עברית')
        );
      });
      this.hebrewVoice = female || hebrewVoices[0];
      return this.hebrewVoice;
    }

    // NEVER fall back to a non-Hebrew voice object!
    // Leaving voice null allows Chrome/Safari to use their network he-IL engine based on utterance.lang = 'he-IL'
    this.hebrewVoice = null;
    return null;
  }

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && (this.ctx.state === 'suspended' || this.ctx.state === ('interrupted' as AudioContextState))) {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  // Synchronously unlock Web Audio context and audio session on user gestures
  public unlockAudio() {
    if (typeof window === 'undefined') return;
    try {
      // Run window.speechSynthesis.resume() and window.speechSynthesis.cancel() immediately inside the click handler to unlock Chrome's speech engine
      if ('speechSynthesis' in window) {
        window.speechSynthesis.resume();
        window.speechSynthesis.getVoices();
      }
      const ctx = this.getContext();
      if (ctx && (ctx.state === 'suspended' || ctx.state === ('interrupted' as AudioContextState))) {
        ctx.resume().catch(() => {});
      }
      if (this.synth && !this.isMuted) {
        if (this.synth.paused) {
          this.synth.resume();
        }
      }
      // Create a tiny silent buffer source to warm up mobile Web Audio pipeline
      if (ctx) {
        const buffer = ctx.createBuffer(1, 1, 22050);
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        source.start(0);
      }
      // Start the looping silent HTML5 audio element to switch iOS session to Playback mode (bypasses silent switch)
      if (!this.isMuted && this.silentAudioElement && !this.isIosUnlocked) {
        this.silentAudioElement
          .play()
          .then(() => {
            this.isIosUnlocked = true;
          })
          .catch(() => {
            // Will retry on next interaction
          });
      }
    } catch {
      // Audio unlock fallback
    }
  }

  public stopAllAudio() {
    try {
      this.speechSequenceId++;
      if (this.pendingSpeechTimeout) {
        clearTimeout(this.pendingSpeechTimeout);
        this.pendingSpeechTimeout = null;
      }
      if (this.synth) {
        this.synth.cancel();
      }
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      if (this.currentCustomAudio) {
        this.currentCustomAudio.pause();
        this.currentCustomAudio.currentTime = 0;
        this.currentCustomAudio = null;
      }
    } catch {
      // ignore
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (typeof window !== 'undefined') {
      localStorage.setItem('alefbet_muted', this.isMuted.toString());
      if (this.isMuted) {
        if (this.synth) {
          this.synth.cancel();
        }
        if (this.silentAudioElement) {
          this.silentAudioElement.pause();
          this.isIosUnlocked = false;
        }
      } else {
        if (this.silentAudioElement) {
          this.silentAudioElement.play().catch(() => {});
        }
      }
    }
    return this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public setMuted(muted: boolean): boolean {
    if (this.isMuted !== muted) {
      return this.toggleMute();
    }
    return this.isMuted;
  }

  // Play musical tone (Safe linear ramps for iOS WebKit)
  public playNote(freq: number, duration = 0.35, type: OscillatorType = 'triangle') {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      if (ctx.state === 'suspended' || ctx.state === ('interrupted' as AudioContextState)) {
        ctx.resume().catch(() => {});
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const now = ctx.currentTime;

      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.24, now + 0.03);
      gain.gain.linearRampToValueAtTime(0.001, now + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + duration + 0.01);
    } catch {
      // Audio fallback
    }
  }

  // Cheerful bubble pop sound
  public playPop(rate: number = 1.0) {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      if (ctx.state === 'suspended' || ctx.state === ('interrupted' as AudioContextState)) {
        ctx.resume().catch(() => {});
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const now = ctx.currentTime;
      const duration = 0.11 / rate;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(350 * rate, now);
      osc.frequency.linearRampToValueAtTime(750 * rate, now + 0.07 / rate);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.28, now + (0.01 / rate));
      gain.gain.linearRampToValueAtTime(0.001, now + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + duration + 0.01);
    } catch {
      // Audio fallback
    }
  }

  // Retro sci-fi laser zap sound effect for Invasion mode
  public playLaserZap() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      if (ctx.state === 'suspended' || ctx.state === ('interrupted' as AudioContextState)) {
        ctx.resume().catch(() => {});
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const now = ctx.currentTime;
      const duration = 0.16;

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(980, now);
      osc.frequency.exponentialRampToValueAtTime(120, now + duration);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.24, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + duration + 0.01);
    } catch {
      // Audio fallback
    }
  }

  // Playful roulette tick sound effect ("beep boop beep")
  public playRouletteBeep(index = 0) {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    // Do NOT schedule sound if audio context is not active; prevents chime stacking during initial load
    if (ctx.state !== 'running') return;

    try {
      const freqs = [440, 587.33, 523.25, 659.25, 783.99, 880];
      const freq = freqs[index % freqs.length];
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const now = ctx.currentTime;
      const duration = 0.07;

      osc.type = index % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.24, now + 0.012);
      gain.gain.linearRampToValueAtTime(0.001, now + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + duration + 0.01);
    } catch {
      // Audio fallback
    }
  }

  // Pleasant correct answer chime
  public playCorrect() {
    if (this.isMuted) return;
    this.playNote(523.25, 0.2, 'sine'); // C5
    setTimeout(() => {
      this.playNote(783.99, 0.4, 'sine'); // G5
    }, 120);
  }

  // Crisp, satisfying metallic coin clink sound effect (two coins clinking together)
  public playCoinClink() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      if (ctx.state === 'suspended' || ctx.state === ('interrupted' as AudioContextState)) {
        ctx.resume().catch(() => {});
      }

      const now = ctx.currentTime;

      // Helper to generate a single metallic coin ping with resonant harmonic
      const createPing = (startTime: number, f1: number, f2: number, volume = 0.3) => {
        [f1, f2].forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = i === 0 ? 'sine' : 'triangle';
          osc.frequency.setValueAtTime(freq, startTime);

          gain.gain.setValueAtTime(0.0001, startTime);
          gain.gain.linearRampToValueAtTime(volume * (i === 0 ? 1 : 0.45), startTime + 0.003);
          gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.22);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(startTime);
          osc.stop(startTime + 0.24);
        });
      };

      // First coin impact
      createPing(now, 1975.5, 3136.0, 0.34);
      // Second coin clink ping slightly delayed
      createPing(now + 0.065, 2349.3, 3729.3, 0.30);
      // Third bright shimmer ping
      createPing(now + 0.13, 2793.8, 4186.0, 0.24);
    } catch {
      // Audio fallback
    }
  }

  // Gentle soft boing for miss
  public playGentleBoing() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      if (ctx.state === 'suspended' || ctx.state === ('interrupted' as AudioContextState)) {
        ctx.resume().catch(() => {});
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const now = ctx.currentTime;
      const duration = 0.28;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(260, now);
      osc.frequency.linearRampToValueAtTime(160, now + duration);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.2, now + 0.02);
      gain.gain.linearRampToValueAtTime(0.001, now + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + duration + 0.01);
    } catch {
      // Ignored
    }
  }

  // Star sparkle chime
  public playSparkle() {
    if (this.isMuted) return;
    const notes = [523.25, 659.25, 783.99, 1046.50];
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        this.playNote(freq, 0.3, 'sine');
      }, idx * 70);
    });
  }

  // Triumphant Fanfare for level win / complete tracing
  public playFanfare() {
    if (this.isMuted) return;
    const fanfareNotes = [
      { f: 523.25, t: 0 },
      { f: 659.25, t: 120 },
      { f: 783.99, t: 240 },
      { f: 1046.50, t: 380 },
      { f: 783.99, t: 550 },
      { f: 1046.50, t: 700 },
    ];
    fanfareNotes.forEach(({ f, t }) => {
      setTimeout(() => {
        this.playNote(f, 0.45, 'triangle');
      }, t);
    });
  }

  // Classic 8-bit retro style healing chime
  public playHealingChime() {
    if (this.isMuted) return;
    const notes = [
      { f: 659.25, d: 0.18 },
      { f: 659.25, d: 0.18 },
      { f: 783.99, d: 0.22 },
      { f: 1046.50, d: 0.45 },
    ];
    notes.forEach(({ f, d }, idx) => {
      setTimeout(() => {
        this.playNote(f, d, 'sine');
      }, idx * 160);
    });
  }

  // Kid Pix Airbrush Spray Hiss Sound
  public playSpray() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      if (ctx.state === 'suspended' || ctx.state === ('interrupted' as AudioContextState)) {
        ctx.resume().catch(() => {});
      }
      const bufferSize = ctx.sampleRate * 0.08;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(3200, ctx.currentTime);
      filter.Q.setValueAtTime(3, ctx.currentTime);

      const gain = ctx.createGain();
      const now = ctx.currentTime;
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.12, now + 0.01);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.08);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      noise.start(now);
    } catch {
      // Ignored
    }
  }

  // Kid Pix Bucket Fill Glug Splash Sound
  public playBucketFill() {
    if (this.isMuted) return;
    const freqs = [300, 420, 580, 750, 920, 1100];
    freqs.forEach((freq, idx) => {
      setTimeout(() => {
        this.playNote(freq, 0.12, 'sine');
      }, idx * 35);
    });
  }

  // Kid Pix Dynamite Explosive Clear Sound
  public playDynamite() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      if (ctx.state === 'suspended' || ctx.state === ('interrupted' as AudioContextState)) {
        ctx.resume().catch(() => {});
      }
      const now = ctx.currentTime;
      // Low boom oscillator
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(30, now + 0.4);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.42);

      // Noise burst for dynamite pop
      const bufferSize = ctx.sampleRate * 0.3;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.25, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      noise.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      noise.start(now);
    } catch {
      // Ignored
    }
  }

  // Kid Pix Rainbow Magic Chime Sound -> Speaks Keshet (קשת) instead of funny sound
  public playRainbowChime() {
    if (this.isMuted) return;
    this.speakHebrew('קֶשֶׁת', 0.9, 1.0);
  }

  private getSynth(): SpeechSynthesis | null {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      if (!this.synth) {
        this.synth = window.speechSynthesis;
      }
      return this.synth;
    }
    return null;
  }

  // Bulletproof speak method
  public speak(text: string, lang: string = 'he-IL') {
    if (this.isMuted) return;
    try {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.resume();
      }
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      const voices = window.speechSynthesis.getVoices();
      const hebrewVoice = voices.find(v => v.lang === lang || v.lang.startsWith(lang.substring(0, 2)));
      if (hebrewVoice) {
        utterance.voice = hebrewVoice;
      }
      activeUtterances.add(utterance);
      utterance.onend = () => { activeUtterances.delete(utterance); };
      utterance.onerror = (e) => {
        console.warn("Speech synthesis error:", e);
        activeUtterances.delete(utterance);
      };
      window.speechSynthesis.speak(utterance);
      window.speechSynthesis.resume();
    } catch (err) {
      console.warn("speak error:", err);
    }
  }

  // Speak with native Israeli voice for authentic Hebrew letters and terms
  public speakHebrew(textOrItem: string | { audioSrc?: string; speakText?: string; ttsOverride?: string; hebrew?: string; wordHe?: string; spokenHe?: string; [key: string]: any }, rate = 0.9, pitch = 1.0, onComplete?: () => void) {
    const item = typeof textOrItem === 'object' && textOrItem !== null ? textOrItem : null;
    const isSababa = (typeof textOrItem === 'string' && (textOrItem === 'סַבָּבָה' || textOrItem === 'סבבה' || textOrItem === 'סַבָּה בַּה' || textOrItem === 'סָבָּאבָּה' || textOrItem.toLowerCase() === 'sababa')) ||
                     (item && (item.id === 'saying_sababa' || item.wordEn?.toLowerCase() === 'sababa' || item.hebrew === 'סַבָּבָה' || item.wordHe === 'סַבָּבָה' || item.spokenHe === 'סַבָּבָה'));
    const audioSrc = item?.audioSrc || (isSababa ? '/sababa.mp3' : undefined);

    const isFalafel = (typeof textOrItem === 'string' && (
      textOrItem.toLowerCase() === 'falafel' ||
      textOrItem.includes('פָּלָ') ||
      textOrItem === 'פָּלָאפֶל' ||
      textOrItem === 'פָּלָּ-פֶל' ||
      textOrItem === 'פָּלָּפֶל' ||
      textOrItem === 'פלאפל'
    )) || (item && (
      item.id === 'falafel' ||
      item.wordEn?.toLowerCase() === 'falafel' ||
      item.nameEn?.toLowerCase() === 'falafel'
    ));

    if (isFalafel) {
      if (this.isMuted) {
        onComplete?.();
        return;
      }
      this.speakEnglish('falafel', rate, pitch, onComplete);
      return;
    }

    if (audioSrc || isSababa) {
      if (this.isMuted) {
        onComplete?.();
        return;
      }
      try {
        const audio = new Audio(audioSrc || '/sababa.mp3');
        if (onComplete) {
          audio.onended = () => onComplete();
          audio.onerror = (err) => {
            console.warn("Sababa audio playback failed or was blocked:", err);
            onComplete?.();
          };
        } else {
          audio.onerror = (err) => {
            console.warn("Sababa audio playback failed or was blocked:", err);
          };
        }
        audio.play().catch(err => {
          console.warn("Sababa audio playback failed or was blocked:", err);
          onComplete?.();
        });
        return;
      } catch (err) {
        console.warn("Sababa audio playback failed or was blocked:", err);
        onComplete?.();
      }
    }

    const synth = this.getSynth();
    if (this.isMuted || !synth) {
      onComplete?.();
      return;
    }

    let text = typeof textOrItem === 'object' && textOrItem !== null
      ? (textOrItem.ttsOverride || textOrItem.ttsText || textOrItem.speakText || textOrItem.hebrew || textOrItem.spokenHe || textOrItem.nameHe || textOrItem.wordHe || '')
      : (textOrItem || '');

    if (typeof textOrItem === 'object' && textOrItem !== null) {
      if ((textOrItem as any).wordEn === 'eye' || (textOrItem as any).english === 'eye') {
        text = textOrItem.ttsOverride || 'ע';
      }
    }

    try {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.resume();
        const synthInst = window.speechSynthesis;
        if (synthInst.speaking || synthInst.pending) {
          if (text !== this.lastSpokenHebrewText) {
            // synthInst.cancel();
          }
        }
        this.lastSpokenHebrewText = text;
      }

      if (this.pendingSpeechTimeout) {
        clearTimeout(this.pendingSpeechTimeout);
        this.pendingSpeechTimeout = null;
      }

      const speakNow = () => {
        if (!synth) {
          onComplete?.();
          return;
        }

        // As requested by user, pass 'ספר' without nikud so modern Hebrew TTS engines pronounce standard noun "sefer" (SE-fer)
        let textToSpeak = text;
        if (textToSpeak) {
          // Respect sacred tradition: Never pronounce the Tetragrammaton! Always pronounce as "הַשֵּׁם" ("Hashem")
          textToSpeak = textToSpeak.replace(/יְהוָה|יהוה|ה׳|ה'|אֲדֹנָי|אדני/g, 'הַשֵּׁם');
          // Replace אֱלֹהֵינוּ with אֱלֹקֵינוּ (Elokeinu)
          textToSpeak = textToSpeak.replace(/אֱלֹהֵינוּ|אלהינו/g, 'אֱלֹקֵינוּ');
          textToSpeak = textToSpeak.replace(/אֱלֹהַיִךְ|אלהיך/g, 'אֱלֹקַיִךְ');
          textToSpeak = textToSpeak.replace(/אֱלֹהָי|אלהי/g, 'אֱלֹקָי');

          // Ensure "Eve" and "farm" (Chava) are pronounced as authentic modern "Chava" (/va/) instead of classical/Arabic "Chawa" (/wa/)
          textToSpeak = textToSpeak.replace(/ח[\u0591-\u05C7]*ו{1,2}[\u0591-\u05C7]*ה(?=[^\u0590-\u05FF]|$)/g, 'חָבָה');

          // Ensure "school" is always pronounced as construct "Beit Sefer" (בֵּית-ספר) not "bayit sefer"
          textToSpeak = textToSpeak.replace(/(^|[^\u0590-\u05FF])(בַּיִת|בֵּית|בֵּית|בית)\s*(סֵ?פֶ?ר|ספר)($|[^\u0590-\u05FF])/g, '$1בֵּית-ספר$4');
          textToSpeak = textToSpeak.replace(/(^|[^\u0590-\u05FF])בְּ(בַּיִת|בֵּית|בֵּית|בית)\s*(סֵ?פֶ?ר|ספר)($|[^\u0590-\u05FF])/g, '$1בְּבֵית-ספר$4');

          // Ensure "Purim" and holiday names are pronounced with authentic Hebrew vowelization
          textToSpeak = textToSpeak.replace(/\bPurim\b/gi, 'פּוּרִים');
          textToSpeak = textToSpeak.replace(/פוּרִים/g, 'פּוּרִים');
          textToSpeak = textToSpeak.replace(/פּוּ-רִים/g, 'פּוּרִים');
          textToSpeak = textToSpeak.replace(/\bShabbat\b/gi, 'שַׁבָּת');
          textToSpeak = textToSpeak.replace(/(^|[^\u0590-\u05FF])שבת($|[^\u0590-\u05FF])/g, '$1שַׁבָּת$2');
          textToSpeak = textToSpeak.replace(/\bRosh Hashanah\b/gi, 'רֹאשׁ הַשָּׁנָה');
          textToSpeak = textToSpeak.replace(/\bYom Kippur\b/gi, 'יוֹם כִּפּוּר');
          textToSpeak = textToSpeak.replace(/(^|[^\u0590-\u05FF])(יום כפור|יום כיפור)($|[^\u0590-\u05FF])/g, '$1יוֹם כִּפּוּר$3');
          textToSpeak = textToSpeak.replace(/\bSukkot\b/gi, 'סֻכּוֹת');
          textToSpeak = textToSpeak.replace(/(^|[^\u0590-\u05FF])(סכות|סוכות)($|[^\u0590-\u05FF])/g, '$1סֻכּוֹת$3');
          textToSpeak = textToSpeak.replace(/\bSimchat Torah\b/gi, 'שִׂמְחַת תּוֹרָה');
          textToSpeak = textToSpeak.replace(/\bHanukkah\b|\bChanukah\b/gi, 'חֲנֻכָּה');
          textToSpeak = textToSpeak.replace(/(^|[^\u0590-\u05FF])(חנכה|חנוכה)($|[^\u0590-\u05FF])/g, '$1חֲנֻכָּה$3');
          textToSpeak = textToSpeak.replace(/\bPassover\b|\bPesach\b|\bPesah\b/gi, 'פֶּסַח');
          textToSpeak = textToSpeak.replace(/(^|[^\u0590-\u05FF])פסח($|[^\u0590-\u05FF])/g, '$1פֶּסַח$2');
          textToSpeak = textToSpeak.replace(/\bShavuot\b/gi, 'שָׁבוּעוֹת');
          textToSpeak = textToSpeak.replace(/\bChag Sameach\b/gi, 'חָג שָׂמֵחַ');
          textToSpeak = textToSpeak.replace(/\bYom Ha['’]atzmaut\b/gi, 'יוֹם הָעַצְמָאוּת');
          textToSpeak = textToSpeak.replace(/\bYom Yerushalayim\b/gi, 'יוֹם יְרוּשָׁלַיִם');
          textToSpeak = textToSpeak.replace(/\bSigd\b/gi, 'סִיגְד');
          textToSpeak = textToSpeak.replace(/\bYom HaShoah\b/gi, 'יוֹם הַשּׁוֹאָה');
          textToSpeak = textToSpeak.replace(/\bYom Hazikaron\b/gi, 'יוֹם הַזִּכָּרוֹן');
          textToSpeak = textToSpeak.replace(/\bLag BaOmer\b|\bLag Ba['’]Omer\b/gi, 'לַג בָּעֹמֶר');
          textToSpeak = textToSpeak.replace(/(^|[^\u0590-\u05FF])(ל"?ג בָּ?עוֹ?מֶ?ר|ל״ג בעומר|ל"ג בעומר)($|[^\u0590-\u05FF])/g, '$1לַג בָּעֹמֶר$3');
          textToSpeak = textToSpeak.replace(/\bTu B['’]Av\b/gi, 'טוּ בְּאָב');

          // Characters section pronunciation mapping
          textToSpeak = textToSpeak.replace(/\bPharaoh\b/gi, 'פַּרְעֹה');
          textToSpeak = textToSpeak.replace(/(^|[^\u0590-\u05FF])פרעה($|[^\u0590-\u05FF])/g, '$1פַּרְעֹה$2');
          textToSpeak = textToSpeak.replace(/\b(General\s+)?Holofernes\b/gi, 'הוֹלוֹפֶרְנֶס');
          textToSpeak = textToSpeak.replace(/(^|[^\u0590-\u05FF])הולופרנס($|[^\u0590-\u05FF])/g, '$1הוֹלוֹפֶרְנֶס$2');

          // Kosher foods pronunciation mapping (selected items routed with pointed strings)
          textToSpeak = textToSpeak.replace(/\bFalafel\b/gi, 'פָּלָאפֶל');
          textToSpeak = textToSpeak.replace(/(^|[^\u0590-\u05FF])(פלאפל|פָלָאפֶל)($|[^\u0590-\u05FF])/g, '$1פָּלָאפֶל$3');
          textToSpeak = textToSpeak.replace(/\bShakshuka\b/gi, 'שַׁקְשׁוּקָה');
          textToSpeak = textToSpeak.replace(/(^|[^\u0590-\u05FF])שקשוקה($|[^\u0590-\u05FF])/g, '$1שַׁקְשׁוּקָה$2');
          textToSpeak = textToSpeak.replace(/\bHummus\b/gi, 'חוּמוּס');
          textToSpeak = textToSpeak.replace(/(^|[^\u0590-\u05FF])חומוס($|[^\u0590-\u05FF])/g, '$1חוּמוּס$2');
          textToSpeak = textToSpeak.replace(/\bHamantasch\b|\bHamantaschen\b/gi, 'אֹזֶן הָמָן');
          textToSpeak = textToSpeak.replace(/\bChallah\b/gi, 'חַלָּה');
          textToSpeak = textToSpeak.replace(/(^|[^\u0590-\u05FF])חלה($|[^\u0590-\u05FF])/g, '$1חַלָּה$2');

          // Ensure "ladybug" (Parat Moshe Rabbeinu) has authentic mil'el stress on ra-BEI-nu (raBEInu)
          textToSpeak = textToSpeak.replace(/רַבֵּנוּ|רבנו|רַבֵּינוּ/g, 'רַבֵּי-נוּ');

          // Ensure Antiochus is spoken with explicit niqqud (אַנְטִיּוֹכוּס הַמֶּלֶךְ)
          textToSpeak = textToSpeak.replace(/\b(King\s+)?Antiochus\b/gi, 'אַנְטִיּוֹכוּס הַמֶּלֶךְ');
          textToSpeak = textToSpeak.replace(/(?:אַנְטִיּוֹכּוֹס|אַנְטִיּוֹכוֹס|אַנְטִיּוֹכוּס|אנטיוכוס)\s*(?:הַמֶּלֶךְ|המלך)?/g, 'אַנְטִיּוֹכוּס הַמֶּלֶךְ');

          textToSpeak = textToSpeak.replace(/סֵ-?פֶ?ר|סֶ-?פֶ?ר/g, 'ספר');
          // Ensure "Tu Bishvat" is pronounced clearly as "Tu" (טוּ) instead of "Tet-Vav" or choking on gershayim quotes
          textToSpeak = textToSpeak.replace(/טַ?"ו|ט"ו|ט״ו|ט'ו|טַ״ו/g, 'טוּ');
          textToSpeak = textToSpeak.replace(/Tu BiShvat|Tu Bishvat/gi, 'טוּ בִּשְׁבָט');
          textToSpeak = textToSpeak.replace(/\bTu\b/g, 'טוּ');
          textToSpeak = textToSpeak.replace(/תַּנַ?״?ךְ?|תנ״ך|תנ'ך|תנך/g, 'תַּנָךְ');
          textToSpeak = textToSpeak.replace(/מִצְווֹת|מצוות/g, 'מִצְווֹת');

          // Ensure the month of "Shevat" is vocalized with vowels as שְׁבָט (Sh'vat) with sheva and kamatz
          textToSpeak = textToSpeak.replace(/\bShevat\b|\bSheh-vaht\b/gi, 'שְׁבָט');
          textToSpeak = textToSpeak.replace(/(^|[^\u0590-\u05FF])(שְׁ?בָ?t|שְׁ?בָ?ט|שְׁ?בָ?ט|שֵׁבֶט|שבט)($|[^\u0590-\u05FF])/g, '$1שְׁבָט$3');
          // Ensure "ozen" (ear) is pronounced with authentic mil'el stress (Ó-zen)
          textToSpeak = textToSpeak.replace(/(^|[^\u0590-\u05FF])(אֹזֶן|אוזן|אוֹזֶן)($|[^\u0590-\u05FF])/g, '$1אֹ-זֶן$3');
          // Ensure "mayim" (water) is pronounced with authentic mil'el stress (MA-yim)
          textToSpeak = textToSpeak.replace(/(^|[^\u0590-\u05FF])(מַיִם|מים|מַיִם)($|[^\u0590-\u05FF])/g, '$1מַ-יִם$3');
          // Ensure "ofanayim" (bicycle) is pronounced with authentic mil'el dual stress (o-fa-NA-yim)
          textToSpeak = textToSpeak.replace(/(^|[^\u0590-\u05FF])(אוֹפַנַּיִם|אופניים|אוֹפַנַיִם)($|[^\u0590-\u05FF])/g, '$1אוֹפַנַּ-יִם$3');
          textToSpeak = textToSpeak.replace(/(^|[^\u0590-\u05FF])(שׁוּעָל|שועל)($|[^\u0590-\u05FF])/g, '$1שׁוּ-עָל$3');
          // Ensure "sababa" (סַבָּבָה) is pronounced with authentic mil'el penultimate stress (sa-BA-ba) rather than ultimate stress (mil'ra)
          textToSpeak = textToSpeak.replace(/(^|[^\u0590-\u05FF])(סַ?בָּ?בָ?ה|סבבה)($|[^\u0590-\u05FF])/g, '$1סָבָּאבָּה$3');

          // Ensure "Osnat" is pronounced as authentic "Osnat" (אוֹסְנַת) with 'o' rather than unpointed/kamatz fallback "Asnat"
          textToSpeak = textToSpeak.replace(/(^|[^\u0590-\u05FF])(וְ?|וַ?|וֹ?)?(אָסְנַת|אסנת)($|[^\u0590-\u05FF])/g, '$1$2אוֹסְנַת$4');

          // Ensure "Arad" is pronounced with pointed text (עֲרָד)
          textToSpeak = textToSpeak.replace(/(^|[^\u0590-\u05FF])ערד($|[^\u0590-\u05FF])/g, '$1עֲרָד$2');

          // Ensure "lunch" / "tzohorayim" is pronounced with natural Israeli "tzo" (צוֹהֳרַיִם) rather than awkward chataf-kamatz
          textToSpeak = textToSpeak.replace(/(^|[^\u0590-\u05FF])(וְ?|וַ?|וֹ?)?(אֲ?רוּ?חַ?ת?\s+)?צ[\u0591-\u05C7]*ו?[\u0591-\u05C7]*ה[\u0591-\u05C7]*ר[\u0591-\u05C7]*י{1,2}[\u0591-\u05C7]*ם($|[^\u0590-\u05FF])/g, (_m: string, p1: string, conj: string, aruchat: string, p4: string) => {
            const conjStr = conj || '';
            const aruchatStr = aruchat ? (aruchat.includes('אֲ') ? aruchat : 'אֲרוּחַת ') : '';
            return p1 + conjStr + aruchatStr + 'צוֹהֳרַיִם' + p4;
          });

          // Ensure "ץ" (tzadi sofit) sends "צ סוֹפִית" to the TTS engine with correct first-syllable stress
          if (textToSpeak.trim() === 'ץ') {
            textToSpeak = 'צ סוֹפִית';
          }
          textToSpeak = textToSpeak.replace(/(^|[^\u0590-\u05FF])(צַ?דִ?י?ק?\s+סוֹ?פִית)($|[^\u0590-\u05FF])/g, '$1צ סוֹפִית$3');
        }

        // Any English words, including "Israeli salad", should ALWAYS be sent to the English-speaking engine!
        if (!/[\u0590-\u05FF]/.test(textToSpeak)) {
          this.speakEnglish(text, rate, pitch, onComplete);
          return;
        }

        // If text contains mixed Hebrew characters AND English words, speak bilingually so English words go to the English engine
        if (/[a-zA-Z]{2,}/.test(textToSpeak)) {
          const segments: Array<{ text: string; lang: 'en' | 'he'; rate?: number; pitch?: number }> = [];
          const tokens = textToSpeak.split(/([a-zA-Z\s'-]+)/);
          for (const tok of tokens) {
            if (!tok || !tok.trim()) continue;
            if (/[\u0590-\u05FF]/.test(tok)) {
              segments.push({ text: tok.trim(), lang: 'he', rate: rate * 0.85, pitch });
            } else if (/[a-zA-Z]/.test(tok)) {
              segments.push({ text: tok.trim(), lang: 'en', rate, pitch });
            }
          }
          if (segments.length > 0) {
            this.speakBilingualSequence(segments, onComplete);
            return;
          }
        }

        // Ensure resume is run immediately (do not call cancel right before speak)
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
          window.speechSynthesis.resume();
        }

        const utteranceText = textToSpeak.trim();
        const utterance = new SpeechSynthesisUtterance(utteranceText);
        utterance.lang = 'he-IL';
        utterance.rate = rate * 0.85; // Slower Hebrew tempo
        utterance.pitch = pitch;

        const voices = window.speechSynthesis.getVoices();
        const hebrewVoice = voices.find(v => v.lang === 'he-IL' || v.lang.startsWith('he'));
        if (hebrewVoice) {
          utterance.voice = hebrewVoice;
        }

        activeUtterances.add(utterance);

        let hasFinished = false;
        const finish = () => {
          if (hasFinished) return;
          hasFinished = true;
          activeUtterances.delete(utterance);
          if (typeof window !== 'undefined' && window.__activeUtterances) {
            const idx = window.__activeUtterances.indexOf(utterance);
            if (idx !== -1) {
              window.__activeUtterances.splice(idx, 1);
            }
          }
          onComplete?.();
        };

        if (typeof window !== 'undefined') {
          if (!window.__activeUtterances) {
            window.__activeUtterances = [];
          }
          window.__activeUtterances.push(utterance);
        }

        utterance.onend = finish;
        utterance.onerror = (e) => {
          console.warn("Speech synthesis error:", e);
          finish();
        };

        window.speechSynthesis.speak(utterance);
        //window.speechSynthesis.resume();

        // Safety timeout to prevent hung state
        setTimeout(() => {
          if (!hasFinished) finish();
        }, 10000);
      };

      speakNow();
    } catch {
      onComplete?.();
    }
  }

  // Speak clear English prompt with natural English voice
  public speakEnglish(text: string, rate = 0.95, pitch = 1.0, onComplete?: () => void) {
    // If text contains Hebrew characters, route to Hebrew voice and Hebrew pronunciation
    if (/[\u0590-\u05FF]/.test(text)) {
      this.speakHebrew(text, rate, pitch, onComplete);
      return;
    }

    // If text contains "Rav-Kav" or "Baruch Hashem", route through bilingual sequence so Hebrew voice pronounces them accurately
    if (/\b(rav[- ]?kav|baruch hashem)\b/i.test(text)) {
      const parts = text.split(/\b(rav[- ]?kav|baruch hashem)\b/i);
      const segments: Array<{ text: string; lang: 'en' | 'he'; rate?: number; pitch?: number }> = [];
      for (const part of parts) {
        if (!part) continue;
        if (/^rav[- ]?kav$/i.test(part.trim())) {
          segments.push({ text: 'רַב-קַו', lang: 'he', rate: 0.9, pitch: pitch });
        } else if (/^baruch hashem$/i.test(part.trim())) {
          segments.push({ text: 'בָּרוּךְ הַשֵּׁם', lang: 'he', rate: 0.9, pitch: pitch });
        } else {
          segments.push({ text: part, lang: 'en', rate, pitch });
        }
      }
      this.speakBilingualSequence(segments, onComplete);
      return;
    }

    const synth = this.getSynth();
    if (this.isMuted || !synth) {
      onComplete?.();
      return;
    }

    try {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.resume();
        const synthInst = window.speechSynthesis;
        if (synthInst.speaking || synthInst.pending) {
          if (text !== this.lastSpokenEnglishText) {
           // synthInst.cancel();
          }
        }
        this.lastSpokenEnglishText = text;
      }

      if (this.pendingSpeechTimeout) {
        clearTimeout(this.pendingSpeechTimeout);
        this.pendingSpeechTimeout = null;
      }

      const speakNow = () => {
        if (!synth) {
          onComplete?.();
          return;
        }

        const phoneticText = text
          .replace(/\b(king\s+)?antiochus\b/gi, 'antiyochus')
          .replace(/Tu BiShvat|Tu Bishvat/gi, 'Too Bishvat')
          .replace(/\bTu\b/g, 'Too')
          .replace(/\bPurim\b/gi, 'Pooreem')
          .replace(/\balef-?ball\b/gi, '')
          .trim();
        const utterance = new SpeechSynthesisUtterance(phoneticText);
        utterance.lang = 'en-US';
        utterance.rate = rate;
        utterance.pitch = pitch;

        let hasFinished = false;
        const finish = () => {
          if (hasFinished) return;
          hasFinished = true;
          this.activeUtterances.delete(utterance);
          if (typeof window !== 'undefined' && window.__activeUtterances) {
            const idx = window.__activeUtterances.indexOf(utterance);
            if (idx !== -1) {
              window.__activeUtterances.splice(idx, 1);
            }
          }
          onComplete?.();
        };

        this.activeUtterances.add(utterance);
        if (typeof window !== 'undefined') {
          if (!window.__activeUtterances) {
            window.__activeUtterances = [];
          }
          window.__activeUtterances.push(utterance);
        }
        utterance.onend = finish;
        utterance.onerror = finish;

        const voice = this.findEnglishVoice();
        if (voice) {
          utterance.voice = voice;
        }

        synth.speak(utterance);
        // Ensure Chrome's playback starts immediately
        synth.resume();

        setTimeout(() => {
          if (!hasFinished) finish();
        }, 10000);
      };

      speakNow();
    } catch {
      onComplete?.();
    }
  }

  // Speak a sequence of bilingual English and Hebrew text segments with correct native voices
  public speakBilingualSequence(
    segments: Array<{ text: string; lang: 'en' | 'he'; rate?: number; pitch?: number }>,
    onComplete?: () => void
  ) {
    if (!segments || segments.length === 0) {
      onComplete?.();
      return;
    }
    const currentSeq = ++this.speechSequenceId;
    const playNext = (index: number) => {
      if (index >= segments.length) {
        onComplete?.();
        return;
      }
      if (currentSeq !== this.speechSequenceId || this.isMuted) {
        onComplete?.();
        return;
      }
      const seg = segments[index];
      if (seg.lang === 'he') {
        this.speakHebrew(seg.text, seg.rate ?? 0.9, seg.pitch ?? 1.0, () => {
          playNext(index + 1);
        });
      } else {
        this.speakEnglish(seg.text, seg.rate ?? 0.95, seg.pitch ?? 1.0, () => {
          playNext(index + 1);
        });
      }
    };
    playNext(0);
  }

  // Play a recorded audio file (e.g. from Cantor Yakov)
  public playAudioFile(audioUrl: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.isMuted) {
        resolve();
        return;
      }
      try {
        if (this.currentCustomAudio) {
          this.currentCustomAudio.pause();
          this.currentCustomAudio = null;
        }
        const audio = new Audio(audioUrl);
        this.currentCustomAudio = audio;
        audio.onended = () => {
          if (this.currentCustomAudio === audio) this.currentCustomAudio = null;
          resolve();
        };
        audio.onerror = (err) => {
          if (this.currentCustomAudio === audio) this.currentCustomAudio = null;
          reject(err);
        };
        audio.play().catch((err) => {
          if (this.currentCustomAudio === audio) this.currentCustomAudio = null;
          reject(err);
        });
      } catch (err) {
        reject(err);
      }
    });
  }

  // Speak a single Hebrew letter by sending the raw letter glyph (e.g. 'א', 'ב', 'ג', 'ט').
  // If a permanent recorded voice clip exists for this letter, play that recording directly!
  // Alef ('א') is passed as pure 'א' directly to the synthesizer.
  // Ayin ('ע') uses hyphenated syllable phrasing ('עַ-יִן') to shift stress to the initial syllable (Mile'el).
  public speakLetter(letterChar: string, rateOrName?: number | string, pitch = 1.0, onComplete?: () => void) {
    if (this.isMuted) {
      onComplete?.();
      return;
    }
    const cleanLetter = letterChar.replace(/[\u0591-\u05BD\u05BF-\u05C7]/g, '').trim().slice(0, 1) || letterChar;

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // ignore
      }
    }

    // 1. Check if a permanent recorded voice clip exists for this letter
    const permanentClip = PERMANENT_LETTER_AUDIO[cleanLetter];
    if (permanentClip) {
      this.playAudioFile(permanentClip)
        .then(() => onComplete?.())
        .catch(() => {
          this.speakHebrew(cleanLetter, 0.9, 1.0, onComplete);
        });
      return;
    }

    if (!this.synth) {
      onComplete?.();
      return;
    }
    const effectiveRate = typeof rateOrName === 'number' ? rateOrName : 0.9;

    let textToSpeak = cleanLetter;
    if (cleanLetter === 'ע') {
      textToSpeak = 'עַ-יִן';
    } else if (cleanLetter === 'י') {
      textToSpeak = 'יוֹד';
    } else if (cleanLetter === 'ך') {
      textToSpeak = 'כַּף סוֹפִית';
    } else if (cleanLetter === 'ם') {
      textToSpeak = 'מֵם סוֹפִית';
    } else if (cleanLetter === 'ן') {
      textToSpeak = 'נוּן סוֹפִית';
    } else if (cleanLetter === 'ף') {
      textToSpeak = 'פֵּא סוֹפִית';
    } else if (cleanLetter === 'ץ') {
      textToSpeak = 'צ סוֹפִית';
    }

    this.speakHebrew(textToSpeak, effectiveRate, pitch, onComplete);
  }

  public speakWord(
    word: { ttsOverride?: string; ttsText?: string; speakText?: string; spokenHe?: string; wordHe?: string; wordEn?: string },
    rate = 0.9,
    pitch = 1.0,
    onComplete?: () => void
  ) {
    const textToSpeak = word.ttsOverride || word.ttsText || word.speakText || word.spokenHe || word.wordHe || '';
    this.speakHebrew(textToSpeak, rate, pitch, onComplete);
  }



  public speakText(text: string, lang = 'he-IL', rate = 0.9, onComplete?: () => void) {
    speakText(text, lang, rate, onComplete);
  }

  // Speaks bilingual instruction:
  // 1. "Click on the" in natural American English
  // 2. The Hebrew letter (e.g. 'ב' / 'Bet') in authentic Israeli Hebrew (or recorded voice clip)
  public speakClickLetterPrompt(letterChar: string) {
    if (this.isMuted) return;
    const seq = ++this.speechSequenceId;

    this.speakEnglish('Click on the', 0.95, 1.0, () => {
      if (seq !== this.speechSequenceId || this.isMuted) return;
      this.speakLetter(letterChar);
    });
  }

  // Speaks bilingual instruction for Match game:
  // 1. "Which picture starts with the letter" in natural American English
  // 2. The Hebrew letter (e.g. 'י') in authentic Israeli Hebrew (or recorded voice clip)
  public speakMatchPrompt(letterChar: string) {
    if (this.isMuted) return;
    const seq = ++this.speechSequenceId;

    this.speakEnglish('Which picture starts with the letter', 0.95, 1.0, () => {
      if (seq !== this.speechSequenceId || this.isMuted) return;
      this.speakLetter(letterChar);
    });
  }

  // Speaks bilingual instruction for Pop game target mission:
  // American English instruction + Israeli Hebrew letter
  public speakPopMissionPrompt(theme: 'balloons' | 'butterflies' | 'cars' | 'invasion', letterChar: string) {
    if (this.isMuted) return;
    const seq = ++this.speechSequenceId;

    const engPhrase = theme === 'butterflies'
      ? 'Catch butterflies with the letter'
      : theme === 'cars'
      ? 'Drive cars with the letter'
      : theme === 'invasion'
      ? 'Zap aliens with the letter'
      : 'Pop balloons with the letter';

    this.speakEnglish(engPhrase, 0.95, 1.0, () => {
      if (seq !== this.speechSequenceId || this.isMuted) return;
      this.speakLetter(letterChar);
    });
  }

  // Speaks prompt when selecting active companion in Catch game:
  // "Go!" + Hebrew letter (e.g. 'Alef')
  public speakGoCompanionPrompt(letterChar: string, letterNameEn?: string) {
    if (this.isMuted) return;
    const seq = ++this.speechSequenceId;

    this.speakEnglish('Go', 0.95, 1.0, () => {
      if (seq !== this.speechSequenceId || this.isMuted) return;
      this.speakLetter(letterChar);
    });
  }

  // Speaks prompt when selecting active Hero or Holiday companion in Catch game:
  // "Go!" (English) followed by the authentic Hebrew name (Israeli Hebrew voice)
  public speakGoHeroPrompt(heroNameEn: string, heroNameHe?: string) {
    if (this.isMuted) return;
    const seq = ++this.speechSequenceId;

    const key = heroNameEn.trim().toLowerCase();
    const cleanKey = key.replace(/['’]/g, '');
    const resolvedHe = heroNameHe || HEBREW_COMPANION_NAMES[cleanKey] || HEBREW_COMPANION_NAMES[key];

    // Only route to Hebrew voice if resolvedHe contains actual Hebrew characters
    if (resolvedHe && /[\u0590-\u05FF]/.test(resolvedHe)) {
      this.speakEnglish('Go', 0.95, 1.0, () => {
        if (seq !== this.speechSequenceId || this.isMuted) return;
        this.speakHebrew(resolvedHe, 0.9, 1.0);
      });
    } else {
      // Any English name, including "Israeli Salad", is sent to the English-speaking engine!
      this.speakEnglish(`Go ${heroNameEn}!`, 0.95, 1.0);
    }
  }

  // Speaks prompt to trace a specific letter:
  // "Trace the..." + Hebrew letter (e.g. 'Alef')
  public speakTraceLetterPrompt(letterChar: string, onComplete?: () => void) {
    if (this.isMuted) {
      onComplete?.();
      return;
    }
    const seq = ++this.speechSequenceId;

    this.speakEnglish('Trace the', 0.95, 1.0, () => {
      if (seq !== this.speechSequenceId || this.isMuted) {
        onComplete?.();
        return;
      }
      this.speakLetter(letterChar, 0.9, 1.0, () => {
        if (seq !== this.speechSequenceId || this.isMuted) {
          onComplete?.();
          return;
        }
        onComplete?.();
      });
    });
  }

  // Speaks prompt to color a specific letter:
  // "Color the..." + Hebrew letter (e.g. 'Alef')
  public speakColorLetterPrompt(letterChar: string, onComplete?: () => void) {
    if (this.isMuted) {
      onComplete?.();
      return;
    }
    const seq = ++this.speechSequenceId;

    this.speakEnglish('Color the', 0.95, 1.0, () => {
      if (seq !== this.speechSequenceId || this.isMuted) {
        onComplete?.();
        return;
      }
      this.speakLetter(letterChar, 0.9, 1.0, () => {
        if (seq !== this.speechSequenceId || this.isMuted) {
          onComplete?.();
          return;
        }
        onComplete?.();
      });
    });
  }

  // Speaks prompt when letter is caught and ready to be traced:
  // "Now trace the..." + Hebrew letter (e.g. 'Alef')
  public speakTraceNeededPrompt(letterChar: string, onComplete?: () => void) {
    if (this.isMuted) {
      onComplete?.();
      return;
    }
    const seq = ++this.speechSequenceId;

    this.speakEnglish('Now trace the', 0.95, 1.0, () => {
      if (seq !== this.speechSequenceId || this.isMuted) {
        onComplete?.();
        return;
      }
      this.speakLetter(letterChar, 0.9, 1.0, () => {
        if (seq !== this.speechSequenceId || this.isMuted) {
          onComplete?.();
          return;
        }
        setTimeout(() => {
          onComplete?.();
        }, 350);
      });
    });
  }

  // Alias for backward compatibility
  public speakCapturedLetterPrompt(letterChar: string, onComplete?: () => void) {
    this.speakTraceNeededPrompt(letterChar, onComplete);
  }

  // Speaks bilingual celebration for catching a character or letter:
  // "כל הכבוד! Caught [character name]!" with authentic Hebrew voice and pronunciation for Hebrew names
  public speakCaughtCharacterPrompt(nameEn: string, nameHe?: string, onComplete?: () => void) {
    if (this.isMuted) {
      onComplete?.();
      return;
    }
    const seq = ++this.speechSequenceId;

    const key = nameEn.trim().toLowerCase();
    const cleanKey = key.replace(/['’]/g, '');
    const resolvedHe = nameEn === 'The Snake' ? undefined : (nameHe || HEBREW_COMPANION_NAMES[cleanKey] || HEBREW_COMPANION_NAMES[key]);
    const isHoliday = ['shabbat', 'rosh hashanah', 'yom kippur', 'sukkot', 'simchat torah', 'hanukkah', 'tu bishvat', 'purim', 'passover', 'yom haatzmaut', 'yom ha’atzmaut', 'lag baomer', 'yom yerushalayim', 'shavuot'].includes(cleanKey);

    this.speakHebrew('כָּל הַכָּבוֹד!', 0.9, 1.05, () => {
      if (seq !== this.speechSequenceId || this.isMuted) {
        onComplete?.();
        return;
      }

      const finish = () => {
        if (seq !== this.speechSequenceId || this.isMuted) {
          onComplete?.();
          return;
        }
        // Comfortable natural pause after character celebration before next prompt
        setTimeout(() => {
          onComplete?.();
        }, 500);
      };

      if (isHoliday && resolvedHe && /[\u0590-\u05FF]/.test(resolvedHe)) {
        this.speakHebrew(resolvedHe, 0.9, 1.0, finish);
      } else {
        this.speakEnglish('You caught', 0.95, 1.0, () => {
          if (seq !== this.speechSequenceId || this.isMuted) {
            onComplete?.();
            return;
          }

          if (resolvedHe && /[\u0590-\u05FF]/.test(resolvedHe)) {
            if (resolvedHe.length === 1) {
              this.speakLetter(resolvedHe, 0.9, 1.0, finish);
            } else {
              this.speakHebrew(resolvedHe, 0.9, 1.0, finish);
            }
          } else {
            this.speakEnglish(nameEn, 0.95, 1.0, finish);
          }
        });
      }
    });
  }

  // Speaks companion name ensuring English names (including "Israeli Salad" and "Falafel") always go to English voice
  private speakCompanionName(companionNameEn: string, companionNameHe?: string, companionLetter?: string) {
    if (companionNameEn?.toLowerCase() === 'falafel' || companionNameHe?.toLowerCase() === 'falafel' || (companionNameHe && (companionNameHe.includes('פָּלָ') || companionNameHe === 'פלאפל'))) {
      this.speakEnglish('falafel', 0.95, 1.0);
      return;
    }
    if (companionNameHe && /[\u0590-\u05FF]/.test(companionNameHe)) {
      this.speakHebrew(companionNameHe, 0.9, 1.0);
    } else if (companionLetter) {
      this.speakLetter(companionLetter);
    } else {
      this.speakEnglish(companionNameEn || companionNameHe || '');
    }
  }

  private speakHolidayEncounterPromptInternal(
    holidayNameHe: string,
    companionNameEn: string,
    companionNameHe?: string,
    companionLetter?: string,
    seq?: number
  ) {
    const currentSeq = seq ?? ++this.speechSequenceId;
    this.speakHebrew(holidayNameHe, 0.9, 1.0, () => {
      if (currentSeq !== this.speechSequenceId || this.isMuted) return;
      this.speakEnglish('appeared! Go', 0.95, 1.0, () => {
        if (currentSeq !== this.speechSequenceId || this.isMuted) return;
        this.speakCompanionName(companionNameEn, companionNameHe, companionLetter);
      });
    });
  }

  private speakWildHeroEncounterPromptInternal(
    wildNameEn: string,
    wildNameHe: string,
    companionNameEn: string,
    companionNameHe?: string,
    companionLetter?: string,
    seq?: number
  ) {
    const currentSeq = seq ?? ++this.speechSequenceId;
    const isFalafel = wildNameEn.trim().toLowerCase() === 'falafel';
    const hasHebrew = wildNameHe && /[\u0590-\u05FF]/.test(wildNameHe);
    if (wildNameEn === 'The Snake' || isFalafel || !hasHebrew) {
      this.speakEnglish(`${wildNameEn} appeared! Go`, 0.95, 1.0, () => {
        if (currentSeq !== this.speechSequenceId || this.isMuted) return;
        this.speakCompanionName(companionNameEn, companionNameHe, companionLetter);
      });
    } else {
      this.speakHebrew(wildNameHe, 0.9, 1.0, () => {
        if (currentSeq !== this.speechSequenceId || this.isMuted) return;
        this.speakEnglish('appeared! Go', 0.95, 1.0, () => {
          if (currentSeq !== this.speechSequenceId || this.isMuted) return;
          this.speakCompanionName(companionNameEn, companionNameHe, companionLetter);
        });
      });
    }
  }

  private speakWildKosherFoodEncounterPromptInternal(
    foodNameEn: string,
    foodNameHe: string,
    isChallah: boolean,
    companionNameEn: string,
    companionNameHe?: string,
    companionLetter?: string,
    seq?: number
  ) {
    const currentSeq = seq ?? ++this.speechSequenceId;
    const isFalafel = foodNameEn.trim().toLowerCase() === 'falafel';
    const cleanKey = foodNameEn.trim().toLowerCase().replace(/['’]/g, '');
    const mappedHe = HEBREW_COMPANION_NAMES[cleanKey] || HEBREW_COMPANION_NAMES[foodNameEn.trim().toLowerCase()];
    const resolvedHe = (foodNameHe && /[\u0590-\u05FF]/.test(foodNameHe)) ? foodNameHe : mappedHe;
    const isHebrewVoice = !isFalafel && (isChallah || Boolean(resolvedHe && /[\u0590-\u05FF]/.test(resolvedHe)));

    this.speakEnglish('A wild', 0.95, 1.0, () => {
      if (currentSeq !== this.speechSequenceId || this.isMuted) return;
      if (isHebrewVoice && resolvedHe) {
        this.speakHebrew(resolvedHe, 0.9, 1.0, () => {
          if (currentSeq !== this.speechSequenceId || this.isMuted) return;
          this.speakEnglish('appeared! Go', 0.95, 1.0, () => {
            if (currentSeq !== this.speechSequenceId || this.isMuted) return;
            this.speakCompanionName(companionNameEn, companionNameHe, companionLetter);
          });
        });
      } else {
        this.speakEnglish(`${foodNameEn} appeared! Go`, 0.95, 1.0, () => {
          if (currentSeq !== this.speechSequenceId || this.isMuted) return;
          this.speakCompanionName(companionNameEn, companionNameHe, companionLetter);
        });
      }
    });
  }

  private speakWildEncounterPromptInternal(
    wildLetterChar: string,
    companionNameEn: string,
    companionNameHe?: string,
    companionLetterChar?: string,
    seq?: number
  ) {
    const currentSeq = seq ?? ++this.speechSequenceId;
    this.speakEnglish('A wild', 0.95, 1.0, () => {
      if (currentSeq !== this.speechSequenceId || this.isMuted) return;
      this.speakLetter(wildLetterChar, 0.9, 1.0, () => {
        if (currentSeq !== this.speechSequenceId || this.isMuted) return;
        this.speakEnglish('appeared!', 0.95, 1.0, () => {
          if (currentSeq !== this.speechSequenceId || this.isMuted) return;
          this.speakEnglish('Go', 0.95, 1.0, () => {
            if (currentSeq !== this.speechSequenceId || this.isMuted) return;
            this.speakCompanionName(companionNameEn, companionNameHe, companionLetterChar);
          });
        });
      });
    });
  }

  public speakStationEncounterPrompt(
    stationNameHe: string,
    stationNameEn: string,
    type: 'holiday' | 'kosher_food' | 'hero' | 'letter',
    wildNameEn: string,
    wildNameHe: string,
    isChallah: boolean,
    companionNameEn: string,
    companionNameHe?: string,
    companionLetter?: string,
    wildLetterChar?: string
  ) {
    if (this.isMuted) return;
    const seq = ++this.speechSequenceId;

    this.speakEnglish('Welcome to', 0.95, 1.0, () => {
      if (seq !== this.speechSequenceId || this.isMuted) return;
      this.speakHebrew(stationNameHe, 0.9, 1.0, () => {
        if (seq !== this.speechSequenceId || this.isMuted) return;
        this.speakEnglish('Station.', 0.95, 1.0, () => {
          if (seq !== this.speechSequenceId || this.isMuted) return;
          if (type === 'holiday') {
            this.speakHolidayEncounterPromptInternal(wildNameHe, companionNameEn, companionNameHe, companionLetter, seq);
          } else if (type === 'kosher_food') {
            this.speakWildKosherFoodEncounterPromptInternal(wildNameEn, wildNameHe, isChallah, companionNameEn, companionNameHe, companionLetter, seq);
          } else if (type === 'hero') {
            this.speakWildHeroEncounterPromptInternal(wildNameEn, wildNameHe, companionNameEn, companionNameHe, companionLetter, seq);
          } else {
            this.speakWildEncounterPromptInternal(wildLetterChar || wildNameEn, companionNameEn, companionNameHe, companionLetter, seq);
          }
        });
      });
    });
  }

  // Speaks holiday encounter announcement in Catch mode (NO "wild"):
  // Hebrew name of holiday + "appeared! Go!" + companion
  public speakHolidayEncounterPrompt(
    holidayNameHe: string,
    companionNameEn: string,
    companionNameHe?: string,
    companionLetter?: string
  ) {
    this.speakHolidayEncounterPromptInternal(holidayNameHe, companionNameEn, companionNameHe, companionLetter);
  }

  public speakWildHeroEncounterPrompt(
    wildNameEn: string,
    wildNameHe: string,
    companionNameEn: string,
    companionNameHe?: string,
    companionLetter?: string
  ) {
    this.speakWildHeroEncounterPromptInternal(wildNameEn, wildNameHe, companionNameEn, companionNameHe, companionLetter);
  }

  // Speaks wild encounter announcement in Catch mode for kosher food (e.g. Challah or Falafel):
  // "A wild..." + [Hebrew name for challah or English name for other foods] + "...appeared! Go!..." + companion
  public speakWildKosherFoodEncounterPrompt(
    foodNameEn: string,
    foodNameHe: string,
    isChallah: boolean,
    companionNameEn: string,
    companionNameHe?: string,
    companionLetter?: string
  ) {
    this.speakWildKosherFoodEncounterPromptInternal(foodNameEn, foodNameHe, isChallah, companionNameEn, companionNameHe, companionLetter);
  }

  // Speaks wild encounter announcement in Catch mode with a Hero or Holiday companion:
  // "A wild..." + Hebrew letter + "...appeared! Go!..." + Hero/Holiday Name (spoken in authentic Hebrew)
  public speakWildEncounterPromptWithHero(wildLetterChar: string, heroNameEn: string, heroNameHe?: string) {
    this.speakWildEncounterPromptInternal(wildLetterChar, heroNameEn, heroNameHe);
  }

  // Speaks wild encounter announcement in Catch mode:
  // "A wild..." + Hebrew letter (e.g. 'Alef') + "...appeared! Go!..." + Companion letter
  public speakWildEncounterPrompt(wildLetterChar: string, companionLetterChar?: string) {
    this.speakWildEncounterPromptInternal(wildLetterChar, '', undefined, companionLetterChar);
  }

  // Speaks bilingual level-up celebration for Pop game:
  // "Great job! You found four of the letter..." + Hebrew letter
  public speakPopSuccessPrompt(letterChar: string) {
    if (this.isMuted) return;
    const seq = ++this.speechSequenceId;

    this.speakEnglish('Great job! You found four of the letter', 0.95, 1.0, () => {
      if (seq !== this.speechSequenceId || this.isMuted) return;
      this.speakLetter(letterChar);
    });
  }

  // Speaks bilingual celebration for tracing a letter:
  // "כל הכבוד! you traced the [letter]!"
  public speakTraceSuccessPrompt(letterChar: string) {
    if (this.isMuted) return;
    const seq = ++this.speechSequenceId;

    this.speakHebrew('כָּל הַכָּבוֹד!', 0.9, 1.05, () => {
      if (seq !== this.speechSequenceId || this.isMuted) return;
      this.speakEnglish('you traced the', 0.95, 1.0, () => {
        if (seq !== this.speechSequenceId || this.isMuted) return;
        this.speakLetter(letterChar);
      });
    });
  }

  // Speaks bilingual feedback when an incorrect balloon/butterfly is clicked:
  // "That's [wrong letter]! Look for the letter [target letter]!"
  public speakPopWrongPrompt(wrongLetterChar: string, targetLetterChar: string) {
    if (this.isMuted) return;
    const seq = ++this.speechSequenceId;

    this.speakEnglish("That's", 0.95, 1.0, () => {
      if (seq !== this.speechSequenceId || this.isMuted) return;
      this.speakLetter(wrongLetterChar, 0.9, 1.0, () => {
        if (seq !== this.speechSequenceId || this.isMuted) return;
        this.speakEnglish('Look for the letter', 0.95, 1.0, () => {
          if (seq !== this.speechSequenceId || this.isMuted) return;
          this.speakLetter(targetLetterChar);
        });
      });
    });
  }

  // Pronounce Hebrew letter & word with authentic native Israeli pronunciation, then English translation
  public speakLetterPhonics(
    letterChar: string,
    wordHe: string,
    wordEn: string
  ) {
    if (this.isMuted) return;
    this.playSparkle();

    // Utterance 1: Speaks the raw Hebrew letter character followed by Hebrew word (e.g. "א... ארנבת!")
    // Using the raw letter forces the speech engine to say "Alef... Arnevet!"
    const cleanLetter = letterChar.replace(/[\u0591-\u05BD\u05BF-\u05C7]/g, '').trim().slice(0, 1) || letterChar;
    const spokenLetter = cleanLetter === 'ע' ? 'עַ-יִן' : cleanLetter === 'ץ' ? 'צ סוֹפִית' : cleanLetter;
    const hebrewPhrase = `${spokenLetter}... ${wordHe}!`;
    this.speakHebrew(hebrewPhrase, 0.85, 1.05);

    // Utterance 2: Follows up with English translation if desired
    if (wordEn && this.synth) {
      setTimeout(() => {
        if (this.isMuted || !this.synth) return;
        this.speakEnglish(wordEn, 0.95, 1.0);
      }, 1400);
    }
  }

  // Crisp synthesized sweep/whoosh with gentle paper-crumple texture and sub-tone for Reset Everything
  public playRecycleSweep() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      if (ctx.state === 'suspended' || ctx.state === ('interrupted' as AudioContextState)) {
        ctx.resume().catch(() => {});
      }

      const now = ctx.currentTime;
      const duration = 0.35;

      // 1. White Noise Burst + Bandpass Filter (Sweep)
      const bufferSize = ctx.sampleRate * duration;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;

      const bandpass = ctx.createBiquadFilter();
      bandpass.type = 'bandpass';
      bandpass.Q.setValueAtTime(3.0, now);
      bandpass.frequency.setValueAtTime(2400, now);
      bandpass.frequency.exponentialRampToValueAtTime(350, now + duration);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.001, now);
      noiseGain.gain.linearRampToValueAtTime(0.4, now + 0.02);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      whiteNoise.connect(bandpass);
      bandpass.connect(noiseGain);
      noiseGain.connect(ctx.destination);

      whiteNoise.start(now);
      whiteNoise.stop(now + duration + 0.05);

      // 2. Subtle Sub-Tone (descending sine tone)
      const subDuration = 0.2;
      const subOsc = ctx.createOscillator();
      const subGain = ctx.createGain();

      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(180, now);
      subOsc.frequency.exponentialRampToValueAtTime(60, now + subDuration);

      subGain.gain.setValueAtTime(0.001, now);
      subGain.gain.linearRampToValueAtTime(0.15, now + 0.01);
      subGain.gain.exponentialRampToValueAtTime(0.001, now + subDuration);

      subOsc.connect(subGain);
      subGain.connect(ctx.destination);

      subOsc.start(now);
      subOsc.stop(now + subDuration + 0.05);

      // Clean up nodes after completion
      setTimeout(() => {
        try {
          whiteNoise.disconnect();
          bandpass.disconnect();
          noiseGain.disconnect();
          subOsc.disconnect();
          subGain.disconnect();
        } catch {}
      }, (duration + 0.1) * 1000);
    } catch {
      // Audio fallback
    }
  }
}

export const soundManager = new SoundManager();

/**
 * Robust Text-to-Speech function for Cantor Yakov's Classroom.
 * Prevents Chrome freeze, handles cancel queue, and retains active references in window.__activeUtterances.
 */
let lastGlobalSpokenText = '';
export function speakText(text: string, lang = 'he-IL', rate = 0.9, onComplete?: () => void) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    console.warn('Speech synthesis not supported in this browser.');
    onComplete?.();
    return;
  }

  try {
    window.speechSynthesis.resume();
    const synthInst = window.speechSynthesis;
    if (synthInst.speaking || synthInst.pending) {
      if (text !== lastGlobalSpokenText) {
        // synthInst.cancel();
      }
    }
    lastGlobalSpokenText = text;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = rate;

    activeUtterances.add(utterance);

    // 1. Global registry to protect utterances from Chrome's garbage collector
    if (!window.__activeUtterances) {
      window.__activeUtterances = [];
    }
    window.__activeUtterances.push(utterance);

    let hasFinished = false;
    const finish = () => {
      if (hasFinished) return;
      hasFinished = true;
      activeUtterances.delete(utterance);
      if (window.__activeUtterances) {
        const idx = window.__activeUtterances.indexOf(utterance);
        if (idx !== -1) {
          window.__activeUtterances.splice(idx, 1);
        }
      }
      onComplete?.();
    };

    utterance.onend = finish;
    utterance.onerror = finish;

    const voices = window.speechSynthesis.getVoices();
    if (lang.startsWith('he')) {
      const voice = voices.find((v) => {
        const l = v.lang.toLowerCase();
        const n = v.name.toLowerCase();
        return l.startsWith('he') || l.startsWith('iw') || n.includes('עברית') || n.includes('hebrew');
      });
      if (voice) utterance.voice = voice;
    } else {
      const voice = voices.find((v) => v.lang.startsWith('en'));
      if (voice) utterance.voice = voice;
    }

    window.speechSynthesis.speak(utterance);
    window.speechSynthesis.resume();

    setTimeout(() => {
      if (!hasFinished) finish();
    }, 10000);
  } catch (err) {
    console.warn('Speech synthesis error:', err);
    onComplete?.();
  }
}

if (typeof window !== 'undefined') {
  window.speakText = speakText;
}
