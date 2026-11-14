import React, { useState, useEffect, useRef } from 'react';
import { Volume2, RotateCcw, Star } from 'lucide-react';
import { LetterData } from '../types';
import { soundManager } from '../utils/audio';
import { fireCelebrationConfetti } from '../utils/confetti';
import { LetterDrillSelector } from './LetterDrillSelector';

interface BalloonPopperProps {
  letters: LetterData[];
  score: number;
  onUpdateScore: (updater: number | ((prev: number) => number)) => void;
  selectedLetterIds: Set<string>;
  onUpdateSelectedLetterIds: (updater: Set<string> | ((prev: Set<string>) => Set<string>)) => void;
  selectedStyles?: Set<PopperTheme>;
  onUpdateSelectedStyles?: (updater: Set<PopperTheme> | ((prev: Set<PopperTheme>) => Set<PopperTheme>)) => void;
}

export type PopperTheme = 'balloons' | 'butterflies' | 'cars' | 'invasion';

interface FlyItem {
  id: number;
  letter: LetterData;
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  speed: number;
  color: string;
  size: number;
  flutterOffset: number;
  isPopping: boolean;
}


export const POP_BACKGROUNDS = [
  'https://i.imgur.com/jF5nEPw.jpeg',
  'https://i.imgur.com/BFwEPzH.jpeg',
  'https://i.imgur.com/Rnr4suq.jpeg',
  'https://i.imgur.com/nwHxcEq.jpeg',
];

export const INVASION_BACKGROUNDS = [
  'https://i.imgur.com/OV3vPbu.jpeg',
];

// 4 distinct horizontal lanes distributed evenly from top to bottom
const CAR_LANES = [22, 42, 62, 82];

// 5 distinct horizontal flight corridors for butterflies to prevent overlap
const BUTTERFLY_LANES = [16, 31, 46, 61, 76];

// 6 distinct vertical flight columns for invading aliens to fly down from top to bottom
const INVASION_COLUMNS = [14, 28, 44, 60, 76, 88];

