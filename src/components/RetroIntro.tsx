import React, { useEffect, useCallback, useState, useRef } from 'react';
import { ALEFBET_LETTERS } from '../data/alefbet';
import { AlefBallIcon } from './AlefBallIcon';
import {
  playIntroSequence,
  playTitleFanfare,
  stopAllAudio,
  unlockAudio,
} from '../utils/chiptuneAudio';

interface RetroIntroProps {
  onComplete: () => void;
}

const MAIN_22_LETTERS = ALEFBET_LETTERS.filter(
  (l) =>
    !['ך', 'ם', 'ן', 'ף', 'ץ', 'kaf-sofit', 'mem-sofit', 'nun-sofit', 'pe-sofit', 'tzadi-sofit'].includes(l.letter) &&
    !['kaf-sofit', 'mem-sofit', 'nun-sofit', 'pe-sofit', 'tzadi-sofit'].includes(l.id)
);

// Canonical color scheme helper returning hex colors directly for the letter glyphs
const getCanonicalLetterColor = (letterChar: string): string => {
  switch (letterChar) {
    case 'א':
    case 'ח':
    case 'ס':
    case 'ת':
      return '#ef4444'; // Red
    case 'ב':
    case 'ט':
    case 'ע':
      return '#f97316'; // Orange
    case 'ג':
    case 'י':
    case 'פ':
      return '#eab308'; // Yellow
    case 'ד':
    case 'כ':
    case 'צ':
      return '#22c55e'; // Green
    case 'ה':
    case 'ל':
    case 'ק':
      return '#3b82f6'; // Blue
    case 'ו':
    case 'מ':
    case 'ר':
      return '#a855f7'; // Purple
    case 'ז':
    case 'נ':
    case 'ש':
      return '#ec4899'; // Pink
    default:
      return '#e2e8f0'; // Fallback Slate
  }
};

