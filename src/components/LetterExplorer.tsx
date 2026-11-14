import { stripNiqqud, stripHonorificPrefix, getLocationCardLabel, getExploreWordCategories, getAllExploreWords } from '../utils/hebrew';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Shuffle, Volume2, Star, Play } from 'lucide-react';
import { motion, LayoutGroup, AnimatePresence } from 'motion/react';
import { LetterData, WordExample } from '../types';
import { soundManager } from '../utils/audio';
import { randomizeSkinTone } from '../utils/emoji';
import { getTokenGender } from './SentenceBuilder';
import { getAllDictionaryWords } from '../data/dictionary';
import { ALEFBET_LETTERS, SOFIT_LETTERS, ALL_LETTERS } from '../data/alefbet';

interface LetterExplorerProps {
  currentLetter: LetterData;
  letters: LetterData[];
  onSelectLetter: (letter: LetterData) => void;
  onGoToTracing: (letter: LetterData) => void;
  onLetterExplored: (letterId: string) => void;
  onWordExplored?: (wordEn: string) => void;
  onCategoryExplored?: (catKey: string) => void;
  exploredLetters?: string[];
  exploredWords?: string[];
  exploredCategories?: string[];
  onOpenVideo: (videoId: string) => void;
  devModeEnabled?: boolean;
  hasUnlockedFullCurriculum?: boolean;
  onUnlockFullCurriculum?: () => void;
}

interface ColorBoxTheme {
  bg: string;
  border: string;
  ring: string;
  textHe: string;
  textEn: string;
  closeBtn: string;
  arrowBg: string;
  arrowBorder: string;
}

const COLOR_WORD_THEMES: Record<string, ColorBoxTheme> = {
  red: {
    bg: 'bg-red-500',
    border: 'border-red-600',
    ring: 'ring-red-400/60',
    textHe: 'text-white',
    textEn: 'text-red-100',
    closeBtn: 'text-red-200 hover:text-white hover:bg-red-600/70',
    arrowBg: 'bg-red-500',
    arrowBorder: 'border-red-600',
  },
  blue: {
    bg: 'bg-blue-600',
    border: 'border-blue-700',
    ring: 'ring-blue-400/60',
    textHe: 'text-white',
    textEn: 'text-blue-100',
    closeBtn: 'text-blue-200 hover:text-white hover:bg-blue-700/70',
    arrowBg: 'bg-blue-600',
    arrowBorder: 'border-blue-700',
  },
  green: {
    bg: 'bg-emerald-600',
    border: 'border-emerald-700',
    ring: 'ring-emerald-400/60',
    textHe: 'text-white',
    textEn: 'text-emerald-100',
    closeBtn: 'text-emerald-200 hover:text-white hover:bg-emerald-700/70',
    arrowBg: 'bg-emerald-600',
    arrowBorder: 'border-emerald-700',
  },
  yellow: {
    bg: 'bg-yellow-400',
    border: 'border-yellow-500',
    ring: 'ring-yellow-300/70',
    textHe: 'text-yellow-950',
    textEn: 'text-yellow-900',
    closeBtn: 'text-yellow-800 hover:text-yellow-950 hover:bg-yellow-300/80',
    arrowBg: 'bg-yellow-400',
    arrowBorder: 'border-yellow-500',
  },
  orange: {
    bg: 'bg-orange-500',
    border: 'border-orange-600',
    ring: 'ring-orange-400/60',
    textHe: 'text-white',
    textEn: 'text-orange-100',
    closeBtn: 'text-orange-200 hover:text-white hover:bg-orange-600/70',
    arrowBg: 'bg-orange-500',
    arrowBorder: 'border-orange-600',
  },
  purple: {
    bg: 'bg-purple-600',
    border: 'border-purple-700',
    ring: 'ring-purple-400/60',
    textHe: 'text-white',
    textEn: 'text-purple-100',
    closeBtn: 'text-purple-200 hover:text-white hover:bg-purple-700/70',
    arrowBg: 'bg-purple-600',
    arrowBorder: 'border-purple-700',
  },
  pink: {
    bg: 'bg-pink-500',
    border: 'border-pink-600',
    ring: 'ring-pink-400/60',
    textHe: 'text-white',
    textEn: 'text-pink-100',
    closeBtn: 'text-pink-200 hover:text-white hover:bg-pink-600/70',
    arrowBg: 'bg-pink-500',
    arrowBorder: 'border-pink-600',
  },
  brown: {
    bg: 'bg-amber-900',
    border: 'border-amber-950',
    ring: 'ring-amber-700/60',
    textHe: 'text-white',
    textEn: 'text-amber-100',
    closeBtn: 'text-amber-200 hover:text-white hover:bg-amber-950/70',
    arrowBg: 'bg-amber-900',
    arrowBorder: 'border-amber-950',
  },
  black: {
    bg: 'bg-neutral-900',
    border: 'border-black',
    ring: 'ring-neutral-600/60',
    textHe: 'text-white',
    textEn: 'text-neutral-300',
    closeBtn: 'text-neutral-400 hover:text-white hover:bg-neutral-800',
    arrowBg: 'bg-neutral-900',
    arrowBorder: 'border-black',
  },
  white: {
    bg: 'bg-white',
    border: 'border-slate-300',
    ring: 'ring-slate-300/60',
    textHe: 'text-slate-900',
    textEn: 'text-slate-600',
    closeBtn: 'text-slate-400 hover:text-slate-700 hover:bg-slate-100',
    arrowBg: 'bg-white',
    arrowBorder: 'border-slate-300',
  },
  gray: {
    bg: 'bg-gray-500',
    border: 'border-gray-600',
    ring: 'ring-gray-400/60',
    textHe: 'text-white',
    textEn: 'text-gray-100',
    closeBtn: 'text-gray-200 hover:text-white hover:bg-gray-600/70',
    arrowBg: 'bg-gray-500',
    arrowBorder: 'border-gray-600',
  },
  grey: {
    bg: 'bg-gray-500',
    border: 'border-gray-600',
    ring: 'ring-gray-400/60',
    textHe: 'text-white',
    textEn: 'text-gray-100',
    closeBtn: 'text-gray-200 hover:text-white hover:bg-gray-600/70',
    arrowBg: 'bg-gray-500',
    arrowBorder: 'border-gray-600',
  },
  rainbow: {
    bg: 'bg-gradient-to-r from-red-500 via-yellow-400 via-green-500 via-blue-500 to-purple-600',
    border: 'border-white/90',
    ring: 'ring-pink-400/80',
    textHe: 'text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]',
    textEn: 'text-white font-bold drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]',
    closeBtn: 'text-white hover:text-white hover:bg-black/30',
    arrowBg: 'bg-gradient-to-br from-indigo-500 to-purple-600',
    arrowBorder: 'border-white/90',
  },
};

const DEFAULT_THEME: ColorBoxTheme = {
  bg: 'bg-white',
  border: 'border-amber-300',
  ring: 'ring-amber-300/50',
  textHe: 'text-slate-900',
  textEn: 'text-amber-900',
  closeBtn: 'text-slate-400 hover:text-slate-700 hover:bg-slate-100',
  arrowBg: 'bg-white',
  arrowBorder: 'border-amber-300',
};

const getWordUniqueId = (word: WordExample): string => {
  if (word.id) return word.id;
  const cleanHe = word.wordHe.replace(/[\u0591-\u05C7]/g, '').trim();
  return `${cleanHe}-${word.wordEn.trim().toLowerCase()}`;
};

const getWordPopupTheme = (word: WordExample | null | undefined): ColorBoxTheme => {
  if (!word) return DEFAULT_THEME;
  if (word.id === 'orange_fruit') return DEFAULT_THEME;
  if (word.id === 'orange_color') return COLOR_WORD_THEMES['orange'] || DEFAULT_THEME;
  const normalizedHe = word.wordHe.replace(/[\u0591-\u05BD\u05BF-\u05C7]/g, '').trim();

  // תפוז (tapuz) is an orange fruit / food word, not the color swatch - keep its popup white!
  if (
    normalizedHe === 'תפוז' ||
    normalizedHe.includes('תפוז') ||
    (word.wordEn.toLowerCase() === 'orange' && normalizedHe !== 'כתום')
  ) {
    return DEFAULT_THEME;
  }
  return COLOR_WORD_THEMES[word.wordEn.toLowerCase()] || DEFAULT_THEME;
};

export const isWordBig = (word?: WordExample | null): boolean => {
  if (!word) return false;
  const en = (word.wordEn || '').toLowerCase().trim();
  const he = (word.wordHe || '').trim().replace(/[\u0591-\u05C7]/g, '');
  return en === 'big' || he === 'גדול' || word.id === 'gadol';
};

export const isWordSmall = (word?: WordExample | null): boolean => {
  if (!word) return false;
  const en = (word.wordEn || '').toLowerCase().trim();
  const he = (word.wordHe || '').trim().replace(/[\u0591-\u05C7]/g, '');
  return en === 'small' || he === 'קטן' || word.id === 'katan';
};

export const playWordPopSound = (word: WordExample): void => {
  if (isWordBig(word)) {
    // 50% slower audio pop sound
    soundManager.playPop(0.5);
  } else if (isWordSmall(word)) {
    // 50% faster audio pop sound
    soundManager.playPop(1.5);
  } else {
    soundManager.playPop(1.0);
  }
};

export const getWordBottomPopupStyle = (word?: WordExample | null): React.CSSProperties => {
  if (isWordBig(word)) {
    return { transform: 'translateX(-50%) scale(1.5)', transformOrigin: 'bottom center', maxWidth: '90vw', maxHeight: '90vh' };
  }
  if (isWordSmall(word)) {
    return { transform: 'translateX(-50%) scale(0.5)', transformOrigin: 'bottom center' };
  }
  return { transform: 'translateX(-50%)', transformOrigin: 'bottom center' };
};

export const getWordSidePopupStyle = (word?: WordExample | null, topY?: number | null): React.CSSProperties => {
  const baseStyle: React.CSSProperties = {
    top: topY !== null && topY !== undefined ? `${topY}px` : '50%',
  };
  if (isWordBig(word)) {
    return { ...baseStyle, transform: 'translateY(-50%) scale(1.5)', transformOrigin: 'right center', maxWidth: '90vw', maxHeight: '90vh' };
  }
  if (isWordSmall(word)) {
    return { ...baseStyle, transform: 'translateY(-50%) scale(0.5)', transformOrigin: 'right center' };
  }
  return { ...baseStyle, transform: 'translateY(-50%)', transformOrigin: 'right center' };
};

export const getWordBottomPopupClass = (word?: WordExample | null): string => {
  if (isWordBig(word)) return 'popup-big popup-big-bottom';
  if (isWordSmall(word)) return 'popup-small popup-small-bottom';
  return '';
};

export const getWordSidePopupClass = (word?: WordExample | null): string => {
  if (isWordBig(word)) return 'popup-big popup-big-desktop';
  if (isWordSmall(word)) return 'popup-small popup-small-desktop';
  return '';
};