export const BalloonPopper: React.FC<BalloonPopperProps> = ({
  letters,
  score,
  onUpdateScore,
  selectedLetterIds,
  onUpdateSelectedLetterIds,
  selectedStyles,
  onUpdateSelectedStyles,
}) => {
  const [localStyles, setLocalStyles] = useState<Set<PopperTheme>>(
    () => new Set<PopperTheme>(['balloons', 'butterflies', 'cars', 'invasion'])
  );
  const activeStyles = selectedStyles ?? localStyles;
  const updateStyles = onUpdateSelectedStyles ?? setLocalStyles;

  const activeStylesRef = useRef<Set<PopperTheme>>(activeStyles);
  activeStylesRef.current = activeStyles;

  const [targetLetter, setTargetLetter] = useState<LetterData>(letters[0]);
  const [gameTheme, setGameTheme] = useState<PopperTheme>(() => {
    const list = Array.from(activeStyles);
    return list.length > 0 ? list[0] : 'balloons';
  });
  const [backgroundUrl, setBackgroundUrl] = useState<string>(() => {
    const list = Array.from(activeStyles);
    const initialTheme = list.length > 0 ? list[0] : 'balloons';
    const bgPool = initialTheme === 'invasion' ? INVASION_BACKGROUNDS : POP_BACKGROUNDS;
    return bgPool[Math.floor(Math.random() * bgPool.length)];
  });
  const [items, setItems] = useState<FlyItem[]>([]);
  const [roundPoints, setRoundPoints] = useState<number>(0);
  const [scoreShake, setScoreShake] = useState(false);
  const [dollarPop, setDollarPop] = useState(false);

  const nextItemId = useRef<number>(1);
  const animFrameRef = useRef<number | null>(null);
  const poppedItemIds = useRef<Set<number>>(new Set());
  const tickRef = useRef<number>(0);

  const targetLetterRef = useRef<LetterData>(targetLetter);
  targetLetterRef.current = targetLetter;

  const gameThemeRef = useRef<PopperTheme>(gameTheme);
  gameThemeRef.current = gameTheme;

  const selectedLetterIdsRef = useRef<Set<string>>(selectedLetterIds);
  selectedLetterIdsRef.current = selectedLetterIds;

  const vibrantColors = [
    '#EF4444', // Red
    '#F59E0B', // Amber
    '#10B981', // Emerald
    '#3B82F6', // Blue
    '#8B5CF6', // Purple
    '#EC4899', // Pink
    '#06B6D4', // Cyan
  ];

  const styleBucketRef = useRef<PopperTheme[]>([]);

  const getNextThemeFromBucket = (stylesSet: Set<PopperTheme>): PopperTheme => {
    const list = Array.from(stylesSet);
    if (list.length === 0) return 'balloons';
    if (styleBucketRef.current.length === 0) {
      styleBucketRef.current = [...list].sort(() => 0.5 - Math.random());
    }
    let next = styleBucketRef.current.pop();
    if (!next || !stylesSet.has(next)) {
      styleBucketRef.current = [...list].sort(() => 0.5 - Math.random());
      next = styleBucketRef.current.pop() || list[0];
    }
    return next;
  };

  const pickNewTarget = (
    forcedTheme?: PopperTheme,
    customActiveIds?: Set<string>,
    customActiveStyles?: Set<PopperTheme>
  ) => {
    const activeSet = customActiveIds ?? selectedLetterIdsRef.current;
    const activeLetters = letters.filter((l) => activeSet.has(l.id));

    if (activeLetters.length === 0) {
      setItems([]);
      return;
    }

    // Pick distinct random letter from available active letters
    const currentId = targetLetterRef.current?.id;
    const otherLetters = activeLetters.filter((l) => l.id !== currentId);
    const pool = otherLetters.length > 0 ? otherLetters : activeLetters;
    const randLetter = pool[Math.floor(Math.random() * pool.length)];

    // Randomize among enabled/selected game styles using bucket rule (no replacement until bucket is empty)
    const stylesSet = customActiveStyles ?? activeStylesRef.current;
    const availableThemes: PopperTheme[] = Array.from(stylesSet);

    const nextTheme = forcedTheme && availableThemes.includes(forcedTheme)
      ? forcedTheme
      : getNextThemeFromBucket(stylesSet);

    setTargetLetter(randLetter);
    setGameTheme(nextTheme);
    const bgPool = nextTheme === 'invasion' ? INVASION_BACKGROUNDS : POP_BACKGROUNDS;
    setBackgroundUrl(bgPool[Math.floor(Math.random() * bgPool.length)]);
    setRoundPoints(0);
    poppedItemIds.current.clear();
    setItems([]);

    soundManager.playSparkle();
    soundManager.speakPopMissionPrompt(nextTheme, randLetter.letter);
  };

  const handleToggleStyle = (style: PopperTheme) => {
    soundManager.playPop();
    const next = new Set(activeStyles);
    if (next.has(style)) {
      // Keep at least one style active
      if (next.size > 1) {
        next.delete(style);
      }
    } else {
      next.add(style);
    }
    updateStyles(next);
    activeStylesRef.current = next;

    // If current theme was just turned off, switch immediately to one of the newly active themes
    if (!next.has(gameThemeRef.current)) {
      const remaining = Array.from(next);
      const newTheme = remaining[Math.floor(Math.random() * remaining.length)];
      pickNewTarget(newTheme, selectedLetterIds, next);
    }
  };

  const handleToggleLetter = (id: string) => {
    const next = new Set(selectedLetterIds);
    const isEnabling = !next.has(id);
    const letterObj = letters.find((l) => l.id === id);

    if (isEnabling) {
      if (letterObj) {
        soundManager.speakLetter(letterObj.letter);
      } else {
        soundManager.playPop();
      }
      next.add(id);
    } else {
      soundManager.playPop();
      next.delete(id);
    }
    onUpdateSelectedLetterIds(next);
    selectedLetterIdsRef.current = next;

    // Reset the game:
    onUpdateScore(0);
    setRoundPoints(0);
    setItems([]);

    const activeLetters = letters.filter((l) => next.has(l.id));
    if (activeLetters.length === 0) {
      setItems([]);
    } else {
      pickNewTarget(undefined, next, activeStyles);
    }
  };

  const handleSelectAll = () => {
    soundManager.playPop();
    const coreSet = new Set(letters.filter((l) => !l.id.startsWith('sofit_')).map((l) => l.id));
    onUpdateSelectedLetterIds(coreSet);
    selectedLetterIdsRef.current = coreSet;
    if (!targetLetterRef.current || !coreSet.has(targetLetterRef.current.id)) {
      pickNewTarget(gameThemeRef.current, coreSet);
    }
  };

  const handleSelectNone = () => {
    soundManager.playPop();
    const emptySet = new Set<string>();
    onUpdateSelectedLetterIds(emptySet);
    selectedLetterIdsRef.current = emptySet;
    setItems([]);
  };

  useEffect(() => {
    if (selectedLetterIds.size > 0) {
      pickNewTarget(undefined, selectedLetterIds, activeStyles);
    } else {
      setItems([]);
    }
  }, []);

  useEffect(() => {
    let spawnCounter = 0;

    const tick = () => {
      tickRef.current++;
      spawnCounter++;

      const isCurrentButterflies = gameThemeRef.current === 'butterflies';
      const isCurrentCars = gameThemeRef.current === 'cars';
      const isCurrentInvasion = gameThemeRef.current === 'invasion';
      const activeSet = selectedLetterIdsRef.current;
      const activeLetters = letters.filter((l) => activeSet.has(l.id));

      // Spawn interval (~75-80 frames)
      if (spawnCounter % 75 === 0 && activeLetters.length > 0) {
        setItems((prev) => {
          if (prev.length < 9) {
            const isTarget = Math.random() < 0.45;
            let letter: LetterData;

            if (isTarget && targetLetterRef.current && activeSet.has(targetLetterRef.current.id)) {
              letter = targetLetterRef.current;
            } else {
              // Pick a distractor (prefer other active letters; fill from alphabet if needed)
              const otherActive = activeLetters.filter((l) => l.id !== targetLetterRef.current?.id);
              if (otherActive.length > 0) {
                letter = otherActive[Math.floor(Math.random() * otherActive.length)];
              } else {
                const otherAll = letters.filter((l) => l.id !== targetLetterRef.current?.id);
                letter = otherAll[Math.floor(Math.random() * otherAll.length)] || activeLetters[0];
              }
            }
            
            // Cars: Right to Left; Butterflies: Left to Right; Invasion: Top to Bottom; Balloons: Bottom to Top.
            let spawnX: number;
            let spawnY: number;
            if (isCurrentCars) {
              const freeLanes = CAR_LANES.filter(
                (lane) => !prev.some((it) => Math.abs(it.baseY - lane) < 5 && it.x > 75)
              );
              spawnY = freeLanes.length > 0
                ? freeLanes[Math.floor(Math.random() * freeLanes.length)]
                : CAR_LANES[Math.floor(Math.random() * CAR_LANES.length)];
              spawnX = 112;
            } else if (isCurrentButterflies) {
              const freeLanes = BUTTERFLY_LANES.filter(
                (lane) => !prev.some((it) => Math.abs(it.baseY - lane) < 9 && it.x < 28)
              );
              spawnY = freeLanes.length > 0
                ? freeLanes[Math.floor(Math.random() * freeLanes.length)]
                : BUTTERFLY_LANES[Math.floor(Math.random() * BUTTERFLY_LANES.length)];
              spawnX = -12;
            } else if (isCurrentInvasion) {
              const freeCols = INVASION_COLUMNS.filter(
                (col) => !prev.some((it) => Math.abs(it.baseX - col) < 10 && it.y < 24)
              );
              spawnX = freeCols.length > 0
                ? freeCols[Math.floor(Math.random() * freeCols.length)]
                : INVASION_COLUMNS[Math.floor(Math.random() * INVASION_COLUMNS.length)];
              spawnY = -14;
            } else {
              spawnY = 108;
              spawnX = 10 + Math.random() * 80;
            }

            return [
              ...prev,
              {
                id: nextItemId.current++,
                letter,
                x: spawnX,
                y: spawnY,
                baseX: spawnX,
                baseY: spawnY,
                speed: isCurrentCars
                  ? 0.18 + Math.random() * 0.12
                  : isCurrentButterflies
                  ? (typeof window !== 'undefined' && window.innerWidth >= 768
                      ? 0.15 + Math.random() * 0.08
                      : 0.22 + Math.random() * 0.08)
                  : isCurrentInvasion
                  ? (typeof window !== 'undefined' && window.innerWidth >= 768
                      ? 0.17 + Math.random() * 0.10
                      : 0.22 + Math.random() * 0.08)
                  : 0.20 + Math.random() * 0.16,
                color: vibrantColors[Math.floor(Math.random() * vibrantColors.length)],
                size: isCurrentCars
                  ? 116 + Math.random() * 22
                  : isCurrentButterflies
                  ? 104 + Math.random() * 20
                  : isCurrentInvasion
                  ? 110 + Math.random() * 18
                  : 124 + Math.random() * 24,
                flutterOffset: Math.random() * 100,
                isPopping: false,
              },
            ];
          }
          return prev;
        });
      }

      // Update positions
      setItems((prev) => {
        const next: FlyItem[] = [];
        let targetEscaped = false;

        for (const item of prev) {
          if (isCurrentCars) {
            // CARS MODE: Drive straight from RIGHT to LEFT across the screen along their road lane
            const nextX = item.x - item.speed;
            const nextY = item.baseY;

            if (nextX <= -14) {
              if (item.letter.id === targetLetterRef.current.id && !poppedItemIds.current.has(item.id)) {
                targetEscaped = true;
              }
            } else {
              next.push({
                ...item,
                x: nextX,
                y: nextY,
              });
            }
          } else if (isCurrentButterflies) {
            // BUTTERFLY MODE: Fly from LEFT to RIGHT across the screen with gentle vertical flutter
            const nextX = item.x + item.speed;
            const wave = Math.sin((tickRef.current + item.flutterOffset) * 0.05) * 3;
            const nextY = Math.max(10, Math.min(88, item.baseY + wave));

            if (nextX >= 112) {
              if (item.letter.id === targetLetterRef.current.id && !poppedItemIds.current.has(item.id)) {
                targetEscaped = true;
              }
            } else {
              next.push({
                ...item,
                x: nextX,
                y: nextY,
              });
            }
          } else if (isCurrentInvasion) {
            // INVASION MODE: Invading UFO aliens fly straight down from TOP to BOTTOM
            const nextY = item.y + item.speed;
            const nextX = item.baseX;

            if (nextY >= 114) {
              if (item.letter.id === targetLetterRef.current.id && !poppedItemIds.current.has(item.id)) {
                targetEscaped = true;
              }
            } else {
              next.push({
                ...item,
                x: nextX,
                y: nextY,
              });
            }
          } else {
            // BALLOONS MODE: Rise upwards from bottom to top
            const nextY = item.y - item.speed;
            const nextX = item.x;

            if (nextY <= -22) {
              if (item.letter.id === targetLetterRef.current.id && !poppedItemIds.current.has(item.id)) {
                targetEscaped = true;
              }
            } else {
              next.push({
                ...item,
                x: nextX,
                y: nextY,
              });
            }
          }
        }

        if (targetEscaped) {
          soundManager.playGentleBoing();
          setScoreShake(true);
          setTimeout(() => setScoreShake(false), 500);
          setRoundPoints((r) => Math.max(0, r - 1));
        }

        return next;
      });

      animFrameRef.current = requestAnimationFrame(tick);
    };

    animFrameRef.current = requestAnimationFrame(tick);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [letters]);

  const handlePopItem = (item: FlyItem) => {
    if (poppedItemIds.current.has(item.id) || item.isPopping) return;
    poppedItemIds.current.add(item.id);

    if (gameThemeRef.current === 'invasion') {
      soundManager.playLaserZap();
    } else {
      soundManager.playPop();
    }

    if (item.letter.id === targetLetter.id) {
      soundManager.playSparkle();
      soundManager.speakLetter(targetLetter.letter);
      const nextRound = roundPoints + 1;
      setRoundPoints(nextRound);

      // Remove from active floating items
      setItems((prev) => prev.filter((i) => i.id !== item.id));

      // Automatically earn 1 dollar & change target letter & style after 4 correct points!
      if (nextRound >= 4) {
        soundManager.playCoinClink();
        onUpdateScore((s) => s + 1); // Get ONE dollar!
        setDollarPop(true);
        setTimeout(() => setDollarPop(false), 1200);
        setRoundPoints(0);
        fireCelebrationConfetti(item.x / 100, item.y / 100);
        setTimeout(() => {
          pickNewTarget();
        }, 800);
      }
    } else {
      soundManager.playGentleBoing();
      soundManager.speakPopWrongPrompt(item.letter.letter, targetLetter.letter);
      setScoreShake(true);
      setTimeout(() => setScoreShake(false), 500);
      setRoundPoints((r) => Math.max(0, r - 1));

      setTimeout(() => {
        poppedItemIds.current.delete(item.id);
      }, 600);

      // Jolt item slightly on wrong click
      setItems((prev) =>
        prev.map((i) =>
          i.id === item.id
            ? {
                ...i,
                x: gameThemeRef.current === 'butterflies'
                  ? Math.max(2, i.x - 4)
                  : gameThemeRef.current === 'cars'
                  ? Math.min(96, i.x + 4)
                  : Math.max(6, Math.min(94, i.x + (Math.random() - 0.5) * 8)),
                y: gameThemeRef.current === 'cars'
                  ? i.baseY
                  : gameThemeRef.current === 'invasion'
                  ? Math.max(-6, i.y - 4)
                  : Math.max(10, Math.min(90, i.y + (Math.random() - 0.5) * 6)),
              }
            : i
        )
      );
    }
  };

  const isButterflies = gameTheme === 'butterflies';
  const isCars = gameTheme === 'cars';
  const isCurrentInvasion = gameTheme === 'invasion';

  return (
    <div className="max-w-5xl xl:max-w-6xl 2xl:max-w-7xl mx-auto px-3 sm:px-4 py-2 sm:py-3 space-y-3 sm:space-y-3.5">
      {/* 22 Hebrew Letters Drill Selector Tray (2x11) */}
      <LetterDrillSelector
        letters={letters}
        selectedLetterIds={selectedLetterIds}
        onToggleLetter={handleToggleLetter}
        onSelectAll={handleSelectAll}
        onSelectNone={handleSelectNone}
      />

      {/* Game Style Selector Bar (below drill letters box, multi-selectable) */}
      <div className="bg-white rounded-2xl sm:rounded-3xl px-3 py-2 sm:px-4 sm:py-2.5 border border-amber-200/80 shadow-xs flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-bold text-slate-700">Game Styles:</span>
        <div className="flex flex-wrap items-center bg-slate-100/90 p-1 rounded-2xl border border-slate-200/90 shadow-2xs text-xs font-bold gap-1">
          <button
            type="button"
            onClick={() => handleToggleStyle('balloons')}
            className={`px-3 py-1.5 rounded-xl transition-colors cursor-pointer select-none flex items-center gap-1.5 text-xs font-bold border shadow-2xs ${
              activeStyles.has('balloons')
                ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                : 'bg-white/80 text-slate-700 hover:text-slate-900 hover:bg-white border-slate-200/80'
            }`}
          >
            <span className="text-sm leading-none shrink-0 inline-flex items-center justify-center w-5 h-5">🎈</span>
            <span className="leading-none whitespace-nowrap">Balloons</span>
          </button>

          <button
            type="button"
            onClick={() => handleToggleStyle('butterflies')}
            className={`px-3 py-1.5 rounded-xl transition-colors cursor-pointer select-none flex items-center gap-1.5 text-xs font-bold border shadow-2xs ${
              activeStyles.has('butterflies')
                ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                : 'bg-white/80 text-slate-700 hover:text-slate-900 hover:bg-white border-slate-200/80'
            }`}
          >
            <span className="text-sm leading-none shrink-0 inline-flex items-center justify-center w-5 h-5">🦋</span>
            <span className="leading-none whitespace-nowrap">Butterflies</span>
          </button>

          <button
            type="button"
            onClick={() => handleToggleStyle('cars')}
            className={`px-3 py-1.5 rounded-xl transition-colors cursor-pointer select-none flex items-center gap-1.5 text-xs font-bold border shadow-2xs ${
              activeStyles.has('cars')
                ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                : 'bg-white/80 text-slate-700 hover:text-slate-900 hover:bg-white border-slate-200/80'
            }`}
          >
            <span className="text-sm leading-none shrink-0 inline-flex items-center justify-center w-5 h-5">🚗</span>
            <span className="leading-none whitespace-nowrap">Cars</span>
          </button>

          <button
            type="button"
            onClick={() => handleToggleStyle('invasion')}
            className={`px-3 py-1.5 rounded-xl transition-colors cursor-pointer select-none flex items-center gap-1.5 text-xs font-bold border shadow-2xs ${
              activeStyles.has('invasion')
                ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                : 'bg-white/80 text-slate-700 hover:text-slate-900 hover:bg-white border-slate-200/80'
            }`}
          >
            <span className="text-sm leading-none shrink-0 inline-flex items-center justify-center w-5 h-5">👾</span>
            <span className="leading-none whitespace-nowrap">Invasion</span>
          </button>
        </div>
      </div>

      <div
        className="w-full pop-game-subwindow"
        style={{
          userSelect: 'none',
          WebkitUserSelect: 'none',
          MozUserSelect: 'none',
          msUserSelect: 'none',
        }}
      >
        {/* Floating Arena - Fits gracefully in the viewport without vertical scrolling */}
        <div
          className="pop-game-subwindow relative w-full h-[400px] sm:h-[460px] md:h-[500px] lg:h-[530px] xl:h-[560px] max-h-[calc(100vh-270px)] min-h-[380px] rounded-3xl border-2 border-amber-300/60 shadow-inner overflow-hidden select-none touch-none isolate"
          style={{
            backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.2)), url(${backgroundUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            touchAction: 'none',
            userSelect: 'none',
            WebkitUserSelect: 'none',
            MozUserSelect: 'none',
            msUserSelect: 'none',
          }}
        >
        {/* No letters selected overlay */}
        {selectedLetterIds.size === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/85 backdrop-blur-xs z-30 p-6 text-center">
            <div className="text-5xl mb-2 animate-bounce">🎈</div>
            <h3 className="text-lg font-bold text-slate-800">No Letters Selected</h3>
            <p className="text-xs text-slate-500 max-w-xs mt-1">
              Select one or more letters in the drill selector above to start catching balloons and butterflies!
            </p>
            <button
              type="button"
              onClick={handleSelectAll}
              className="mt-3 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-2xl text-xs shadow-md transition-all active:scale-95 cursor-pointer"
            >
              Select All Letters
            </button>
          </div>
        )}

        {/* Target Letter Badge on Top-Left (Orange letter, click to say letter) */}
        <button
          type="button"
          onClick={() => {
            if (!targetLetter) return;
            soundManager.playPop();
            soundManager.speakLetter(targetLetter.letter);
          }}
          className="absolute top-3 left-3 w-14 h-14 rounded-2xl bg-white/95 hover:bg-white backdrop-blur-md border-2 border-amber-400 shadow-lg flex items-center justify-center z-30 cursor-pointer transition-transform active:scale-95 group select-none pointer-events-auto"
        >
          <span
            className="text-3xl font-bold font-hebrew text-amber-600 group-hover:text-amber-700 leading-none"
            style={{ fontFamily: "'Akoderf', sans-serif" }}
          >
            {targetLetter?.letter || '?'}
          </span>
        </button>

        {/* Top-Right Badges & Controls: Separated Dollar Score and (0/4) Progress */}
        <div className="absolute top-3 right-3 flex items-center gap-2 sm:gap-3 z-30 select-none">
          {/* Much Bigger Dollar Score with Visual Pop Effect */}
          <div
            className={`relative bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-500 text-emerald-950 px-3.5 py-1.5 sm:px-5 sm:py-2 rounded-2xl sm:rounded-3xl border-2 sm:border-3 border-emerald-600 shadow-xl flex items-center gap-1.5 sm:gap-2.5 font-bold text-base sm:text-2xl pointer-events-none transition-all duration-300 ${
              dollarPop
                ? 'scale-125 ring-6 sm:ring-8 ring-emerald-300/90 shadow-2xl animate-bounce'
                : 'hover:scale-105'
            }`}
          >
            <span className="text-xl sm:text-3xl filter drop-shadow-xs">💵</span>
            <span className="tracking-tight font-bold">${score}</span>

            {/* Popping +$1 Floating Reward Pill when dollar is earned */}
            {dollarPop && (
              <div className="absolute -bottom-7 sm:-bottom-8 left-1/2 -translate-x-1/2 bg-amber-400 text-amber-950 font-bold text-[11px] sm:text-sm px-2.5 py-0.5 rounded-full shadow-lg border-2 border-white animate-bounce flex items-center gap-1 whitespace-nowrap z-40">
                <span>+$1.00!</span>
                <span>🪙</span>
              </div>
            )}
          </div>

          {/* (0/4) Round Progress Meter (Shakes/updates on miss) */}
          <div
            className={`bg-white/95 backdrop-blur-md px-3 py-2 rounded-2xl border-2 border-amber-300 shadow-md flex items-center gap-1.5 pointer-events-none transition-transform ${
              scoreShake ? 'scale-110 ring-4 ring-rose-400 animate-pulse' : ''
            }`}
          >
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4].map((step) => (
                <div
                  key={step}
                  className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                    roundPoints >= step
                      ? 'bg-amber-500 scale-125 shadow-xs'
                      : 'bg-slate-200 border border-slate-300'
                  }`}
                />
              ))}
              <span className="text-[10px] font-bold text-slate-700 ml-1">
                ({roundPoints}/4)
              </span>
            </div>
          </div>

          {/* Reset Game Button */}
          <button
            type="button"
            onClick={() => {
              soundManager.playPop();
              onUpdateScore(0);
              setRoundPoints(0);
              pickNewTarget();
            }}
            className="px-2.5 py-2 bg-white/95 hover:bg-white text-rose-700 font-bold rounded-2xl text-xs shadow-md transition-all active:scale-95 cursor-pointer border border-rose-200 flex items-center gap-1 pointer-events-auto"
          >
            <RotateCcw className="w-3.5 h-3.5 text-rose-500" />
            <span className="hidden md:inline">Reset</span>
          </button>
        </div>

        {/* Floating Items */}
        {items.map((item) => (
          <button
            key={item.id}
            data-balloon-id={item.id}
            onPointerDown={(e) => {
              e.stopPropagation();
              handlePopItem(item);
            }}
            onTouchStart={(e) => {
              e.stopPropagation();
              handlePopItem(item);
            }}
            onClick={(e) => {
              e.stopPropagation();
              handlePopItem(item);
            }}
            className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-transform active:scale-125 focus:outline-hidden group select-none z-20"
            style={{
              left: `${item.x}%`,
              top: `${item.y}%`,
              width: `${item.size}px`,
              height: isButterflies ? `${item.size}px` : isCars ? `${item.size * 0.75}px` : isCurrentInvasion ? `${item.size * 0.92}px` : `${item.size * 1.3}px`,
              touchAction: 'none',
            }}
          >
            {isCars ? (
              /* Car Graphic driving Right-to-Left */
              <div className="w-full h-full relative flex items-center justify-center filter drop-shadow-md">
                {/* Car Chassis Body */}
                <div
                  className="absolute bottom-2 left-1 right-1 h-7 rounded-2xl shadow-md"
                  style={{
                    backgroundColor: item.color,
                    border: '2px solid rgba(255,255,255,0.8)',
                  }}
                />
                {/* Car Cabin / Roof */}
                <div
                  className="absolute bottom-7 left-4 right-5 h-6 rounded-t-xl shadow-xs"
                  style={{
                    backgroundColor: item.color,
                    opacity: 0.95,
                    borderTop: '2px solid rgba(255,255,255,0.8)',
                  }}
                />
                {/* Windshield */}
                <div className="absolute bottom-8 left-5 right-7 h-3.5 bg-sky-200/90 rounded-t-lg border border-white/60" />

                {/* Rear Wheel */}
                <div className="absolute left-2.5 -bottom-1 w-7 h-7 rounded-full border-2 border-dashed border-slate-800 bg-slate-900 animate-spin-reverse flex items-center justify-center shadow-sm">
                  <div className="w-0.5 h-full bg-slate-300" />
                </div>
                {/* Front Wheel */}
                <div className="absolute right-2.5 -bottom-1 w-7 h-7 rounded-full border-2 border-dashed border-slate-800 bg-slate-900 animate-spin-reverse flex items-center justify-center shadow-sm">
                  <div className="w-0.5 h-full bg-slate-300" />
                </div>

                {/* Center Medallion with Hebrew Letter */}
                <div
                  className="relative z-10 w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white/95 border-2 border-white flex items-center justify-center shadow-md transform transition-transform group-hover:scale-110"
                  style={{
                    boxShadow: `0 4px 14px ${item.color}80`,
                  }}
                >
                  <span
                    className="text-2xl sm:text-3xl font-bold leading-none font-hebrew"
                    style={{
                      color: item.color,
                      fontFamily: "'Akoderf', sans-serif",
                    }}
                  >
                    {item.letter.letter}
                  </span>
                </div>
              </div>
            ) : isButterflies ? (
              /* Butterfly Graphic flying Left-to-Right with Animated Flapping Wings */
              <div className="w-full h-full relative flex items-center justify-center filter drop-shadow-md">
                {/* Left Flapping Wing */}
                <div
                  className="absolute right-1/2 w-1/2 h-full rounded-l-[40px] rounded-r-[10px] opacity-90 animate-wing-left"
                  style={{
                    backgroundColor: item.color,
                    background: `radial-gradient(circle at 30% 30%, #fff 5%, ${item.color} 60%, rgba(0,0,0,0.3) 100%)`,
                    border: '2px solid rgba(255,255,255,0.7)',
                  }}
                />

                {/* Right Flapping Wing */}
                <div
                  className="absolute left-1/2 w-1/2 h-full rounded-r-[40px] rounded-l-[10px] opacity-90 animate-wing-right"
                  style={{
                    backgroundColor: item.color,
                    background: `radial-gradient(circle at 70% 30%, #fff 5%, ${item.color} 60%, rgba(0,0,0,0.3) 100%)`,
                    border: '2px solid rgba(255,255,255,0.7)',
                  }}
                />

                {/* Antennae tilted forward toward flight direction */}
                <div className="absolute -top-3 w-4 h-3 flex justify-between pointer-events-none z-10">
                  <div className="w-1 h-3 bg-amber-950 rounded-full rotate-[-15deg]" />
                  <div className="w-1 h-3 bg-amber-950 rounded-full rotate-[35deg]" />
                </div>

                {/* Center Glow Medallion with Hebrew Letter */}
                <div
                  className="relative z-10 w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white/95 border-2 border-white flex items-center justify-center shadow-md transform transition-transform group-hover:scale-110"
                  style={{
                    boxShadow: `0 4px 14px ${item.color}80`,
                  }}
                >
                  <span
                    className="text-2xl sm:text-3xl font-bold leading-none font-hebrew"
                    style={{
                      color: item.color,
                      fontFamily: "'Akoderf', sans-serif",
                    }}
                  >
                    {item.letter.letter}
                  </span>
                </div>
              </div>
            ) : isCurrentInvasion ? (
              /* Alien UFO Flying Saucer Invader */
              <div className="w-full h-full relative flex items-center justify-center">
                {/* Saucer Glass Cockpit Dome with Cute Alien Eyes */}
                <div className="absolute -top-2.5 w-13 h-8 bg-gradient-to-b from-emerald-300 via-teal-400 to-emerald-600 rounded-t-full border-2 border-cyan-200/90 flex items-center justify-center z-5">
                  {/* Alien Antenna */}
                  <div className="absolute -top-3 w-1 h-3 bg-emerald-400 rounded-full flex items-center justify-center">
                    <div className="w-2.5 h-2.5 bg-yellow-300 rounded-full border border-yellow-500 animate-ping" />
                  </div>
                  {/* Cute Friendly Alien Eyes */}
                  <div className="flex items-center gap-1.5 pt-0.5">
                    <div className="w-2 h-2 bg-white rounded-full flex items-center justify-center">
                      <div className="w-1 h-1 bg-slate-900 rounded-full" />
                    </div>
                    <div className="w-2 h-2 bg-white rounded-full flex items-center justify-center">
                      <div className="w-1 h-1 bg-slate-900 rounded-full" />
                    </div>
                  </div>
                </div>

                {/* Metallic Flying Saucer Disk Body */}
                <div
                  className="absolute top-2.5 w-full h-10 rounded-[28px] border-2 border-white/85 flex items-center justify-between px-2"
                  style={{
                    backgroundColor: item.color,
                    background: `linear-gradient(180deg, ${item.color} 0%, rgba(15,23,42,0.85) 100%)`,
                  }}
                >
                  {/* Blinking Sci-Fi LED Lights across the rim */}
                  <div className="w-2 h-2 rounded-full bg-yellow-300 animate-pulse" />
                  <div className="w-2 h-2 rounded-full bg-cyan-300 animate-ping" />
                  <div className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" />
                </div>

                {/* Center Glow Medallion with Hebrew Letter */}
                <div
                  className="relative z-10 w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-slate-950/90 border-2 border-cyan-300 flex items-center justify-center transform transition-transform group-hover:scale-110"
                >
                  <span
                    className="text-2xl sm:text-3xl font-bold leading-none font-hebrew text-white"
                    style={{
                      fontFamily: "'Akoderf', sans-serif",
                    }}
                  >
                    {item.letter.letter}
                  </span>
                </div>
              </div>
            ) : (
              /* Big Round Balloon Body */
              <div className="w-full h-full flex flex-col items-center">
                <div
                  className="w-full aspect-square rounded-full shadow-xl flex items-center justify-center relative overflow-hidden transition-all group-hover:scale-105"
                  style={{
                    backgroundColor: item.color,
                    backgroundImage: `radial-gradient(circle at 35% 28%, rgba(255,255,255,0.42) 0%, rgba(255,255,255,0) 60%), radial-gradient(circle at 75% 75%, rgba(0,0,0,0.18) 0%, rgba(0,0,0,0) 65%)`,
                    boxShadow: `0 12px 28px ${item.color}65, inset -4px -4px 10px rgba(0,0,0,0.15), inset 4px 4px 10px rgba(255,255,255,0.35)`,
                  }}
                >
                  {/* Balloon Gloss Highlight Shine */}
                  <div className="absolute top-3 right-4 w-4 h-8 bg-white/55 rounded-full rotate-25 blur-[0.5px]" />
                  <div className="absolute top-2.5 right-8 w-2 h-3 bg-white/40 rounded-full rotate-25" />

                  {/* Print Letter Inside Balloon */}
                  <span
                    className="text-5xl sm:text-6xl font-bold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.35)] select-none font-hebrew transform group-hover:scale-105 transition-transform"
                    style={{ fontFamily: "'Akoderf', sans-serif" }}
                  >
                    {item.letter.letter}
                  </span>
                </div>

                {/* Balloon Knot and String */}
                <div
                  className="w-3.5 h-3 rounded-b-sm -mt-1 shadow-sm relative z-10"
                  style={{
                    backgroundColor: item.color,
                    filter: 'brightness(0.85)',
                  }}
                />
                <div className="w-0.5 h-8 bg-slate-400/80" />
              </div>
            )}
          </button>
        ))}
      </div>
      </div>
    </div>
  );
};
