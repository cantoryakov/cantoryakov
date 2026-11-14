import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Volume2, RotateCcw, CheckCircle2, CheckSquare, Square } from 'lucide-react';
import { LetterData, WordExample } from '../types';
import { soundManager } from '../utils/audio';
import { fireCelebrationConfetti } from '../utils/confetti';
import { randomizeSkinTone } from '../utils/emoji';
import { getLocationCardLabel, stripHonorificPrefix, getExploreWordCategories, getAllExploreWords } from '../utils/hebrew';
import { SOFIT_LETTERS } from '../data/alefbet';

export interface MatchCategoryItem {
  key: string;
  icon: string;
  label: string;
}

// Exactly matching categories from Explore (LetterExplorer), strictly excluding proper nouns (Heroes & Villains, Locations)
export const MATCH_CATEGORIES: MatchCategoryItem[] = [
  { key: '22', icon: '🪝', label: '22' },
  { key: 'colors', icon: '🎨', label: 'Adjectives' },
  { key: 'animals', icon: '🦁', label: 'Animals' },
  { key: 'body', icon: '👀👂👃', label: 'Body' },
  { key: 'adjectives', icon: '😊', label: 'Feelings' },
  { key: 'food', icon: '🍎', label: 'Food' },
  { key: 'helpers', icon: '🔤', label: 'Helpers' },
  { key: 'jewish', icon: '✡️', label: 'Jewish' },
  { key: 'numbers', icon: '🔢', label: 'Numbers' },
  { key: 'people', icon: '👥', label: 'People' },
  { key: 'places', icon: '🏞️', label: 'Places' },
  { key: 'sayings', icon: '💬', label: 'Sayings' },
  { key: 'sky', icon: '🌤️', label: 'Sky' },
  { key: 'transportation', icon: '🚗', label: 'Transportation' },
  { key: 'verbs', icon: '🏃', label: 'Verbs' },
  { key: 'other', icon: '🌟', label: 'Other' },
];

/**
 * Evaluates whether a vocabulary word is a proper noun (Heroes & Villains or Locations)
 * that is strictly forbidden from appearing anywhere in Match drills (questions or distractors).
 */
export const isMatchExcludedWord = (word: WordExample | undefined | null): boolean => {
  if (!word) return true;
  if (word.category === 'heroes_villains' || word.category === 'locations') return true;
  const cats = getExploreWordCategories(word);
  return cats.includes('heroes_villains') || cats.includes('locations');
};

export const wordMatchesCategories = (word: WordExample, catKeys: Set<string>): boolean => {
  if (catKeys.size === 0) return false;
  if (isMatchExcludedWord(word)) return false;
  const cats = getExploreWordCategories(word);
  if (catKeys.has('other') && (cats.length === 0 || cats.includes('other') || cats.includes('objects'))) {
    return true;
  }
  return cats.some((c) => catKeys.has(c));
};

export function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = result[i];
    result[i] = result[j];
    result[j] = temp;
  }
  return result;
}

export const noDragCardStyle: React.CSSProperties = {
  userSelect: 'none',
  WebkitUserSelect: 'none',
  touchAction: 'manipulation',
  ...({ WebkitUserDrag: 'none' } as React.CSSProperties),
};

export interface MatchGameProps {
  letters: LetterData[];
  selectedLetterIds: Set<string>;
  onUpdateSelectedLetterIds: (updater: Set<string> | ((prev: Set<string>) => Set<string>)) => void;
  selectedModes: Set<MatchSubMode>;
  onUpdateSelectedModes: (updater: Set<MatchSubMode> | ((prev: Set<MatchSubMode>) => Set<MatchSubMode>)) => void;
  matchScore?: number;
  onUpdateMatchScore?: (updater: number | ((prev: number) => number)) => void;
  isActive?: boolean;
  devModeEnabled?: boolean;
}

export interface QuestionOption {
  id: string;
  letter?: string;
  wordEn?: string;
  wordHe?: string;
  spokenHe?: string;
  transliteration?: string;
  emoji?: string;
  image?: string;
  category?: string;
  cardLabel?: string;
  ttsOverride?: string;
  isCorrect: boolean;
}

/**
 * Returns custom label text if the card qualifies to display one (matching Explore):
 * - Characters in Heroes & Villains (proper names / titles with honorifics stripped)
 * - Designated Places (e.g. Tel Aviv, Jerusalem, TLV, Haifa, or items with explicit cardLabel)
 * Returns null for all standard vocabulary categories (e.g. Feelings, Animals, Food, Body).
 */
export const getCardDisplayLabel = (
  item?: { wordEn?: string; wordHe?: string; category?: string; cardLabel?: string } | null
): string | null => {
  if (!item) return null;
  const locationLabel = getLocationCardLabel(item) || item.cardLabel;
  const isHeroesVillains =
    item.category?.includes('heroes_villains') ||
    (item.wordEn
      ? getExploreWordCategories({ wordEn: item.wordEn, wordHe: item.wordHe || '', category: item.category }).includes('heroes_villains')
      : false);

  if (locationLabel) {
    return locationLabel;
  }
  if (isHeroesVillains && item.wordEn) {
    return stripHonorificPrefix(item.wordEn);
  }
  return null;
};

export interface Question {
  id: string;
  type: 'picture_to_letter' | 'letter_to_picture' | 'audio_to_letter';
  targetLetter: LetterData;
  targetWord?: WordExample;
  promptTextEn: string;
  promptSubtextEn: string;
  options: QuestionOption[];
  allOptions?: QuestionOption[];
}

// Helper to get valid words for a letter in Match mode (strictly excluding proper nouns: Heroes & Villains and Locations)
const getLetterVocabulary = (letter: LetterData): WordExample[] => {
  const words = [letter.primaryWord, ...(letter.secondaryWords || [])];
  return words.filter((w) => !isMatchExcludedWord(w));
};

export const getTrueLetterForWord = (word: WordExample, letters: LetterData[]): LetterData | undefined => {
  if (!word || !word.wordHe) return undefined;
  const cleanHe = word.wordHe.replace(/[\u0591-\u05C7]/g, '').trim();
  if (!cleanHe) return undefined;
  const firstChar = cleanHe.charAt(0);

  const found = letters.find((l) => {
    const lClean = l.letter.replace(/[\u0591-\u05C7]/g, '').trim();
    if (lClean === firstChar) return true;
    if (lClean.charAt(0) === firstChar) return true;
    return false;
  });

  return found;
};

export type MatchSubMode = 'audio_to_letter' | 'picture_to_letter' | 'letter_to_picture';