export const LetterExplorer: React.FC<LetterExplorerProps> = ({
  currentLetter,
  letters,
  onSelectLetter,
  onGoToTracing,
  onLetterExplored,
  onWordExplored,
  onCategoryExplored,
  exploredLetters,
  exploredWords,
  exploredCategories,
  onOpenVideo,
  devModeEnabled = false,
  hasUnlockedFullCurriculum = false,
  onUnlockFullCurriculum,
}) => {
  // Daily explore checkmarks are strictly volatile (session-only React state)
  const [exploredLettersState, setExploredLettersState] = useState<Set<string>>(() => {
    return new Set(exploredLetters || []);
  });

  // Clean up any legacy localStorage entry on mount to ensure fresh sessions start unchecked
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('exploredLetters');
    }
  }, []);
  const [exploredCategoriesState, setExploredCategoriesState] = useState<Set<string>>(new Set(exploredCategories || []));
  const [exploredWordsState, setExploredWordsState] = useState<Set<string>>(new Set(exploredWords || []));

  const coreLettersCheckedCount = useMemo(() => {
    return ALEFBET_LETTERS.filter((l) => exploredLettersState.has(l.id)).length;
  }, [exploredLettersState]);

  // Explore library is permanently unlocked if milestone was ever achieved, or if all 22 checked today
  const isExploreUnlocked = devModeEnabled || hasUnlockedFullCurriculum || coreLettersCheckedCount >= 22;

  // Whenever user checks off all 22 core letters during any session, trigger permanent milestone
  useEffect(() => {
    if (coreLettersCheckedCount >= 22) {
      onUnlockFullCurriculum?.();
    }
  }, [coreLettersCheckedCount, onUnlockFullCurriculum]);

  useEffect(() => {
    setExploredLettersState(new Set(exploredLetters || []));
  }, [exploredLetters]);
  useEffect(() => {
    setExploredWordsState(new Set(exploredWords || []));
  }, [exploredWords]);
  useEffect(() => {
    setExploredCategoriesState(new Set(exploredCategories || []));
  }, [exploredCategories]);

  useEffect(() => {
    const handleResetEverything = () => {
      setExploredLettersState(new Set());
      setExploredCategoriesState(new Set());
      setExploredWordsState(new Set());
      setActiveVocabPopup(null);
      setActiveVocabInstanceId(null);
    };
    window.addEventListener('alefbet_reset_everything', handleResetEverything);
    return () => {
      window.removeEventListener('alefbet_reset_everything', handleResetEverything);
    };
  }, []);
  const [activeVocabPopup, setActiveVocabPopup] = useState<WordExample | null>(null);
  const [activeVocabInstanceId, setActiveVocabInstanceId] = useState<string | null>(null);
  const [activeCardRect, setActiveCardRect] = useState<DOMRect | null>(null);
  const [activeButtonY, setActiveButtonY] = useState<number | null>(null);

  useEffect(() => {
    if (!activeVocabInstanceId || activeVocabInstanceId.startsWith('sidebar-')) {
      setActiveCardRect(null);
      return;
    }
    const updateRect = () => {
      const el = document.getElementById(`word-card-${activeVocabInstanceId}`);
      if (el) {
        setActiveCardRect(el.getBoundingClientRect());
      }
    };
    updateRect();
    const rafId = requestAnimationFrame(updateRect);
    window.addEventListener('scroll', updateRect, true);
    window.addEventListener('resize', updateRect);
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('scroll', updateRect, true);
      window.removeEventListener('resize', updateRect);
    };
  }, [activeVocabInstanceId]);

  const popupRef = useRef<HTMLDivElement | null>(null);

  // Document-level non-blocking dismissal: clicks on cards pass through immediately to cards!
  useEffect(() => {
    if (!activeVocabPopup) return;

    const handlePointerDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      // 1. If clicked inside the popup bubble: dismiss/close immediately!
      if ((popupRef.current && popupRef.current.contains(target)) || target.closest('.vocab-popup-bubble')) {
        setActiveVocabPopup(null);
        setActiveVocabInstanceId(null);
        setActiveCardRect(null);
        return;
      }

      // 2. If clicked on ANY word card button anywhere on the screen:
      // let the card's native onClick handler execute immediately!
      if (target.closest('[id^="word-card-"]')) {
        return;
      }

      // 3. Otherwise, clicked on neutral whitespace / header / outside: dismiss popup
      setActiveVocabPopup(null);
      setActiveVocabInstanceId(null);
      setActiveCardRect(null);
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [activeVocabPopup]);

  const [popKey, setPopKey] = useState(0);
  const [buttonEmojiMap, setButtonEmojiMap] = useState<Record<string, string>>({});
  const [isPronouncingLetter, setIsPronouncingLetter] = useState(false);
  const [rouletteLetterId, setRouletteLetterId] = useState<string | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [isSpinningWord, setIsSpinningWord] = useState(false);
  const [rouletteWordInstanceId, setRouletteWordInstanceId] = useState<string | null>(null);
  type ArrangementType = 'alphabetical' | 'gender' | 'alignment';
  const [categoryArrangements, setCategoryArrangements] = useState<Record<string, ArrangementType>>({});
  const [isGlobalGenderArranged, setIsGlobalGenderArranged] = useState<boolean>(false);

  const toggleCategoryArrangement = (catKey: string, targetMode: ArrangementType) => {
    soundManager.playPop();
    setActiveVocabPopup(null);
    setActiveVocabInstanceId(null);
    setActiveCardRect(null);
    setCategoryArrangements((prev) => {
      const current = prev[catKey] || 'alphabetical';
      const next = current === targetMode ? 'alphabetical' : targetMode;
      return { ...prev, [catKey]: next };
    });
  };
  type FilterType = 'letter' | 'all' | '22' | 'heroes_villains' | 'adjectives' | 'animals' | 'body' | 'colors' | 'food' | 'helpers' | 'jewish' | 'numbers' | 'other' | 'people' | 'places' | 'locations' | 'sayings' | 'sky' | 'transportation' | 'verbs';
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('letter');

  useEffect(() => {
    if (!isExploreUnlocked && selectedFilter !== 'letter') {
      setSelectedFilter('letter');
    }
  }, [isExploreUnlocked, selectedFilter]);
  const spinTimerRef = useRef<number | null>(null);
  const wordSpinTimerRef = useRef<number | null>(null);
  const sidebarRef = useRef<HTMLDivElement | null>(null);
  const hasAutoTriggeredRandomRef = useRef(false);

  useEffect(() => {
    // Automatically trigger the random letter button on Explore when launching the app
    if (!hasAutoTriggeredRandomRef.current) {
      hasAutoTriggeredRandomRef.current = true;
      let initialTimer: number | null = null;
      let handleVisibilityChange: (() => void) | null = null;

      const runAutoTrigger = () => {
        initialTimer = window.setTimeout(() => {
          handleRandomLetter(true);
        }, 500);
      };

      if (document.visibilityState === 'visible') {
        runAutoTrigger();
      } else {
        handleVisibilityChange = () => {
          if (document.visibilityState === 'visible') {
            if (handleVisibilityChange) {
              document.removeEventListener('visibilitychange', handleVisibilityChange);
            }
            runAutoTrigger();
          }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);
      }

      return () => {
        if (initialTimer !== null) clearTimeout(initialTimer);
        if (handleVisibilityChange) {
          document.removeEventListener('visibilitychange', handleVisibilityChange);
        }
      };
    }
  }, []);

  useEffect(() => {
    return () => {
      if (spinTimerRef.current) clearTimeout(spinTimerRef.current);
      if (wordSpinTimerRef.current) clearTimeout(wordSpinTimerRef.current);
    };
  }, []);




  const getWordCategories = getExploreWordCategories;

  const allWordsList = useMemo(() => {
    return getAllExploreWords(letters);
  }, [letters]);

  const filteredWords = allWordsList.filter(({ word }) => {
    if (selectedFilter === 'all') return true;
    const cats = getWordCategories(word);
    if (selectedFilter === 'other') return cats.length === 0 || cats.includes('other') || cats.includes('objects');
    return cats.includes(selectedFilter);
  });

    const colorOrderMap: Record<string, number> = {
      'red': 1,
      'orange': 2, 'orange (color)': 2,
      'yellow': 3,
      'green': 4,
      'blue': 5,
      'purple': 6,
      'pink': 7,
      'brown': 8,
      'black': 9,
      'gray': 10, 'grey': 10,
      'white': 11,
      'big': 12,
      'small': 13,
    };

    if (selectedFilter === 'colors') {
      filteredWords.sort((a, b) => {
        const valA = colorOrderMap[a.word.wordEn.toLowerCase()] ?? 999;
        const valB = colorOrderMap[b.word.wordEn.toLowerCase()] ?? 999;
        return valA - valB;
      });
    }

    if (selectedFilter === 'numbers') {
    const numberOrderMap: Record<string, number> = {
      'zero': 0, '0': 0,
      'one': 1, '1': 1,
      'two': 2, '2': 2,
      'three': 3, '3': 3,
      'four': 4, '4': 4,
      'five': 5, '5': 5,
      'six': 6, '6': 6,
      'seven': 7, '7': 7,
      'eight': 8, '8': 8,
      'nine': 9, '9': 9,
      'ten': 10, '10': 10,
      '100': 100,
      'one hundred': 100,
    };
    filteredWords.sort((a, b) => {
      const valA = numberOrderMap[a.word.wordEn.toLowerCase()] ?? 999;
      const valB = numberOrderMap[b.word.wordEn.toLowerCase()] ?? 999;
      return valA - valB;
    });
  }

  const currentIndex = letters.findIndex((l) => l.id === currentLetter.id);
  const prevLetter = currentIndex > 0 ? letters[currentIndex - 1] : letters[letters.length - 1];
  const nextLetter = currentIndex < letters.length - 1 ? letters[currentIndex + 1] : letters[0];

  const isSofitLetter = currentLetter.id.startsWith('sofit_') || SOFIT_LETTERS.some((s) => s.id === currentLetter.id);

  const allWords = useMemo(() => {
    const list: WordExample[] = [];
    const seen = new Set<string>();
    const getWordKey = (w: WordExample) => `${w.wordHe.trim().replace(/[\u0591-\u05C7]/g, '')}-${w.wordEn.trim().toLowerCase()}`;

    if (isSofitLetter) {
      const sofitChar = currentLetter.letter.replace(/[\u0591-\u05C7]/g, '').trim();
      ALL_LETTERS.forEach((l) => {
        const words = [l.primaryWord, ...(l.secondaryWords || [])];
        words.forEach((w) => {
          if (!w || !w.wordHe) return;
          const cleanHe = w.wordHe.replace(/[\u0591-\u05C7]/g, '').trim();
          if (cleanHe.endsWith(sofitChar)) {
            const key = getWordKey(w);
            if (!seen.has(key)) {
              seen.add(key);
              list.push(w);
            }
          }
        });
      });
      const dictWords = getAllDictionaryWords();
      dictWords.forEach((w) => {
        if (!w || !w.wordHe) return;
        const cleanHe = w.wordHe.replace(/[\u0591-\u05C7]/g, '').trim();
        if (cleanHe.endsWith(sofitChar)) {
          const key = getWordKey(w);
          if (!seen.has(key)) {
            seen.add(key);
            list.push(w);
          }
        }
      });
    } else {
      const baseWords = [currentLetter.primaryWord, ...(currentLetter.secondaryWords || [])];
      baseWords.forEach((w) => {
        if (!w || !w.wordHe) return;
        const key = getWordKey(w);
        if (!seen.has(key)) {
          seen.add(key);
          list.push(w);
        }
      });
      const letterChar = currentLetter.letter.replace(/[\u0591-\u05C7]/g, '').trim();
      const dictWords = getAllDictionaryWords().filter((w) => w && w.wordHe && w.wordHe.replace(/[\u0591-\u05C7]/g, '').trim().startsWith(letterChar));
      dictWords.forEach((w) => {
        if (!w || !w.wordHe) return;
        const key = getWordKey(w);
        if (!seen.has(key)) {
          seen.add(key);
          list.push(w);
        }
      });
    }

    list.sort((a, b) => {
      const cleanA = a.wordHe.replace(/[\u0591-\u05C7]/g, '').trim();
      const cleanB = b.wordHe.replace(/[\u0591-\u05C7]/g, '').trim();
      return cleanA.localeCompare(cleanB, 'he');
    });

    return list;
  }, [currentLetter, isSofitLetter]);

  // Roulette Random Letter Spin: steps through letters with beep-boop sounds before settling
  const handleRandomLetter = (isInitialAutoTrigger = false) => {
    if (isSpinning) return;
    soundManager.unlockAudio();
    setIsSpinning(true);
    setSelectedFilter('letter');
    setActiveVocabPopup(null);
    setActiveVocabInstanceId(null);

    // Pick final target distinct from current letter
    const pool = letters.filter((l) => l.id !== currentLetter.id);
    const finalTarget = pool[Math.floor(Math.random() * pool.length)] || letters[0];

    const totalSteps = 14;
    const stepLetters: LetterData[] = [];
    let prevId = currentLetter.id;

    for (let i = 0; i < totalSteps - 1; i++) {
      const candidates = letters.filter((l) => l.id !== prevId);
      const rand = candidates[Math.floor(Math.random() * candidates.length)] || letters[0];
      stepLetters.push(rand);
      prevId = rand.id;
    }
    stepLetters.push(finalTarget);

    let step = 0;
    const runStep = () => {
      const currentStepLetter = stepLetters[step];
      setRouletteLetterId(currentStepLetter.id);
      soundManager.playRouletteBeep(step);

      step++;
      if (step < totalSteps) {
        // Starts fast (~50ms) and gradually slows down to ~260ms like a real wheel
        const progress = step / totalSteps;
        const delay = 50 + Math.pow(progress, 2.2) * 210;
        spinTimerRef.current = window.setTimeout(runStep, delay);
      } else {
        // Land on target
        spinTimerRef.current = window.setTimeout(() => {
          setRouletteLetterId(null);
          setIsSpinning(false);
          onSelectLetter(finalTarget);
          onLetterExplored(finalTarget.id);
          soundManager.speakLetter(finalTarget.letter);
        }, 160);
      }
    };

    runStep();
  };

  // Clear timers on unmount
  useEffect(() => {
    return () => {
      if (spinTimerRef.current) {
        clearTimeout(spinTimerRef.current);
      }
    };
  }, []);

  // Whenever current letter changes, reset popups and setup emoji skin tones
  useEffect(() => {
    setActiveVocabPopup(null);
    setActiveButtonY(null);

    // Randomize human emoji skin tones for the buttons on this letter
    const initialMap: Record<string, string> = {};
    allWords.forEach((w) => {
      if (w.emoji) {
        initialMap[getWordUniqueId(w)] = randomizeSkinTone(w.emoji);
      }
    });
    setButtonEmojiMap(initialMap);
  }, [currentLetter.id, currentLetter.letter]);

  // When clicking the big letter card, JUST recite the letter name!
  const lastLetterClickTimeRef = useRef<number>(0);
  const handleLetterClick = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    const now = Date.now();
    if (now - lastLetterClickTimeRef.current < 250) {
      return;
    }
    lastLetterClickTimeRef.current = now;

    if (isSpinning) return;
    setIsPronouncingLetter(true);
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    soundManager.speakLetter(currentLetter.letter);
    onLetterExplored(currentLetter.id);
    setExploredLettersState((prev) => new Set([...prev, currentLetter.id]));
    setTimeout(() => setIsPronouncingLetter(false), 600);
  };

  // When clicking a vocabulary icon, open the popup, vertically aligned with the clicked button
  const handleVocabClick = (word: WordExample, e?: React.MouseEvent<HTMLButtonElement>) => {
    if (isSpinning) return;
    // Generate a fresh random skin tone each time the card is opened (ensuring it's different than currently shown)
    const wordKey = getWordUniqueId(word);
    const freshEmoji = randomizeSkinTone(word.emoji, buttonEmojiMap[wordKey]);
    setButtonEmojiMap((prev) => ({ ...prev, [wordKey]: freshEmoji }));
    setPopKey((prev) => prev + 1);
    setActiveVocabPopup(word);
    setActiveVocabInstanceId(`sidebar-${wordKey}`);
    setExploredWordsState((prev) => new Set([...prev, word.wordEn]));

    if (e && sidebarRef.current) {
      const btnRect = e.currentTarget.getBoundingClientRect();
      const sidebarRect = sidebarRef.current.getBoundingClientRect();
      const centerY = btnRect.top - sidebarRect.top + btnRect.height / 2;
      setActiveButtonY(centerY);
    } else {
      const el = document.getElementById(`word-card-sidebar-${wordKey}`);
      if (el && sidebarRef.current) {
        const btnRect = el.getBoundingClientRect();
        const sidebarRect = sidebarRef.current.getBoundingClientRect();
        const centerY = btnRect.top - sidebarRect.top + btnRect.height / 2;
        setActiveButtonY(centerY);
      }
    }

    playWordPopSound(word);
    soundManager.speakHebrew(word.ttsOverride || word.ttsText || word.speakText || word.spokenHe || word.wordHe);
  };

  // Smoothly scroll element into center view accounting for header and bottom navigation bar
  const scrollToWordCard = (cardId: string) => {
    const el = document.getElementById(`word-card-${cardId}`);
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const targetScrollY = window.scrollY + rect.top - (window.innerHeight / 2) + (rect.height / 2);
    window.scrollTo({
      top: Math.max(0, targetScrollY),
      behavior: 'smooth',
    });
  };

  // Roulette Random Word Spin for ALL WORDS / Category view
  const handleRandomAllWord = () => {
    if (isSpinning || isSpinningWord) return;
    const pool = allWordsList.filter(({ word }) => {
      if (selectedFilter === 'all') return true;
      const cats = getWordCategories(word);
      if (selectedFilter === 'other') return cats.length === 0 || cats.includes('other') || cats.includes('objects');
      return cats.includes(selectedFilter);
    });
    if (pool.length === 0) return;

    soundManager.unlockAudio();
    setIsSpinningWord(true);
    setActiveVocabPopup(null);
    setActiveVocabInstanceId(null);

    // Pick final target distinct from current active popup
    const activePopupKey = activeVocabPopup ? getWordUniqueId(activeVocabPopup) : undefined;
    const candidatesForFinal = pool.filter((item) => getWordUniqueId(item.word) !== activePopupKey);
    const finalTarget = candidatesForFinal.length > 0
      ? candidatesForFinal[Math.floor(Math.random() * candidatesForFinal.length)]
      : pool[Math.floor(Math.random() * pool.length)];

    const totalSteps = Math.min(14, Math.max(8, pool.length));
    const stepItems: typeof pool = [];
    let prevWordKey = activePopupKey;

    for (let i = 0; i < totalSteps - 1; i++) {
      const candidates = pool.filter((item) => getWordUniqueId(item.word) !== prevWordKey);
      const rand = candidates[Math.floor(Math.random() * candidates.length)] || pool[0];
      stepItems.push(rand);
      prevWordKey = getWordUniqueId(rand.word);
    }
    stepItems.push(finalTarget);

    let step = 0;
    const runStep = () => {
      const currentItem = stepItems[step];
      const currentCat = selectedFilter === 'all'
        ? (getWordCategories(currentItem.word)[0] || 'other')
        : selectedFilter;
      const stepKey = `${currentCat}-${currentItem.letter.id}-${getWordUniqueId(currentItem.word)}`;
      setRouletteWordInstanceId(stepKey);
      soundManager.playRouletteBeep(step);

      step++;
      if (step < totalSteps) {
        const progress = step / totalSteps;
        const delay = 50 + Math.pow(progress, 2.2) * 210;
        wordSpinTimerRef.current = window.setTimeout(runStep, delay);
      } else {
        // Land on target
        wordSpinTimerRef.current = window.setTimeout(() => {
          setRouletteWordInstanceId(null);
          setIsSpinningWord(false);
          const targetCat = selectedFilter === 'all'
            ? (getWordCategories(finalTarget.word)[0] || 'other')
            : selectedFilter;
          const targetWordKey = getWordUniqueId(finalTarget.word);
          const finalKey = `${targetCat}-${finalTarget.letter.id}-${targetWordKey}`;
          const freshEmoji = randomizeSkinTone(finalTarget.word.emoji, buttonEmojiMap[targetWordKey]);
          setButtonEmojiMap((prev) => ({ ...prev, [targetWordKey]: freshEmoji }));
          setPopKey((k) => k + 1);
          setActiveVocabPopup(finalTarget.word);
          setActiveVocabInstanceId(finalKey);
          playWordPopSound(finalTarget.word);
          soundManager.speakHebrew(finalTarget.word.ttsOverride || finalTarget.word.ttsText || finalTarget.word.speakText || finalTarget.word.spokenHe || finalTarget.word.wordHe);

          setTimeout(() => {
            scrollToWordCard(finalKey);
          }, 60);
        }, 160);
      }
    };

    runStep();
  };

  // Roulette Random Word Spin for letter VOCABULARY list
  const handleRandomSidebarWord = () => {
    if (isSpinning || isSpinningWord || allWords.length === 0) return;

    soundManager.unlockAudio();
    setIsSpinningWord(true);
    setActiveVocabPopup(null);
    setActiveVocabInstanceId(null);

    const activePopupKey = activeVocabPopup ? getWordUniqueId(activeVocabPopup) : undefined;
    const candidatesForFinal = allWords.filter((w) => getWordUniqueId(w) !== activePopupKey);
    const finalTarget = candidatesForFinal.length > 0
      ? candidatesForFinal[Math.floor(Math.random() * candidatesForFinal.length)]
      : allWords[Math.floor(Math.random() * allWords.length)];

    const totalSteps = Math.min(12, Math.max(6, allWords.length));
    const stepWords: WordExample[] = [];
    let prevWordKey = activePopupKey;

    for (let i = 0; i < totalSteps - 1; i++) {
      const candidates = allWords.filter((w) => getWordUniqueId(w) !== prevWordKey);
      const rand = candidates[Math.floor(Math.random() * candidates.length)] || allWords[0];
      stepWords.push(rand);
      prevWordKey = getWordUniqueId(rand);
    }
    stepWords.push(finalTarget);

    let step = 0;
    const runStep = () => {
      const currentWord = stepWords[step];
      const currentWordKey = getWordUniqueId(currentWord);
      const stepKey = `sidebar-${currentWordKey}`;
      setRouletteWordInstanceId(stepKey);
      soundManager.playRouletteBeep(step);

      step++;
      if (step < totalSteps) {
        const progress = step / totalSteps;
        const delay = 50 + Math.pow(progress, 2.2) * 210;
        wordSpinTimerRef.current = window.setTimeout(runStep, delay);
      } else {
        // Land on target
        wordSpinTimerRef.current = window.setTimeout(() => {
          setRouletteWordInstanceId(null);
          setIsSpinningWord(false);
          const targetWordKey = getWordUniqueId(finalTarget);
          const finalKey = `sidebar-${targetWordKey}`;
          const freshEmoji = randomizeSkinTone(finalTarget.emoji, buttonEmojiMap[targetWordKey]);
          setButtonEmojiMap((prev) => ({ ...prev, [targetWordKey]: freshEmoji }));
          setPopKey((k) => k + 1);
          setActiveVocabPopup(finalTarget);
          setActiveVocabInstanceId(finalKey);
          setExploredWordsState((prev) => new Set([...prev, finalTarget.wordEn]));
          playWordPopSound(finalTarget);
          soundManager.speakHebrew(finalTarget.ttsOverride || finalTarget.ttsText || finalTarget.speakText || finalTarget.spokenHe || finalTarget.wordHe);

          setTimeout(() => {
            scrollToWordCard(finalKey);
            const el = document.getElementById(`word-card-${finalKey}`);
            if (el && sidebarRef.current) {
              const btnRect = el.getBoundingClientRect();
              const sidebarRect = sidebarRef.current.getBoundingClientRect();
              setActiveButtonY(btnRect.top - sidebarRect.top + btnRect.height / 2);
            }
          }, 60);
        }, 160);
      }
    };

    runStep();
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-4 sm:py-6 space-y-5">
      {/* Quick Letter Tray (At Top of Explorer) */}
      <div className="bg-white p-3.5 sm:p-5 rounded-3xl border border-amber-200/80 shadow-xs space-y-3">
        {/* Centered Randomizer Button */}
        <div className="flex items-center justify-center mt-0.5 sm:mt-1 mb-4 sm:mb-5">
          <button
            type="button"
            onClick={() => handleRandomLetter(false)}
            disabled={isSpinning}
            className={`h-6 sm:h-7 flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 bg-gradient-to-r from-amber-100 via-amber-100 to-amber-200 hover:from-amber-200 hover:to-amber-300 active:scale-95 text-amber-900 border border-amber-300 rounded-xl sm:rounded-2xl text-[11px] sm:text-xs font-bold transition-all cursor-pointer shadow-2xs disabled:opacity-75 leading-none ${
              isSpinning ? 'scale-105 ring-2 ring-amber-400' : ''
            }`}
            title="Pick a random letter"
            aria-label="Pick a random letter"
          >
            <Shuffle className={`w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-700 shrink-0 ${isSpinning ? 'animate-spin' : ''}`} />
            <span className="text-xs sm:text-sm leading-none">🎲</span>
          </button>
        </div>

        <div dir="rtl" className="grid grid-cols-11 gap-1 sm:gap-2 w-full max-w-3xl mx-auto">
          {ALEFBET_LETTERS.map((letter) => {
            const isTarget = selectedFilter === 'letter' && (rouletteLetterId ? letter.id === rouletteLetterId : letter.id === currentLetter.id);
            const isRouletteActive = selectedFilter === 'letter' && rouletteLetterId !== null && letter.id === rouletteLetterId;

            return (
              <button
                key={letter.id}
                disabled={isSpinning}
                onClick={() => {
                  if (isSpinning) return;
                  setSelectedFilter('letter');
                  setActiveVocabPopup(null);
                  setActiveVocabInstanceId(null);
                  onSelectLetter(letter);
                  onLetterExplored(letter.id);
                  setExploredLettersState((prev) => {
                    const next = new Set([...prev, letter.id]);
                    return next;
                  });
                  soundManager.speakLetter(letter.letter);
                }}
                className={`select-none relative aspect-square w-full rounded-lg sm:rounded-xl font-bold text-sm sm:text-base md:text-lg transition-all duration-75 flex items-center justify-center cursor-pointer ${
                  isRouletteActive
                    ? 'bg-amber-400 text-white shadow-md scale-125 ring-4 ring-amber-300 z-10'
                    : isTarget
                    ? 'bg-amber-500 text-white shadow-xs scale-105 ring-2 ring-amber-300'
                    : 'bg-amber-50/70 text-slate-700 hover:bg-amber-200 hover:text-slate-900 border border-amber-200/60'
                }`}
                style={{ fontFamily: "'Akoderf', sans-serif" }}
              >
                {letter.letter || (letter.id === 'alef' ? 'א' : '')}
                {exploredLettersState.has(letter.id) && (
                  <span
                    aria-hidden="true"
                    className="absolute -top-1 -right-1 sm:-top-1 sm:-right-1 w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full bg-emerald-500 text-white text-[8px] sm:text-[9px] font-bold flex items-center justify-center shadow-2xs z-20"
                    title="Explored"
                  >
                    ✓
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {isExploreUnlocked && (
          <>
            {/* Final (Sofit) Letters Grid right underneath */}
            <div dir="rtl" className="grid grid-cols-11 gap-1 sm:gap-2 w-full max-w-3xl mx-auto pt-1 sm:pt-1.5 mt-1 sm:mt-1.5">
              {SOFIT_LETTERS.map((sofitLetter, idx) => {
                const isTarget = selectedFilter === 'letter' && (rouletteLetterId ? sofitLetter.id === rouletteLetterId : sofitLetter.id === currentLetter.id);
                const isRouletteActive = selectedFilter === 'letter' && rouletteLetterId !== null && sofitLetter.id === rouletteLetterId;
                const areSofitsUnlocked = devModeEnabled || hasUnlockedFullCurriculum || coreLettersCheckedCount >= 22;
                const isLocked = !areSofitsUnlocked;

                return (
                  <button
                    key={sofitLetter.id}
                    disabled={isLocked || isSpinning}
                    dir="ltr"
                    onClick={() => {
                      if (isLocked || isSpinning) return;
                      setSelectedFilter('letter');
                      setActiveVocabPopup(null);
                      setActiveVocabInstanceId(null);
                      onSelectLetter(sofitLetter);
                      onLetterExplored(sofitLetter.id);
                      setExploredLettersState((prev) => {
                        const next = new Set([...prev, sofitLetter.id]);
                        return next;
                      });
                      soundManager.speakLetter(sofitLetter.letter);
                    }}
                    className={`select-none relative aspect-square w-full rounded-lg sm:rounded-xl font-bold text-sm sm:text-base md:text-lg transition-all duration-75 flex items-center justify-center ${
                      isLocked ? 'cursor-not-allowed' : 'cursor-pointer'
                    } ${
                      idx === 0 ? 'col-start-4' : ''
                    } ${
                      isLocked
                        ? 'bg-slate-100 text-slate-400 border border-dashed border-slate-300 opacity-80'
                        : isRouletteActive
                        ? 'bg-amber-400 text-white shadow-md scale-125 ring-4 ring-amber-300 z-10'
                        : isTarget
                        ? 'bg-amber-500 text-white shadow-xs scale-105 ring-2 ring-amber-300'
                        : 'bg-amber-50/70 text-slate-700 hover:bg-amber-200 hover:text-slate-900 border border-amber-200/60'
                    }`}
                    style={{ fontFamily: "'Akoderf', sans-serif" }}
                    title={isLocked ? "Place checkmarks on all 22 main letters to unlock final letters!" : sofitLetter.letter}
                  >
                    {isLocked ? (
                      <span className="text-slate-400 font-bold" style={{ fontFamily: "'Akoderf', sans-serif" }}>?</span>
                    ) : (
                      sofitLetter.letter
                    )}
                    {exploredLettersState.has(sofitLetter.id) && !isLocked && (
                      <span
                        aria-hidden="true"
                        className="absolute -top-1 -right-1 sm:-top-1 sm:-right-1 w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full bg-emerald-500 text-white text-[8px] sm:text-[9px] font-bold flex items-center justify-center shadow-2xs z-20"
                        title="Explored"
                      >
                        ✓
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Category & All Words Filter Buttons below alphabet buttons */}
            <div className="flex flex-wrap items-center justify-center gap-1.5 pt-2.5 border-t border-amber-100">
              {(['all', '22', 'colors', 'animals', 'body', 'adjectives', 'food', 'helpers', 'heroes_villains', 'jewish', 'locations', 'numbers', 'people', 'places', 'sayings', 'sky', 'transportation', 'verbs', 'other'] as const).map((filter) => {
                const isHighlighted = selectedFilter === filter;
                const labels: Record<string, { icon?: string; image?: string; text: string }> = {
                  all: { icon: '📚', text: 'All words' },
                  '22': { icon: '🪝', text: '22' },
                  colors: { icon: '🎨', text: 'Adjectives' },
                  animals: { icon: '🦁', text: 'Animals' },
                  body: { icon: '👀👂👃', text: 'Body' },
                  adjectives: { icon: '😊', text: 'Feelings' },
                  food: { icon: '🍎', text: 'Food' },
                  helpers: { icon: '🔤', text: 'Helpers' },
                  heroes_villains: { icon: '🦸', text: 'Heroes & Villains' },
                  jewish: { icon: '✡️', text: 'Jewish' },
                  locations: { icon: '📍', text: 'Locations' },
                  numbers: { icon: '🔢', text: 'Numbers' },
                  people: { icon: '👥', text: 'People' },
                  places: { icon: '🏞️', text: 'Places' },
                  sayings: { icon: '💬', text: 'Sayings' },
                  sky: { icon: '🌤️', text: 'Sky' },
                  transportation: { icon: '🚗', text: 'Transportation' },
                  verbs: { icon: '🏃', text: 'Verbs' },
                  other: { icon: '🌟', text: 'Other' },
                };
                return (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => {
                      soundManager.playPop();
                      soundManager.speakEnglish(labels[filter].text);
                      setSelectedFilter(filter);
                      setActiveVocabPopup(null);
                      setActiveVocabInstanceId(null);
                      setExploredCategoriesState((prev) => {
                        const next = new Set([...prev, filter]);
                        onCategoryExplored?.(filter);
                        return next;
                      });
                    }}
                    title={labels[filter].text}
                    aria-label={labels[filter].text}
                    className={`relative flex items-center justify-center gap-1 sm:gap-1.5 rounded-xl text-xs sm:text-sm font-bold transition-colors cursor-pointer select-none border shadow-2xs ${
                      filter === 'all'
                        ? 'px-2.5 py-1.5 sm:px-3 sm:py-1.5'
                        : 'p-1.5 sm:px-3 sm:py-1.5 min-w-[32px] min-h-[32px] sm:min-w-0 sm:min-h-0'
                    } ${
                      isHighlighted
                        ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                        : 'bg-amber-50/70 hover:bg-amber-200 text-slate-700 hover:text-slate-900 border-amber-200/70'
                    }`}
                  >
                    {exploredCategoriesState.has(filter) && (
                      <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[9px] font-bold shadow-xs z-20">
                        ✓
                      </span>
                    )}
                    {labels[filter].image ? (
                      <img
                        src={labels[filter].image}
                        alt={labels[filter].text}
                        referrerPolicy="no-referrer"
                        className="w-4 h-4 sm:w-4.5 sm:h-4.5 object-contain shrink-0"
                      />
                    ) : (
                      <span className="text-sm sm:text-base leading-none shrink-0 inline-flex items-center justify-center tracking-tighter">{labels[filter].icon}</span>
                    )}
                    <span className={`leading-none whitespace-nowrap ${filter === 'all' ? 'inline' : 'hidden sm:inline'}`}>
                      {labels[filter].text}
                    </span>
                  </button>
                );
              })}
            </div>
          </>
        )}

      </div>

      {selectedFilter !== 'letter' ? (
        <div
          className="bg-white rounded-3xl p-6 sm:p-8 pb-14 sm:pb-20 border border-amber-200 shadow-sm space-y-6 overflow-visible no-scrollbar"
          style={{ overflow: 'visible', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          <div className="flex flex-col items-center justify-center gap-2">
            <button
              type="button"
              onClick={handleRandomAllWord}
              disabled={isSpinning || isSpinningWord}
              className={`h-7 flex items-center gap-1.5 px-3 bg-gradient-to-r from-amber-100 via-amber-100 to-amber-200 hover:from-amber-200 hover:to-amber-300 active:scale-95 text-amber-900 border border-amber-300 rounded-2xl text-xs font-bold transition-all cursor-pointer shadow-xs disabled:opacity-75 leading-none ${
                isSpinningWord ? 'scale-105 ring-2 ring-amber-400' : ''
              }`}
            >
              <Shuffle className={`w-3.5 h-3.5 text-amber-700 ${isSpinningWord ? 'animate-spin' : ''}`} />
              <span className="text-sm leading-none">🎲</span>
            </button>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-800 text-center tracking-wide">
              {selectedFilter === 'all'
                ? 'All words'
                : selectedFilter === '22'
                ? '22'
                : selectedFilter === 'heroes_villains'
                ? 'Heroes & Villains'
                : selectedFilter === 'adjectives'
                ? 'Feelings'
                : selectedFilter === 'other'
                ? 'Other'
                : selectedFilter === 'colors'
                ? 'Adjectives'
                : `${selectedFilter.charAt(0).toUpperCase() + selectedFilter.slice(1)}`}
              {selectedFilter !== '22' && ` (${filteredWords.length})`}
            </h3>
            {selectedFilter === 'all' && (
              <button
                type="button"
                onClick={() => {
                  soundManager.playPop();
                  setActiveVocabPopup(null);
                  setActiveVocabInstanceId(null);
                  setActiveCardRect(null);
                  setIsGlobalGenderArranged(!isGlobalGenderArranged);
                }}
                className="mt-1 text-xs font-bold text-amber-900 hover:text-amber-950 bg-amber-100 hover:bg-amber-200 border border-amber-300 px-3.5 py-1.5 rounded-2xl transition-all shadow-xs flex items-center gap-2 cursor-pointer"
              >
                <span>👫</span>
                <span>{isGlobalGenderArranged ? 'Show Alphabetical (א-ת)' : 'Arrange by Gender'}</span>
              </button>
            )}
          </div>

          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={selectedFilter}
              className="space-y-6 overflow-visible no-scrollbar"
              style={{ overflow: 'visible', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {(() => {
            const categoriesDef = [
              { key: '22', label: '22', icon: '🪝', badgeBg: 'bg-amber-100 text-amber-900 border-amber-300' },
              { key: 'colors', label: 'Adjectives', icon: '🎨', badgeBg: 'bg-purple-100 text-purple-800 border-purple-300' },
              { key: 'animals', label: 'Animals', icon: '🦁', badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
              { key: 'body', label: 'Body', icon: '👀👂👃', badgeBg: 'bg-amber-100 text-amber-900 border-amber-300' },
              { key: 'adjectives', label: 'Feelings', icon: '😊', badgeBg: 'bg-yellow-100 text-yellow-900 border-yellow-300' },
              { key: 'food', label: 'Food', icon: '🍎', badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
              { key: 'helpers', label: 'Helpers', icon: '🔤', badgeBg: 'bg-violet-100 text-violet-900 border-violet-300' },
              { key: 'heroes_villains', label: 'Heroes & Villains', icon: '🦸', badgeBg: 'bg-rose-100 text-rose-900 border-rose-300' },
              { key: 'jewish', label: 'Jewish', icon: '✡️', badgeBg: 'bg-blue-100 text-blue-900 border-blue-300' },
              { key: 'locations', label: 'Locations', icon: '📍', badgeBg: 'bg-cyan-100 text-cyan-900 border-cyan-300' },
              { key: 'numbers', label: 'Numbers', icon: '🔢', badgeBg: 'bg-blue-100 text-blue-800 border-blue-300' },
              { key: 'people', label: 'People', icon: '👥', badgeBg: 'bg-pink-100 text-pink-800 border-pink-300' },
              { key: 'places', label: 'Places', icon: '🏞️', badgeBg: 'bg-teal-100 text-teal-800 border-teal-300' },
              { key: 'sayings', label: 'Sayings', icon: '💬', badgeBg: 'bg-sky-100 text-sky-900 border-sky-300' },
              { key: 'sky', label: 'Sky', icon: '🌤️', badgeBg: 'bg-sky-100 text-sky-800 border-sky-300' },
              { key: 'transportation', label: 'Transportation', icon: '🚗', badgeBg: 'bg-indigo-100 text-indigo-800 border-indigo-300' },
              { key: 'verbs', label: 'Verbs', icon: '🏃', badgeBg: 'bg-orange-100 text-orange-900 border-orange-300' },
              { key: 'other', label: 'Other', icon: '🌟', badgeBg: 'bg-slate-100 text-slate-800 border-slate-300' },
            ];

            const activeCategories = selectedFilter === 'all'
              ? categoriesDef
              : categoriesDef.filter((c) => c.key === selectedFilter);

            return activeCategories.map((cat) => {
              const catWords = allWordsList.filter(({ word }) => {
                const cats = getWordCategories(word);
                if (cat.key === 'other') return cats.includes('other') || (cats.length === 0 && !cats.includes('objects'));
                if (cat.key === 'objects') return cats.includes('objects');
                return cats.includes(cat.key);
              });

              if (cat.key === 'colors') {
                const colorOrderMap: Record<string, number> = {
                  'red': 1,
                  'orange': 2, 'orange (color)': 2,
                  'yellow': 3,
                  'green': 4,
                  'blue': 5,
                  'purple': 6,
                  'pink': 7,
                  'brown': 8,
                  'black': 9,
                  'gray': 10, 'grey': 10,
                  'white': 11,
                };
                catWords.sort((a, b) => {
                  const valA = colorOrderMap[a.word.wordEn.toLowerCase()] ?? 999;
                  const valB = colorOrderMap[b.word.wordEn.toLowerCase()] ?? 999;
                  return valA - valB;
                });
              } else if (cat.key === 'numbers') {
                const numberOrderMap: Record<string, number> = {
                  'zero': 0, '0': 0,
                  'one': 1, '1': 1,
                  'two': 2, '2': 2,
                  'three': 3, '3': 3,
                  'four': 4, '4': 4,
                  'five': 5, '5': 5,
                  'six': 6, '6': 6,
                  'seven': 7, '7': 7,
                  'eight': 8, '8': 8,
                  'nine': 9, '9': 9,
                  'ten': 10, '10': 10,
                  '100': 100,
                  'one hundred': 100,
                };
                catWords.sort((a, b) => {
                  const valA = numberOrderMap[a.word.wordEn.toLowerCase()] ?? 999;
                  const valB = numberOrderMap[b.word.wordEn.toLowerCase()] ?? 999;
                  return valA - valB;
                });
              } else {
                catWords.sort((a, b) => {
                  const cleanA = a.word.wordHe.replace(/[\u0591-\u05C7]/g, '').trim();
                  const cleanB = b.word.wordHe.replace(/[\u0591-\u05C7]/g, '').trim();
                  return cleanA.localeCompare(cleanB, 'he');
                });
              }

              if (catWords.length === 0) return null;

              const currentArrangement: ArrangementType = selectedFilter === 'all'
                ? (isGlobalGenderArranged ? 'gender' : 'alphabetical')
                : (categoryArrangements[cat.key] || 'alphabetical');

              const isGenderSorted = cat.key !== 'sayings' && currentArrangement === 'gender';
              const isAlignmentSorted = currentArrangement === 'alignment';

              const heroWords: { word: WordExample, letter: LetterData }[] = [];
              const villainWords: { word: WordExample, letter: LetterData }[] = [];
              catWords.forEach(item => {
                const align = item.word.alignment || (['The Snake', 'Pharaoh', 'King Balak', 'Goliath', 'Haman', 'King Antiochus', 'Holofernes'].includes(item.word.wordEn) ? 'villain' : 'hero');
                if (align === 'villain') {
                  villainWords.push(item);
                } else {
                  heroWords.push(item);
                }
              });

              const maleWords: { word: WordExample, letter: LetterData }[] = [];
              const femaleWords: { word: WordExample, letter: LetterData }[] = [];
              const bothWords: { word: WordExample, letter: LetterData }[] = [];

              catWords.forEach(item => {
                const g = getTokenGender({
                  he: item.word.wordHe,
                  en: item.word.wordEn,
                  vocalizedHe: item.word.spokenHe,
                  gender: item.word.gender,
                });
                if (g === 'f') {
                  femaleWords.push(item);
                } else if (g === 'm') {
                  maleWords.push(item);
                } else {
                  bothWords.push(item);
                }
              });

              const renderCard = (item: { word: WordExample, letter: LetterData }, cKey: string) => {
                const { word, letter } = item;
                const wordUniqueId = getWordUniqueId(word);
                const randomizedEmoji = randomizeSkinTone(word.emoji);
                const itemInstanceId = `${cKey}-${letter.id}-${wordUniqueId}`;
                const isActive = activeVocabInstanceId === itemInstanceId;
                const isRouletteActive = isSpinningWord && (rouletteWordInstanceId === itemInstanceId || rouletteWordInstanceId === wordUniqueId || rouletteWordInstanceId === word.wordEn);
                const activeTheme = getWordPopupTheme(word);
                const isHeroesVillains = cKey === 'heroes_villains' || word.category?.includes('heroes_villains') || getWordCategories(word).includes('heroes_villains');

                const popupStyle = getWordBottomPopupStyle(word);

                return (
                  <motion.div
                    layout
                    layoutId={itemInstanceId}
                    transition={{ type: "spring", stiffness: 350, damping: 25 }}
                    id={`word-card-${itemInstanceId}`}
                    key={itemInstanceId}
                    className={`relative select-none overflow-visible ${isActive ? 'z-40' : 'z-0'}`}
                    style={{ overflow: 'visible', zIndex: isActive ? 40 : 1 }}
                  >
                    <button
                      type="button"
                      onClick={(e) => {
                        const cardEl = ((e.currentTarget as HTMLElement).closest('[id^="word-card-"]') as HTMLElement) || (e.currentTarget as HTMLElement);
                        if (cardEl) {
                          setActiveCardRect(cardEl.getBoundingClientRect());
                        }
                        const freshEmoji = randomizeSkinTone(word.emoji, buttonEmojiMap[wordUniqueId]);
                        setButtonEmojiMap((prev) => ({ ...prev, [wordUniqueId]: freshEmoji }));
                        setPopKey((prev) => prev + 1);
                        setActiveVocabPopup(word);
                        setActiveVocabInstanceId(itemInstanceId);
                        playWordPopSound(word);
                        soundManager.speakHebrew(word.ttsOverride || word.ttsText || word.speakText || word.spokenHe || word.wordHe);
                        setExploredWordsState((prev) => {
                          const next = new Set([...prev, word.wordEn]);
                          onWordExplored?.(word.wordEn);
                          return next;
                        });
                        setExploredCategoriesState((prev) => {
                          const next = new Set([...prev, cKey]);
                          onCategoryExplored?.(cKey);
                          return next;
                        });
                        setExploredLettersState((prev) => {
                          const next = new Set([...prev, letter.id]);
                          onLetterExplored?.(letter.id);
                          return next;
                        });
                      }}
                      style={{
                        userSelect: 'none',
                        WebkitUserSelect: 'none',
                      }}
                      className={`vocab-grid-item select-none aspect-square w-full rounded-2xl border-2 flex items-center justify-center cursor-pointer transition-all duration-150 active:scale-95 shadow-xs ${
                        isRouletteActive
                          ? 'bg-amber-400 border-amber-500 ring-4 ring-amber-300 scale-110 shadow-md z-10'
                          : isActive
                          ? 'bg-amber-400 border-amber-500 ring-2 ring-amber-300 scale-100 shadow-md z-10'
                          : 'bg-white hover:bg-amber-50 border-amber-200/80 hover:scale-105'
                      }`}
                    >
                      {exploredWordsState.has(word.wordEn) && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-bold shadow-xs z-20 pointer-events-none">
                          ✓
                        </div>
                      )}
                      {(() => {
                        const locationLabel = getLocationCardLabel(word) || word.cardLabel;
                        const hasCardLabel = isHeroesVillains || !!locationLabel;
                        const cardLabelText = locationLabel || stripHonorificPrefix(word.wordEn);

                        if (hasCardLabel) {
                          return (
                            <div className="flex flex-col items-center justify-center p-0.5 w-full h-full text-center overflow-clip select-none" style={{ userSelect: 'none', WebkitUserSelect: 'none' }}>
                              {word.image ? (
                                <img
                                  src={word.image}
                                  alt={word.wordEn}
                                  referrerPolicy="no-referrer"
                                  draggable={false}
                                  style={{ WebkitUserDrag: 'none', userSelect: 'none', WebkitUserSelect: 'none' } as React.CSSProperties}
                                  className="w-7 h-7 sm:w-8 sm:h-8 object-contain rounded-lg select-none pointer-events-none"
                                />
                              ) : (
                                <span
                                  dir="ltr"
                                  className="text-lg sm:text-xl font-bold font-hebrew select-none filter drop-shadow-2xs leading-none inline-flex items-center justify-center tracking-tight"
                                  style={{ fontFamily: "'Akoderf', sans-serif", userSelect: 'none', WebkitUserSelect: 'none' }}
                                >
                                  {buttonEmojiMap[wordUniqueId] || randomizedEmoji}
                                </span>
                              )}
                              <span
                                className="text-[8px] sm:text-[9px] font-bold text-slate-800 leading-[1.1] whitespace-normal text-center max-w-full mt-0.5 px-0.5 select-none"
                                style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
                              >
                                {cardLabelText}
                              </span>
                            </div>
                          );
                        }
                        if (word.image) {
                          return (
                            <img
                              src={word.image}
                              alt={word.wordEn}
                              referrerPolicy="no-referrer"
                              draggable={false}
                              style={{ WebkitUserDrag: 'none', userSelect: 'none', WebkitUserSelect: 'none' } as React.CSSProperties}
                              className="w-10 h-10 sm:w-12 sm:h-12 object-contain p-0.5 rounded-xl mt-1 select-none pointer-events-none"
                            />
                          );
                        }
                        if (word.emoji) {
                          return (
                            <span
                              dir="ltr"
                              className="text-xl sm:text-2xl md:text-3xl font-bold font-hebrew select-none filter drop-shadow-2xs leading-tight inline-flex flex-col items-center justify-center tracking-tight whitespace-nowrap"
                              style={{ fontFamily: "'Akoderf', sans-serif", userSelect: 'none', WebkitUserSelect: 'none' }}
                            >
                              {buttonEmojiMap[wordUniqueId] || randomizedEmoji}
                            </span>
                          );
                        }
                        return (
                          <span
                            className="text-2xl sm:text-3xl md:text-4xl font-bold font-hebrew text-slate-900 select-none filter drop-shadow-2xs leading-none mt-1 inline-flex items-center justify-center tracking-tight"
                            style={{ fontFamily: "'Akoderf', sans-serif", userSelect: 'none', WebkitUserSelect: 'none' }}
                          >
                            {stripNiqqud(word.wordHe)}
                          </span>
                        );
                      })()}
                    </button>

                    {/* Fallback inline Popup Box if portal rect not yet ready */}
                    {isActive && !activeCardRect && (
                      <div
                        key={`fallback-popup-${wordUniqueId}-${popKey}`}
                        onClick={() => {
                          setActiveVocabPopup(null);
                          setActiveVocabInstanceId(null);
                          setActiveCardRect(null);
                        }}
                        style={{ ...popupStyle, cursor: 'default' }}
                        className={`vocab-popup-bubble absolute bottom-full mb-2.5 left-1/2 w-44 z-50 pointer-events-auto cursor-default select-none ${getWordBottomPopupClass(word)}`}
                      >
                        <div
                          key={`fallback-burst-${wordUniqueId}-${popKey}`}
                          className={`relative ${activeTheme.bg} rounded-2xl shadow-xl border-2 ${activeTheme.border} p-3 text-center animate-pop-burst cursor-default`}
                        >
                          <div
                            key={`fallback-ring-${popKey}`}
                            className={`absolute inset-0 rounded-2xl ring-4 ${activeTheme.ring} animate-ring-burst pointer-events-none -z-10`}
                          />

                          <div
                            className={`text-2xl md:text-3xl font-bold ${activeTheme.textHe} leading-tight font-hebrew pt-0.5 cursor-default`}
                            style={{ fontFamily: "'Akoderf', sans-serif" }}
                          >
                            {stripNiqqud(word.wordHe || word.spokenHe)}
                          </div>

                          <div className={`text-xs md:text-sm font-bold ${activeTheme.textEn} leading-tight mt-1`}>
                            {word.wordEn}
                          </div>

                          {/* Downward-pointing arrow notch */}
                          <div className={`absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 ${activeTheme.arrowBg} border-b-2 border-r-2 ${activeTheme.arrowBorder} transform rotate-45 pointer-events-none`} />
                        </div>
                      </div>
                    )}
                  </motion.div>
                );
              };

              return (
                <LayoutGroup id={`cat-layout-${cat.key}`} key={cat.key}>
                  <div
                    className="space-y-3 overflow-visible no-scrollbar"
                    style={{ overflow: 'visible', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                  >
                    {selectedFilter === 'all' && (
                      <div className="flex flex-col gap-1.5 pb-2 border-b border-amber-100">
                        <div className="flex items-center gap-2">
                          <span className={`px-3 py-1 rounded-2xl text-xs sm:text-sm font-bold border flex items-center gap-1.5 shadow-2xs ${cat.badgeBg}`}>
                            <span>{cat.icon}</span>
                            <span>{cat.label}</span>
                            {cat.key !== '22' && (
                              <span className="opacity-75 font-bold">({catWords.length})</span>
                            )}
                            {exploredCategoriesState.has(cat.key) && (
                              <span className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-bold ml-1">✓</span>
                            )}
                          </span>
                        </div>
                      </div>
                    )}

                    {selectedFilter !== 'all' && cat.key !== 'sayings' && (
                      <div className="flex justify-center items-center gap-2 mb-4 flex-wrap">
                        <button
                          type="button"
                          onClick={() => toggleCategoryArrangement(cat.key, 'gender')}
                          className={`text-xs font-bold px-3.5 py-1.5 rounded-xl transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer border ${
                            currentArrangement === 'gender'
                              ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                              : 'text-amber-800 hover:text-amber-950 bg-amber-50 hover:bg-amber-100 border-amber-200'
                          }`}
                        >
                          <span>🚻</span>
                          <span>{currentArrangement === 'gender' ? 'Show Alphabetical (א-ת)' : 'Arrange by Gender'}</span>
                        </button>
                        {(cat.key === 'heroes_villains' || selectedFilter === 'heroes_villains') && (
                          <button
                            type="button"
                            onClick={() => toggleCategoryArrangement(cat.key, 'alignment')}
                            className={`text-xs font-bold px-3.5 py-1.5 rounded-xl transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer border ${
                              currentArrangement === 'alignment'
                                ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                                : 'text-amber-800 hover:text-amber-950 bg-amber-50 hover:bg-amber-100 border-amber-200'
                            }`}
                          >
                            <span>⚖️</span>
                            <span>{currentArrangement === 'alignment' ? 'Show Alphabetical (א-ת)' : 'Arrange by Alignment'}</span>
                          </button>
                        )}
                      </div>
                    )}

                    {isAlignmentSorted ? (
                      <motion.div
                        layout
                        className="space-y-3 overflow-visible no-scrollbar"
                        style={{ overflow: 'visible', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                      >
                        <motion.div
                          layout
                          initial={{ opacity: 0, y: -8, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          transition={{ duration: 0.22 }}
                          className="grid grid-cols-2 text-center font-bold text-xs text-amber-900 bg-amber-100/70 py-1.5 rounded-xl border border-amber-200 divide-x divide-amber-300/70 shadow-2xs"
                        >
                          <div className="px-3">Heroes 🦸 ({heroWords.length})</div>
                          <div className="px-3">Villains 🦹 ({villainWords.length})</div>
                        </motion.div>

                        <motion.div
                          layout
                          className="grid grid-cols-2 gap-4 items-start overflow-visible no-scrollbar"
                          style={{ overflow: 'visible', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                        >
                          <div
                            className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pr-4 border-r-2 border-amber-300/70 overflow-visible no-scrollbar"
                            style={{ overflow: 'visible', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                          >
                            {heroWords.map((item) => renderCard(item, cat.key))}
                          </div>
                          <div
                            className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pl-4 overflow-visible no-scrollbar"
                            style={{ overflow: 'visible', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                          >
                            {villainWords.map((item) => renderCard(item, cat.key))}
                          </div>
                        </motion.div>
                      </motion.div>
                    ) : isGenderSorted ? (
                      <motion.div
                        layout
                        className="space-y-3 overflow-visible no-scrollbar"
                        style={{ overflow: 'visible', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                      >
                        <motion.div
                          layout
                          initial={{ opacity: 0, y: -8, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          transition={{ duration: 0.22 }}
                          className="grid grid-cols-2 text-center font-bold text-xs text-amber-900 bg-amber-100/70 py-1.5 rounded-xl border border-amber-200 divide-x divide-amber-300/70 shadow-2xs"
                        >
                          <div className="px-3">{cat.key === 'people' ? 'Male' : 'Masculine'} 👦 ({maleWords.length})</div>
                          <div className="px-3">{cat.key === 'people' ? 'Female' : 'Feminine'} 👧 ({femaleWords.length})</div>
                        </motion.div>

                        <motion.div
                          layout
                          className="grid grid-cols-2 gap-4 items-start overflow-visible no-scrollbar"
                          style={{ overflow: 'visible', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                        >
                          {/* Masculine Column (left side) */}
                          <div
                            className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pr-4 border-r-2 border-amber-300/70 overflow-visible no-scrollbar"
                            style={{ overflow: 'visible', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                          >
                            {maleWords.map((item) => renderCard(item, cat.key))}
                          </div>

                          {/* Feminine Column (right side) */}
                          <div
                            className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pl-4 overflow-visible no-scrollbar"
                            style={{ overflow: 'visible', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                          >
                            {femaleWords.map((item) => renderCard(item, cat.key))}
                          </div>
                        </motion.div>

                        {bothWords.length > 0 && (
                          <motion.div
                            layout
                            className="pt-2 overflow-visible no-scrollbar"
                            style={{ overflow: 'visible', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                          >
                            <div className="text-xs font-bold text-slate-500 mb-2">Neutral / Both:</div>
                            <div
                              className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-7 lg:grid-cols-8 gap-3 sm:gap-3.5 overflow-visible no-scrollbar"
                              style={{ overflow: 'visible', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                            >
                              {bothWords.map((item) => renderCard(item, cat.key))}
                            </div>
                          </motion.div>
                        )}
                      </motion.div>
                    ) : (
                      <motion.div
                        layout
                        className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-7 lg:grid-cols-8 gap-3 sm:gap-3.5 overflow-visible no-scrollbar"
                        style={{ overflow: 'visible', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                      >
                        {catWords.map((item) => renderCard(item, cat.key))}
                      </motion.div>
                    )}
                  </div>
                </LayoutGroup>
              );
            });
          })()}
            </motion.div>
          </AnimatePresence>

          {/* React Portal for Active Vocab Card Popup in Category View (Smart Vertical Positioning & Immune to Clipping) */}
          {typeof document !== 'undefined' &&
            activeVocabPopup &&
            activeVocabInstanceId &&
            !activeVocabInstanceId.startsWith('sidebar-') &&
            activeCardRect &&
            createPortal(
              (() => {
                const isTopRowOrCloseToTop = activeCardRect.top < 190;
                const activeTheme = getWordPopupTheme(activeVocabPopup);
                const cardCenterX = activeCardRect.left + activeCardRect.width / 2;
                // Keep popup horizontally within viewport padding (popup width is 176px, radius 88px + 12px margin = 100px)
                const clampedCenterX = Math.max(100, Math.min(window.innerWidth - 100, cardCenterX));
                const notchLeftOffset = Math.max(16, Math.min(160, 88 + (cardCenterX - clampedCenterX)));

                const transformOrigin = isTopRowOrCloseToTop ? 'top center' : 'bottom center';
                const scaleStyle = isWordBig(activeVocabPopup)
                  ? 'scale(1.5)'
                  : isWordSmall(activeVocabPopup)
                  ? 'scale(0.5)'
                  : 'scale(1)';

                return (
                  <div className="fixed inset-0 pointer-events-none z-[1000]">
                    {/* Floating popup box - pointer-events-auto only on the bubble itself, allowing cards underneath to be tapped instantly */}
                    <div
                      key={`portal-popup-${getWordUniqueId(activeVocabPopup)}-${popKey}`}
                      ref={popupRef}
                      onClick={() => {
                        setActiveVocabPopup(null);
                        setActiveVocabInstanceId(null);
                        setActiveCardRect(null);
                      }}
                      style={{
                        position: 'fixed',
                        left: `${clampedCenterX}px`,
                        top: isTopRowOrCloseToTop ? `${activeCardRect.bottom + 10}px` : undefined,
                        bottom: !isTopRowOrCloseToTop ? `${Math.max(10, window.innerHeight - activeCardRect.top + 10)}px` : undefined,
                        transform: `translateX(-50%) ${scaleStyle}`,
                        transformOrigin,
                        maxWidth: '90vw',
                        cursor: 'default',
                      }}
                      className={`vocab-popup-bubble w-44 pointer-events-auto cursor-default select-none ${getWordBottomPopupClass(activeVocabPopup)}`}
                    >
                      <div
                        key={`burst-card-${getWordUniqueId(activeVocabPopup)}-${popKey}`}
                        className={`relative ${activeTheme.bg} rounded-2xl shadow-xl border-2 ${activeTheme.border} p-3 text-center animate-pop-burst cursor-default`}
                      >
                        <div
                          key={`ring-${popKey}`}
                          className={`absolute inset-0 rounded-2xl ring-4 ${activeTheme.ring} animate-ring-burst pointer-events-none -z-10`}
                        />

                        <div
                          className={`text-2xl md:text-3xl font-bold ${activeTheme.textHe} leading-tight font-hebrew pt-0.5 cursor-default`}
                          style={{ fontFamily: "'Akoderf', sans-serif" }}
                        >
                          {stripNiqqud(activeVocabPopup.wordHe || activeVocabPopup.spokenHe)}
                        </div>

                        <div className={`text-xs md:text-sm font-bold ${activeTheme.textEn} leading-tight mt-1`}>
                          {activeVocabPopup.wordEn}
                        </div>

                        {/* Smart Arrow Notch */}
                        {isTopRowOrCloseToTop ? (
                          <div
                            style={{ left: `${notchLeftOffset}px` }}
                            className={`absolute -top-1.5 -translate-x-1/2 w-3 h-3 ${activeTheme.arrowBg} border-t-2 border-l-2 ${activeTheme.arrowBorder} transform rotate-45 pointer-events-none`}
                          />
                        ) : (
                          <div
                            style={{ left: `${notchLeftOffset}px` }}
                            className={`absolute -bottom-1.5 -translate-x-1/2 w-3 h-3 ${activeTheme.arrowBg} border-b-2 border-r-2 ${activeTheme.arrowBorder} transform rotate-45 pointer-events-none`}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })(),
              document.body
            )}
        </div>
      ) : (
        /* Main Flashcard Stage: Wide layout puts Vocab Buttons on the Right when unlocked */
        <div className={isExploreUnlocked ? "grid grid-cols-1 md:grid-cols-12 gap-5 items-start" : "flex justify-center w-full"}>
          {/* Left / Center Area: Consistent Shape Letter Card across all letters */}
          <div
            onClick={handleLetterClick}
            className={`${
              isExploreUnlocked ? "md:col-span-7 lg:col-span-8" : "w-full max-w-2xl mx-auto"
            } rounded-3xl p-4 sm:p-8 border-2 shadow-sm flex flex-col items-center justify-between text-center relative overflow-hidden min-h-[220px] sm:min-h-[440px] w-full transition-colors duration-200 cursor-pointer`}
            style={{ backgroundColor: currentLetter.bgLight, borderColor: currentLetter.borderColor }}
          >
          {/* Letter Title Header - centered across whole box */}
          <div className="w-full relative flex items-center justify-center min-h-[36px] z-10">
            {currentLetter.sofitLetter && (devModeEnabled || hasUnlockedFullCurriculum || coreLettersCheckedCount >= 22) && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveVocabPopup(null);
                  setActiveVocabInstanceId(null);
                  const sofitLetterData = SOFIT_LETTERS.find(s => s.letter === currentLetter.sofitLetter);
                  if (sofitLetterData) {
                    onSelectLetter(sofitLetterData);
                    onLetterExplored(sofitLetterData.id);
                    setExploredLettersState((prev) => new Set([...prev, sofitLetterData.id]));
                    soundManager.speakLetter(sofitLetterData.letter);
                  }
                }}
                className="absolute left-0 top-1/2 -translate-y-1/2 text-xs font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-300 px-2.5 py-1 rounded-xl shadow-2xs whitespace-nowrap cursor-pointer transition-all hover:scale-105 active:scale-95 z-20"
                title={`Go to ${currentLetter.sofitNameEn || currentLetter.sofitLetter}`}
              >
                Final Form: <span className="text-sm font-bold text-amber-900 font-hebrew" style={{ fontFamily: "'Akoderf', sans-serif" }}>{currentLetter.sofitLetter}</span>
              </button>
            )}
            <div className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight text-center">
              <span style={{ color: currentLetter.color }}>{currentLetter.nameEn.toLowerCase()}</span>
            </div>
          </div>

          {/* Giant Print Letter (Clicking speaks ONLY letter name) */}
          <div className="my-auto py-3 sm:py-6 relative group z-10 pointer-events-none select-none">
            <div
              className="transform group-hover:scale-105 active:scale-95 transition-transform relative"
            >
              <div
                className={`text-8xl sm:text-[140px] md:text-[160px] font-bold leading-none drop-shadow-sm select-none transition-all ${
                  isPronouncingLetter ? 'scale-110 text-amber-500' : ''
                }`}
                style={{
                  color: isPronouncingLetter ? '#F59E0B' : currentLetter.color,
                  fontFamily: "'Akoderf', sans-serif",
                }}
              >
                {currentLetter.letter || (currentLetter.id === 'alef' ? 'א' : '')}
              </div>
            </div>
          </div>

          {currentLetter.youtubeUrl && (
            <div className="absolute bottom-4 left-4 z-20">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if ((window as any).openVideoModal) {
                    (window as any).openVideoModal(currentLetter);
                  } else {
                    onOpenVideo(currentLetter.youtubeUrl!);
                  }
                }}
                className="hover:scale-105 active:scale-95 transition-transform flex items-center justify-center cursor-pointer p-0 bg-transparent border-0 outline-none"
                title="Play video"
              >
                <img
                  src={
                    ['bet', 'dalet', 'vav', 'chet', 'yod', 'lamed', 'nun', 'ayin', 'tsadi', 'resh', 'tav'].includes(currentLetter.id) ||
                    ['ב', 'ד', 'ו', 'ח', 'י', 'ל', 'נ', 'ע', 'צ', 'ר', 'ת'].some((l) => currentLetter.letter.includes(l))
                      ? 'https://i.imgur.com/04nTIWq.png'
                      : 'https://i.imgur.com/aXKFshC.png'
                  }
                  alt="Play video"
                  referrerPolicy="no-referrer"
                  className="h-12 w-auto object-contain block drop-shadow-sm select-none"
                />
              </button>
            </div>
          )}
        </div>

        {/* Right Area: Vocabulary Icon Buttons Sidebar (ONLY RENDERED WHEN UNLOCKED) */}
        {isExploreUnlocked && (
          <div
            className="md:col-span-5 lg:col-span-4 bg-amber-50/60 rounded-3xl p-4 sm:p-5 border border-amber-200/80 shadow-xs flex flex-col justify-start gap-3 relative z-35 self-start"
          >
            <div ref={sidebarRef} className="flex flex-col gap-2.5 relative">
              <div className="flex items-center justify-between min-h-[28px] pb-0.5 w-full">
                <span className="text-xs font-bold text-amber-800 tracking-wide select-none">
                  VOCABULARY ({allWords.length})
                </span>
                <button
                  type="button"
                  onClick={handleRandomSidebarWord}
                  disabled={isSpinning || isSpinningWord || allWords.length === 0}
                  className={`h-6 flex items-center gap-1 px-2 bg-gradient-to-r from-amber-100 via-amber-100 to-amber-200 hover:from-amber-200 hover:to-amber-300 active:scale-95 text-amber-900 border border-amber-300 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs disabled:opacity-75 leading-none ${
                    isSpinningWord ? 'scale-105 ring-2 ring-amber-400' : ''
                  }`}
                  title="Pick a random word"
                >
                  <Shuffle className={`w-3 h-3 text-amber-700 ${isSpinningWord ? 'animate-spin' : ''}`} />
                  <span className="text-xs leading-none">🎲</span>
                </button>
              </div>

              {/* Grid of clean image/emoji buttons with ZERO text, NEVER blocked */}
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-3 lg:grid-cols-3 gap-2.5">
                {allWords.map((word, idx) => {
                  const wordUniqueId = getWordUniqueId(word);
                  const itemInstanceId = `sidebar-${wordUniqueId}`;
                  const isActive = activeVocabInstanceId === itemInstanceId || (!activeVocabInstanceId && activeVocabPopup && getWordUniqueId(activeVocabPopup) === wordUniqueId);
                  const isRouletteActive = isSpinningWord && (rouletteWordInstanceId === itemInstanceId || rouletteWordInstanceId === wordUniqueId);
                  const activeTheme = getWordPopupTheme(word);
                  const isHeroesVillains = word.category?.includes('heroes_villains') || getWordCategories(word).includes('heroes_villains');

                  return (
                    <div id={`word-card-${itemInstanceId}`} key={wordUniqueId + '-' + idx} className="relative">
                      <button
                        type="button"
                        onClick={(e) => handleVocabClick(word, e)}
                       onMouseDown={(e) => {
  if (e.detail > 1) {
    e.preventDefault();
  }
}}
                        style={{
                          userSelect: 'none',
                          WebkitUserSelect: 'none',
                        }}
                        className={`vocab-grid-item select-none aspect-square w-full rounded-2xl flex items-center justify-center cursor-pointer transition-all duration-150 active:scale-95 shadow-2xs border ${
                          isRouletteActive
                            ? 'bg-amber-400 border-amber-500 ring-4 ring-amber-300 scale-110 shadow-md z-10'
                            : isActive
                            ? 'bg-amber-400 border-amber-500 ring-2 ring-amber-300 scale-100 shadow-xs z-10'
                            : 'bg-white hover:bg-amber-100/70 border-amber-200/80 hover:scale-105'
                        }`}
                      >
                        {exploredWordsState.has(word.wordEn) && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-bold shadow-xs z-20 pointer-events-none">
                            ✓
                          </div>
                        )}
                        {(() => {
                          const locationLabel = getLocationCardLabel(word) || word.cardLabel;
                          const hasCardLabel = isHeroesVillains || !!locationLabel;
                          const cardLabelText = locationLabel || stripHonorificPrefix(word.wordEn);

                          if (hasCardLabel) {
                            return (
                              <div className="flex flex-col items-center justify-center p-0.5 w-full h-full text-center overflow-hidden select-none" style={{ userSelect: 'none', WebkitUserSelect: 'none' }}>
                                {word.image ? (
                                  <img
                                    src={word.image}
                                    alt={word.wordEn}
                                    referrerPolicy="no-referrer"
                                    draggable={false}
                                    style={{ WebkitUserDrag: 'none', userSelect: 'none', WebkitUserSelect: 'none' } as React.CSSProperties}
                                    className="w-7 h-7 sm:w-8 sm:h-8 object-contain rounded-lg select-none pointer-events-none"
                                  />
                                ) : (
                                  <span
                                    dir="ltr"
                                    className="text-lg sm:text-xl font-bold font-hebrew filter drop-shadow-2xs leading-none inline-flex items-center justify-center tracking-tight select-none pointer-events-none"
                                    style={{ fontFamily: "'Akoderf', sans-serif", userSelect: 'none', WebkitUserSelect: 'none' }}
                                  >
                                    {buttonEmojiMap[wordUniqueId] || word.emoji}
                                  </span>
                                )}
                                <span
                                  className="text-[8px] sm:text-[9px] font-bold text-slate-800 leading-[1.1] whitespace-normal text-center max-w-full mt-0.5 px-0.5 select-none"
                                  style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
                                >
                                  {cardLabelText}
                                </span>
                              </div>
                            );
                          }
                          if (word.image) {
                            return (
                              <img
                                src={word.image}
                                alt={word.wordEn}
                                referrerPolicy="no-referrer"
                                draggable={false}
                                style={{ WebkitUserDrag: 'none', userSelect: 'none', WebkitUserSelect: 'none' } as React.CSSProperties}
                                className="w-10 h-10 sm:w-11 sm:h-11 object-contain p-0 rounded-lg select-none pointer-events-none"
                              />
                            );
                          }
                          if (word.emoji) {
                            return (
                              <span
                                dir="ltr"
                                className="text-xl sm:text-2xl md:text-3xl font-bold font-hebrew filter drop-shadow-2xs leading-tight inline-flex flex-col items-center justify-center tracking-tight whitespace-nowrap select-none"
                                style={{ fontFamily: "'Akoderf', sans-serif", userSelect: 'none', WebkitUserSelect: 'none' }}
                              >
                                {buttonEmojiMap[wordUniqueId] || word.emoji}
                              </span>
                            );
                          }
                          return (
                            <span
                              className="text-2xl sm:text-3xl md:text-4xl font-bold font-hebrew text-slate-900 filter drop-shadow-2xs leading-none inline-flex items-center justify-center tracking-tight select-none"
                              style={{ fontFamily: "'Akoderf', sans-serif", userSelect: 'none', WebkitUserSelect: 'none' }}
                            >
                              {stripNiqqud(word.wordHe)}
                            </span>
                          );
                        })()}
                      </button>

                      {/* Mobile Floating Burst Dialog Box:
                          - On Mobile (narrow screens only): pops up RIGHT ABOVE the clicked icon with downward arrow */}
                      {isActive && (
                        <div
                          key={`mobile-sidebar-popup-${wordUniqueId}-${popKey}`}
                          ref={popupRef}
                          onClick={() => {
                            setActiveVocabPopup(null);
                            setActiveVocabInstanceId(null);
                          }}
                          style={{ ...getWordBottomPopupStyle(word), cursor: 'default' }}
                          className={`vocab-popup-bubble md:hidden absolute bottom-full mb-2.5 left-1/2 w-40 sm:w-44 z-50 pointer-events-auto cursor-default select-none ${getWordBottomPopupClass(word)}`}
                        >
                          <div
                            key={`burst-card-${word.wordEn}-${popKey}`}
                            className={`relative ${activeTheme.bg} rounded-2xl shadow-xl border-2 ${activeTheme.border} p-2.5 sm:p-3 text-center animate-pop-burst cursor-default`}
                          >
                            {/* Glowing ring burst */}
                            <div
                              key={`ring-${popKey}`}
                              className={`absolute inset-0 rounded-2xl ring-4 ${activeTheme.ring} animate-ring-burst pointer-events-none -z-10`}
                            />

                            <div className="relative">
                              {/* Hebrew Word */}
                              <div
                                className={`text-2xl sm:text-3xl font-bold ${activeTheme.textHe} leading-tight font-hebrew pt-0.5 cursor-default`}
                                style={{ fontFamily: "'Akoderf', sans-serif" }}
                              >
                                {stripNiqqud(word.wordHe || word.spokenHe)}
                              </div>

                              {/* English Definition */}
                              <div className={`text-xs sm:text-sm font-bold ${activeTheme.textEn} leading-tight mt-1`}>
                                {word.wordEn}
                              </div>
                            </div>

                            {/* Mobile: Downward-pointing arrow */}
                            <div className={`absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 ${activeTheme.arrowBg} border-b-2 border-r-2 ${activeTheme.arrowBorder} transform rotate-45 pointer-events-none`} />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Wide Screen Desktop Vocab Popup (md: screens and up):
                  Positioned to the LEFT of the entire icon stack,
                  vertically aligned with the clicked button,
                  NEVER covering any icons in the stack! */}
              {activeVocabPopup && (
                <div
                  key={`desktop-sidebar-popup-${getWordUniqueId(activeVocabPopup)}-${popKey}`}
                  ref={popupRef}
                  onClick={() => {
                    setActiveVocabPopup(null);
                    setActiveVocabInstanceId(null);
                  }}
                  style={{ ...getWordSidePopupStyle(activeVocabPopup, activeButtonY), cursor: 'default' }}
                  className={`vocab-popup-bubble hidden md:block absolute right-full mr-3.5 w-44 lg:w-48 z-50 pointer-events-auto cursor-default select-none ${getWordSidePopupClass(activeVocabPopup)}`}
                >
                  {(() => {
                    const popupTheme = getWordPopupTheme(activeVocabPopup);
                    return (
                      <div
                        key={`desktop-burst-card-${activeVocabPopup.wordEn}-${popKey}`}
                        className={`relative ${popupTheme.bg} rounded-2xl shadow-xl border-2 ${popupTheme.border} p-3 text-center animate-pop-burst cursor-default`}
                      >
                        {/* Glowing ring burst */}
                        <div
                          key={`desktop-ring-${popKey}`}
                          className={`absolute inset-0 rounded-2xl ring-4 ${popupTheme.ring} animate-ring-burst pointer-events-none -z-10`}
                        />

                        <div className="relative">
                          {/* Hebrew Word */}
                          <div
                            className={`text-2xl md:text-3xl font-bold ${popupTheme.textHe} leading-tight font-hebrew pt-0.5 cursor-default`}
                            style={{ fontFamily: "'Akoderf', sans-serif" }}
                          >
                            {stripNiqqud(activeVocabPopup.wordHe || activeVocabPopup.spokenHe)}
                          </div>

                          {/* English Definition */}
                          <div className={`text-xs md:text-sm font-bold ${popupTheme.textEn} leading-tight mt-1`}>
                            {activeVocabPopup.wordEn}
                          </div>
                        </div>

                        {/* Right-pointing arrow notch towards the icon stack */}
                        <div
                          className={`absolute top-1/2 -translate-y-1/2 -right-1.5 w-3 h-3 ${popupTheme.arrowBg} border-t-2 border-r-2 ${popupTheme.arrowBorder} transform rotate-45 pointer-events-none`}
                        />
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      )}
    </div>
  );
};