export const RetroIntro: React.FC<RetroIntroProps> = ({ onComplete }) => {
  const isFinishedRef = useRef(false);
  const canExitRef = useRef(false);

  const handleFinish = useCallback(() => {
    if (!canExitRef.current || isFinishedRef.current) return;
    isFinishedRef.current = true;
    stopAllAudio();
    onComplete();
  }, [onComplete]);

  // 1. Pick 2 different random letters from the 22 core letters
  const [fgLetter] = useState(() => {
    const fg = MAIN_22_LETTERS[Math.floor(Math.random() * MAIN_22_LETTERS.length)];
    return fg || ALEFBET_LETTERS[0];
  });

  const [bgLetter] = useState(() => {
    const filtered = MAIN_22_LETTERS.filter((l) => l.id !== fgLetter.id);
    const bg = filtered[Math.floor(Math.random() * filtered.length)];
    return bg || ALEFBET_LETTERS[1];
  });

  // 2. Pick a pure visual attack asset (emoji or image) from ALL available words (primary + secondary) - NO TEXT
  const [attackAsset] = useState(() => {
    const assets: { emoji?: string; image?: string }[] = [];
    if (fgLetter.primaryWord?.emoji || fgLetter.primaryWord?.image) {
      assets.push({
        emoji: fgLetter.primaryWord.emoji,
        image: fgLetter.primaryWord.image,
      });
    }
    fgLetter.secondaryWords?.forEach((w) => {
      if (w.emoji || w.image) {
        assets.push({ emoji: w.emoji, image: w.image });
      }
    });

    if (assets.length > 0) {
      return assets[Math.floor(Math.random() * assets.length)];
    }
    return { emoji: '✨' };
  });

  // 3. Random letter cycler for title screen phase
  const [cyclingLetter, setCyclingLetter] = useState(() => fgLetter.letter);

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    unlockAudio().catch(() => {});
    
    // Start GB battle chiptune music
    playIntroSequence();

    // Lock exit for the first 1.5 seconds so initial click doesn't instantly skip
    const lockTimer = window.setTimeout(() => {
      canExitRef.current = true;
    }, 1500);

    // Sound transition: Title fanfare starts right as the whiteout fade completes and title reveals (~14.4 seconds)
    const titleMusicTimer = window.setTimeout(() => {
      if (!isFinishedRef.current) {
        stopAllAudio();
        playTitleFanfare();
      }
    }, 14400);

    // Title screen background letter cycler (every 250ms)
    const cycleInterval = window.setInterval(() => {
      const randIndex = Math.floor(Math.random() * MAIN_22_LETTERS.length);
      setCyclingLetter(MAIN_22_LETTERS[randIndex].letter);
    }, 250);

    // Listen for user click/tap or keypress to exit title screen
    const handleUserInteraction = () => {
      handleFinish();
    };

    window.addEventListener('click', handleUserInteraction);
    window.addEventListener('keydown', handleUserInteraction);

    return () => {
      document.body.style.overflow = originalOverflow;
      clearTimeout(lockTimer);
      clearTimeout(titleMusicTimer);
      clearInterval(cycleInterval);
      window.removeEventListener('click', handleUserInteraction);
      window.removeEventListener('keydown', handleUserInteraction);
      stopAllAudio();
    };
  }, [handleFinish]);

  const fgColorHex = getCanonicalLetterColor(fgLetter.letter);
  const bgColorHex = getCanonicalLetterColor(bgLetter.letter);
  const cyclingColorHex = getCanonicalLetterColor(cyclingLetter);

  return (
    <div
      className="fixed inset-0 z-[9999] bg-white text-black select-none overflow-hidden flex flex-col items-center justify-center cursor-pointer"
      style={{
        fontFamily: "'Press Start 2P', monospace, ui-monospace, sans-serif",
        height: '100dvh',
        width: '100vw',
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');

        /* -------------------------------------------------------------------------
           EXACT TIMELINE (60 FPS, Total Intro Duration = ~14.4s):
           - White Screen: 60 frames (0.0s - 1.0s)
           - Copyright Screen: 180 frames (1.0s - 4.0s)
           - Battle Slide In: 72 frames (4.00s - 5.20s)
           - Background Hops: 127 frames (5.20s - 7.32s)
           - Foreground Attack: 127 frames (7.32s - 9.43s)
           - Damage Stun Wait: 23 frames (9.43s - 9.81s)
           - Background Bounces: 74 frames (9.81s - 11.05s)
           - Face Jump: 24 frames (11.05s - 11.45s)
           - Fade to White + White Hold: 171 frames (11.45s - 14.40s)
           - Title Reveal: 14.40s+ (Persistent Hold until clicked)
        ------------------------------------------------------------------------- */

        /* 1. White Screen (0 - 60 frames) */
        /* 2. Copyright Screen (60 - 240 frames) */
        @keyframes copyrightFade {
          0%, 6.9% { opacity: 0; visibility: hidden; }
          7.0%, 27.7% { opacity: 1; visibility: visible; }
          27.8%, 100% { opacity: 0; visibility: hidden; }
        }

        /* 3. Battle Screen Container */
        @keyframes battleContainerFade {
          0%, 27.7% { opacity: 0; visibility: hidden; }
          27.8%, 79.4% { opacity: 1; visibility: visible; }
          79.5%, 100% { opacity: 0; visibility: hidden; }
        }

        /* Foreground Slide In (72 frames: 4.00s to 5.20s) */
        @keyframes fgSlideIn {
          0%, 27.7% { transform: translateX(100vw); }
          32.8% { transform: translateX(0); }
          100% { transform: translateX(0); }
        }

        /* Background Slide In (72 frames: 4.00s to 5.20s) */
        @keyframes bgSlideIn {
          0%, 27.7% { transform: translateX(-100vw); }
          32.8% { transform: translateX(0); }
          100% { transform: translateX(0); }
        }

        /* Background Routine: Hops -> Stun -> Bounces -> Face Jump */
        @keyframes bgBattleRoutine {
          0%, 32.8% { transform: translate(0, 0) scale(1); }
          /* 127 frames of hops */
          35% { transform: translate(15px, -18px) scale(1); }
          37.5% { transform: translate(0, 0) scale(1); }
          40% { transform: translate(-15px, -18px) scale(1); }
          42.5% { transform: translate(0, 0) scale(1); }
          45% { transform: translate(15px, -18px) scale(1); }
          48% { transform: translate(0, 0) scale(1); }
          
          /* ATTACH LANDS */
          /* 23 frames damage stun / pause in pain */
          50.6%, 52.2% { transform: translate(0, 0) scale(1); filter: brightness(2.5) sepia(1) hue-rotate(-50deg); }
          
          /* 74 frames left/right bounces */
          54% { transform: translate(-25px, -10px) scale(1); filter: brightness(1); }
          57% { transform: translate(0, 0) scale(1); }
          60% { transform: translate(25px, -10px) scale(1); }
          62.3% { transform: translate(0, 0) scale(1); }
          
          /* 24 frames face jump - controlled perspective scale */
          62.4% { transform: translate(0, 0) scale(1); }
          69.4% { transform: translate(-42vw, 10vh) scale(1.15) rotate(-8deg); }
          100% { transform: translate(-42vw, 10vh) scale(1.15) rotate(-8deg); }
        }

        /* FG Letter Attack Routine */
        @keyframes fgAttackRoutine {
          0%, 50.5% { transform: translate(0, 0); }
          53% { transform: translate(-20px, 10px); }
          56% { transform: translate(30px, -15px); }
          60% { transform: translate(0, 0); }
          100% { transform: translate(0, 0); }
        }

        /* Vocabulary Projectile Arc */
        @keyframes vocabAttackFly {
          0%, 50.5% { opacity: 0; transform: translate(0, 0) scale(0.5); }
          51% { opacity: 1; transform: translate(0, 0) scale(1); }
          59% { opacity: 1; transform: translate(52vw, -25vh) scale(1.3); }
          60.5% { opacity: 0; transform: translate(55vw, -27vh) scale(1.8); }
          100% { opacity: 0; }
        }

        /* 4. Slow Fade to White Overlay (z-40) */
        @keyframes whiteoutFade {
          0%, 71.4% { opacity: 0; visibility: hidden; }
          71.5% { opacity: 0; visibility: visible; }
          79.4% { opacity: 1; visibility: visible; }
          79.5%, 100% { opacity: 0; visibility: hidden; }
        }

        /* 5. Title Screen Phase (z-50: Appears above whiteout at 79.5% and holds) */
        @keyframes titleScreenFade {
          0%, 79.4% { opacity: 0; visibility: hidden; }
          79.5%, 100% { opacity: 1; visibility: visible; }
        }

        /* Catch & Train Logo Keynote Drop & Small Bounce */
        @keyframes logoKeynoteDrop {
          0%, 79.4% { transform: translateY(-100vh); opacity: 0; }
          82% { transform: translateY(0); opacity: 1; }
          83.5% { transform: translateY(-12px); opacity: 1; }
          85% { transform: translateY(0); opacity: 1; }
          100% { transform: translateY(0); opacity: 1; }
        }

        /* AlefBall Gentle Idle Bounce */
        @keyframes ballBounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }

        .anim-copyright { animation: copyrightFade 14.4s linear forwards; }
        .anim-battle-container { animation: battleContainerFade 14.4s linear forwards; }
        .anim-fg-slide { animation: fgSlideIn 14.4s linear forwards; }
        .anim-bg-slide { animation: bgSlideIn 14.4s linear forwards; }
        .anim-bg-routine { animation: bgBattleRoutine 14.4s linear forwards; }
        .anim-fg-attack { animation: fgAttackRoutine 14.4s linear forwards; }
        .anim-vocab-fly { animation: vocabAttackFly 14.4s linear forwards; }
        .anim-whiteout { animation: whiteoutFade 14.4s linear forwards; }
        .anim-title-phase { animation: titleScreenFade 14.4s linear forwards; }
        .anim-logo-drop { animation: logoKeynoteDrop 14.4s cubic-bezier(0.22, 1, 0.36, 1) forwards; }
        .anim-ball-idle { animation: ballBounce 1.2s ease-in-out infinite; }
      `}</style>

      {/* ---------------- PHASE 1: Copyright Screen (z-30) ---------------- */}
      <div className="absolute inset-0 bg-white z-30 flex items-center justify-center anim-copyright">
        <p className="text-black text-sm sm:text-base tracking-widest text-center">
          © Cantor Yakov
        </p>
      </div>

      {/* ---------------- PHASE 2: Battle Sequence (z-20) ---------------- */}
      <div className="absolute inset-0 bg-black z-20 flex flex-col items-center justify-between anim-battle-container">
        {/* Top Black Bar */}
        <div className="w-full flex-1 bg-black" />

        {/* 2:1 Widescreen White Battle Arena */}
        <div className="relative w-full aspect-[2/1] bg-white border-y-4 border-black overflow-hidden shrink-0 flex items-center justify-between">
          
          {/* Background Letter (Nidorino Position ~85% right) */}
          <div className="absolute top-[18%] right-[12%] z-10 anim-bg-slide">
            <div className="anim-bg-routine">
              <span
                className="font-bold select-none leading-none inline-block drop-shadow-[4px_4px_0_#000000]"
                style={{
                  fontSize: '96px',
                  fontFamily: "'Akoderf', 'Press Start 2P', sans-serif",
                  color: bgColorHex,
                }}
              >
                {bgLetter.letter}
              </span>
            </div>
          </div>

          {/* Pure Visual Attack Asset (Circular Badge, NO TEXT) */}
          <div className="absolute bottom-[18%] left-[12%] z-30 pointer-events-none anim-vocab-fly">
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-white border-4 border-black rounded-full shadow-2xl flex items-center justify-center overflow-hidden">
              {attackAsset.image ? (
                <img
                  src={attackAsset.image}
                  alt="Attack Asset"
                  className="w-8 h-8 sm:w-10 sm:h-10 object-contain"
                />
              ) : (
                <span className="text-2xl sm:text-3xl leading-none">
                  {attackAsset.emoji || '✨'}
                </span>
              )}
            </div>
          </div>

          {/* Foreground Letter (Gengar Position ~10% left) */}
          <div className="absolute bottom-[10%] left-[10%] z-20 anim-fg-slide">
            <div className="anim-fg-attack">
              <span
                className="font-bold select-none leading-none inline-block drop-shadow-[5px_5px_0_#000000]"
                style={{
                  fontSize: '125px',
                  fontFamily: "'Akoderf', 'Press Start 2P', sans-serif",
                  color: fgColorHex,
                }}
              >
                {fgLetter.letter}
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Black Bar */}
        <div className="w-full flex-1 bg-black" />
      </div>

      {/* ---------------- SLOW FADE TO WHITE OVERLAY (z-40) ---------------- */}
      <div className="absolute inset-0 bg-white z-40 pointer-events-none anim-whiteout" />

      {/* ---------------- PHASE 3: Title Screen Reveal (z-50) ---------------- */}
      <div className="absolute inset-0 bg-white z-50 flex flex-col items-center justify-between py-8 px-4 anim-title-phase">
        {/* Top Spacing / Catch & Train Logo */}
        <div className="pt-6 flex flex-col items-center">
          <img
            src="/catch-and-train-logo.webp"
            alt="Catch and Train Logo"
            className="w-72 sm:w-96 max-w-full object-contain anim-logo-drop"
          />
        </div>

        {/* Center: Alefball (Right) & Random Letter Cycler (Left - NO BOX) */}
        <div className="flex items-center justify-center gap-8 sm:gap-12 my-auto">
          {/* Cycling Core Hebrew Letters (Canonical Colored Glyph directly with NO BOX) */}
          <div className="w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center">
            <span
              className="text-6xl sm:text-7xl font-bold transition-all duration-200 drop-shadow-[4px_4px_0_#000000]"
              style={{
                fontFamily: "'Akoderf', 'Press Start 2P', sans-serif",
                color: cyclingColorHex,
              }}
            >
              {cyclingLetter}
            </span>
          </div>

          {/* Bouncing AlefBall Icon */}
          <div className="anim-ball-idle">
            <AlefBallIcon className="w-20 h-20 sm:w-24 sm:h-24 drop-shadow-md" />
          </div>
        </div>

        {/* Bottom Copyright Notice */}
        <div className="pb-4 text-center">
          <p className="text-black text-xs sm:text-sm tracking-widest font-bold">
            © Cantor Yakov
          </p>
        </div>
      </div>
    </div>
  );
};

export default RetroIntro;