export const MatchGame: React.FC<MatchGameProps> = ({
  letters,
  selectedLetterIds,
  onUpdateSelectedLetterIds,
  selectedModes,
  onUpdateSelectedModes,
  matchScore,
  onUpdateMatchScore,
  isActive = false,
  devModeEnabled = false,
}) => {
  // Permanent Cumulative / Lifetime score: uses matchScore prop as primary source of truth
  const [lifetimeScore, setLifetimeScore] = useState<number>(() => {
    if (typeof matchScore === 'number') return matchScore;
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('cantor_yakov_match_lifetime_score');
      if (stored) {
        const val = parseInt(stored, 10);
        if (!isNaN(val)) return val;
      }
    }
    return 0;
  });

  const effectiveScore = typeof matchScore === 'number' ? matchScore : (lifetimeScore || 0);
  const isQuestionTypesUnlocked = effectiveScore >= 10 || devModeEnabled;
  const isBeginnerMode = !isQuestionTypesUnlocked;

  // When Question Types are locked, enforce "Hear Letter" mode exclusively
  useEffect(() => {
    if (isBeginnerMode) {
      if (!selectedModes.has('audio_to_letter') || selectedModes.size !== 1) {
        onUpdateSelectedModes(new Set(['audio_to_letter']));
      }
    }
  }, [isBeginnerMode, selectedModes, onUpdateSelectedModes]);

  useEffect(() => {
    if (isBeginnerMode && selectedLetterIds.size === 0) {
      const default4 = new Set(letters.slice(0, 4).map((l) => l.id));
      onUpdateSelectedLetterIds(default4);
    }
  }, [isBeginnerMode, selectedLetterIds.size]);
  // Hot Potato Queue: active deck of flashcards
  const [deckQueue, setDeckQueue] = useState<Question[]>([]);
  const [totalInitialDeckSize, setTotalInitialDeckSize] = useState<number>(0);
  const [cardsCompletedCount, setCardsCompletedCount] = useState<number>(0);

  // Current session run score: tracks points earned in current run/session, resets on "Restart Game"
  const [sessionScore, setSessionScore] = useState<number>(0);

  // Keep lifetimeScore synced with matchScore prop if provided from App-level UserProgress
  useEffect(() => {
    if (typeof matchScore === 'number') {
      setLifetimeScore(matchScore);
      if (typeof window !== 'undefined') {
        localStorage.setItem('cantor_yakov_match_lifetime_score', matchScore.toString());
      }
    }
  }, [matchScore]);

  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [eliminatedOptionIds, setEliminatedOptionIds] = useState<Set<string>>(new Set());
  const hasWrongAttemptRef = useRef<boolean>(false);
  const [isAnswered, setIsAnswered] = useState<boolean>(false);
  const [isProcessingTurn, setIsProcessingTurn] = useState<boolean>(false);
  const [isCursorHidden, setIsCursorHidden] = useState<boolean>(false);

  // Category filter state (multi-selectable; defaults to containing only category '22')
  const [selectedCategoryKeys, setSelectedCategoryKeys] = useState<Set<string>>(
    () => new Set(['22'])
  );
  const [filterMode, setFilterMode] = useState<'letters' | 'categories'>('letters');
  const filterModeRef = useRef(filterMode);
  useEffect(() => {
    filterModeRef.current = filterMode;
  }, [filterMode]);

  // Difficulty Slider state: number of multiple-choice answer cards (2 to 8)
  const [answerCount, setAnswerCount] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('match_answer_count');
      if (stored) {
        const val = parseInt(stored, 10);
        if (val >= 2 && val <= 8) return val;
      }
    }
    return 4;
  });
  const answerCountRef = useRef<number>(answerCount);
  useEffect(() => {
    answerCountRef.current = answerCount;
  }, [answerCount]);

  const handleAnswerCountChange = (count: number) => {
    const clamped = Math.max(2, Math.min(8, count));
    setAnswerCount(clamped);
    answerCountRef.current = clamped;
    soundManager.playPop();
    if (typeof window !== 'undefined') {
      localStorage.setItem('match_answer_count', clamped.toString());
    }
    setDeckQueue((prev) => {
      if (prev.length === 0) return prev;
      const current = prev[0];
      const allOpts = current.allOptions || current.options;
      const correctOpt = allOpts.find((o) => o.isCorrect);
      const incorrectOpts = allOpts.filter((o) => !o.isCorrect);

      const neededIncorrect = clamped - 1;
      const selectedIncorrect = shuffleArray(incorrectOpts).slice(0, neededIncorrect);
      const newOptions = correctOpt ? shuffleArray([correctOpt, ...selectedIncorrect]) : shuffleArray(allOpts).slice(0, clamped);

      const updatedQuestion: Question = {
        ...current,
        options: newOptions,
      };

      return [updatedQuestion, ...prev.slice(1)];
    });
  };

  const questionVoiceTimerRef = useRef<number | null>(null);
  const isActiveRef = useRef(isActive);
  const prevIsActiveRef = useRef(isActive);
  const lastTargetLetterIdRef = useRef<string | null>(null);

  const selectedLetterIdsRef = useRef(selectedLetterIds);
  const selectedCategoryKeysRef = useRef(selectedCategoryKeys);
  const selectedModesRef = useRef(selectedModes);

  useEffect(() => {
    isActiveRef.current = isActive;
  }, [isActive]);

  useEffect(() => {
    selectedLetterIdsRef.current = selectedLetterIds;
  }, [selectedLetterIds]);

  useEffect(() => {
    selectedCategoryKeysRef.current = selectedCategoryKeys;
  }, [selectedCategoryKeys]);

  useEffect(() => {
    selectedModesRef.current = selectedModes;
  }, [selectedModes]);

  useEffect(() => {
    const handleMouseMove = () => {
      setIsCursorHidden(false);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (questionVoiceTimerRef.current) {
        clearTimeout(questionVoiceTimerRef.current);
      }
    };
  }, []);

  const playPromptAudio = (q: Question, delayMs = 150) => {
    if (questionVoiceTimerRef.current) {
      clearTimeout(questionVoiceTimerRef.current);
      questionVoiceTimerRef.current = null;
    }
    if (!isActiveRef.current) return;

    questionVoiceTimerRef.current = window.setTimeout(() => {
      if (q.type === 'audio_to_letter') {
        soundManager.speakClickLetterPrompt(q.targetLetter.letter);
      } else if (q.type === 'picture_to_letter') {
        soundManager.speakEnglish('What is the first letter of this word?');
      } else if (q.type === 'letter_to_picture') {
        soundManager.speakMatchPrompt(q.targetLetter.letter);
      }
    }, delayMs);
  };

  // Replay audio if tab becomes active
  useEffect(() => {
    if (isActive && !prevIsActiveRef.current) {
      if (deckQueue.length > 0 && !isAnswered && !isProcessingTurn) {
        playPromptAudio(deckQueue[0], 250);
      }
    } else if (!isActive) {
      if (questionVoiceTimerRef.current) {
        clearTimeout(questionVoiceTimerRef.current);
        questionVoiceTimerRef.current = null;
      }
    }
    prevIsActiveRef.current = isActive;
  }, [isActive, deckQueue, isAnswered, isProcessingTurn]);

  // Builds a single question card
  const createSingleQuestion = (
    type: MatchSubMode,
    target: LetterData,
    targetWord: WordExample | undefined,
    lettersPool: LetterData[],
    categoryWordsPool?: { word: WordExample; letter: LetterData }[],
    optionsCount: number = answerCountRef.current
  ): Question => {
    // When question types are locked (under 10 points), strictly force type to audio_to_letter
    const resolvedType: MatchSubMode = isBeginnerMode ? 'audio_to_letter' : type;
    const uniqueId = `card_${resolvedType}_${target.id}_${targetWord?.wordEn || ''}_${Math.random().toString(36).substring(2, 7)}`;
    const requestedCount = Math.max(2, Math.min(8, optionsCount));
    const poolDistractorsCount = 7;

    if (resolvedType === 'audio_to_letter') {
      const otherLetters = lettersPool.filter((l) => l.id !== target.id);
      const distractors = shuffleArray(otherLetters).slice(0, poolDistractorsCount);

      const fullPoolOptions: QuestionOption[] = [
        {
          id: `${uniqueId}_${target.id}`,
          letter: target.letter,
          isCorrect: true,
        },
        ...distractors.map((d) => ({
          id: `${uniqueId}_${d.id}`,
          letter: d.letter,
          isCorrect: false,
        })),
      ];

      const correctOpt = fullPoolOptions.find(o => o.isCorrect)!;
      const incorrectOpts = fullPoolOptions.filter(o => !o.isCorrect);
      const selectedIncorrect = shuffleArray(incorrectOpts).slice(0, requestedCount - 1);
      const initialOptions = shuffleArray([correctOpt, ...selectedIncorrect]);

      return {
        id: uniqueId,
        type: 'audio_to_letter',
        targetLetter: target,
        promptTextEn: `Click on the ${target.nameEn.toLowerCase()}`,
        promptSubtextEn: 'Listen to the prompt and tap the matching Hebrew letter!',
        options: initialOptions,
        allOptions: fullPoolOptions,
      };
    }

    if (resolvedType === 'picture_to_letter') {
      const validVocab = getLetterVocabulary(target);
      const fallbackWord = validVocab[0] || target.primaryWord;
      const resolvedWord = targetWord && !isMatchExcludedWord(targetWord) ? targetWord : fallbackWord;
      const otherLetters = lettersPool.filter((l) => l.id !== target.id);
      const distractors = shuffleArray(otherLetters).slice(0, poolDistractorsCount);

      const fullPoolOptions: QuestionOption[] = [
        {
          id: `${uniqueId}_${target.id}`,
          letter: target.letter,
          wordEn: resolvedWord.wordEn,
          isCorrect: true,
        },
        ...distractors.map((d) => ({
          id: `${uniqueId}_${d.id}`,
          letter: d.letter,
          isCorrect: false,
        })),
      ];

      const correctOpt = fullPoolOptions.find(o => o.isCorrect)!;
      const incorrectOpts = fullPoolOptions.filter(o => !o.isCorrect);
      const selectedIncorrect = shuffleArray(incorrectOpts).slice(0, requestedCount - 1);
      const initialOptions = shuffleArray([correctOpt, ...selectedIncorrect]);

      return {
        id: uniqueId,
        type: 'picture_to_letter',
        targetLetter: target,
        targetWord: resolvedWord,
        promptTextEn: 'What is the first letter of this word?',
        promptSubtextEn: '',
        options: initialOptions,
        allOptions: fullPoolOptions,
      };
    }

    // letter_to_picture
    const validVocab = getLetterVocabulary(target);
    const fallbackWord = validVocab[0] || target.primaryWord;
    const resolvedWord = targetWord && !isMatchExcludedWord(targetWord) ? targetWord : fallbackWord;
    const chosenDistractorWords: { word: WordExample; letter: LetterData }[] = [];
    const usedLetterIds = new Set<string>([target.id]);
    const targetDistractorCount = poolDistractorsCount;

    if (categoryWordsPool && categoryWordsPool.length > 0) {
      // IN CATEGORY MODE: Only pick distractor pictures from categoryWordsPool!
      const otherCatWords = categoryWordsPool.filter(
        (item) => item.letter.id !== target.id && item.word.wordEn.toLowerCase() !== resolvedWord.wordEn.toLowerCase() && !isMatchExcludedWord(item.word)
      );
      const shuffledCat = [...otherCatWords].sort(() => Math.random() - 0.5);

      // Pass 1: Unique letter distractors
      for (const item of shuffledCat) {
        if (!usedLetterIds.has(item.letter.id)) {
          usedLetterIds.add(item.letter.id);
          chosenDistractorWords.push(item);
          if (chosenDistractorWords.length === targetDistractorCount) break;
        }
      }

      // Pass 2: If category has fewer distinct letters, fill remaining slots with distinct words from the same category
      if (chosenDistractorWords.length < targetDistractorCount) {
        const usedWordKeys = new Set<string>([
          resolvedWord.wordEn.toLowerCase(),
          ...chosenDistractorWords.map((c) => c.word.wordEn.toLowerCase()),
        ]);
        for (const item of shuffledCat) {
          if (!usedWordKeys.has(item.word.wordEn.toLowerCase())) {
            usedWordKeys.add(item.word.wordEn.toLowerCase());
            chosenDistractorWords.push(item);
            if (chosenDistractorWords.length === targetDistractorCount) break;
          }
        }
      }
    } else {
      // IN LETTER MODE: Distractors strictly from other letters in lettersPool (currently selected/active drill letters ONLY)
      const otherLetters = lettersPool.filter((l) => !usedLetterIds.has(l.id));
      const shuffledRem = shuffleArray(otherLetters);
      for (const remLetter of shuffledRem) {
        if (chosenDistractorWords.length >= targetDistractorCount) break;
        const vocab = getLetterVocabulary(remLetter);
        if (vocab.length > 0) {
          const remWord = vocab[Math.floor(Math.random() * vocab.length)];
          usedLetterIds.add(remLetter.id);
          chosenDistractorWords.push({ word: remWord, letter: remLetter });
        }
      }

      // If active letters in lettersPool are fewer than targetDistractorCount,
      // fill remaining slots with other distinct vocabulary words from the active letters in lettersPool ONLY!
      if (chosenDistractorWords.length < targetDistractorCount) {
        const usedWordKeys = new Set<string>([
          resolvedWord.wordEn.toLowerCase(),
          ...chosenDistractorWords.map((c) => c.word.wordEn.toLowerCase()),
        ]);
        for (const poolLetter of shuffleArray(lettersPool)) {
          if (chosenDistractorWords.length >= targetDistractorCount) break;
          const vocab = getLetterVocabulary(poolLetter);
          const availableWords = vocab.filter((w) => !usedWordKeys.has(w.wordEn.toLowerCase()));
          for (const extraWord of shuffleArray(availableWords)) {
            if (chosenDistractorWords.length >= targetDistractorCount) break;
            usedWordKeys.add(extraWord.wordEn.toLowerCase());
            chosenDistractorWords.push({ word: extraWord, letter: poolLetter });
          }
        }
      }
    }

    const fullPoolOptions: QuestionOption[] = [
      {
        id: `${uniqueId}_${target.id}_${resolvedWord.wordEn}`,
        wordEn: resolvedWord.wordEn,
        wordHe: resolvedWord.wordHe,
        spokenHe: resolvedWord.spokenHe,
        transliteration: resolvedWord.transliteration,
        emoji: randomizeSkinTone(resolvedWord.emoji),
        image: resolvedWord.image,
        category: resolvedWord.category,
        cardLabel: resolvedWord.cardLabel,
        ttsOverride: resolvedWord.ttsOverride,
        isCorrect: true,
      },
      ...chosenDistractorWords.map(({ word: dWord, letter: dLetter }) => ({
        id: `${uniqueId}_${dLetter.id}_${dWord.wordEn}`,
        wordEn: dWord.wordEn,
        wordHe: dWord.wordHe,
        spokenHe: dWord.spokenHe,
        transliteration: dWord.transliteration,
        emoji: randomizeSkinTone(dWord.emoji),
        image: dWord.image,
        category: dWord.category,
        cardLabel: dWord.cardLabel,
        ttsOverride: dWord.ttsOverride,
        isCorrect: false,
      })),
    ];

    const correctOpt = fullPoolOptions.find(o => o.isCorrect)!;
    const incorrectOpts = fullPoolOptions.filter(o => !o.isCorrect);
    const selectedIncorrect = shuffleArray(incorrectOpts).slice(0, requestedCount - 1);
    const initialOptions = shuffleArray([correctOpt, ...selectedIncorrect]);

    return {
      id: uniqueId,
      type: 'letter_to_picture',
      targetLetter: target,
      targetWord: resolvedWord,
      promptTextEn: `Which picture starts with the letter ${target.letter}?`,
      promptSubtextEn: `Find the word that begins with the sound of ${target.nameEn}!`,
      options: initialOptions,
      allOptions: fullPoolOptions,
    };
  };

  const shuffleAndAvoidConsecutiveTargets = (
    cards: Question[],
    lastTargetId?: string
  ): Question[] => {
    if (cards.length <= 1) return cards;

    const shuffled = [...cards].sort(() => Math.random() - 0.5);

    // 1. Avoid repeating the exact target letter from the last card of the previous round
    if (lastTargetId && shuffled[0].targetLetter.id === lastTargetId) {
      const swapIdx = shuffled.findIndex((c) => c.targetLetter.id !== lastTargetId);
      if (swapIdx > 0) {
        const temp = shuffled[0];
        shuffled[0] = shuffled[swapIdx];
        shuffled[swapIdx] = temp;
      }
    }

    // 2. Avoid back-to-back same target letters in the sequence
    for (let i = 1; i < shuffled.length; i++) {
      if (shuffled[i].targetLetter.id === shuffled[i - 1].targetLetter.id) {
        const swapIdx = shuffled.findIndex(
          (c, idx) => idx > i && c.targetLetter.id !== shuffled[i - 1].targetLetter.id
        );
        if (swapIdx > i) {
          const temp = shuffled[i];
          shuffled[i] = shuffled[swapIdx];
          shuffled[swapIdx] = temp;
        }
      }
    }

    return shuffled;
  };

  // Assembles a brand-new Hot Potato queue based on active filters
  // Helper to build a fresh Hat of questions for the selected pool
  const createHatDeck = (
    activeLetterSet: Set<string>,
    activeCatSet: Set<string>,
    activeModesSet: Set<MatchSubMode>,
    targetFilterMode: 'letters' | 'categories',
    lastTargetId?: string,
    optionsCount: number = answerCountRef.current
  ): Question[] => {
    const isCatMode = !isBeginnerMode && targetFilterMode === 'categories';
    let activeModesList: MatchSubMode[];

    // QUESTION POOL CONSTRAINT:
    // When question types are locked (under 10 points and !devModeEnabled), the ONLY question type allowed
    // is "Hear Letter" (audio_to_letter).
    if (isBeginnerMode) {
      activeModesList = ['audio_to_letter'];
    } else {
      activeModesList = Array.from(activeModesSet);
      if (isCatMode) {
        activeModesList = activeModesList.filter((m) => m !== 'audio_to_letter');
      }
      if (activeModesList.length === 0) {
        if (activeModesSet.has('picture_to_letter')) {
          activeModesList.push('picture_to_letter');
        } else if (activeModesSet.has('letter_to_picture')) {
          activeModesList.push('letter_to_picture');
        } else {
          activeModesList = isCatMode ? ['picture_to_letter'] : ['audio_to_letter'];
        }
      }
    }

    if (activeModesList.length === 0) {
      return [];
    }

    const cards: Question[] = [];

    if (isCatMode) {
      if (activeCatSet.size === 0) return [];

      const allExploreWords = getAllExploreWords(letters);
      const categoryWords: { word: WordExample; letter: LetterData }[] = [];
      const seenWordKeys = new Set<string>();

      for (const item of allExploreWords) {
        if (isMatchExcludedWord(item.word)) continue;
        if (wordMatchesCategories(item.word, activeCatSet)) {
          const key =
            item.word.id ||
            `${item.word.wordHe.trim().replace(/[\u0591-\u05C7]/g, '')}-${item.word.wordEn.trim().toLowerCase()}`;
          if (!seenWordKeys.has(key)) {
            seenWordKeys.add(key);
            const trueLetter = getTrueLetterForWord(item.word, letters) || item.letter;
            categoryWords.push({ word: item.word, letter: trueLetter });
          }
        }
      }

      if (categoryWords.length === 0) return [];

      // Category Mode: pool of letters is strictly the letters in the active category words!
      const categoryLettersMap = new Map<string, LetterData>();
      categoryWords.forEach((cw) => {
        if (!categoryLettersMap.has(cw.letter.id)) {
          categoryLettersMap.set(cw.letter.id, cw.letter);
        }
      });
      const categoryLetters = Array.from(categoryLettersMap.values());

      // Exactly one copy of each category word, shuffled
      const shuffledWords = [...categoryWords].sort(() => Math.random() - 0.5);

      for (const { word, letter } of shuffledWords) {
        const mode = activeModesList[Math.floor(Math.random() * activeModesList.length)];
        cards.push(createSingleQuestion(mode, letter, word, categoryLetters, categoryWords, optionsCount));
      }
    } else {
      // Letter Mode:
      // STRICT HAT METAPHOR: exactly ONE copy of every currently selected drill letter!
      const activeLetters = letters.filter((l) => activeLetterSet.has(l.id));
      const activeSofitLetters = SOFIT_LETTERS.filter((sl) => activeLetterSet.has(sl.id));
      const useSofit = !isBeginnerMode && activeSofitLetters.length > 0;

      let targetLettersPool = activeLetters;
      if (useSofit) {
        targetLettersPool = activeLetters.length > 0 ? [...activeLetters, ...activeSofitLetters] : [...activeSofitLetters];
      }

      if (targetLettersPool.length === 0) return [];

      // Shuffle the selected drill letters so order is random
      const shuffledLetters = [...targetLettersPool].sort(() => Math.random() - 0.5);

      for (const letter of shuffledLetters) {
        const isSofit = SOFIT_LETTERS.some((sl) => sl.id === letter.id) || letter.id.startsWith('sofit_');

        if (isSofit) {
          if (activeModesList.includes('audio_to_letter')) {
            cards.push(createSingleQuestion('audio_to_letter', letter, undefined, targetLettersPool, undefined, optionsCount));
          }
          continue;
        }

        const mode = isBeginnerMode
          ? 'audio_to_letter'
          : activeModesList[Math.floor(Math.random() * activeModesList.length)];

        if (mode === 'audio_to_letter') {
          cards.push(createSingleQuestion('audio_to_letter', letter, undefined, targetLettersPool, undefined, optionsCount));
        } else {
          const vocab = getLetterVocabulary(letter);
          const shuffledVocab = [...vocab].sort(() => Math.random() - 0.5);
          const fallback = !isMatchExcludedWord(letter.primaryWord) ? letter.primaryWord : undefined;
          const word = shuffledVocab[0] || fallback;
          if (!word) {
            cards.push(createSingleQuestion('audio_to_letter', letter, undefined, targetLettersPool, undefined, optionsCount));
            continue;
          }
          const trueLetter = getTrueLetterForWord(word, letters) || letter;
          cards.push(createSingleQuestion(mode, trueLetter, word, targetLettersPool, undefined, optionsCount));
        }
      }
    }

    // Shuffle the queue avoiding starting with the lastTargetId if pool has > 1 items
    return shuffleAndAvoidConsecutiveTargets(cards, lastTargetId);
  };

  // Assembles the Hat Queue based on active filters
  const buildHotPotatoDeck = (
    customActiveLetterIds?: Set<string>,
    customActiveCategoryKeys?: Set<string>,
    customModes?: Set<MatchSubMode>,
    promptDelayMs = 200,
    customFilterMode?: 'letters' | 'categories',
    customAnswerCount?: number
  ) => {
    if (questionVoiceTimerRef.current) {
      clearTimeout(questionVoiceTimerRef.current);
      questionVoiceTimerRef.current = null;
    }

    setIsAnswered(false);
    setSelectedOptionId(null);
    setEliminatedOptionIds(new Set());
    hasWrongAttemptRef.current = false;
    setIsProcessingTurn(false);

    const activeLetterSet = customActiveLetterIds ?? selectedLetterIdsRef.current;
    const activeCatSet = customActiveCategoryKeys ?? selectedCategoryKeysRef.current;
    const targetFilterMode = customFilterMode ?? filterModeRef.current;
    const activeModesSet = customModes ?? selectedModesRef.current;
    const count = customAnswerCount ?? answerCountRef.current;

    const cards = createHatDeck(
      activeLetterSet,
      activeCatSet,
      activeModesSet,
      targetFilterMode,
      lastTargetLetterIdRef.current || undefined,
      count
    );

    setDeckQueue(cards);
    setTotalInitialDeckSize(cards.length);
    setCardsCompletedCount(0);

    if (cards.length > 0) {
      playPromptAudio(cards[0], promptDelayMs);
    }
  };

  // Initial load
  useEffect(() => {
    buildHotPotatoDeck();
  }, []);

  // Safeguard: When Question Types are locked, ensure queue never contains non-audio cards
  useEffect(() => {
    if (isBeginnerMode) {
      setDeckQueue((prev) => {
        if (prev.some((q) => q.type !== 'audio_to_letter')) {
          const activeLetters = letters.filter((l) => selectedLetterIdsRef.current.has(l.id));
          const pool = activeLetters.length > 0 ? activeLetters : letters.slice(0, 4);
          const sanitized = pool.map((l) => createSingleQuestion('audio_to_letter', l, undefined, pool, undefined, answerCountRef.current));
          return shuffleAndAvoidConsecutiveTargets(sanitized);
        }
        return prev;
      });
    }
  }, [isBeginnerMode]);

  const currentQuestion = deckQueue[0] || null;

  // Active answer choices for the current question:
  // Randomly shuffled every time a question loads so that the correct answer is not always in the first (leftmost) position,
  // and memoized by [currentQuestion?.id, answerCount] so choices stay locked during clicks/eliminations.
  const activeOptions = useMemo(() => {
    if (!currentQuestion) return [];
    const requestedCount = Math.max(2, Math.min(8, answerCount));
    const allOpts = currentQuestion.allOptions || currentQuestion.options || [];
    const correctOpt = allOpts.find((o) => o.isCorrect) || currentQuestion.options?.find((o) => o.isCorrect);
    const incorrectOpts = allOpts.filter((o) => !o.isCorrect);

    if (correctOpt) {
      const selectedIncorrect = shuffleArray(incorrectOpts).slice(0, requestedCount - 1);
      return shuffleArray([correctOpt, ...selectedIncorrect]);
    }
    return shuffleArray(currentQuestion.options).slice(0, requestedCount);
  }, [currentQuestion?.id, answerCount]);

  // Reset attempt tracker whenever a new question is loaded
  useEffect(() => {
    hasWrongAttemptRef.current = false;
  }, [currentQuestion?.id]);

  // Handle student answer clicks
  const handleOptionClick = (option: QuestionOption) => {
    if (isAnswered || eliminatedOptionIds.has(option.id) || !currentQuestion) return;
    setIsCursorHidden(true);

    if (option.isCorrect) {
      // Record last answered target letter for reshuffle avoidance
      lastTargetLetterIdRef.current = currentQuestion.targetLetter.id;

      // CORRECT: Student got it right!
      setIsAnswered(true);
      setIsProcessingTurn(true);
      setSelectedOptionId(option.id);
      soundManager.playCorrect();

      // SCORING & REWARD RULE (FIRST GUESS ONLY):
      // Only award points and trigger confetti burst if the student picks the correct answer on their FIRST attempt.
      const isFirstTry = !hasWrongAttemptRef.current;
      if (isFirstTry) {
        fireCelebrationConfetti(0.5, 0.45);

        // Increment current session run score
        setSessionScore((prev) => prev + 1);

        // Increment permanent cumulative lifetime score
        setLifetimeScore((prev) => {
          const next = prev + 1;
          if (typeof window !== 'undefined') {
            localStorage.setItem('cantor_yakov_match_lifetime_score', next.toString());
          }
          return next;
        });

        // Update global App-level UserProgress (persisted to localStorage)
        onUpdateMatchScore?.((s: number) => s + 1);
      }

      // Voice praise/pronunciation
      if (currentQuestion.type === 'letter_to_picture') {
        const vocalized = option.ttsOverride || option.spokenHe || option.wordHe || '';
        soundManager.speakHebrew(vocalized);
      } else if (currentQuestion.type === 'picture_to_letter') {
        soundManager.speakLetter(option.letter || '');
        const targetWordHe = currentQuestion.targetWord?.ttsOverride || currentQuestion.targetWord?.spokenHe || currentQuestion.targetWord?.wordHe;
        if (targetWordHe) {
          setTimeout(() => {
            soundManager.speakHebrew(targetWordHe);
          }, 850);
        }
      } else {
        soundManager.speakLetter(option.letter || '');
      }

      const madeMistake = hasWrongAttemptRef.current;

      // Queue advancement (Hat Metaphor)
      setTimeout(() => {
        setDeckQueue((prev) => {
          if (prev.length === 0) return prev;
          const current = prev[0];
          const remaining = prev.slice(1);

          let nextQueue: Question[];
          if (madeMistake) {
            // INCORRECT GUESS PREVIOUSLY: Put this letter back into hatPool to be re-drilled!
            const refreshed: Question = {
              ...current,
              id: `card_${current.type}_${current.targetLetter.id}_${Math.random().toString(36).substring(2, 7)}`,
              options: shuffleArray(
                [...current.options].map((opt) => ({
                  ...opt,
                  id: `${opt.id}_retry_${Math.random().toString(36).substring(2, 6)}`,
                }))
              ),
            };
            nextQueue = [...remaining, refreshed];
          } else {
            // CORRECT ON FIRST GUESS: Stays out of the hat (on the table)
            setCardsCompletedCount((c) => c + 1);
            nextQueue = remaining;
          }

          setIsAnswered(false);
          setSelectedOptionId(null);
          setEliminatedOptionIds(new Set());
          hasWrongAttemptRef.current = false;
          setIsProcessingTurn(false);

          // ENDLESS DRILL LOOP:
          // When hatPool becomes completely empty, re-populate hatPool silently with the full set
          // of selected letters, shuffle them, and immediately keep serving questions uninterrupted.
          // No victory modal or popup interruption.
          if (nextQueue.length === 0) {
            const freshDeck = createHatDeck(
              selectedLetterIdsRef.current,
              selectedCategoryKeysRef.current,
              selectedModesRef.current,
              filterModeRef.current,
              current.targetLetter.id
            );
            if (freshDeck.length > 0) {
              playPromptAudio(freshDeck[0], 250);
            }
            return freshDeck;
          } else {
            playPromptAudio(nextQueue[0], 250);
            return nextQueue;
          }
        });
      }, currentQuestion.type === 'picture_to_letter' ? 1800 : 1300);
    } else {
      // INCORRECT GUESS: Play gentle boing, mark wrong attempt, and eliminate card with tilted drop-off
      soundManager.playGentleBoing();
      hasWrongAttemptRef.current = true;
      setEliminatedOptionIds((prev) => {
        const next = new Set(prev);
        next.add(option.id);
        return next;
      });
    }
  };

  // Robust pointer tracking for standardizing button click & tap behavior
  const optionPointerStartRef = useRef<{ id: string; x: number; y: number } | null>(null);
  const lastOptionTriggerTimeRef = useRef<number>(0);

  const triggerOptionSelection = (option: QuestionOption) => {
    const now = Date.now();
    if (now - lastOptionTriggerTimeRef.current < 350) return;
    lastOptionTriggerTimeRef.current = now;
    handleOptionClick(option);
  };

  const handleCardPointerDown = (optId: string, clientX: number, clientY: number) => {
    optionPointerStartRef.current = { id: optId, x: clientX, y: clientY };
  };

  const handleCardPointerUp = (
    opt: QuestionOption,
    elem: HTMLElement | null,
    clientX: number,
    clientY: number
  ) => {
    if (!elem || isAnswered || eliminatedOptionIds.has(opt.id)) return;
    if (optionPointerStartRef.current && optionPointerStartRef.current.id === opt.id) {
      const rect = elem.getBoundingClientRect();
      // Allow slight finger sliding within card bounds plus a generous 8px buffer
      const isInside =
        clientX >= rect.left - 8 &&
        clientX <= rect.right + 8 &&
        clientY >= rect.top - 8 &&
        clientY <= rect.bottom + 8;
      if (isInside) {
        triggerOptionSelection(opt);
      }
      optionPointerStartRef.current = null;
    }
  };

  // Toggle tab between Letters and Categories in Pro mode
  const handleTabChange = (newMode: 'letters' | 'categories') => {
    if (filterMode === newMode) return;
    soundManager.playPop();
    setFilterMode(newMode);
    filterModeRef.current = newMode;

    let nextModes = new Set(selectedModes);
    if (newMode === 'categories') {
      if (!nextModes.has('picture_to_letter') && !nextModes.has('letter_to_picture')) {
        nextModes.add('picture_to_letter');
        onUpdateSelectedModes(nextModes);
      }
    }

    buildHotPotatoDeck(
      selectedLetterIds,
      selectedCategoryKeys,
      nextModes,
      200,
      newMode
    );
  };

  // Toggle letter: preserves category filter state
  const handleToggleLetter = (id: string) => {
    if (questionVoiceTimerRef.current) {
      clearTimeout(questionVoiceTimerRef.current);
      questionVoiceTimerRef.current = null;
    }

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

    buildHotPotatoDeck(next, selectedCategoryKeys, selectedModes, isEnabling && letterObj ? 1600 : 250, 'letters');
  };

  const handleSelectAll = () => {
    soundManager.playPop();
    const allSet = new Set<string>();
    letters.forEach((l) => allSet.add(l.id));
    onUpdateSelectedLetterIds(allSet);

    let nextModes = new Set(selectedModes);
    if (!nextModes.has('audio_to_letter')) {
      nextModes.add('audio_to_letter');
      onUpdateSelectedModes(nextModes);
    }

    buildHotPotatoDeck(allSet, selectedCategoryKeys, nextModes, 200, 'letters');
  };

  const handleSelectNone = () => {
    soundManager.playPop();
    const emptySet = new Set<string>();
    onUpdateSelectedLetterIds(emptySet);
    setDeckQueue([]);
    setTotalInitialDeckSize(0);
    setCardsCompletedCount(0);
  };

  // Toggle category: preserves letter filter state
  const handleToggleCategory = (catKey: string) => {
    if (questionVoiceTimerRef.current) {
      clearTimeout(questionVoiceTimerRef.current);
      questionVoiceTimerRef.current = null;
    }
    soundManager.playPop();

    const next = new Set(selectedCategoryKeys);
    const isEnabling = !next.has(catKey);
    if (isEnabling) {
      next.add(catKey);
      const catObj = MATCH_CATEGORIES.find((c) => c.key === catKey);
      if (catObj) {
        soundManager.speakEnglish(catObj.label);
      }
    } else {
      next.delete(catKey);
    }
    setSelectedCategoryKeys(next);

    let nextModes = new Set(selectedModes);
    if (!nextModes.has('picture_to_letter') && !nextModes.has('letter_to_picture')) {
      nextModes.add('picture_to_letter');
      onUpdateSelectedModes(nextModes);
    }

    buildHotPotatoDeck(selectedLetterIds, next, nextModes, isEnabling ? 1400 : 200, 'categories');
  };

  const handleSelectAllCategories = () => {
    soundManager.playPop();
    const allCats = new Set(MATCH_CATEGORIES.map((c) => c.key));
    setSelectedCategoryKeys(allCats);

    let nextModes = new Set(selectedModes);
    if (!nextModes.has('picture_to_letter') && !nextModes.has('letter_to_picture')) {
      nextModes.add('picture_to_letter');
      onUpdateSelectedModes(nextModes);
    }

    buildHotPotatoDeck(selectedLetterIds, allCats, nextModes, 200, 'categories');
  };

  const handleSelectNoneCategories = () => {
    soundManager.playPop();
    setSelectedCategoryKeys(new Set());
    setDeckQueue([]);
    setTotalInitialDeckSize(0);
    setCardsCompletedCount(0);
  };

  // Toggle individual Sofit letter
  const handleToggleSofit = (sofitId: string) => {
    if (questionVoiceTimerRef.current) {
      clearTimeout(questionVoiceTimerRef.current);
      questionVoiceTimerRef.current = null;
    }

    const nextLetterIds = new Set(selectedLetterIds);
    const isEnabling = !nextLetterIds.has(sofitId);
    let nextModes = new Set(selectedModes);

    if (isEnabling) {
      soundManager.playPop();
      const sofitObj = SOFIT_LETTERS.find((sl) => sl.id === sofitId);
      if (sofitObj) {
        soundManager.speakLetter(sofitObj.letter);
      }
      nextLetterIds.add(sofitId);
      if (!nextModes.has('audio_to_letter')) {
        nextModes.add('audio_to_letter');
        onUpdateSelectedModes(nextModes);
      }
    } else {
      soundManager.playPop();
      nextLetterIds.delete(sofitId);
    }

    onUpdateSelectedLetterIds(nextLetterIds);
    buildHotPotatoDeck(nextLetterIds, selectedCategoryKeys, nextModes, isEnabling ? 1800 : 250, 'letters');
  };

  const handleToggleMode = (mode: MatchSubMode) => {
    if (isBeginnerMode) {
      soundManager.playGentleBoing();
      return;
    }
    soundManager.playPop();
    const isCat = filterMode === 'categories';
    const allowedModes: MatchSubMode[] = isCat
      ? ['picture_to_letter', 'letter_to_picture']
      : ['audio_to_letter', 'picture_to_letter', 'letter_to_picture'];
    const currentActiveInContext = Array.from(selectedModes).filter((m) => allowedModes.includes(m));

    const nextModes = new Set(selectedModes);
    if (nextModes.has(mode)) {
      if (currentActiveInContext.length > 1) {
        nextModes.delete(mode);
      }
    } else {
      nextModes.add(mode);
    }

    let nextLetterIds = new Set(selectedLetterIds);
    const hasSofitActive = SOFIT_LETTERS.some((sl) => nextLetterIds.has(sl.id));
    if (hasSofitActive && !nextModes.has('audio_to_letter') && filterMode === 'letters') {
      SOFIT_LETTERS.forEach((sl) => nextLetterIds.delete(sl.id));
      onUpdateSelectedLetterIds(nextLetterIds);
    }

    onUpdateSelectedModes(nextModes);
    buildHotPotatoDeck(nextLetterIds, selectedCategoryKeys, nextModes, 200);
  };

  const renderPromptWithHebrew = (text: string) => {
    const parts = text.split(/([\u0590-\u05FF]+(?:[ \t\u05BE]+[\u0590-\u05FF]+)*)/g);
    return parts.map((part, idx) => {
      if (/[\u0590-\u05FF]/.test(part)) {
        return (
          <bdi
            key={idx}
            dir="rtl"
            className="font-hebrew inline px-1 text-slate-900"
            style={{ fontFamily: "'Akoderf', sans-serif" }}
          >
            {part}
          </bdi>
        );
      }
      return <span key={idx}>{part}</span>;
    });
  };

  return (
    <div className={`max-w-5xl mx-auto px-4 py-4 sm:py-6 space-y-5 ${isCursorHidden ? 'cursor-none select-none [&_*]:cursor-none!' : ''}`}>
      {/* Beginner Mode info badge */}
      {isBeginnerMode && (
        <div className="bg-amber-100/80 border border-amber-200 text-amber-900 px-3.5 py-2 rounded-2xl text-xs font-bold shadow-2xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-sm">⭐</span>
            <span>Earn 10 points in Match to unlock Question Types, Categories, and Sofit letters! ({matchScore || 0}/10 pts)</span>
          </div>
        </div>
      )}

      {/* Unified Filter Card matching the top of Explore */}
      <div className="bg-white/95 backdrop-blur-xs p-3 sm:p-4 rounded-2xl sm:rounded-3xl border border-amber-200/80 shadow-xs space-y-3">
        {/* Pro Mode: Two-Tab Segmented Toggle */}
        {!isBeginnerMode && (
          <div className="flex items-center justify-center pb-0.5">
            <div className="inline-flex items-center bg-slate-100/90 p-1 rounded-2xl border border-slate-200/90 shadow-2xs gap-1">
              <button
                type="button"
                onClick={() => handleTabChange('letters')}
                className={`px-4 py-1.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer select-none flex items-center gap-1.5 border shadow-2xs ${
                  filterMode === 'letters'
                    ? 'bg-amber-500 text-white border-amber-600 shadow-xs ring-2 ring-amber-300'
                    : 'bg-white/80 text-slate-700 hover:text-slate-900 hover:bg-white border-slate-200/80'
                }`}
              >
                <span>Letters</span>
              </button>
              <button
                type="button"
                onClick={() => handleTabChange('categories')}
                className={`px-4 py-1.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer select-none flex items-center gap-1.5 border shadow-2xs ${
                  filterMode === 'categories'
                    ? 'bg-amber-500 text-white border-amber-600 shadow-xs ring-2 ring-amber-300'
                    : 'bg-white/80 text-slate-700 hover:text-slate-900 hover:bg-white border-slate-200/80'
                }`}
              >
                <span>Categories</span>
              </button>
            </div>
          </div>
        )}

        {/* When Letters Tab is Active (or in Beginner Mode) */}
        {(isBeginnerMode || filterMode === 'letters') && (
          <>
            {/* Letters Header with status count and Select All / Select None action buttons */}
            {(() => {
              const hasAnySofitActive = !isBeginnerMode && SOFIT_LETTERS.some((sl) => selectedLetterIds.has(sl.id));
              const activeLetterCount = selectedLetterIds.size;
              const totalLetterCount = hasAnySofitActive ? letters.length + SOFIT_LETTERS.length : letters.length;
              return (
                <div className="h-8 flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800 text-xs sm:text-sm leading-none">
                      Drill Letters:
                    </span>
                    <span className="font-bold text-amber-800 bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-full text-[11px] leading-none inline-flex items-center">
                      {`${activeLetterCount} of ${totalLetterCount} active`}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handleSelectAll}
                      className="h-7 flex items-center gap-1 px-2.5 bg-amber-100 hover:bg-amber-200 active:scale-95 text-amber-900 border border-amber-300 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs leading-none"
                    >
                      <CheckSquare className="w-3.5 h-3.5 text-amber-700" />
                      <span>Select All</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleSelectNone}
                      className="h-7 flex items-center gap-1 px-2.5 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs leading-none"
                    >
                      <Square className="w-3.5 h-3.5 text-slate-500" />
                      <span>Select None</span>
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* 2x11 RTL Hebrew Letter Grid */}
            <div dir="rtl" className="grid grid-cols-11 gap-1 sm:gap-2 w-full max-w-3xl mx-auto">
              {letters.map((letter) => {
                const isSelected = selectedLetterIds.has(letter.id);
                return (
                  <button
                    key={letter.id}
                    type="button"
                    onClick={() => handleToggleLetter(letter.id)}
                    className={`aspect-square w-full rounded-lg sm:rounded-xl font-bold text-sm sm:text-base md:text-lg transition-all flex items-center justify-center cursor-pointer select-none ${
                      isSelected
                        ? 'bg-amber-500 text-white shadow-xs scale-105 ring-2 ring-amber-300'
                        : 'bg-slate-100/90 text-slate-400 hover:bg-amber-100 hover:text-slate-600 border border-slate-200 opacity-60'
                    }`}
                    style={{ fontFamily: "'Akoderf', sans-serif" }}
                  >
                    {letter.letter}
                  </button>
                );
              })}
            </div>

            {/* Five Separate Sofit Letter Icons: ך ם ן ף ץ (only in Pro mode) */}
            {!isBeginnerMode && (
              <div dir="rtl" className="grid grid-cols-11 gap-1 sm:gap-2 w-full max-w-3xl mx-auto pt-2 border-t border-amber-100 mt-2">
                {SOFIT_LETTERS.map((sofitLetter, idx) => {
                  const isSelected = selectedLetterIds.has(sofitLetter.id);
                  return (
                    <button
                      key={sofitLetter.id}
                      type="button"
                      onClick={() => handleToggleSofit(sofitLetter.id)}
                      title={sofitLetter.nameEn}
                      aria-label={`Toggle ${sofitLetter.nameEn}`}
                      className={`aspect-square w-full rounded-lg sm:rounded-xl font-bold text-sm sm:text-base md:text-lg transition-all flex items-center justify-center cursor-pointer select-none border shadow-2xs ${
                        idx === 0 ? 'col-start-4' : ''
                      } ${
                        isSelected
                          ? 'bg-amber-500 text-white border-amber-600 shadow-xs ring-2 ring-amber-300 scale-105'
                          : 'bg-slate-100/90 text-slate-400 hover:bg-amber-100 hover:text-slate-600 border border-slate-200 opacity-60'
                      }`}
                      style={{ fontFamily: "'Akoderf', sans-serif" }}
                    >
                      {sofitLetter.letter}
                    </button>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* When Categories Tab is Active in Pro Mode */}
        {!isBeginnerMode && filterMode === 'categories' && (
          <>
            {/* Categories Header with Select All / Select None */}
            <div className="h-8 flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-800 text-xs sm:text-sm leading-none">
                  Drill Categories:
                </span>
                <span className="font-bold text-amber-800 bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-full text-[11px] leading-none inline-flex items-center">
                  {`${selectedCategoryKeys.size} of ${MATCH_CATEGORIES.length} active`}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleSelectAllCategories}
                  className="h-7 flex items-center gap-1 px-2.5 bg-amber-100 hover:bg-amber-200 active:scale-95 text-amber-900 border border-amber-300 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs leading-none"
                >
                  <CheckSquare className="w-3.5 h-3.5 text-amber-700" />
                  <span>Select All</span>
                </button>

                <button
                  type="button"
                  onClick={handleSelectNoneCategories}
                  className="h-7 flex items-center gap-1 px-2.5 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs leading-none"
                >
                  <Square className="w-3.5 h-3.5 text-slate-500" />
                  <span>Select None</span>
                </button>
              </div>
            </div>

            {/* Categories listed */}
            <div className="flex flex-wrap items-center justify-center gap-1 sm:gap-1.5 pt-0.5">
              {MATCH_CATEGORIES.map((cat) => {
                const isSelected = selectedCategoryKeys.has(cat.key);
                return (
                  <button
                    key={cat.key}
                    type="button"
                    onClick={() => handleToggleCategory(cat.key)}
                    title={cat.label}
                    aria-label={cat.label}
                    className={`flex items-center justify-center gap-1 sm:gap-1.5 rounded-xl text-xs sm:text-sm font-bold transition-colors cursor-pointer select-none border shadow-2xs p-1.5 sm:px-3 sm:py-1.5 min-w-[32px] min-h-[32px] sm:min-w-0 sm:min-h-0 ${
                      isSelected
                        ? 'bg-amber-500 text-white border-amber-600 shadow-xs ring-2 ring-amber-300 font-bold'
                        : 'bg-slate-100/90 text-slate-400 hover:bg-amber-100 hover:text-slate-600 border border-slate-200 opacity-60'
                    }`}
                  >
                    <span className="text-sm sm:text-base leading-none shrink-0 inline-flex items-center justify-center tracking-tighter">
                      {cat.icon}
                    </span>
                    <span className="leading-none whitespace-nowrap hidden sm:inline">
                      {cat.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>

      <div className="max-w-3xl mx-auto space-y-4">
        {/* Match Controls Bar: Difficulty Slider (Left) & Compact Question Types (Right) */}
        <div className="bg-white rounded-3xl p-3 sm:p-4 border border-amber-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
          {/* Left: Answer Count Difficulty Slider (2 to 8) */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 select-none shrink-0">
              <span>🎯</span>
              <span>Choices:</span>
              <span className="w-3 text-center text-amber-800 font-extrabold text-sm">{answerCount}</span>
            </div>
            <div className="relative w-36 sm:w-48 md:w-56 h-12 flex items-center py-2 -my-2 px-1">
              <div 
                className="absolute inset-x-2 h-6 sm:h-7 bg-amber-300 rounded-sm pointer-events-none"
                style={{ clipPath: 'polygon(0% 85%, 100% 15%, 100% 100%, 0% 100%)' }}
              />
              <input 
                type="range" 
                min="2" 
                max="8" 
                step="1" 
                value={answerCount}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  handleAnswerCountChange(val);
                }}
                onInput={(e) => {
                  const val = parseInt((e.target as HTMLInputElement).value, 10);
                  handleAnswerCountChange(val);
                }}
                className="absolute inset-x-0 w-full bg-transparent appearance-none cursor-pointer fader-range z-10 h-12"
                title="Choices Difficulty (2 to 8 cards)"
              />
            </div>
          </div>

          {/* Right: Compact Question Types Buttons */}
          {!isBeginnerMode ? (
            <div className="flex items-center bg-slate-100/90 p-1 rounded-2xl border border-slate-200/90 shadow-2xs gap-1 ml-auto">
              {filterMode === 'letters' && (
                <button
                  type="button"
                  onClick={() => handleToggleMode('audio_to_letter')}
                  title="Hear to Letter"
                  className={`px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-xl transition-all cursor-pointer select-none flex items-center justify-center font-bold border shadow-2xs ${
                    selectedModes.has('audio_to_letter')
                      ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                      : 'bg-white/80 text-slate-700 hover:text-slate-900 hover:bg-white border-slate-200/80'
                  }`}
                >
                  <span className="text-xs sm:text-sm leading-none font-bold select-none whitespace-nowrap">🔊 ➔ א</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => handleToggleMode('picture_to_letter')}
                title="Pic to Letter"
                className={`px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-xl transition-all cursor-pointer select-none flex items-center justify-center font-bold border shadow-2xs ${
                  selectedModes.has('picture_to_letter')
                    ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                    : 'bg-white/80 text-slate-700 hover:text-slate-900 hover:bg-white border-slate-200/80'
                }`}
              >
                <span className="text-xs sm:text-sm leading-none font-bold select-none whitespace-nowrap">🖼️ ➔ א</span>
              </button>

              <button
                type="button"
                onClick={() => handleToggleMode('letter_to_picture')}
                title="Letter to Pic"
                className={`px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-xl transition-all cursor-pointer select-none flex items-center justify-center font-bold border shadow-2xs ${
                  selectedModes.has('letter_to_picture')
                    ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                    : 'bg-white/80 text-slate-700 hover:text-slate-900 hover:bg-white border-slate-200/80'
                }`}
              >
                <span className="text-xs sm:text-sm leading-none font-bold select-none whitespace-nowrap">א ➔ 🖼️</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center bg-slate-100/90 p-1 rounded-2xl border border-slate-200/90 shadow-2xs gap-1 ml-auto">
              <div 
                title="Hear to Letter (Earn 10 points to unlock more types)"
                className="px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-amber-500 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-xs select-none"
              >
                <span className="text-xs sm:text-sm leading-none font-bold select-none whitespace-nowrap">🔊 ➔ א</span>
              </div>
            </div>
          )}
        </div>

        {!currentQuestion ? (
          /* When no letters or categories are selected */
          <div className="bg-white rounded-3xl p-6 sm:p-10 border border-amber-200 shadow-sm text-center space-y-4 relative overflow-hidden">
            {/* Top-Left Pinned Massive Score */}
            <div 
              className="absolute left-4 top-3 sm:left-6 sm:top-4 z-10 font-bold text-amber-500 tracking-tight select-none pointer-events-none leading-none"
              style={{ fontSize: 'clamp(4rem, 10vw, 7.5rem)', lineHeight: 1 }}
              title="Score"
            >
              {sessionScore}
            </div>

            {/* Top-Right Pinned Reset Button */}
            <div className="absolute right-4 top-4 sm:right-6 sm:top-6 z-10">
              <button
                type="button"
                onClick={() => {
                  soundManager.playPop();
                  setSessionScore(0);
                  buildHotPotatoDeck();
                }}
                aria-label="Restart Game"
                title="Restart Game"
                className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-amber-100 hover:bg-amber-200 active:scale-95 text-amber-900 border border-amber-300 shadow-2xs flex items-center justify-center transition-all cursor-pointer hover:rotate-[-45deg]"
              >
                <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5 text-amber-700" />
              </button>
            </div>

            <div className="text-4xl sm:text-5xl pt-2 sm:pt-4">🎯</div>
            <div className="space-y-1">
              <h3 className="text-xl sm:text-2xl font-bold text-slate-800">
                {filterMode === 'letters' ? 'No Letters Selected for Drilling' : 'No Categories Selected for Drilling'}
              </h3>
              <p className="text-sm text-slate-500 max-w-md mx-auto">
                {filterMode === 'letters'
                  ? 'Select one or more letters in the grid above to practice, or click Select All to drill all 22 letters.'
                  : 'Select one or more categories above to practice words, or click Select All Categories.'}
              </p>
            </div>
            <button
              type="button"
              onClick={filterMode === 'letters' ? handleSelectAll : handleSelectAllCategories}
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-2xl shadow-xs transition-all active:scale-95 cursor-pointer text-sm"
            >
              {filterMode === 'letters' ? '✓ Select All Letters' : '✓ Select All Categories'}
            </button>
          </div>
        ) : (
          /* ACTIVE QUESTION CARD */
          <div className="bg-white rounded-3xl p-4 sm:p-8 border border-amber-200 shadow-sm text-center space-y-3 sm:space-y-5 relative overflow-hidden">
            {/* Top-Left Pinned Massive Score */}
            <div 
              className="absolute left-4 top-3 sm:left-6 sm:top-4 z-10 font-bold text-amber-500 tracking-tight select-none pointer-events-none leading-none"
              style={{ fontSize: 'clamp(4rem, 10vw, 7.5rem)', lineHeight: 1 }}
              title="Score"
            >
              {sessionScore}
            </div>

            {/* Top-Right Pinned Reset Icon Button */}
            <div className="absolute right-4 top-4 sm:right-6 sm:top-6 z-10">
              <button
                type="button"
                onClick={() => {
                  soundManager.playPop();
                  setSessionScore(0);
                  buildHotPotatoDeck();
                }}
                aria-label="Restart Game"
                title="Restart Game"
                className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-amber-100 hover:bg-amber-200 active:scale-95 text-amber-900 border border-amber-300 shadow-2xs flex items-center justify-center transition-all cursor-pointer hover:rotate-[-45deg]"
              >
                <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5 text-amber-700" />
              </button>
            </div>

            {/* Centered Mode Pill */}
            <div className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1 bg-amber-100 text-amber-900 rounded-full text-xs font-bold shadow-2xs">
              {currentQuestion.type === 'audio_to_letter' ? (
                <>
                  <span className="text-sm leading-none">🔊</span>
                  <span>Listen & Find Letter</span>
                </>
              ) : currentQuestion.type === 'picture_to_letter' ? (
                <>
                  <span className="text-xs sm:text-sm leading-none font-bold">🖼️ ➔ א</span>
                  <span>Pic to Letter</span>
                </>
              ) : (
                <>
                  <span className="text-xs sm:text-sm leading-none font-bold">א ➔ 🖼️</span>
                  <span>Letter to Pic</span>
                </>
              )}
            </div>

            {/* Question Prompt */}
            <div className="space-y-1">
              {currentQuestion.type === 'letter_to_picture' ? (
                <h2 className="text-xl sm:text-3xl font-bold text-slate-800 tracking-tight">
                  Which picture starts with the letter{' '}
                  <span
                    className="font-hebrew inline-block px-1 text-slate-900"
                    style={{ fontFamily: "'Akoderf', sans-serif" }}
                  >
                    {currentQuestion.targetLetter.letter}
                  </span>
                  ?
                </h2>
              ) : (
                <h2 className="text-xl sm:text-3xl font-bold text-slate-800 tracking-tight">
                  {renderPromptWithHebrew(currentQuestion.promptTextEn)}
                </h2>
              )}
            </div>

            {/* Central Spotlight */}
            <div className="py-2 flex items-center justify-center">
              {currentQuestion.type === 'audio_to_letter' ? (
                <div className="p-6 bg-amber-50/80 rounded-3xl border-2 border-amber-300 inline-flex flex-col items-center justify-center shadow-xs">
                  <button
                    type="button"
                    onClick={() => {
                      soundManager.playPop();
                      soundManager.speakLetter(currentQuestion.targetLetter.letter);
                    }}
                    className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-amber-500 hover:bg-amber-600 text-white flex flex-col items-center justify-center shadow-md hover:scale-105 active:scale-95 transition-transform cursor-pointer group"
                  >
                    <Volume2 className="w-10 h-10 text-white" />
                    <span className="text-[11px] font-bold text-amber-100 mt-1">Tap to Listen</span>
                  </button>
                </div>
              ) : currentQuestion.type === 'picture_to_letter' ? (
                (() => {
                  const promptLabel = getCardDisplayLabel(currentQuestion.targetWord);
                  return (
                    <div className="p-6 bg-amber-50/80 rounded-3xl border-2 border-amber-300 inline-flex flex-col items-center justify-center shadow-xs">
                      <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl flex flex-col items-center justify-center p-2 text-center">
                        {currentQuestion.targetWord?.image ? (
                          <img
                            src={currentQuestion.targetWord.image}
                            alt={currentQuestion.targetWord.wordEn}
                            referrerPolicy="no-referrer"
                            draggable="false"
                            onDragStart={(e) => e.preventDefault()}
                            style={noDragCardStyle}
                            className="w-20 h-20 sm:w-24 sm:h-24 object-contain filter drop-shadow-sm select-none pointer-events-none"
                          />
                        ) : (
                          <span
                            draggable="false"
                            onDragStart={(e) => e.preventDefault()}
                            style={noDragCardStyle}
                            className={`filter drop-shadow-sm leading-none select-none ${
                              promptLabel ? 'text-5xl sm:text-6xl' : 'text-6xl sm:text-7xl'
                            }`}
                          >
                            {currentQuestion.targetWord?.emoji}
                          </span>
                        )}
                        {promptLabel && (
                          <span
                            draggable="false"
                            onDragStart={(e) => e.preventDefault()}
                            style={noDragCardStyle}
                            className="text-xs sm:text-sm font-bold text-slate-800 mt-2 truncate max-w-full select-none"
                          >
                            {promptLabel}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })()
              ) : (
                <div className="p-6 bg-amber-50/80 rounded-3xl border-2 border-amber-300 inline-flex flex-col items-center justify-center shadow-xs">
                  <div
                    draggable="false"
                    onDragStart={(e) => e.preventDefault()}
                    className="w-24 h-24 sm:w-28 sm:h-28 bg-white border-2 border-amber-300 rounded-3xl flex items-center justify-center text-6xl sm:text-7xl font-bold text-slate-900 shadow-sm select-none"
                    style={{
                      fontFamily: "'Akoderf', sans-serif",
                      ...noDragCardStyle,
                    }}
                  >
                    {currentQuestion.targetLetter.letter}
                  </div>
                </div>
              )}
            </div>

            {/* Answer Options Row/Grid - Dynamically styled:
                2 to 4 choices: single horizontal row (1 row of 2, 3, or 4 cards)
                5 to 8 choices: 2-row grid (up to 4 cols x 2 rows, scaled down so cards fit comfortably without overflowing)
            */}
            {(() => {
              const optionsCount = activeOptions.length;
              const isTwoRows = optionsCount >= 5;

              // Card width and aspect ratio scaling
              const cardMaxWidthClass = isTwoRows
                ? 'max-w-[85px] sm:max-w-[120px] md:max-w-[140px]'
                : optionsCount === 2
                ? 'max-w-[155px] sm:max-w-[200px] md:max-w-[220px]'
                : optionsCount === 3
                ? 'max-w-[135px] sm:max-w-[175px] md:max-w-[190px]'
                : 'max-w-[125px] sm:max-w-[160px] md:max-w-[180px]';

              // Hebrew letter font size class: scaled down for 2-row layout (5-8 choices)
              const letterTextSizeClass = isTwoRows
                ? 'text-4xl sm:text-5xl md:text-6xl'
                : optionsCount === 2
                ? 'text-6xl sm:text-8xl md:text-9xl'
                : 'text-5xl sm:text-7xl md:text-8xl';

              // Card inner padding and rounded corners
              const cardPaddingClass = isTwoRows ? 'p-1 sm:p-2' : 'p-2';
              const cardRoundedClass = isTwoRows ? 'rounded-xl sm:rounded-2xl' : 'rounded-2xl sm:rounded-3xl';

              // Card aspect ratio: slightly more compact aspect-[3/4] or [4/5]
              const cardAspectClass = isTwoRows ? 'aspect-[4/5] sm:aspect-[3/4]' : 'aspect-[3/4]';

              // Image / emoji sizing for picture options
              const imageSizeClass = isTwoRows
                ? 'w-10 h-10 sm:w-16 sm:h-16 md:w-20 md:h-20'
                : optionsCount === 2
                ? 'w-20 h-20 sm:w-28 sm:h-28 md:w-32 md:h-32'
                : 'w-16 h-16 sm:w-24 sm:h-24 md:w-28 md:h-28';

              const emojiSizeClass = (hasLabel: boolean) => {
                if (isTwoRows) {
                  return hasLabel ? 'text-3xl sm:text-4xl md:text-5xl' : 'text-4xl sm:text-5xl md:text-6xl';
                }
                if (optionsCount === 2) {
                  return hasLabel ? 'text-6xl sm:text-7xl md:text-8xl' : 'text-7xl sm:text-9xl md:text-[10rem]';
                }
                return hasLabel ? 'text-5xl sm:text-6xl md:text-7xl' : 'text-6xl sm:text-8xl md:text-9xl';
              };

              const labelTextClass = isTwoRows
                ? 'text-[9px] sm:text-[11px] font-bold leading-tight truncate max-w-full mt-1 px-0.5 select-none'
                : 'text-[11px] sm:text-xs font-bold leading-tight truncate max-w-full mt-2 px-1 select-none';

              // Top row / bottom row splitting when 5 to 8 choices
              const renderCard = (opt: QuestionOption) => {
                const isSelected = selectedOptionId === opt.id;
                const isEliminated = eliminatedOptionIds.has(opt.id);
                const optLabel = getCardDisplayLabel(opt);

                return (
                  <button
                    key={opt.id}
                    type="button"
                    draggable="false"
                    onDragStart={(e) => e.preventDefault()}
                    onPointerDown={(e) => {
                      if (isAnswered || isEliminated) return;
                      handleCardPointerDown(opt.id, e.clientX, e.clientY);
                    }}
                    onPointerUp={(e) => {
                      if (isAnswered || isEliminated) return;
                      handleCardPointerUp(opt, e.currentTarget, e.clientX, e.clientY);
                    }}
                    onPointerCancel={() => {
                      optionPointerStartRef.current = null;
                    }}
                    onClick={(e) => {
                      e.preventDefault();
                      if (isAnswered || isEliminated) return;
                      triggerOptionSelection(opt);
                    }}
                    disabled={isAnswered || isEliminated}
                    style={{
                      transform: isEliminated
                        ? 'translateY(100px) rotate(14deg)'
                        : isSelected && opt.isCorrect
                        ? 'scale(1.06)'
                        : 'translateY(0) rotate(0deg)',
                      opacity: isEliminated ? 0 : 1,
                      pointerEvents: isEliminated ? 'none' : 'auto',
                      overflow: 'visible',
                      transition:
                        'transform 0.45s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.45s ease-out',
                      ...noDragCardStyle,
                    }}
                    className={`match-option-card relative overflow-visible flex-1 ${cardMaxWidthClass} ${cardAspectClass} ${cardRoundedClass} border-2 sm:border-3 flex flex-col items-center justify-center cursor-pointer active:scale-95 group shadow-md select-none touch-manipulation ${
                      isEliminated ? 'pointer-events-none select-none border-rose-300/80 bg-rose-50/40 text-slate-300 shadow-none' : ''
                    } ${
                      isSelected && opt.isCorrect
                        ? 'bg-emerald-500 text-white border-emerald-600 ring-4 ring-emerald-300 shadow-lg'
                        : !isEliminated
                        ? 'bg-amber-50/80 text-slate-800 border-amber-200/90 shadow-2xs'
                        : ''
                    }`}
                  >
                    {/* Inner Card Content */}
                    {opt.letter ? (
                      <div
                        draggable="false"
                        onDragStart={(e) => e.preventDefault()}
                        style={noDragCardStyle}
                        className={`flex flex-col items-center justify-center ${cardPaddingClass} w-full h-full select-none`}
                      >
                        <span
                          draggable="false"
                          onDragStart={(e) => e.preventDefault()}
                          className={`font-bold leading-none select-none ${letterTextSizeClass}`}
                          style={{
                            fontFamily: "'Akoderf', sans-serif",
                            ...noDragCardStyle,
                          }}
                        >
                          {opt.letter}
                        </span>
                      </div>
                    ) : (
                      <div
                        draggable="false"
                        onDragStart={(e) => e.preventDefault()}
                        style={noDragCardStyle}
                        className={`flex flex-col items-center justify-center ${cardPaddingClass} w-full h-full text-center overflow-hidden rounded-xl select-none`}
                      >
                        {opt.image ? (
                          <img
                            src={opt.image}
                            alt=""
                            draggable="false"
                            onDragStart={(e) => e.preventDefault()}
                            referrerPolicy="no-referrer"
                            style={noDragCardStyle}
                            className={`${imageSizeClass} object-contain rounded-lg sm:rounded-xl filter drop-shadow-sm select-none`}
                          />
                        ) : (
                          <span
                            draggable="false"
                            onDragStart={(e) => e.preventDefault()}
                            style={noDragCardStyle}
                            className={`filter drop-shadow-sm leading-none select-none ${emojiSizeClass(!!optLabel)}`}
                          >
                            {opt.emoji}
                          </span>
                        )}
                        {optLabel && (
                          <span
                            draggable="false"
                            onDragStart={(e) => e.preventDefault()}
                            style={noDragCardStyle}
                            className={`${labelTextClass} ${
                              isSelected && opt.isCorrect ? 'text-white' : 'text-slate-800'
                            }`}
                          >
                            {optLabel}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Success Checkmark Badge: Floats consistently above top-right corner without clipping */}
                    {isSelected && opt.isCorrect && (
                      <div
                        className="absolute -top-2.5 -right-2.5 w-6 h-6 sm:w-8 sm:h-8 bg-white text-emerald-600 rounded-full flex items-center justify-center shadow-lg animate-bounce pointer-events-none z-20"
                        style={{
                          position: 'absolute',
                          top: '-8px',
                          right: '-8px',
                          zIndex: 20,
                          pointerEvents: 'none',
                        }}
                      >
                        <CheckCircle2 className="w-4 h-4 sm:w-6 sm:h-6" />
                      </div>
                    )}
                  </button>
                );
              };

              if (isTwoRows) {
                // 5 to 8 choices: 2-row grid (4 columns max on top row, remainder on bottom row)
                const topRowCount = Math.min(4, Math.ceil(optionsCount / 2) > 4 ? 4 : Math.ceil(optionsCount / 2));
                // Alternatively, up to 4 on top row: e.g. 5 -> 3 top, 2 bottom; 6 -> 3 top, 3 bottom or 4 top, 2 bottom.
                // User requirement: "a 4-column by 2-row grid, with up to 4 cards on the top row and the remaining cards on the bottom row—so 8 choices displays as a clean 4x2 grid"
                const topCardsCount = Math.min(4, Math.max(Math.ceil(optionsCount / 2), optionsCount - 4));
                const topRow = activeOptions.slice(0, topCardsCount);
                const bottomRow = activeOptions.slice(topCardsCount);

                return (
                  <div className="flex flex-col items-center justify-center w-full mx-auto pt-1 sm:pt-2 pb-3 sm:pb-4 gap-2 sm:gap-3 max-w-2xl">
                    <div className="flex flex-row flex-nowrap items-center justify-center w-full gap-2 sm:gap-3">
                      {topRow.map(renderCard)}
                    </div>
                    <div className="flex flex-row flex-nowrap items-center justify-center w-full gap-2 sm:gap-3">
                      {bottomRow.map(renderCard)}
                    </div>
                  </div>
                );
              }

              // 2 to 4 choices: single horizontal row
              const rowGapClass =
                optionsCount === 2
                  ? 'gap-5 sm:gap-8 md:gap-10 max-w-xl'
                  : optionsCount === 3
                  ? 'gap-4 sm:gap-6 md:gap-8 max-w-2xl'
                  : 'gap-3 sm:gap-5 md:gap-6 max-w-3xl';

              return (
                <div className={`flex flex-row flex-nowrap items-center justify-center w-full mx-auto pt-2 sm:pt-3 pb-4 sm:pb-6 ${rowGapClass}`}>
                  {activeOptions.map(renderCard)}
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
};
